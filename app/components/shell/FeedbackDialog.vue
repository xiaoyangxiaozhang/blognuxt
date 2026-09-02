<template>
  <Teleport to="body">
    <Transition name="site-dialog">
      <div v-if="feedbackOpen" class="dialog-overlay" role="presentation" @click.self="close">
        <section class="dialog" role="dialog" aria-modal="true" aria-labelledby="feedback-dialog-title">
          <button class="close-button" type="button" aria-label="关闭" @click="close">×</button>

          <div class="dialog-header">
            <h2 id="feedback-dialog-title">{{ mode === 'submit' ? '反馈与举报' : '查询工单' }}</h2>
            <div class="mode-switch" role="tablist" aria-label="反馈功能">
              <button type="button" :class="{ active: mode === 'submit' }" @click="mode = 'submit'">提交反馈</button>
              <button type="button" :class="{ active: mode === 'query' }" @click="mode = 'query'">查询工单</button>
            </div>
          </div>

          <form v-if="mode === 'submit'" class="dialog-form" @submit.prevent="submit">
            <label>
              <span>相关页面</span>
              <input v-model="form.reportUrl" required type="url" placeholder="页面地址">
            </label>
            <label>
              <span>类型</span>
              <select v-model="form.reportType">
                <option v-for="item in reportTypes" :key="item.value" :value="item.value">{{ item.label }}</option>
              </select>
            </label>
            <label>
              <span>邮箱</span>
              <input v-model="form.email" type="email" placeholder="选填">
            </label>
            <label>
              <span>原因</span>
              <input v-model="form.reason" maxlength="255" placeholder="选填">
            </label>
            <label>
              <span>说明</span>
              <textarea v-model="form.description" required maxlength="5000" rows="5" placeholder="请填写具体内容" />
            </label>
            <label class="file-field">
              <span>附件</span>
              <input ref="fileInput" type="file" accept="image/*,.pdf,.doc,.docx" multiple @change="uploadAttachments">
            </label>
            <div v-if="form.attachmentFiles.length" class="attachment-list">
              <div v-for="(file, index) in form.attachmentFiles" :key="file" class="attachment-item">
                <span>{{ fileName(file) }}</span>
                <button type="button" @click="removeAttachment(index)">移除</button>
              </div>
            </div>
            <div class="form-actions">
              <span v-if="uploading" class="status-text">附件上传中…</span>
              <button class="primary-button" type="submit" :disabled="submitting || uploading">
                {{ submitting ? '提交中…' : '提交' }}
              </button>
            </div>
          </form>

          <div v-else class="dialog-form">
            <label>
              <span>工单号</span>
              <input v-model="ticketNo" required placeholder="请输入工单号" @keyup.enter="queryTicket">
            </label>
            <div class="form-actions">
              <span v-if="queryError" class="error-text">{{ queryError }}</span>
              <button class="primary-button" type="button" :disabled="querying" @click="queryTicket">
                {{ querying ? '查询中…' : '查询' }}
              </button>
            </div>
            <div v-if="ticketResult" class="ticket-result">
              <div><span>工单号</span><strong>{{ ticketResult.ticket_no }}</strong></div>
              <div><span>类型</span><strong>{{ reportTypeLabel(ticketResult.report_type) }}</strong></div>
              <div><span>状态</span><strong>{{ statusLabel(ticketResult.status) }}</strong></div>
              <div v-if="ticketResult.admin_reply" class="ticket-reply">
                <span>回复</span>
                <p>{{ ticketResult.admin_reply }}</p>
              </div>
            </div>
          </div>

          <div v-if="submittedTicket" class="submit-result">
            <span>工单号</span>
            <strong>{{ submittedTicket }}</strong>
            <button type="button" @click="mode = 'query'; ticketNo = submittedTicket">查询工单</button>
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { useSiteOverlays } from '~/composables/useSiteOverlays'
import { getFeedbackByTicket, submitFeedback, type FeedbackResponse, type FeedbackStatus, type ReportType } from '~/services/api/feedback'
import { uploadFile } from '~/services/api/upload'

const { feedbackOpen } = useSiteOverlays()
const route = useRoute()
const mode = ref<'submit' | 'query'>('submit')
const submitting = ref(false)
const uploading = ref(false)
const submittedTicket = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const ticketNo = ref('')
const querying = ref(false)
const queryError = ref('')
const ticketResult = ref<FeedbackResponse | null>(null)

const reportTypes: Array<{ value: ReportType, label: string }> = [
  { value: 'copyright', label: '版权 / 侵权' },
  { value: 'inappropriate', label: '不当内容' },
  { value: 'summary', label: '文章信息问题' },
  { value: 'suggestion', label: '功能建议' }
]

const form = reactive({
  reportUrl: '',
  reportType: 'suggestion' as ReportType,
  email: '',
  reason: '',
  description: '',
  attachmentFiles: [] as string[]
})

const currentPageUrl = () => import.meta.client ? window.location.href : route.fullPath

const reset = () => {
  form.reportUrl = currentPageUrl()
  form.reportType = 'suggestion'
  form.email = ''
  form.reason = ''
  form.description = ''
  form.attachmentFiles = []
  submittedTicket.value = ''
  ticketNo.value = ''
  queryError.value = ''
  ticketResult.value = null
  mode.value = 'submit'
}

const close = () => {
  if (submitting.value || uploading.value || querying.value) return
  feedbackOpen.value = false
  reset()
}

watch(feedbackOpen, (open) => {
  if (open) reset()
})

const uploadAttachments = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files || []).slice(0, 5 - form.attachmentFiles.length)
  if (!files.length) return

  uploading.value = true
  try {
    const responses = await Promise.all(files.map(file => uploadFile(file, '反馈投诉')))
    form.attachmentFiles.push(...responses.map(response => response.data.file_url))
  } catch (error) {
    console.error(error)
    ElMessage.error('附件上传失败。')
  } finally {
    uploading.value = false
    input.value = ''
  }
}

const removeAttachment = (index: number) => {
  form.attachmentFiles.splice(index, 1)
}

const fileName = (url: string) => decodeURIComponent(url.split('/').pop() || url)

const submit = async () => {
  submitting.value = true
  try {
    const response = await submitFeedback({
      reportUrl: form.reportUrl.trim(),
      reportType: form.reportType,
      email: form.email.trim() || undefined,
      reason: form.reason.trim() || undefined,
      description: form.description.trim(),
      attachmentFiles: form.attachmentFiles
    })
    submittedTicket.value = response.data.ticket_no
    ElMessage.success('已提交。')
  } catch (error) {
    console.error(error)
    ElMessage.error('提交失败，请稍后重试。')
  } finally {
    submitting.value = false
  }
}

const queryTicket = async () => {
  if (!ticketNo.value.trim()) return
  querying.value = true
  queryError.value = ''
  ticketResult.value = null
  try {
    const response = await getFeedbackByTicket(ticketNo.value.trim())
    ticketResult.value = response.data
  } catch (error) {
    console.error(error)
    queryError.value = '未找到该工单。'
  } finally {
    querying.value = false
  }
}

const reportTypeLabel = (type: ReportType) => reportTypes.find(item => item.value === type)?.label || type
const statusLabel = (status: FeedbackStatus) => ({ pending: '处理中', resolved: '已解决', closed: '已关闭' }[status] || status)
</script>

<style scoped lang="scss">
.dialog-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: grid;
  place-items: center;
  padding: 16px;
  overflow-y: auto;
  background: rgba(0, 0, 0, 0.48);
  backdrop-filter: blur(8px);
}

.dialog {
  position: relative;
  width: min(100%, 460px);
  max-height: min(760px, calc(100vh - 32px));
  overflow-y: auto;
  padding: 28px;
  border: 1px solid var(--border-color);
  border-radius: 16px;
  background: var(--bg-elevated);
  color: var(--text-primary);
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.24);
}

.close-button {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  border: 0;
  background: transparent;
  color: var(--text-muted);
  font-size: 24px;
  cursor: pointer;
}

.dialog-header {
  display: grid;
  gap: 18px;
  margin-bottom: 24px;

  h2 {
    margin: 0;
    font-size: 24px;
  }
}

.mode-switch {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 4px;
  padding: 3px;
  border-radius: 9px;
  background: var(--bg-soft);

  button {
    border: 0;
    border-radius: 7px;
    padding: 8px;
    background: transparent;
    color: var(--text-muted);
    font: inherit;
    font-size: 13px;
    cursor: pointer;

    &.active {
      background: var(--bg-panel-solid);
      color: var(--text-primary);
    }
  }
}

.dialog-form {
  display: grid;
  gap: 15px;
}

.dialog-form label {
  display: grid;
  gap: 7px;

  span {
    font-size: 13px;
    font-weight: 600;
  }
}

.dialog-form input,
.dialog-form select,
.dialog-form textarea {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid var(--border-color);
  border-radius: 9px;
  padding: 10px 12px;
  background: var(--bg-panel-solid);
  color: var(--text-primary);
  font: inherit;
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: var(--brand-accent);
  }
}

.dialog-form textarea {
  resize: vertical;
}

.file-field input {
  padding: 8px;
  font-size: 12px;
}

.attachment-list {
  display: grid;
  gap: 6px;
}

.attachment-item,
.ticket-result > div,
.form-actions,
.submit-result {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.attachment-item {
  padding: 7px 9px;
  border-radius: 7px;
  background: var(--bg-soft);
  font-size: 12px;

  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  button,
  .submit-result button {
    flex: 0 0 auto;
    border: 0;
    background: transparent;
    color: var(--brand-accent);
    cursor: pointer;
  }
}

.form-actions {
  justify-content: flex-end;
  margin-top: 3px;
}

.primary-button {
  border: 1px solid var(--brand-accent);
  border-radius: 999px;
  padding: 9px 18px;
  background: var(--brand-accent);
  color: #fff;
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.status-text,
.error-text {
  margin-right: auto;
  font-size: 12px;
}

.status-text {
  color: var(--text-muted);
}

.error-text {
  color: #d45b5b;
}

.ticket-result {
  display: grid;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
  font-size: 13px;

  span {
    color: var(--text-muted);
  }
}

.ticket-reply {
  display: grid !important;
  justify-content: stretch !important;
  gap: 7px;
  margin-top: 2px;
  padding-top: 12px;
  border-top: 1px solid var(--border-color);

  p {
    margin: 0;
    white-space: pre-wrap;
    line-height: 1.6;
  }
}

.submit-result {
  justify-content: flex-start;
  margin-top: 22px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
  font-size: 13px;

  span {
    color: var(--text-muted);
  }

  button {
    margin-left: auto;
    border: 0;
    background: transparent;
    color: var(--brand-accent);
    cursor: pointer;
  }
}

.site-dialog-enter-active,
.site-dialog-leave-active {
  transition: opacity 0.2s ease;
}

.site-dialog-enter-from,
.site-dialog-leave-to {
  opacity: 0;
}
</style>
