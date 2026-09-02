<script setup lang="ts">
defineProps<{
  profileList: Array<{ label: string; value: string }>
  exhibition?: string
}>()
</script>

<template>
  <div class="profile-content">
    <article class="profile-card content-card">
      <div v-if="profileList.length" class="profile-grid">
        <div v-for="item in profileList" :key="`${item.label}-${item.value}`" class="profile-cell">
          <span>{{ item.label }}</span>
          <strong>{{ item.value }}</strong>
        </div>
      </div>
      <p v-else class="empty-profile">暂未填写公开资料</p>
    </article>

    <article v-if="exhibition" class="exhibition-card content-card">
      <img :src="exhibition" alt="关于本站的展示图片" loading="lazy" />
    </article>
  </div>
</template>

<style scoped lang="scss">
.profile-content {
  display: grid;
  gap: 14px;
}

.content-card {
  border: 1px solid var(--home-border);
  border-radius: 14px;
  background: var(--home-card-bg);
  color: var(--home-text);
}

.profile-card {
  min-height: 254px;
  padding: 1px;
  overflow: hidden;
}

.profile-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1px;
  height: 100%;
  background: var(--home-border);
}

.profile-cell {
  display: flex;
  min-width: 0;
  min-height: 126px;
  flex-direction: column;
  justify-content: center;
  padding: 20px;
  background: var(--home-card-bg);
}

.profile-cell span {
  display: block;
  margin-bottom: 13px;
  color: var(--home-text);
  font-size: 12px;
  line-height: 1.3;
}

.profile-cell strong {
  color: var(--home-text);
  font-size: 18px;
  font-weight: 600;
  line-height: 1.35;
  word-break: break-word;
}

.empty-profile {
  margin: 0;
  padding: 28px;
  color: var(--home-text);
  font-size: 14px;
}

.exhibition-card {
  min-height: 92px;
  overflow: hidden;
}

.exhibition-card img {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 92px;
  object-fit: cover;
}

@media (max-width: 900px) {
  .profile-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .profile-grid {
    grid-template-columns: 1fr;
  }

  .profile-cell {
    min-height: 96px;
  }
}
</style>
