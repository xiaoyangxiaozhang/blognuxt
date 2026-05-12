<script setup lang="ts">
import { getBasicSettings } from '~/composables/api/user'

const { data: settingsData } = await useAsyncData('footer-settings', () => getBasicSettings())

const authorName = computed(() => settingsData.value?.data?.['basic.author'] || '小羊嚣张')
const authorAvatar = computed(() => settingsData.value?.data?.['basic.author_avatar'] || '~/assets/img/dashboard.png')
const icp = computed(() => settingsData.value?.data?.['basic.icp'] || '备案信息待补充')
const copyrightYear = computed(() => {
  const year = new Date().getFullYear()
  return `2023 - ${year}`
})
</script>

<template>
  <footer class="blog-footer">
    <div class="footer-content">
      <div class="footer-info">
        <div class="footer-author">
          <img :src="authorAvatar" alt="作者头像" class="author-avatar">
          <span class="author-name">{{ authorName }}</span>
        </div>

        <div class="footer-stats">
          <p></p>
          <p>本站持续更新中</p>
          <p>Copyright © {{ copyrightYear }} {{ authorName }}</p>
          <a>{{ icp }}</a>
        </div>
      </div>

      <div class="footer-actions">
        <div class="copyright-info">
          <a href="#" class="copyright-link">CC BY-NC-SA 4.0</a>
        </div>
      </div>
    </div>
  </footer>
</template>

<style scoped lang="scss">
.blog-footer {
  background-color: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
  padding: 30px 20px;
  position: relative;
  z-index: 10;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 30px;
}

.footer-info {
  flex: 1;
  min-width: 300px;
}

.footer-author {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.author-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 10px;
  border: 1px solid var(--accent-border);
}

.author-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.footer-stats {
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.6;
}

.footer-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 15px;
}

.theme-tip {
  padding: 6px 12px;
  font-size: 12px;
  color: var(--text-muted);
  background: var(--bg-soft);
  border: 1px solid var(--border-color);
  border-radius: 999px;
}

.copyright-info {
  font-size: 12px;
}

.copyright-link {
  color: var(--text-muted);
  text-decoration: none;
  transition: color 0.3s ease;

  &:hover {
    color: var(--accent);
  }
}


</style>
