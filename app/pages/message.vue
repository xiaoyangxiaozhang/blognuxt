<template>
  <section class="message-page">
    <div class="message-shell">
      <MessageHero
        :author-name="authorName"
        :description="aboutDescribe"
        :tips="aboutDescribeTips"
        :model-enabled="model.enabled"
        :model-url="model.url"
        :model-rotate="model.rotate"
        :model-control="model.control"
        :model-zoom="model.zoom"
        :fallback-image-url="authorAvatar"
      />

      <p v-if="settingsError" class="sr-only" role="status">
        {{ settingsError }}
      </p>

      <MessageProfile
        :author-name="authorName"
        :profile-list="profileList"
        :hometown="hometown"
        :description="aboutDescribe"
        :description-tips="aboutDescribeTips"
        :story="aboutStory"
        :motto="mottoText"
        :motto-sub="mottoSub"
        :personality="personality"
        :social-links="socialLinks"
        :creation-links="creationLinks"
        :versions="versions"
        :union-links="unionLinks"
        :exhibition="aboutExhibition"
        :established="blogEstablished"
        :guestbook-transition="guestbookTransition"
      />

      <MessageGuestbook
        :comments="comments"
        :loading="loadingComments"
        :submitting="submitting"
        :submit-state="submitState"
        :form="commentForm"
        :title="guestbookTitle"
        :description="guestbookDescription"
        :empty-text="commentsError ? '暂时无法展示留言。' : guestbookEmptyText"
        :error-text="commentsError"
        @update:form="updateCommentForm"
        @reply="replyToComment"
        @submit="submitComment"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import MessageGuestbook from '~/components/message/MessageGuestbook.vue'
import MessageHero from '~/components/message/MessageHero.vue'
import MessageProfile from '~/components/message/MessageProfile.vue'
import { useMessagePageData } from '~/composables/useMessagePageData'

const {
  authorName,
  authorAvatar,
  aboutDescribe,
  aboutDescribeTips,
  aboutStory,
  blogEstablished,
  aboutExhibition,
  profileList,
  hometown,
  mottoText,
  mottoSub,
  personality,
  socialLinks,
  creationLinks,
  versions,
  unionLinks,
  guestbookTitle,
  guestbookDescription,
  guestbookTransition,
  guestbookEmptyText,
  model,
  comments,
  commentForm,
  loadingComments,
  commentsError,
  submitting,
  submitState,
  settingsError,
  updateCommentForm,
  replyToComment,
  submitComment,
} = useMessagePageData()

const pageTitle = computed(() => `关于 | ${authorName.value || '小羊嚣张'}`)
const pageDescription = computed(() => aboutDescribe.value || '这里记录技术、生活，以及一些仍在思考的问题。')

useSeoMeta({
  title: pageTitle,
  description: pageDescription,
  ogTitle: pageTitle,
  ogDescription: pageDescription,
  ogType: 'website'
})
</script>

<style scoped lang="scss">
.message-page {
  min-height: 100vh;
  background: var(--home-surface);
  color: var(--home-text);
}

.message-shell {
  width: min(1120px, calc(100% - 80px));
  margin: 0 auto;
  padding: 104px 0 96px;
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
    width: min(calc(100% - 48px), 880px);
    padding-top: 96px;
  }
}

@media (max-width: 767px) {
  .message-shell {
    width: calc(100% - 40px);
    padding-top: 96px;
    padding-bottom: 64px;
  }
}
</style>
