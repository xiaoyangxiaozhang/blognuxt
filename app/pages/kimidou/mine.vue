<template>
  <section class="my-moments-page">
    <main class="my-moments-shell">
      <header class="page-header">
        <div>
          <NuxtLink to="/kimidou" class="back-link">← 返回基米斗</NuxtLink>
          <h1>我的动态</h1>
          <p v-if="isLoggedIn">管理你在基米斗发布的动态。</p>
        </div>
        <button v-if="isLoggedIn" type="button" class="primary-button" :disabled="!canCreate" @click="openCreate">
          发布动态
        </button>
      </header>

      <div v-if="!authReady || loading" class="state-card">
        <p>正在加载你的动态…</p>
      </div>

      <div v-else-if="!isLoggedIn" class="state-card login-card">
        <h2>登录后管理自己的动态</h2>
        <p>登录后可以发布、编辑和删除基米斗动态。</p>
        <button type="button" class="primary-button" @click="loginDialogOpen = true">登录</button>
      </div>

      <template v-else>
        <p v-if="!canCreate" class="permission-hint">管理员暂未开启你的发帖资格，你仍然可以管理已有动态。</p>
        <div v-if="pageError" class="state-card error-card">{{ pageError }}</div>

        <div v-else-if="items.length === 0" class="state-card empty-card">
          <h2>还没有自己的动态</h2>
          <p>{{ canCreate ? '分享一条你和小猫的日常吧。' : '开启发帖资格后，就可以发布第一条动态。' }}</p>
          <button v-if="canCreate" type="button" class="secondary-button" @click="openCreate">发布第一条动态</button>
        </div>

        <div v-else class="moment-list">
          <article v-for="item in items" :key="item.id" class="moment-card">
            <div class="moment-card-head">
              <div class="author">
                <img v-if="item.author?.avatar" :src="proxyImageUrl(item.author.avatar)" :alt="item.author.nickname" />
                <span v-else>{{ (item.author?.nickname || currentUser?.nickname || '我').slice(0, 1) }}</span>
                <strong>{{ item.author?.nickname || currentUser?.nickname || '我' }}</strong>
              </div>
              <span class="status" :class="{ draft: !item.is_publish }">{{ item.is_publish ? '已发布' : '草稿' }}</span>
            </div>

            <p class="moment-text">{{ item.content.text || '分享了一条图片动态。' }}</p>

            <div v-if="item.content.images?.length" class="moment-images">
              <img
                v-for="(image, index) in item.content.images.slice(0, 9)"
                :key="`${item.id}-${index}`"
                :src="proxyImageUrl(image)"
                :alt="`动态图片 ${index + 1}`"
                loading="lazy"
              />
            </div>

            <footer class="moment-card-footer">
              <span>{{ formatMomentDate(item.publish_time) }}</span>
              <div class="moment-actions">
                <button type="button" class="text-button" @click="openEdit(item)">编辑</button>
                <button type="button" class="danger-button" @click="removeMoment(item.id)">删除</button>
              </div>
            </footer>
          </article>
        </div>

        <button v-if="hasMore" type="button" class="load-more" :disabled="loadingMore" @click="loadMore">
          {{ loadingMore ? '加载中…' : '加载更多' }}
        </button>
      </template>
    </main>
  </section>

  <Transition name="site-dialog">
    <div v-if="editorOpen" class="editor-overlay" role="presentation" @click.self="closeEditor">
      <section class="editor-dialog" role="dialog" aria-modal="true" aria-labelledby="my-moment-editor-title">
        <button type="button" class="close-button" aria-label="关闭" @click="closeEditor">×</button>
        <h2 id="my-moment-editor-title">{{ editingId ? '编辑动态' : '发布动态' }}</h2>

        <form class="editor-form" @submit.prevent="submitMoment">
          <label>
            <span>动态内容</span>
            <textarea v-model="contentText" rows="6" maxlength="1000" placeholder="分享你和小猫的日常。" />
          </label>

          <label>
            <span>图片（最多 9 张）</span>
            <input ref="fileInput" type="file" accept="image/*" multiple @change="handleFileChange" />
          </label>

          <div v-if="previewImages.length" class="editor-images">
            <div v-for="(image, index) in previewImages" :key="`${image}-${index}`" class="editor-image">
              <img :src="image.startsWith('blob:') ? image : proxyImageUrl(image)" :alt="`待发布图片 ${index + 1}`" />
              <button type="button" aria-label="移除图片" @click="removeImage(index)">×</button>
            </div>
          </div>

          <label class="publish-toggle">
            <input v-model="isPublish" type="checkbox" />
            <span>保存后公开展示</span>
          </label>

          <div class="editor-actions">
            <button type="button" class="secondary-button" :disabled="saving" @click="closeEditor">取消</button>
            <button type="submit" class="primary-button" :disabled="saving">
              {{ saving ? '保存中…' : '保存动态' }}
            </button>
          </div>
        </form>
      </section>
    </div>
  </Transition>

  <LoginDialog
    v-model="loginDialogOpen"
    @login-success="handleLoginSuccess"
    @forgot-password="openAccount('reset')"
  />
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import LoginDialog from '~/components/shell/LoginDialog.vue'
import { useCommentAuth } from '~/composables/useCommentAuth'
import { useSiteOverlays } from '~/composables/useSiteOverlays'
import {
  createKimidouMoment,
  deleteKimidouMoment,
  getMyKimidouMoments,
  updateKimidouMoment,
  type KimidouManagedMomentItem,
  type KimidouMomentPayload
} from '~/services/api/kimidou'
import { uploadFile } from '~/services/api/upload'
import { formatDate } from '~/utils/date'
import { proxyImageUrl } from '~/utils/image'

const { currentUser, authReady, isLoggedIn, fetchProfile } = useCommentAuth()
const { openAccount } = useSiteOverlays()
const items = ref<KimidouManagedMomentItem[]>([])
const total = ref(0)
const page = ref(1)
const loading = ref(false)
const loadingMore = ref(false)
const saving = ref(false)
const pageError = ref('')
const editorOpen = ref(false)
const loginDialogOpen = ref(false)
const editingId = ref<number | null>(null)
const contentText = ref('')
const currentImages = ref<string[]>([])
const pendingFiles = ref<File[]>([])
const pendingPreviews = ref<string[]>([])
const isPublish = ref(true)
const fileInput = ref<HTMLInputElement | null>(null)

const canCreate = computed(() => {
  const role = currentUser.value?.role
  return role === 'admin' || role === 'super_admin' || currentUser.value?.can_post_moments === true
})
const hasMore = computed(() => items.value.length < total.value)
const previewImages = computed(() => [...currentImages.value, ...pendingPreviews.value])

const formatMomentDate = (value?: string) => formatDate(value) || '刚刚'

const fetchItems = async () => {
  if (!isLoggedIn.value) return
  loading.value = true
  pageError.value = ''
  page.value = 1
  try {
    const response = await getMyKimidouMoments({ page: 1, page_size: 10, is_deleted: false })
    items.value = response.data?.list || []
    total.value = response.data?.total || 0
  } catch (error) {
    console.error(error)
    pageError.value = '我的动态加载失败，请稍后重试。'
  } finally {
    loading.value = false
  }
}

const loadMore = async () => {
  if (loadingMore.value || !hasMore.value) return
  loadingMore.value = true
  try {
    const nextPage = page.value + 1
    const response = await getMyKimidouMoments({ page: nextPage, page_size: 10, is_deleted: false })
    items.value = [...items.value, ...(response.data?.list || [])]
    total.value = response.data?.total || total.value
    page.value = nextPage
  } catch (error) {
    console.error(error)
    ElMessage.error('加载更多动态失败。')
  } finally {
    loadingMore.value = false
  }
}

const clearPending = () => {
  pendingPreviews.value.forEach(url => URL.revokeObjectURL(url))
  pendingFiles.value = []
  pendingPreviews.value = []
}

const resetEditor = () => {
  clearPending()
  editingId.value = null
  contentText.value = ''
  currentImages.value = []
  isPublish.value = true
  if (fileInput.value) fileInput.value.value = ''
}

const openCreate = () => {
  if (!canCreate.value) {
    ElMessage.warning('管理员尚未开启你的发帖资格。')
    return
  }
  resetEditor()
  editorOpen.value = true
}

const openEdit = (item: KimidouManagedMomentItem) => {
  resetEditor()
  editingId.value = item.id
  contentText.value = item.content.text || ''
  currentImages.value = [...(item.content.images || [])]
  isPublish.value = item.is_publish
  editorOpen.value = true
}

const closeEditor = () => {
  if (saving.value) return
  editorOpen.value = false
  resetEditor()
}

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = Array.from(target.files || [])
  const remaining = 9 - previewImages.value.length
  if (files.length > remaining) ElMessage.warning('动态最多保留 9 张图片。')
  files.slice(0, Math.max(remaining, 0)).forEach(file => {
    pendingFiles.value.push(file)
    pendingPreviews.value.push(URL.createObjectURL(file))
  })
  target.value = ''
}

const removeImage = (index: number) => {
  if (index < currentImages.value.length) {
    currentImages.value.splice(index, 1)
    return
  }
  const pendingIndex = index - currentImages.value.length
  const preview = pendingPreviews.value[pendingIndex]
  if (preview) URL.revokeObjectURL(preview)
  pendingPreviews.value.splice(pendingIndex, 1)
  pendingFiles.value.splice(pendingIndex, 1)
}

const submitMoment = async () => {
  if (!contentText.value.trim() && previewImages.value.length === 0) {
    ElMessage.warning('请填写文字或选择图片。')
    return
  }
  saving.value = true
  const editing = Boolean(editingId.value)
  try {
    const images = [...currentImages.value]
    for (const file of pendingFiles.value) {
      const response = await uploadFile(file, 'cat_moment')
      const imageUrl = response.data?.file_url
      if (!imageUrl) throw new Error(response.message || '图片上传失败。')
      images.push(imageUrl)
    }

    const payload: KimidouMomentPayload = {
      content: { text: contentText.value.trim(), images },
      is_publish: isPublish.value
    }
    if (editingId.value) await updateKimidouMoment(editingId.value, payload)
    else await createKimidouMoment(payload)
    ElMessage.success(editing ? '动态已更新。' : '动态已发布。')
    saving.value = false
    closeEditor()
    await fetchItems()
  } catch (error: any) {
    console.error(error)
    ElMessage.error(error?.message || '保存动态失败，请稍后重试。')
  } finally {
    saving.value = false
  }
}

const removeMoment = async (id: number) => {
  if (!import.meta.client || !window.confirm('删除后可以由管理员恢复，确定删除这条动态吗？')) return
  try {
    await deleteKimidouMoment(id)
    ElMessage.success('动态已删除。')
    await fetchItems()
  } catch (error: any) {
    console.error(error)
    ElMessage.error(error?.message || '删除动态失败。')
  }
}

const handleLoginSuccess = async () => {
  await fetchProfile()
}

watch(isLoggedIn, loggedIn => {
  if (loggedIn) void fetchItems()
  else items.value = []
}, { immediate: true })

onMounted(() => {
  void fetchProfile()
})

onBeforeUnmount(clearPending)
</script>

<style scoped lang="scss">
.my-moments-page {
  min-height: 100vh;
  padding: 112px 20px 80px;
  background: var(--home-surface);
  color: var(--home-text);
}

.my-moments-shell {
  width: min(860px, 100%);
  margin: 0 auto;
}

.page-header,
.moment-card-head,
.moment-card-footer,
.editor-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.page-header {
  margin-bottom: 24px;

  h1 { margin: 8px 0 6px; font-size: clamp(28px, 5vw, 42px); }
  p { margin: 0; color: var(--text-muted); font-size: 14px; }
}

.back-link,
.text-button {
  color: var(--brand-accent);
  font-size: 13px;
}

.primary-button,
.secondary-button,
.danger-button {
  border-radius: 999px;
  padding: 9px 17px;
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;

  &:disabled { opacity: .55; cursor: not-allowed; }
}

.primary-button { border: 1px solid var(--brand-accent); background: var(--brand-accent); color: #fff; }
.secondary-button { border: 1px solid var(--border-color); background: transparent; color: var(--home-text); }
.danger-button { border: 0; background: transparent; color: #d14b61; padding: 0; }
.text-button { border: 0; background: transparent; padding: 0; cursor: pointer; }

.state-card,
.moment-card {
  border: 1px solid color-mix(in srgb, var(--home-text) 10%, transparent);
  border-radius: 16px;
  background: var(--home-card-bg);
}

.state-card { padding: 40px 24px; text-align: center; }
.state-card h2 { margin: 0 0 10px; font-size: 22px; }
.state-card p { margin: 0 0 20px; color: var(--text-muted); }
.permission-hint { margin: 0 0 18px; color: var(--text-muted); font-size: 13px; }
.error-card { color: #d14b61; }

.moment-list { display: grid; gap: 14px; }
.moment-card { padding: 20px; }
.author { display: flex; align-items: center; gap: 9px; }
.author img,
.author > span { width: 38px; height: 38px; border-radius: 50%; object-fit: cover; }
.author > span { display: grid; place-items: center; background: var(--brand-accent-soft); color: var(--brand-accent); font-weight: 700; }
.author strong { font-size: 14px; }
.status { color: var(--brand-accent); font-size: 12px; }
.status.draft { color: var(--text-muted); }
.moment-text { margin: 18px 0 0; white-space: pre-wrap; line-height: 1.8; word-break: break-word; }
.moment-images { display: grid; grid-template-columns: repeat(3, minmax(0, 120px)); gap: 8px; margin-top: 16px; }
.moment-images img { width: 100%; aspect-ratio: 1; border-radius: 10px; object-fit: cover; }
.moment-card-footer { margin-top: 18px; color: var(--text-muted); font-size: 12px; }
.moment-actions { display: flex; gap: 14px; }
.load-more { display: block; margin: 20px auto 0; border: 1px solid var(--border-color); border-radius: 999px; padding: 9px 20px; background: transparent; color: var(--home-text); cursor: pointer; }
.load-more:disabled { opacity: .55; cursor: wait; }

.editor-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: grid;
  place-items: center;
  padding: 16px;
  background: rgba(0, 0, 0, .48);
  backdrop-filter: blur(8px);
}

.editor-dialog {
  position: relative;
  width: min(100%, 560px);
  max-height: calc(100vh - 32px);
  overflow-y: auto;
  padding: 28px;
  border: 1px solid var(--border-color);
  border-radius: 16px;
  background: var(--bg-elevated);
  color: var(--text-primary);
  box-shadow: 0 24px 70px rgba(0, 0, 0, .24);

  h2 { margin: 0 0 22px; font-size: 22px; }
}

.close-button { position: absolute; top: 10px; right: 12px; border: 0; background: transparent; color: var(--text-muted); font-size: 24px; cursor: pointer; }
.editor-form { display: grid; gap: 18px; }
.editor-form label { display: grid; gap: 8px; font-size: 13px; font-weight: 600; }
.editor-form textarea { width: 100%; box-sizing: border-box; resize: vertical; border: 1px solid var(--border-color); border-radius: 10px; padding: 11px 12px; background: var(--bg-panel-solid); color: var(--text-primary); font: inherit; line-height: 1.6; }
.editor-form textarea:focus { outline: none; border-color: var(--brand-accent); }
.editor-images { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.editor-image { position: relative; aspect-ratio: 1; overflow: hidden; border-radius: 9px; background: var(--bg-panel-solid); }
.editor-image img { width: 100%; height: 100%; object-fit: cover; }
.editor-image button { position: absolute; top: 4px; right: 4px; width: 24px; height: 24px; border: 0; border-radius: 50%; background: rgba(0, 0, 0, .6); color: #fff; cursor: pointer; }
.publish-toggle { display: flex !important; grid-template-columns: none !important; align-items: center; gap: 8px !important; font-weight: 400 !important; }
.editor-actions { justify-content: flex-end; }

@media (max-width: 560px) {
  .my-moments-page { padding: 88px 14px 56px; }
  .page-header { align-items: flex-start; flex-direction: column; }
  .page-header .primary-button { align-self: stretch; }
  .moment-card { padding: 16px; }
  .editor-dialog { padding: 24px 18px; }
}
</style>
