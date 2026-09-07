<script setup lang="ts">
import { computed } from 'vue'

interface ProfileItem {
  label: string
  value: string
}

interface SocialLink {
  name: string
  url: string
  icon: string
}

const props = defineProps<{
  authorName?: string
  profileList?: ProfileItem[]
  hometown?: string
  description?: string
  descriptionTips?: string
  story?: string
  motto?: string
  mottoSub?: string
  personality?: string
  socialLinks?: SocialLink[]
  exhibition?: string
  established?: string
}>()

const profileItems = computed(() => [
  ...(props.profileList || []),
  ...(props.hometown?.trim() ? [{ label: '故乡', value: props.hometown.trim() }] : [])
])

const storyText = computed(() => props.story?.trim() || '')
const mottoItems = computed(() => props.motto?.split(' · ').map(item => item.trim()).filter(Boolean) || [])
const hasAboutText = computed(() => Boolean(storyText.value || props.description?.trim() || props.descriptionTips?.trim()))
const hasCurrentInfo = computed(() => Boolean(
  mottoItems.value.length || props.mottoSub?.trim() || props.personality?.trim() ||
  props.socialLinks?.length || props.established?.trim()
))
</script>

<template>
  <section class="about-details" aria-label="关于我的一些内容">
    <div class="details-grid">
      <section v-if="profileItems.length" class="detail-block profile-block" aria-labelledby="profile-title">
        <h2 id="profile-title">个人资料</h2>
        <dl class="profile-list">
          <div v-for="item in profileItems" :key="`${item.label}-${item.value}`" class="profile-item">
            <dt>{{ item.label }}</dt>
            <dd>{{ item.value }}</dd>
          </div>
        </dl>
      </section>

      <section v-if="hasAboutText" class="detail-block notes-block" aria-labelledby="about-title">
        <h2 id="about-title">关于这个博客</h2>
        <p v-if="storyText" class="story-copy">{{ storyText }}</p>
        <p v-else-if="description">{{ description }}</p>
        <p v-if="descriptionTips" class="muted-copy">{{ descriptionTips }}</p>
      </section>

      <section v-if="hasCurrentInfo" class="detail-block current-block" aria-labelledby="current-title">
        <h2 id="current-title">现在</h2>
        <p v-if="mottoSub" class="muted-copy">{{ mottoSub }}</p>
        <ul v-if="mottoItems.length" class="motto-list">
          <li v-for="item in mottoItems" :key="item">{{ item }}</li>
        </ul>
        <p v-if="personality" class="info-line">性格 · {{ personality }}</p>
        <p v-if="established" class="info-line">建站于 {{ established }}</p>
        <nav v-if="socialLinks?.length" class="social-links" aria-label="社交链接">
          <a v-for="link in socialLinks" :key="`${link.name}-${link.url}`" :href="link.url" target="_blank" rel="noreferrer">
            {{ link.name }}
          </a>
        </nav>
      </section>
    </div>

    <figure v-if="exhibition" class="exhibition">
      <img :src="exhibition" alt="关于本站的展示图片" loading="lazy" />
    </figure>

    <p v-if="authorName" class="signature" :aria-label="`${authorName}的签名`">—— {{ authorName }}</p>

    <p class="guestbook-transition">
      如果你愿意，<br />
      留一句话再继续往下看。
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

.profile-list,
.motto-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.profile-list {
  display: grid;
  gap: 14px;
}

.profile-item {
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr);
  gap: 8px;
  color: var(--home-text);
  font-size: 14px;
  line-height: 1.6;
}

.profile-item dt,
.muted-copy {
  color: var(--home-text-muted);
}

.profile-item dd {
  min-width: 0;
  margin: 0;
  overflow-wrap: anywhere;
}

.notes-block p,
.current-block p {
  margin: 0 0 18px;
  color: var(--home-text);
  font-size: 15px;
  line-height: 1.9;
}

.notes-block .story-copy {
  white-space: pre-line;
}

.notes-block .muted-copy,
.current-block .muted-copy {
  color: var(--home-text-muted);
}

.motto-list {
  display: grid;
  gap: 10px;
  color: var(--home-text);
  font-size: 14px;
  line-height: 1.6;
}

.motto-list li::before {
  margin-right: 12px;
  color: var(--home-text-muted);
  content: '·';
}

.current-block .info-line {
  margin-bottom: 10px;
  color: var(--home-text-muted);
  font-size: 13px;
}

.social-links {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  margin-top: 24px;
}

.social-links a {
  color: var(--home-text);
  font-size: 13px;
  text-decoration: none;
  transition: color var(--transition-fast);
}

.social-links a:hover,
.social-links a:focus-visible {
  color: var(--brand-accent);
}

.exhibition {
  max-width: 720px;
  margin: 64px 0 0 30%;
}

.exhibition img {
  display: block;
  width: 100%;
  max-height: 280px;
  border-radius: 4px;
  object-fit: cover;
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

@media (max-width: 1199px) {
  .details-grid {
    grid-template-columns: minmax(170px, 0.8fr) minmax(260px, 1.2fr);
    gap: 54px 48px;
  }

  .current-block {
    grid-column: 2;
  }

  .signature,
  .exhibition {
    margin-left: 58%;
  }
}

@media (max-width: 767px) {
  .details-grid {
    grid-template-columns: 1fr;
    gap: 54px;
  }

  .current-block {
    grid-column: auto;
  }

  .signature,
  .exhibition,
  .guestbook-transition {
    margin-left: 0;
  }

  .signature {
    margin-top: 48px;
  }

  .guestbook-transition,
  .exhibition {
    margin-top: 44px;
  }
}
</style>
