<script setup lang="ts">
import UnifiedCommentPanel from '~/components/comments/UnifiedCommentPanel.vue'
import type { UnifiedCommentForm, UnifiedCommentItem, UnifiedCommentSubmitState } from '~/components/comments/UnifiedCommentPanel.vue'

withDefaults(defineProps<{
  comments: UnifiedCommentItem[]
  loading: boolean
  submitting: boolean
  submitState?: UnifiedCommentSubmitState
  form: UnifiedCommentForm
  title?: string
  description?: string
  emptyText?: string
  errorText?: string
}>(), {
  emptyText: '还没有留言，来留下第一句问候吧。',
  title: '留言簿',
  description: '来都来了，\n留句话再走吧。\n一个 👋 也可以。',
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
      <h2 id="guestbook-title">{{ title }}</h2>
      <p class="guestbook-description">{{ description }}</p>
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
  --guestbook-submit-bg: color-mix(in srgb, var(--brand-accent) 26%, var(--home-surface));
  --guestbook-submit-hover: color-mix(in srgb, var(--brand-accent) 35%, var(--home-surface));
  --guestbook-focus: color-mix(in srgb, var(--brand-accent) 55%, var(--home-text));

  display: grid;
  grid-template-columns: 200px minmax(0, 1fr);
  gap: 64px;
  margin-top: 76px;
  padding: 58px 0 0;
  border-top: 1px solid var(--home-border);
  scroll-margin-top: 110px;
}

:global([data-theme='blue-white']) .guestbook-section {
  --guestbook-focus: color-mix(in srgb, var(--brand-accent) 40%, #000000);
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
  margin: 20px 0 0;
  color: var(--text-secondary);
  font-size: 15px;
  line-height: 1.9;
  white-space: pre-line;
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
  border-radius: 12px;
  background: var(--home-card-bg);
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
  height: 44px;
  padding: 0 10px;
  border: 1px solid var(--home-border);
  border-radius: 7px;
  color: var(--comment-input-text);
  background: var(--home-surface);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.guestbook-content :deep(.variant-board .info-field input::placeholder),
.guestbook-content :deep(.variant-board .composer-body textarea::placeholder) {
  color: var(--text-secondary);
  opacity: 1;
}

.guestbook-content :deep(.variant-board .info-field input:focus-visible) {
  border-color: var(--guestbook-focus);
  outline: 2px solid var(--guestbook-focus);
  outline-offset: 2px;
}

.guestbook-content :deep(.variant-board .composer-body textarea) {
  width: 100%;
  min-height: 108px;
  padding: 10px 12px;
  border: 1px solid var(--home-border);
  border-radius: 7px;
  color: var(--comment-input-text);
  background: var(--home-surface);
  font-size: 15px;
  line-height: 1.7;
  resize: vertical;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.guestbook-content :deep(.variant-board .composer-body textarea:focus-visible) {
  border-color: var(--guestbook-focus);
  outline: 2px solid var(--guestbook-focus);
  outline-offset: 2px;
}

.guestbook-content :deep(.variant-board .submit-button) {
  min-width: 132px;
  height: 44px;
  padding: 0 24px;
  border-radius: 7px;
  border: 1px solid var(--home-border);
  background: var(--guestbook-submit-bg);
  color: var(--home-text);
  transition: background var(--transition-fast), transform var(--transition-fast), opacity var(--transition-fast);
}

.guestbook-content :deep(.variant-board .submit-button:hover:not(:disabled)) {
  background: var(--guestbook-submit-hover);
  transform: translateY(-1px);
}

.guestbook-content :deep(.variant-board .submit-button:focus-visible),
.guestbook-content :deep(.variant-board .login-button:focus-visible),
.guestbook-content :deep(.variant-board .plain-icon:focus-visible),
.guestbook-content :deep(.variant-board .reply-action:focus-visible) {
  outline: 2px solid var(--guestbook-focus);
  outline-offset: 3px;
}

.guestbook-content :deep(.variant-board .plain-icon) {
  width: 44px;
  height: 44px;
}

.guestbook-content :deep(.variant-board .login-button) {
  height: 44px;
  border-radius: 7px;
}

.guestbook-content :deep(.comment-list) {
  display: grid;
  gap: 0;
  margin-top: 0;
}

.guestbook-content :deep(.board-card) {
  display: flex;
  width: min(100%, 760px);
  min-height: 0;
  flex-direction: column;
  padding: 24px 0;
  border: 0;
  border-bottom: 1px solid var(--home-border);
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.guestbook-content :deep(.comment-avatar) {
  display: none;
}

.guestbook-content :deep(.board-date) {
  order: 1;
  color: var(--text-secondary);
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
  color: var(--text-secondary);
  font-size: 12px;
}

.guestbook-content :deep(.board-author-side > span:not(.reply-pill)),
.guestbook-content :deep(.board-author-side .meta-link) {
  display: none;
}

.guestbook-content :deep(.reply-action) {
  border: 0;
  padding: 0;
  color: var(--text-secondary);
  background: transparent;
  font: inherit;
  font-size: 12px;
  cursor: pointer;
  transition: color var(--transition-fast);
}

.guestbook-content :deep(.reply-action:hover),
.guestbook-content :deep(.reply-action:focus-visible) {
  color: var(--guestbook-focus);
}

.guestbook-content :deep(.comment-empty) {
  padding: 24px 0;
  border: 0;
  border-radius: 0;
  color: var(--text-secondary);
  background: transparent;
  box-shadow: none;
}

.guestbook-content :deep(.comment-empty p),
.guestbook-content :deep(.preview-placeholder),
.guestbook-content :deep(.login-profile p) {
  color: var(--home-text);
  opacity: 1;
}

.guestbook-content :deep(.comment-error .el-alert) {
  border: 1px solid color-mix(in srgb, #d92d20 30%, var(--home-border));
  border-radius: 8px;
  background: color-mix(in srgb, #d92d20 10%, var(--home-surface));
}

.guestbook-content :deep(.comment-error .el-alert__title) {
  color: var(--home-text);
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
    gap: 26px;
    margin-top: 64px;
    padding-top: 48px;
  }

  .guestbook-content :deep(.variant-board .composer-body) {
    margin: 14px 16px 0;
  }

  .guestbook-content :deep(.variant-board .composer-topline) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    padding: 12px 16px 0;
  }

  .guestbook-content :deep(.variant-board .composer-topline .info-field:nth-child(3)) {
    grid-column: 1 / -1;
  }

  .guestbook-content :deep(.variant-board .composer-footer) {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 10px;
    padding: 14px 16px 16px;
  }

  .guestbook-content :deep(.variant-board .toolbar-group) {
    display: grid;
    grid-template-columns: repeat(3, 44px);
    gap: 8px;
  }

  .guestbook-content :deep(.variant-board .action-group) {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    width: 100%;
    gap: 8px;
  }

  .guestbook-content :deep(.variant-board .login-button),
  .guestbook-content :deep(.variant-board .submit-button) {
    min-width: 0;
    width: 100%;
  }

  .guestbook-content :deep(.board-card) {
    width: 100%;
    margin-left: 0;
  }
}

@media (max-width: 359px) {
  .guestbook-content :deep(.variant-board .composer-topline) {
    grid-template-columns: 1fr;
  }

  .guestbook-content :deep(.variant-board .composer-topline .info-field:nth-child(3)) {
    grid-column: auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  .guestbook-content :deep(.variant-board .composer-body textarea),
  .guestbook-content :deep(.variant-board .submit-button) {
    transition: none;
  }
}
</style>
