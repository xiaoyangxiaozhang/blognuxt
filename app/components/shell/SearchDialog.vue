<template>
  <Transition name="search-dialog">
    <div
      v-if="modelValue"
      class="search-dialog-backdrop"
      role="presentation"
      @click.self="close"
    >
      <section
        class="search-dialog-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="search-dialog-title"
        @keydown.esc="close"
      >
        <header class="search-dialog-header">
          <div>
            <span class="search-dialog-kicker">SEARCH</span>
            <h2 id="search-dialog-title">搜索文章</h2>
          </div>
          <button class="search-dialog-close" type="button" aria-label="关闭搜索" @click="close">
            <IconMaterialSymbolsClose />
          </button>
        </header>

        <form class="search-form" role="search" @submit.prevent="search">
          <IconMaterialSymbolsSearch class="search-form-icon" aria-hidden="true" />
          <input
            ref="inputRef"
            v-model="keyword"
            type="search"
            autocomplete="off"
            placeholder="搜索标题或正文"
            aria-label="搜索标题或正文"
          />
          <button v-if="keyword" class="search-clear" type="button" aria-label="清空搜索" @click="clearSearch">
            <IconMaterialSymbolsClose />
          </button>
        </form>

        <div class="search-results" aria-live="polite">
          <div v-if="pending" class="search-state">正在搜索……</div>
          <div v-else-if="errorText" class="search-state search-state-error">{{ errorText }}</div>
          <div v-else-if="!keyword.trim()" class="search-state">
            输入关键词，搜索标题和正文
          </div>
          <div v-else-if="results.length === 0" class="search-state">
            没有找到相关文章
          </div>
          <template v-else>
            <div class="search-result-summary">找到 {{ total }} 篇相关文章</div>
            <NuxtLink
              v-for="item in results"
              :key="item.id"
              :to="articleHref(item)"
              class="search-result"
              @click="close"
            >
              <div class="search-result-meta">
                <span v-if="item.category?.name">{{ item.category.name }}</span>
                <span v-if="item.publish_time">{{ formatDate(item.publish_time) }}</span>
              </div>
              <h3>{{ item.title }}</h3>
              <p v-if="resultExcerpt(item)">{{ resultExcerpt(item) }}</p>
            </NuxtLink>
          </template>
        </div>

        <footer class="search-dialog-footer">
          <span>全文搜索</span>
          <span>ESC 关闭</span>
        </footer>
      </section>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import IconMaterialSymbolsClose from '~icons/material-symbols/close'
import IconMaterialSymbolsSearch from '~icons/material-symbols/search'
import { searchArticles } from '~/services/api/article'
import type { ArticleListItem } from '~/types/api'
import { formatDate } from '~/utils/date'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const inputRef = ref<HTMLInputElement | null>(null)
const keyword = ref('')
const results = ref<ArticleListItem[]>([])
const total = ref(0)
const pending = ref(false)
const errorText = ref('')
let debounceTimer: ReturnType<typeof setTimeout> | null = null
let requestId = 0

const close = () => {
  emit('update:modelValue', false)
}

const clearSearch = () => {
  keyword.value = ''
  results.value = []
  total.value = 0
  errorText.value = ''
  nextTick(() => inputRef.value?.focus())
}

const articleHref = (item: ArticleListItem) => {
  if (item.slug) {
    return `/article/${encodeURIComponent(item.slug)}`
  }

  const matched = item.url?.match(/\/([^/]+)\/?$/)
  return `/article/${encodeURIComponent(matched?.[1] ? decodeURIComponent(matched[1]) : String(item.id))}`
}

const resultExcerpt = (item: ArticleListItem) => {
  const value = item.excerpt || item.summary || ''
  return value
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#>*_~`]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120)
}

const search = async () => {
  const nextKeyword = keyword.value.trim()
  const currentRequestId = ++requestId

  if (!nextKeyword) {
    clearSearch()
    return
  }

  pending.value = true
  errorText.value = ''

  try {
    const response = await searchArticles({
      keyword: nextKeyword,
      page: 1,
      page_size: 20
    })

    if (currentRequestId !== requestId) {
      return
    }

    if (response.code !== 0) {
      throw new Error(response.message || '搜索失败')
    }

    results.value = response.data?.list || []
    total.value = response.data?.total || 0
  } catch (error) {
    if (currentRequestId === requestId) {
      results.value = []
      total.value = 0
      errorText.value = error instanceof Error ? error.message : '搜索失败，请稍后重试'
    }
  } finally {
    if (currentRequestId === requestId) {
      pending.value = false
    }
  }
}

watch(keyword, () => {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }

  if (!keyword.value.trim()) {
    clearSearch()
    return
  }

  debounceTimer = setTimeout(search, 320)
})

watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    nextTick(() => inputRef.value?.focus())
  }
})

onBeforeUnmount(() => {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
})
</script>

<style scoped lang="scss">
.search-dialog-backdrop {
  position: fixed;
  inset: 0;
  z-index: 500;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 104px 20px 28px;
  background: rgba(0, 0, 0, 0.62);
}

.search-dialog-panel {
  width: min(680px, 100%);
  max-height: min(720px, calc(100vh - 132px));
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--home-border);
  border-radius: 14px;
  background: var(--home-card-bg);
  color: var(--home-text);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.24);
}

.search-dialog-header,
.search-dialog-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.search-dialog-header {
  padding: 24px 26px 18px;
}

.search-dialog-kicker {
  display: block;
  color: var(--brand-accent);
  font-size: 11px;
  letter-spacing: 0.16em;
  line-height: 1;
}

.search-dialog-header h2 {
  margin: 8px 0 0;
  font-size: 26px;
  line-height: 1.2;
}

.search-dialog-close,
.search-clear {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  background: transparent;
  color: var(--home-text-muted);
  cursor: pointer;
  transition: color var(--transition-fast), background-color var(--transition-fast);
}

.search-dialog-close {
  width: 34px;
  height: 34px;
  border-radius: 6px;
}

.search-dialog-close:hover,
.search-dialog-close:focus-visible,
.search-clear:hover,
.search-clear:focus-visible {
  color: var(--brand-accent);
  background: var(--home-accent-soft);
}

.search-dialog-close:focus-visible,
.search-clear:focus-visible {
  outline: 2px solid var(--brand-accent);
  outline-offset: 2px;
}

.search-form {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 26px;
  padding: 0 12px;
  min-height: 48px;
  border: 1px solid var(--home-border);
  border-radius: 8px;
  background: var(--home-surface);
  transition: border-color var(--transition-fast);
}

.search-form:focus-within {
  border-color: var(--brand-accent);
}

.search-form-icon {
  flex: 0 0 auto;
  width: 19px;
  height: 19px;
  color: var(--home-text-muted);
}

.search-form input {
  min-width: 0;
  flex: 1;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--home-text);
  font: inherit;
  font-size: 15px;
}

.search-form input::placeholder {
  color: var(--home-text-muted);
}

.search-clear {
  width: 28px;
  height: 28px;
  border-radius: 5px;
}

.search-results {
  min-height: 180px;
  overflow-y: auto;
  padding: 18px 26px 8px;
}

.search-state {
  display: grid;
  min-height: 150px;
  place-items: center;
  color: var(--home-text-muted);
  font-size: 14px;
  text-align: center;
}

.search-state-error {
  color: #c66;
}

.search-result-summary {
  margin-bottom: 8px;
  color: var(--home-text-muted);
  font-size: 13px;
}

.search-result {
  display: block;
  padding: 15px 0;
  border-top: 1px solid var(--home-border);
  color: inherit;
  text-decoration: none;
  transition: color var(--transition-fast), padding-left var(--transition-fast);
}

.search-result:hover,
.search-result:focus-visible {
  padding-left: 6px;
  color: var(--brand-accent);
}

.search-result:focus-visible {
  outline: 2px solid var(--brand-accent);
  outline-offset: 4px;
}

.search-result-meta {
  display: flex;
  gap: 12px;
  margin-bottom: 5px;
  color: var(--home-text-muted);
  font-size: 12px;
}

.search-result h3 {
  margin: 0;
  color: inherit;
  font-size: 17px;
  line-height: 1.45;
}

.search-result p {
  margin: 5px 0 0;
  color: var(--home-text-muted);
  font-size: 13px;
  line-height: 1.6;
}

.search-dialog-footer {
  margin: 10px 26px 0;
  padding: 14px 0 18px;
  border-top: 1px solid var(--home-border);
  color: var(--home-text-muted);
  font-size: 12px;
}

.search-dialog-enter-active,
.search-dialog-leave-active {
  transition: opacity 160ms ease;
}

.search-dialog-enter-active .search-dialog-panel,
.search-dialog-leave-active .search-dialog-panel {
  transition: transform 200ms ease, opacity 160ms ease;
}

.search-dialog-enter-from,
.search-dialog-leave-to {
  opacity: 0;
}

.search-dialog-enter-from .search-dialog-panel,
.search-dialog-leave-to .search-dialog-panel {
  opacity: 0;
  transform: translateY(-12px);
}

@media (max-width: 600px) {
  .search-dialog-backdrop {
    padding: 76px 12px 16px;
  }

  .search-dialog-panel {
    max-height: calc(100vh - 92px);
  }

  .search-dialog-header {
    padding: 20px 18px 16px;
  }

  .search-form {
    margin: 0 18px;
  }

  .search-results {
    padding-right: 18px;
    padding-left: 18px;
  }

  .search-dialog-footer {
    margin-right: 18px;
    margin-left: 18px;
  }
}
</style>
