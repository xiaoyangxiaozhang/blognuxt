<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  story?: string
}>()

const recentItems = [
  { label: '听', value: 'Cigarettes After Sex' },
  { label: '看', value: '《龙之家族》第二季' },
  { label: '折腾', value: '这个博客' },
  { label: '学习', value: 'React' },
  { label: '想', value: '最近在想的事' }
]

const personalNotes = [
  '喜欢晚上改网页。',
  '看到喜欢的界面，会忍不住研究它为什么舒服。',
  '喜欢 Apple 的设计，但越来越不想什么都做成 Apple。',
  '买书的速度比看书快。',
  '这个博客已经不知道改过多少版了。'
]

const techItems = ['Vue / TypeScript', 'Nuxt / Pinia', '偶尔写一点 Node.js']
const storyText = computed(() => props.story?.trim() || '')
</script>

<template>
  <section class="about-details" aria-label="关于我的一些内容">
    <div class="details-grid">
      <section class="detail-block recent-block" aria-labelledby="recent-title">
        <h2 id="recent-title">最近</h2>
        <ul class="recent-list">
          <li v-for="item in recentItems" :key="item.label" class="recent-item">
            <span class="recent-label">{{ item.label }}</span>
            <span class="recent-value">{{ item.value }}</span>
          </li>
        </ul>
      </section>

      <section class="detail-block notes-block" aria-labelledby="notes-title">
        <h2 id="notes-title">一些没必要写进简历的事</h2>
        <p v-if="storyText" class="story-copy">{{ storyText }}</p>
        <p v-for="note in personalNotes" :key="note">{{ note }}</p>
      </section>

      <section class="detail-block tech-block" aria-labelledby="tech-title">
        <h2 id="tech-title">平时写的东西</h2>
        <ul class="tech-list">
          <li v-for="item in techItems" :key="item">{{ item }}</li>
        </ul>
        <p class="tech-copy">平时主要写 Vue 和 TypeScript，这个博客也一直在折腾 Nuxt。</p>
      </section>
    </div>

    <p class="signature" aria-label="小羊的签名">—— 小羊</p>

    <p class="guestbook-transition">
      关于一个人，<br />
      不只有他怎么介绍自己，<br />
      也有别人曾在这里留下过什么。
    </p>
  </section>
</template>

<style scoped lang="scss">
.about-details {
  padding: 4px 0 0;
}

.details-grid {
  display: grid;
  grid-template-columns: minmax(180px, 0.8fr) minmax(280px, 1.25fr) minmax(170px, 0.75fr);
  gap: 64px;
  align-items: start;
}

.detail-block {
  min-width: 0;
}

.detail-block h2 {
  margin: 0 0 28px;
  color: var(--home-text);
  font-family: 'Songti SC', STSong, 'Noto Serif CJK SC', serif;
  font-size: 22px;
  font-weight: 500;
  line-height: 1.4;
}

.recent-list,
.tech-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.recent-list {
  display: grid;
  gap: 14px;
}

.recent-item {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr);
  gap: 8px;
  color: var(--home-text);
  font-size: 14px;
  line-height: 1.6;
  transition: transform var(--transition-fast);
}

.recent-label {
  color: var(--home-text-muted);
  transition: color var(--transition-fast);
}

.recent-value {
  min-width: 0;
  overflow-wrap: anywhere;
}

.notes-block {
  padding-top: 2px;
}

.notes-block p,
.tech-copy {
  margin: 0 0 18px;
  color: var(--home-text);
  font-size: 15px;
  line-height: 1.9;
}

.notes-block .story-copy {
  color: var(--home-text-muted);
  white-space: pre-line;
}

.tech-block {
  padding-top: 26px;
}

.tech-list {
  display: grid;
  gap: 12px;
  color: var(--home-text);
  font-size: 14px;
  line-height: 1.6;
}

.tech-list li::before {
  margin-right: 12px;
  color: var(--home-text-muted);
  content: '·';
}

.tech-copy {
  margin-top: 24px;
  color: var(--home-text-muted);
}

.signature {
  width: fit-content;
  margin: 54px 0 0 62%;
  color: var(--home-text-muted);
  font-family: 'Songti SC', STSong, 'Noto Serif CJK SC', serif;
  font-size: 18px;
}

.guestbook-transition {
  max-width: 420px;
  margin: 52px 0 0 30%;
  padding-left: 22px;
  border-left: 1px solid var(--brand-accent);
  color: var(--home-text-muted);
  font-size: 15px;
  line-height: 1.9;
}

@media (hover: hover) and (pointer: fine) {
  .recent-item:hover {
    transform: translateX(3px);
  }

  .recent-item:hover .recent-label {
    color: var(--brand-accent);
  }
}

@media (max-width: 1199px) {
  .details-grid {
    grid-template-columns: minmax(170px, 0.8fr) minmax(260px, 1.2fr);
    gap: 54px 48px;
  }

  .tech-block {
    grid-column: 2;
    padding-top: 0;
  }

  .signature {
    margin-left: 58%;
  }
}

@media (max-width: 767px) {
  .about-details {
    padding-top: 0;
  }

  .details-grid {
    grid-template-columns: 1fr;
    gap: 54px;
  }

  .tech-block {
    grid-column: auto;
  }

  .signature,
  .guestbook-transition {
    margin-left: 0;
  }

  .signature {
    margin-top: 48px;
  }

  .guestbook-transition {
    margin-top: 44px;
  }
}
</style>
