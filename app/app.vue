<template>
  <div class="bg"><NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
import defaultShareImage from '~/assets/img/hero-poster.jpg'

const config = useRuntimeConfig()
const siteUrl = String(config.public.siteUrl || '').replace(/\/$/, '')
const defaultShareImageUrl = new URL(defaultShareImage, `${siteUrl}/`).href

useSeoMeta({
  title: '小羊嚣张',
  description: '小羊嚣张的个人博客。',
  ogTitle: '小羊嚣张',
  ogDescription: '小羊嚣张的个人博客。',
  ogType: 'website',
  ogUrl: siteUrl,
  ogImage: defaultShareImageUrl,
  ogImageAlt: '小羊嚣张',
  ogSiteName: '小羊嚣张',
  twitterCard: 'summary_large_image',
  twitterTitle: '小羊嚣张',
  twitterDescription: '小羊嚣张的个人博客。',
  twitterImage: defaultShareImageUrl
})

useHead({
  link: [{ rel: 'canonical', href: siteUrl }],
  meta: [{ property: 'og:image:secure_url', content: defaultShareImageUrl }]
})
</script>
