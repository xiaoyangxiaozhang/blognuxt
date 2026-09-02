<script setup lang="ts">
import UnifiedCommentPanel from '~/components/comments/UnifiedCommentPanel.vue'
import type { UnifiedCommentForm, UnifiedCommentItem } from '~/components/comments/UnifiedCommentPanel.vue'

withDefaults(defineProps<{
  comments: UnifiedCommentItem[]
  loading: boolean
  submitting: boolean
  form: UnifiedCommentForm
  emptyText?: string
  errorText?: string
}>(), {
  emptyText: '还没有留言，来留下第一句问候吧。',
  errorText: ''
})

const emit = defineEmits<{
  (event: 'update:form', value: UnifiedCommentForm): void
  (event: 'submit'): void
}>()
</script>

<template>
  <div class="guestbook">
    <div class="guestbook-heading">
      <div>
        <h3>留下你的想法</h3>
      </div>
    </div>

    <UnifiedCommentPanel
      variant="board"
      :show-header="false"
      :comments="comments"
      :loading="loading"
      :submitting="submitting"
      :form="form"
      :empty-text="emptyText"
      :error-text="errorText"
      @update:form="emit('update:form', $event)"
      @submit="emit('submit')"
    />
  </div>
</template>

<style scoped lang="scss">
.guestbook-heading {
  display: flex;
  align-items: flex-end;
  justify-content: flex-start;
  margin-bottom: 18px;
}

.guestbook-heading h3 {
  margin: 0;
  color: var(--home-text);
  font-size: 28px;
  font-weight: 700;
  line-height: 1.25;
}

.guestbook :deep(.composer-card),
.guestbook :deep(.comment-card),
.guestbook :deep(.comment-empty) {
  border: 1px solid var(--home-border);
  border-radius: 14px;
  background: var(--home-card-bg);
  box-shadow: none;
}

.guestbook :deep(.composer-card) {
  padding: 14px;
}

.guestbook :deep(.composer-topline) {
  padding: 0 2px 10px;
}

.guestbook :deep(.info-field input),
.guestbook :deep(.composer-body textarea) {
  border-color: var(--home-border);
  background: var(--home-surface);
  color: var(--home-text);
}

.guestbook :deep(.info-field input::placeholder),
.guestbook :deep(.composer-body textarea::placeholder),
.guestbook :deep(.preview-placeholder),
.guestbook :deep(.comment-empty p),
.guestbook :deep(.meta-line),
.guestbook :deep(.board-author-side),
.guestbook :deep(.login-profile p) {
  color: var(--home-text);
  opacity: 1;
}

.guestbook :deep(.composer-preview) {
  border-top: 0;
}

.guestbook :deep(.info-field input) {
  min-height: 42px;
  border-radius: 8px;
}

.guestbook :deep(.composer-body textarea) {
  min-height: 140px;
  border-radius: 10px;
}

.guestbook :deep(.comment-list) {
  display: grid;
  gap: 10px;
  margin-top: 14px;
}

.guestbook :deep(.board-card) {
  padding: 22px 24px;
}

.guestbook :deep(.comment-avatar) {
  border-radius: 50%;
  background: var(--home-card-alt);
}

@media (max-width: 560px) {
  .guestbook-heading {
    display: block;
  }

  .guestbook :deep(.composer-card) {
    padding: 10px;
  }

  .guestbook :deep(.board-card) {
    padding: 18px;
  }
}
</style>
