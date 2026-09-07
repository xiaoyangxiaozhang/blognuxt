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

      <MessageProfile :story="aboutStory" />

      <MessageGuestbook
        :comments="comments"
        :loading="loadingComments"
        :submitting="submitting"
        :submit-state="submitState"
        :form="commentForm"
        :empty-text="commentsError ? '暂时无法展示留言。' : '还没有留言，来说点什么吧。'"
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

useSeoMeta({
  title: '关于 | 小羊嚣张',
  description: '一个前端开发者的个人博客，记录技术、生活，以及一些仍在思考的问题。',
  ogTitle: '关于 | 小羊嚣张',
  ogDescription: '一个前端开发者的个人博客，记录技术、生活，以及一些仍在思考的问题。',
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
