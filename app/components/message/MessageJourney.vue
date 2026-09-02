<script setup lang="ts">
defineProps<{
  hometown: string
  description?: string
  story?: string
}>()
</script>

<template>
  <div class="journey-grid">
    <article class="map-card" aria-label="足迹地图预留区域">
      <div class="map-pattern" aria-hidden="true"></div>
      <div class="map-label">
        <strong>{{ hometown || '待记录' }}</strong>
        <p>{{ description || '记录我去过的地方' }}</p>
      </div>
    </article>

    <article class="story-card">
      <h3>关于本站的介绍</h3>
      <p v-if="story">{{ story }}</p>
      <p v-else>欢迎来到我的个人博客。这里记录技术、生活和仍在思考的问题。</p>
    </article>
  </div>
</template>

<style scoped lang="scss">
.journey-grid {
  display: grid;
  grid-template-columns: minmax(240px, 0.9fr) minmax(0, 1.1fr);
  gap: 14px;
}

.map-card,
.story-card {
  position: relative;
  min-height: 220px;
  overflow: hidden;
  border: 1px solid var(--home-border);
  border-radius: 14px;
  background: var(--home-card-bg);
  color: var(--home-text);
}

.map-card {
  display: flex;
  align-items: flex-end;
  padding: 24px;
}

.map-pattern {
  position: absolute;
  inset: 0;
  opacity: 0.45;
  background-image:
    linear-gradient(32deg, transparent 48%, var(--home-border) 49%, transparent 50%),
    linear-gradient(-24deg, transparent 48%, var(--home-border) 49%, transparent 50%);
  background-size: 64px 52px;
}

.map-pattern::after,
.map-pattern::before {
  position: absolute;
  width: 7px;
  height: 7px;
  content: '';
  border: 2px solid var(--home-card-bg);
  border-radius: 50%;
  background: var(--brand-accent);
  box-shadow: 0 0 0 4px var(--brand-accent-soft);
}

.map-pattern::before {
  top: 35%;
  left: 42%;
}

.map-pattern::after {
  top: 58%;
  left: 64%;
}

.map-label {
  position: relative;
  z-index: 1;
}

.map-label strong {
  display: block;
  margin-top: 10px;
  font-size: 26px;
  font-weight: 600;
  line-height: 1.2;
}

.map-label p {
  margin: 8px 0 0;
  color: var(--home-text);
  font-size: 12px;
}

.story-card {
  padding: 28px;
  border-radius: 14px;
}

.story-card h3 {
  margin: 14px 0 0;
  font-size: 26px;
  font-weight: 700;
  line-height: 1.25;
}

.story-card p {
  margin: 18px 0 0;
  color: var(--home-text);
  font-size: 15px;
  line-height: 1.85;
}

@media (max-width: 560px) {
  .journey-grid {
    grid-template-columns: 1fr;
  }

  .map-card,
  .story-card {
    min-height: 190px;
  }

  .story-card {
    padding: 24px 20px;
  }
}
</style>
