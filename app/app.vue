<template>
  <div class="bg" :style="themeStyles"><NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
import defaultShareImage from '~/assets/img/hero-poster.jpg'
import { isVideoUrl, useBlogSettings } from '~/composables/useBlogSettings'
import { proxyImageUrl } from '~/utils/image'

const config = useRuntimeConfig()
const siteUrl = String(config.public.siteUrl || '').replace(/\/$/, '')
const defaultShareImageUrl = new URL(defaultShareImage, `${siteUrl}/`).href
const { settings: blogSettings } = useBlogSettings()

const siteTitle = computed(() => blogSettings.value['blog.title'] || '小羊嚣张')
const siteDescription = computed(() => blogSettings.value['blog.description'] || '小羊嚣张的个人博客。')
const siteKeywords = computed(() => blogSettings.value['blog.keywords'] || '')
const configuredScreenshot = computed(() => blogSettings.value['blog.screenshot'] || '')
const configuredFont = computed(() => {
  const raw = blogSettings.value['blog.font']?.trim() || ''
  const separator = raw.lastIndexOf('|')
  if (separator <= 0) return { url: '', family: '' }

  const url = raw.slice(0, separator).trim()
  const family = raw.slice(separator + 1).trim().replace(/[^\p{L}\p{N} ._-]/gu, '')
  if (!family || (!url.startsWith('/') && !/^https?:\/\//i.test(url))) {
    return { url: '', family: '' }
  }

  return { url, family: `"${family}"` }
})
const themeColor = computed(() => {
  const color = blogSettings.value['blog.theme_color']?.trim() || ''
  return /^#[\da-f]{6}$/i.test(color) ? color : ''
})
const themeStyles = computed<Record<string, string>>(() => {
  const styles: Record<string, string> = {}

  if (themeColor.value) {
    styles['--brand-accent'] = themeColor.value
    styles['--brand-accent-soft'] = `color-mix(in srgb, ${themeColor.value} 12%, transparent)`
    styles['--brand-accent-hover'] = `color-mix(in srgb, ${themeColor.value} 82%, #000000)`
  }

  if (configuredFont.value.family) styles['--blog-font-family'] = configuredFont.value.family

  return styles
})
const themeStyleKeys = [
  '--brand-accent',
  '--brand-accent-soft',
  '--brand-accent-hover',
  '--blog-font-family'
] as const

watchEffect(() => {
  if (!import.meta.client) return

  const root = document.documentElement
  const styles = themeStyles.value

  for (const key of themeStyleKeys) {
    const value = styles[key]
    if (value) {
      root.style.setProperty(key, value)
    } else {
      root.style.removeProperty(key)
    }
  }
})
const shareImageUrl = computed(() => {
  if (!configuredScreenshot.value || isVideoUrl(configuredScreenshot.value)) {
    return defaultShareImageUrl
  }

  return new URL(proxyImageUrl(configuredScreenshot.value), `${siteUrl}/`).href
})

useSeoMeta({
  title: siteTitle,
  description: siteDescription,
  ogTitle: siteTitle,
  ogDescription: siteDescription,
  ogType: 'website',
  ogUrl: siteUrl,
  ogImage: shareImageUrl,
  ogImageAlt: siteTitle,
  twitterCard: 'summary_large_image',
  twitterTitle: siteTitle,
  twitterDescription: siteDescription,
  twitterImage: shareImageUrl
})

useHead(() => ({
  link: [
    { rel: 'canonical', href: siteUrl },
    ...(configuredFont.value.url
      ? [{ key: 'blog-font', rel: 'stylesheet', href: configuredFont.value.url }]
      : [])
  ],
  meta: [
    ...(siteKeywords.value ? [{ name: 'keywords', content: siteKeywords.value }] : [])
  ]
}))
</script>
