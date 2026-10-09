import dns from 'node:dns/promises'
import http from 'node:http'
import https from 'node:https'
import { BlockList, isIP, type LookupFunction } from 'node:net'
import { createError } from 'h3'
import sharp from 'sharp'

export const MAX_IMAGE_BYTES = 20 * 1024 * 1024
const blocked = new BlockList()
for (const [address, prefix] of [
  ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8],
  ['169.254.0.0', 16], ['172.16.0.0', 12], ['192.0.0.0', 24], ['192.0.2.0', 24],
  ['192.168.0.0', 16], ['198.18.0.0', 15], ['198.51.100.0', 24],
  ['203.0.113.0', 24], ['224.0.0.0', 3]
] as const) blocked.addSubnet(address, prefix, 'ipv4')
for (const [address, prefix] of [['2001::', 23], ['2001:db8::', 32], ['2002::', 16], ['3fff::', 20]] as const) {
  blocked.addSubnet(address, prefix, 'ipv6')
}
const globalIPv6 = new BlockList()
globalIPv6.addSubnet('2000::', 3, 'ipv6')

export const isPublicImageAddress = (address: string) => {
  const family = isIP(address)
  if (family === 4) return !blocked.check(address, 'ipv4')
  return family === 6 && globalIPv6.check(address, 'ipv6') && !blocked.check(address, 'ipv6')
}

export const validateImageURL = (value: unknown): URL => {
  let url: URL
  try {
    if (typeof value !== 'string') throw new Error()
    url = new URL(value)
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Invalid image URL' })
  }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid image URL' })
  }
  const hostname = url.hostname.replace(/^\[|\]$/g, '')
  if (isIP(hostname) && !isPublicImageAddress(hostname)) {
    throw createError({ statusCode: 403, statusMessage: 'Image address is not public' })
  }
  return url
}

// Validate the addresses used by the socket itself, avoiding a second DNS lookup.
const publicLookup: LookupFunction = (hostname, options, callback) => {
  dns.lookup(hostname, { all: true, verbatim: true }).then(addresses => {
    if (!addresses.length || addresses.some(item => !isPublicImageAddress(item.address))) {
      throw createError({ statusCode: 403, statusMessage: 'Image address is not public' })
    }
    if (options.all) callback(null, addresses)
    else {
      const address = addresses.find(item => item.family === 4) || addresses[0]!
      callback(null, address.address, address.family)
    }
  }).catch(error => callback(error, '', 4))
}

export async function fetchPublicImage(value: string, signal = AbortSignal.timeout(10_000)) {
  let url = validateImageURL(value)
  for (let redirects = 0; redirects <= 3; redirects++) {
    const response = await new Promise<http.IncomingMessage>((resolve, reject) => {
      const request = (url.protocol === 'https:' ? https : http).get(url, {
        lookup: publicLookup, agent: false, signal,
        headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'image/*', 'Accept-Encoding': 'identity' }
      }, resolve)
      request.on('error', reject)
    })
    try {
      if ([301, 302, 303, 307, 308].includes(response.statusCode || 0)) {
        if (!response.headers.location || redirects === 3) {
          throw createError({ statusCode: 502, statusMessage: 'Too many image redirects' })
        }
        url = validateImageURL(new URL(response.headers.location, url).href)
        continue
      }
      if (response.statusCode !== 200) {
        throw createError({ statusCode: 502, statusMessage: 'Image upstream unavailable' })
      }
      const contentType = response.headers['content-type']?.split(';')[0]?.trim().toLowerCase() || ''
      if (!/^image\/(?:png|jpeg|gif|webp|avif|apng|bmp|tiff|x-icon|vnd\.microsoft\.icon|svg\+xml)$/.test(contentType)) {
        throw createError({ statusCode: 415, statusMessage: 'Image content type required' })
      }
      if (Number(response.headers['content-length']) > MAX_IMAGE_BYTES) {
        throw createError({ statusCode: 413, statusMessage: 'Image is too large' })
      }
      if (response.headers['content-encoding'] && response.headers['content-encoding'] !== 'identity') {
        throw createError({ statusCode: 415, statusMessage: 'Unsupported image encoding' })
      }
      const chunks: Buffer[] = []
      let size = 0
      for await (const chunk of response) {
        size += chunk.length
        if (size > MAX_IMAGE_BYTES) throw createError({ statusCode: 413, statusMessage: 'Image is too large' })
        chunks.push(chunk)
      }
      return { contentType, body: Buffer.concat(chunks) }
    } finally {
      response.destroy()
    }
  }
  throw createError({ statusCode: 502, statusMessage: 'Image upstream unavailable' })
}

export async function resizePublicImage(image: { contentType: string; body: Buffer }, width: number) {
  if (!/^image\/(?:jpeg|png|webp|avif)$/.test(image.contentType)) return image
  return {
    contentType: 'image/webp',
    body: await sharp(image.body, { limitInputPixels: 40_000_000 })
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer()
  }
}
