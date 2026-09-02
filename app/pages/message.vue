<template>
  <section class="message-page">
    <div class="message-shell">
      <MessageHero
        :author-name="authorName"
        :description="aboutDescribe"
        :tips="aboutDescribeTips"
        :model-enabled="model.enabled"
        :model-url="model.url"
        :model-credit="model.credit"
        :model-rotate="model.rotate"
        :model-control="model.control"
        :model-zoom="model.zoom"
        :fallback-image-url="authorAvatar"
      />

      <p v-if="settingsError" class="sr-only" role="status">
        {{ settingsError }}
      </p>

      <div class="message-sequence">
        <MessageSection
          id="profile-section"
          number="01"
          title="博主信息"
        >
          <MessageProfile :profile-list="profileList" :exhibition="aboutExhibition" />
        </MessageSection>

        <MessageSection
          number="02"
          title="个性与座右铭"
        >
          <MessageIdentity
            :personality="personality"
            :motto="mottoText"
            :motto-sub="mottoSub"
          />
        </MessageSection>

        <MessageSection
          number="03"
          title="联系方式"
        >
          <MessageSocial :links="socialLinks" />
        </MessageSection>

        <MessageSection
          id="site-section"
          number="04"
          title="本站信息"
        >
          <MessageStats
            :stats="stats"
            :loading="loadingStats"
            :error-text="statsError"
          />
        </MessageSection>

        <MessageSection
          number="05"
          title="足迹与故事"
        >
          <MessageJourney
            :hometown="hometown"
            :story="aboutStory || aboutDescribe"
          />
        </MessageSection>

        <MessageSection
          id="message-board-section"
          number="06"
          title="留言板"
        >
          <MessageGuestbook
            :comments="comments"
            :loading="loadingComments"
            :submitting="submitting"
            :form="commentForm"
            :empty-text="commentsError ? '暂时无法展示留言。' : '还没有留言，来说点什么吧。'"
            :error-text="commentsError"
            @update:form="updateCommentForm"
            @submit="submitComment"
          />
        </MessageSection>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import MessageGuestbook from '~/components/message/MessageGuestbook.vue'
import MessageHero from '~/components/message/MessageHero.vue'
import MessageIdentity from '~/components/message/MessageIdentity.vue'
import MessageJourney from '~/components/message/MessageJourney.vue'
import MessageProfile from '~/components/message/MessageProfile.vue'
import MessageSection from '~/components/message/MessageSection.vue'
import MessageSocial from '~/components/message/MessageSocial.vue'
import MessageStats from '~/components/message/MessageStats.vue'
import { useMessagePageData } from '~/composables/useMessagePageData'

const {
  authorName,
  authorAvatar,
  aboutDescribe,
  aboutDescribeTips,
  aboutExhibition,
  aboutStory,
  personality,
  mottoText,
  mottoSub,
  hometown,
  socialLinks,
  model,
  profileList,
  stats,
  loadingStats,
  statsError,
  comments,
  commentForm,
  loadingComments,
  commentsError,
  submitting,
  settingsError,
  updateCommentForm,
  submitComment,
} = useMessagePageData()
</script>

<style scoped lang="scss">
.message-page {
  min-height: 100vh;
  background: var(--home-surface);
  color: var(--home-text);
}

.message-shell {
  width: min(1120px, calc(100% - 48px));
  margin: 96px auto 84px;
  color: var(--home-text);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 900px) {
  .message-shell {
    width: min(calc(100% - 24px), 760px);
    margin-top: 72px;
  }

}

@media (max-width: 560px) {
  .message-shell {
    width: calc(100% - 16px);
    margin-top: 56px;
    margin-bottom: 48px;
  }
}
</style>
