<template>
  <section class="unified-comment-panel">
    <div class="comment-form-card">
      <div class="comment-form-head">
        <div>
          <h2>评论区</h2>
          <p>这里使用页面级评论接口，当前整页动态共用一个评论区。</p>
        </div>
      </div>

      <form class="comment-form" @submit.prevent="emit('submit')">
        <div class="comment-grid">
          <label class="field">
            <span>昵称</span>
            <input
              :value="form.nickname"
              type="text"
              placeholder="请输入昵称"
              @input="updateField('nickname', ($event.target as HTMLInputElement).value)"
            />
          </label>

          <label class="field">
            <span>邮箱</span>
            <input
              :value="form.email"
              type="email"
              placeholder="name@example.com"
              @input="updateField('email', ($event.target as HTMLInputElement).value)"
            />
          </label>

          <label class="field">
            <span>网站</span>
            <input
              :value="form.website"
              type="url"
              placeholder="https://your-site.com"
              @input="updateField('website', ($event.target as HTMLInputElement).value)"
            />
          </label>
        </div>

        <label class="field textarea-field">
          <span>内容</span>
          <textarea
            :value="form.content"
            rows="5"
            placeholder="写点什么吧..."
            @input="updateField('content', ($event.target as HTMLTextAreaElement).value)"
          ></textarea>
        </label>

        <div class="comment-form-foot">
          <p class="comment-tip">当前页面提交时会发送昵称、邮箱和内容，网站字段仅作为展示预留。</p>
          <button type="submit" class="submit-button" :disabled="submitting">
            {{ submitting ? '提交中...' : '发表评论' }}
          </button>
        </div>
      </form>
    </div>

    <div class="comment-list-wrap">
      <div v-if="loading" class="loading-box">
        <el-skeleton :rows="5" animated />
      </div>

      <div v-else-if="comments.length === 0" class="comment-empty">
        {{ emptyText }}
      </div>

      <div v-else class="comment-list">
        <article v-for="item in comments" :key="item.id" class="comment-card">
          <div class="comment-avatar">
            <img v-if="item.avatar" :src="item.avatar" :alt="item.author" loading="lazy" />
            <span v-else>{{ item.author.slice(0, 1) }}</span>
          </div>

          <div class="comment-main">
            <div class="comment-meta">
              <div class="comment-author-row">
                <strong>{{ item.author }}</strong>
                <a
                  v-if="item.website"
                  :href="item.website"
                  target="_blank"
                  rel="noreferrer"
                  class="comment-link"
                >
                  个人主页
                </a>
              </div>

              <p class="comment-time">{{ item.publishTime || '刚刚' }}</p>
            </div>

            <p v-if="item.replyTo" class="reply-tag">回复 {{ item.replyTo }}</p>
            <p class="comment-content">{{ item.content }}</p>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
interface UnifiedCommentForm {
  nickname: string
  email: string
  website: string
  content: string
}

interface UnifiedCommentItem {
  id: number | string
  author: string
  avatar?: string
  content: string
  publishTime: string
  website?: string
  replyTo?: string
}

const props = withDefaults(defineProps<{
  comments: UnifiedCommentItem[]
  loading?: boolean
  submitting?: boolean
  form: UnifiedCommentForm
  emptyText?: string
}>(), {
  loading: false,
  submitting: false,
  emptyText: '还没有评论。'
})

const emit = defineEmits<{
  (e: 'update:form', value: UnifiedCommentForm): void
  (e: 'submit'): void
}>()

const updateField = (field: keyof UnifiedCommentForm, value: string) => {
  emit('update:form', {
    ...props.form,
    [field]: value
  })
}
</script>

<style scoped lang="scss">
.unified-comment-panel {
  display: grid;
  gap: 18px;
  padding-top: 8px;
}

.comment-form-card,
.comment-card,
.comment-empty {
  border-radius: 18px;
  background: var(--home-card-alt);
  border: 1px solid color-mix(in srgb, var(--home-text) 8%, transparent);
}

.comment-form-card {
  padding: 22px 22px 18px;
}

.comment-form-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;

  h2 {
    margin: 0;
    font-size: 18px;
    color: var(--home-text);
  }

  p {
    margin: 6px 0 0;
    font-size: 12px;
    line-height: 1.7;
    color: var(--text-muted);
  }
}

.comment-form {
  display: grid;
  gap: 16px;
}

.comment-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.field {
  display: grid;
  gap: 8px;

  span {
    font-size: 12px;
    color: var(--text-muted);
  }

  input,
  textarea {
    width: 100%;
    border: 1px solid color-mix(in srgb, var(--home-text) 10%, transparent);
    background: var(--home-card-bg);
    color: var(--home-text);
    border-radius: 12px;
    padding: 12px 14px;
    font-size: 13px;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }

  input::placeholder,
  textarea::placeholder {
    color: color-mix(in srgb, var(--text-muted) 88%, transparent);
  }

  input:focus,
  textarea:focus {
    outline: none;
    border-color: color-mix(in srgb, var(--home-text) 18%, transparent);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--home-accent-soft) 55%, transparent);
  }
}

.textarea-field textarea {
  min-height: 136px;
  resize: vertical;
}

.comment-form-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.comment-tip {
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--text-muted);
}

.submit-button {
  min-width: 112px;
  height: 40px;
  border: 0;
  border-radius: 999px;
  background: var(--home-text);
  color: var(--home-card-bg);
  font-size: 13px;
  cursor: pointer;
  transition: transform 0.2s ease, opacity 0.2s ease;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.comment-list-wrap {
  display: grid;
  gap: 14px;
}

.loading-box {
  padding: 10px 0;
}

.comment-empty {
  padding: 20px 18px;
  font-size: 13px;
  color: var(--text-muted);
}

.comment-list {
  display: grid;
  gap: 12px;
}

.comment-card {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  gap: 12px;
  padding: 16px 18px;
}

.comment-avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  overflow: hidden;
  background: color-mix(in srgb, var(--home-accent-soft) 72%, var(--home-card-bg) 28%);
  display: grid;
  place-items: center;
  color: var(--home-text);
  font-size: 14px;
  font-weight: 600;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
}

.comment-main {
  min-width: 0;
}

.comment-meta {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.comment-author-row {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-width: 0;

  strong {
    font-size: 14px;
    color: var(--home-text);
    font-weight: 600;
  }
}

.comment-link {
  color: var(--text-muted);
  font-size: 12px;
  text-decoration: none;
}

.comment-time {
  margin: 0;
  font-size: 12px;
  color: var(--text-muted);
  white-space: nowrap;
}

.reply-tag {
  margin: 8px 0 0;
  font-size: 12px;
  color: var(--text-muted);
}

.comment-content {
  margin: 8px 0 0;
  font-size: 13px;
  line-height: 1.8;
  color: var(--home-text);
  white-space: pre-wrap;
  word-break: break-word;
}

@media (max-width: 768px) {
  .comment-grid {
    grid-template-columns: 1fr 1fr;
  }

  .comment-form-foot {
    flex-direction: column;
    align-items: stretch;
  }

  .submit-button {
    width: 100%;
  }
}

@media (max-width: 520px) {
  .comment-form-card {
    padding: 18px 16px 16px;
  }

  .comment-grid {
    grid-template-columns: 1fr;
  }

  .comment-card {
    grid-template-columns: 36px minmax(0, 1fr);
    padding: 14px 14px;
  }

  .comment-avatar {
    width: 36px;
    height: 36px;
  }

  .comment-meta {
    flex-direction: column;
    gap: 6px;
  }
}
</style>
