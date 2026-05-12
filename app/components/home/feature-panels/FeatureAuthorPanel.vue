<template>
  <div class="author-panel">
    <div v-if="loading" class="loading-box">
      <el-skeleton :rows="5" animated />
    </div>

    <template v-else>
      <div class="author-main">
        <div class="author-avatar">
          <img :src="authorAvatar" :alt="authorName || '站长头像'" />
        </div>

        <div class="author-copy">
          <h3>{{ authorName || '站长' }}</h3>
          <p>{{ authorDesc || '欢迎来到这里。' }}</p>
        </div>
      </div>

      <div v-if="authorGithub" class="author-actions">
        <a :href="authorGithub" target="_blank" rel="noreferrer" class="action-button">
          My GitHub
        </a>
      </div>

      <!-- <div class="author-stats">
        <div class="stat-card">
          <strong>{{ totalArticles }}</strong>
          <span>文章</span>
        </div>
        <div class="stat-card">
          <strong>{{ tags.length }}</strong>
          <span>标签</span>
        </div>
        <div class="stat-card">
          <strong>{{ categories.length }}</strong>
          <span>分类</span>
        </div>
      </div> -->
    </template>
  </div>
</template>

<script setup lang="ts">
interface CategoryItem {
  id: number
  name: string
  slug: string
  count: number
}

interface TagItem {
  id: number
  name: string
  slug: string
  count: number
}

defineProps<{
  authorName: string
  authorDesc: string
  authorAvatar: string
  authorGithub?: string
  totalArticles: number
  categories: CategoryItem[]
  tags: TagItem[]
  loading: boolean
}>()
</script>

<style scoped lang="scss">
.author-panel {
  display: grid;
  gap: 28px;
}

.loading-box {
  max-width: 420px;
}

.author-main {
  display: flex;
  align-items: center;
  gap: 28px;
}

.author-avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid var(--home-border);
  box-shadow: var(--home-shadow);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
}

.author-copy {
  h3 {
    margin: 0 0 14px;
    font-size: 32px;
    color: var(--home-text);
  }

  p {
    margin: 0;
    color: var(--home-text-muted);
    font-size: 18px;
    line-height: 1.8;
  }
}

.author-actions {
  display: flex;
}

.action-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 172px;
  min-height: 78px;
  padding: 0 30px;
  border-radius: 999px;
  background: var(--home-card-bg);
  border: 1px solid var(--home-border);
  color: var(--home-text);
  font-size: 18px;
  font-weight: 600;
  text-decoration: none;
  box-shadow: var(--home-shadow);
}

.author-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
  max-width: 760px;
}

.stat-card {
  padding: 18px 20px;
  border-radius: 22px;
  border: 1px solid var(--home-border);
  background: var(--home-card-bg);

  strong {
    display: block;
    margin-bottom: 8px;
    color: var(--home-accent);
    font-size: 28px;
  }

  span {
    color: var(--home-text-muted);
    font-size: 14px;
  }
}

@media (max-width: 768px) {
  



  .author-copy p {
    font-size: 16px;
  }

  .action-button {
    min-height: 62px;
    min-width: 150px;
    font-size: 16px;
  }

  .author-stats {
    grid-template-columns: 1fr;
  }
}
</style>
