<template>
  <div class="bg"><NuxtLayout>
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
  link: [{ rel: 'canonical', href: siteUrl }],
  meta: [
    ...(siteKeywords.value ? [{ name: 'keywords', content: siteKeywords.value }] : [])
  ]
}))
</script>
