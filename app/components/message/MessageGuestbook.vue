<script setup lang="ts">
import UnifiedCommentPanel from '~/components/comments/UnifiedCommentPanel.vue'
import type { UnifiedCommentForm, UnifiedCommentItem, UnifiedCommentSubmitState } from '~/components/comments/UnifiedCommentPanel.vue'

withDefaults(defineProps<{
  comments: UnifiedCommentItem[]
  loading: boolean
  submitting: boolean
  submitState?: UnifiedCommentSubmitState
  form: UnifiedCommentForm
  emptyText?: string
  errorText?: string
}>(), {
  emptyText: '还没有留言，来留下第一句问候吧。',
  errorText: '',
  submitState: 'idle'
})

const emit = defineEmits<{
  (event: 'update:form', value: UnifiedCommentForm): void
  (event: 'reply', value: UnifiedCommentItem): void
  (event: 'submit'): void
}>()
</script>

<template>
  <section id="message-board-section" class="guestbook-section" aria-labelledby="guestbook-title">
    <div class="guestbook-intro">
      <h2 id="guestbook-title">留言簿</h2>
      <p class="guestbook-description">来都来了，<br />留句话再走吧。<br />一个 👋 也可以。</p>
    </div>

    <div class="guestbook-content">
      <UnifiedCommentPanel
        variant="board"
        :compact-time="true"
        :show-header="false"
        :comments="comments"
        :loading="loading"
        :submitting="submitting"
        :submit-state="submitState"
        :form="form"
        :empty-text="emptyText"
        :error-text="errorText"
        @update:form="emit('update:form', $event)"
        @reply="emit('reply', $event)"
        @submit="emit('submit')"
      />
    </div>
  </section>
</template>

<style scoped lang="scss">
.guestbook-section {
  display: grid;
  grid-template-columns: 200px minmax(0, 1fr);
  gap: 64px;
  margin-top: 92px;
  padding: 78px 0 0;
  border-top: 1px solid var(--home-border);
  scroll-margin-top: 110px;
}

.guestbook-intro h2 {
  margin: 0;
  color: var(--home-text);
  font-family: 'Songti SC', STSong, 'Noto Serif CJK SC', serif;
  font-size: 32px;
  font-weight: 500;
  line-height: 1.3;
}

.guestbook-description {
  margin: 28px 0 0;
  color: var(--home-text-muted);
  font-size: 15px;
  line-height: 1.9;
}

.guestbook-content {
  min-width: 0;
  max-width: 860px;
}

.guestbook-content :deep(.unified-comment-panel) {
  gap: 38px;
}

.guestbook-content :deep(.variant-board .composer-card) {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--home-border);
  border-radius: 8px;
  background: transparent;
  box-shadow: none;
}

.guestbook-content :deep(.variant-board .composer-body) {
  order: 1;
  margin: 16px 20px 0;
  padding: 0;
}

.guestbook-content :deep(.variant-board .composer-topline) {
  order: 2;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  padding: 14px 20px 0;
}

.guestbook-content :deep(.variant-board .composer-footer) {
  order: 3;
  margin-top: 14px;
  padding: 14px 20px 18px;
  border-top: 1px solid var(--home-border);
}

.guestbook-content :deep(.variant-board .attachment-strip),
.guestbook-content :deep(.variant-board .emoji-panel) {
  order: 4;
}

.guestbook-content :deep(.variant-board .info-field input) {
  height: 38px;
  padding: 0 12px;
  border: 1px solid var(--home-border);
  border-radius: 6px;
  color: var(--comment-input-text);
  background: transparent;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.guestbook-content :deep(.variant-board .info-field input:focus) {
  border-color: var(--brand-accent);
  box-shadow: 0 0 0 3px rgb(129 131 255 / 10%);
}

.guestbook-content :deep(.variant-board .composer-body textarea) {
  width: 100%;
  min-height: 82px;
  padding: 10px 12px;
  border: 1px solid var(--home-border);
  border-radius: 6px;
  color: var(--comment-input-text);
  background: transparent;
  font-size: 15px;
  line-height: 1.7;
  resize: vertical;
  transition: min-height var(--transition-base), border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.guestbook-content :deep(.variant-board .composer-body textarea:focus) {
  min-height: 140px;
  border-color: var(--brand-accent);
  outline: none;
  box-shadow: 0 0 0 3px rgb(129 131 255 / 10%);
}

.guestbook-content :deep(.variant-board .submit-button) {
  min-width: 132px;
  height: 44px;
  padding: 0 24px;
  border-radius: 7px;
  border: 0;
  background: var(--brand-accent);
  color: var(--brand-accent-text);
  transition: background var(--transition-fast), transform var(--transition-fast), opacity var(--transition-fast);
}

.guestbook-content :deep(.variant-board .submit-button:hover:not(:disabled)) {
  background: var(--brand-accent-hover);
  transform: translateY(-1px);
}

.guestbook-content :deep(.variant-board .login-button) {
  border-radius: 7px;
}

.guestbook-content :deep(.comment-list) {
  display: grid;
  gap: 0;
  margin-top: 0;
}

.guestbook-content :deep(.board-card) {
  display: flex;
  width: 72%;
  min-height: 0;
  flex-direction: column;
  padding: 24px 0;
  border: 0;
  border-bottom: 1px solid var(--home-border);
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.guestbook-content :deep(.board-card:nth-child(even)) {
  width: 62%;
  margin-left: auto;
}

.guestbook-content :deep(.comment-avatar) {
  display: none;
}

.guestbook-content :deep(.board-date) {
  order: 1;
  color: var(--home-text-muted);
  font-size: 12px;
  line-height: 1.5;
}

.guestbook-content :deep(.comment-rendered) {
  order: 2;
  margin-top: 10px;
}

.guestbook-content :deep(.comment-text) {
  margin: 0;
  color: var(--home-text);
  font-size: 15px;
  line-height: 1.9;
}

.guestbook-content :deep(.board-meta) {
  order: 3;
  margin-top: 12px;
}

.guestbook-content :deep(.board-author) {
  gap: 0;
}

.guestbook-content :deep(.board-author-copy) {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.guestbook-content :deep(.board-author-copy strong) {
  color: var(--home-text);
  font-size: 12px;
  font-weight: 500;
}

.guestbook-content :deep(.board-author-side) {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--home-text-muted);
  font-size: 12px;
}

.guestbook-content :deep(.board-author-side > span:not(.reply-pill)),
.guestbook-content :deep(.board-author-side .meta-link) {
  display: none;
}

.guestbook-content :deep(.reply-action) {
  border: 0;
  padding: 0;
  color: var(--home-text-muted);
  background: transparent;
  font: inherit;
  font-size: 12px;
  cursor: pointer;
  transition: color var(--transition-fast);
}

.guestbook-content :deep(.reply-action:hover),
.guestbook-content :deep(.reply-action:focus-visible) {
  color: var(--brand-accent);
}

.guestbook-content :deep(.comment-empty) {
  padding: 24px 0;
  border: 0;
  border-radius: 0;
  color: var(--home-text-muted);
  background: transparent;
  box-shadow: none;
}

.guestbook-content :deep(.comment-empty p),
.guestbook-content :deep(.preview-placeholder),
.guestbook-content :deep(.login-profile p) {
  color: var(--home-text);
  opacity: 1;
}

@media (hover: hover) and (pointer: fine) {
  .guestbook-content :deep(.board-card:hover .board-date) {
    color: var(--home-text);
  }
}

@media (max-width: 1199px) {
  .guestbook-section {
    grid-template-columns: 180px minmax(0, 1fr);
    gap: 48px;
  }
}

@media (max-width: 767px) {
  .guestbook-section {
    grid-template-columns: 1fr;
    gap: 40px;
    margin-top: 72px;
    padding-top: 64px;
  }

  .guestbook-content :deep(.variant-board .composer-body) {
    margin: 14px 16px 0;
  }

  .guestbook-content :deep(.variant-board .composer-topline) {
    grid-template-columns: 1fr;
    gap: 8px;
    padding: 12px 16px 0;
  }

  .guestbook-content :deep(.variant-board .composer-footer) {
    padding: 14px 16px 16px;
  }

  .guestbook-content :deep(.variant-board .action-group) {
    flex-direction: column;
    align-items: stretch;
  }

  .guestbook-content :deep(.variant-board .login-button),
  .guestbook-content :deep(.variant-board .submit-button) {
    width: 100%;
  }

  .guestbook-content :deep(.board-card),
  .guestbook-content :deep(.board-card:nth-child(even)) {
    width: 100%;
    margin-left: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .guestbook-content :deep(.variant-board .composer-body textarea),
  .guestbook-content :deep(.variant-board .submit-button) {
    transition: none;
  }
}
</style>
