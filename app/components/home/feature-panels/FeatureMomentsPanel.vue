<template>
  <div class="moments-panel">
    <div v-if="loading" class="loading-box">
      <el-skeleton :rows="6" animated />
    </div>

    <div v-else-if="errorMessage" class="empty-text" role="status">
      {{ errorMessage }}
      <button type="button" class="retry-button" @click="$emit('retry')">重新加载</button>
    </div>

    <div v-else-if="momentCards.length === 0" class="empty-text">暂无动态内容</div>

    <div v-else class="moment-grid">
      <NuxtLink
        v-for="item in momentCards"
        :key="item.id"
        :to="`/dynamic#moment-${item.id}`"
        :aria-label="item.text ? `查看动态：${item.text}` : '查看动态照片'"
        class="moment-card"
        :class="{ 'has-cover': item.cover }"
      >
        <div class="moment-meta">
          <time class="moment-date" :datetime="item.dateTime">{{ item.publishDate }}</time>
          <span v-if="item.location" class="moment-location">{{ item.location }}</span>
        </div>
        <p class="moment-text" :aria-hidden="item.text ? undefined : true">{{ item.text }}</p>
        <div v-if="item.cover" class="moment-cover">
          <img :src="item.cover" :alt="item.text || '动态照片'" loading="lazy" />
        </div>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { MomentItem } from '~/services/api/moments'
import { formatDate } from '~/utils/date'
import { proxyImageUrl } from '~/utils/image'

const props = defineProps<{
  moments: MomentItem[]
  loading: boolean
  errorMessage: string
  limit?: number
}>()

defineEmits<{ retry: [] }>()

const momentCards = computed(() => props.moments.slice(0, props.limit ?? 6).map(item => ({
    id: item.id,
    publishDate: formatDate(item.publish_time),
    dateTime: item.publish_time?.slice(0, 10) || '',
    text: item.content?.text || '',
    cover: proxyImageUrl(item.content?.images?.[0]),
    location: item.content?.location || ''
  }))
)
</script>

<style scoped lang="scss">
.loading-box {
  max-width: 420px;
}

.moments-panel {
  width: 100%;
}

.moment-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
  align-items: start;
}

.moment-card {
  display: block;
  min-width: 0;
  padding: 16px;
  border-radius: 15px;
  border: 1px solid var(--home-border);
  background: var(--home-card-bg);
  box-shadow: var(--home-shadow);
  color: var(--home-text);
  text-decoration: none;
  transition: transform 400ms cubic-bezier(0.345, 0.045, 0.345, 1);

  &:focus-visible {
    outline: 2px solid var(--home-text);
    outline-offset: 4px;
  }
}

.moment-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  line-height: 1.5;
  padding-bottom: 10px;
  border-bottom: 1px dashed var(--home-border);
}

.moment-date {
  margin: 0;
  flex-shrink: 0;
  color: var(--home-text-muted);
  font-size: 13px;
}

.moment-text {
  display: -webkit-box;
  margin: 10px 0 0;
  color: var(--home-text);
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  overflow: hidden;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.has-cover .moment-text {
  height: 4.8em;
}

.moment-cover {
  margin-top: 10px;
  overflow: hidden;
  border-radius: 10px;
  background: var(--home-card-alt);

  img {
    display: block;
    width: 100%;
    height: 80px;
    object-fit: cover;
    transition: transform 400ms cubic-bezier(0.345, 0.045, 0.345, 1);
  }
}

@media (hover: hover) and (pointer: fine) {
  .moment-card:hover { transform: scale(0.97); }
  .moment-card:hover .moment-cover img { transform: scale(1.08); }
}

.moment-location {
  min-width: 0;
  max-width: 45%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--home-text-muted);
  font-size: 13px;
}

.retry-button {
  display: block;
  margin-top: 12px;
  min-height: 44px;
  padding: 8px 16px;
  border: 1px solid var(--home-border);
  border-radius: 8px;
  background: var(--home-card-bg);
  color: var(--home-text);
  font: inherit;
  cursor: pointer;

  &:hover { color: var(--brand-accent); }
  &:focus-visible { outline: 2px solid var(--home-text); outline-offset: 4px; }
}

.empty-text {
  color: var(--home-text-muted);
  font-size: 14px;
}

@media (max-width: 1200px) {
  .moment-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .moment-grid {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .moment-card,
  .moment-cover img { transition: none; }
  .moment-card:hover,
  .moment-card:hover .moment-cover img { transform: none; }
}
</style>
