<template>
  <Teleport to="body">
    <Transition name="subscribe-modal">
      <div
        v-if="modelValue"
        class="subscribe-overlay"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        :aria-describedby="descriptionId"
        @click.self="closeDialog"
        @keydown.esc="closeDialog"
      >
        <section class="subscribe-dialog">
          <button class="close-button" type="button" aria-label="关闭订阅弹窗" @click="closeDialog">
            <IconMaterialSymbolsCloseRounded />
          </button>

          <div class="dialog-icon" aria-hidden="true">
            <IconMaterialSymbolsNotificationsActiveRounded />
          </div>

          <template v-if="submitState === 'success' || submitState === 'already-subscribed'">
            <div class="dialog-copy success-copy" aria-live="polite">
              <h2 :id="titleId">{{ resultTitle }}</h2>
              <p :id="descriptionId">{{ resultDescription }}</p>
            </div>

            <button class="primary-button" type="button" @click="closeDialog">
              完成
            </button>
          </template>

          <template v-else>
            <div class="dialog-copy">
              <h2 :id="titleId">订阅更新</h2>
              <p :id="descriptionId">留下邮箱，有新文章时及时收到通知。</p>
            </div>

            <form class="subscribe-form" novalidate @submit.prevent="handleSubmit">
              <div class="form-field">
                <label for="subscribe-email">邮箱</label>
                <input
                  id="subscribe-email"
                  ref="emailInput"
                  v-model="email"
                  type="email"
                  inputmode="email"
                  autocomplete="email"
                  placeholder="name@example.com"
                  :aria-invalid="Boolean(errorMessage)"
                  :aria-describedby="errorMessage ? errorId : undefined"
                  :disabled="submitState === 'submitting'"
                  @input="clearError"
                >
                <p v-if="errorMessage" :id="errorId" class="field-error" role="alert">
                  {{ errorMessage }}
                </p>
              </div>

              <button class="primary-button" type="submit" :disabled="submitState === 'submitting'">
                <span v-if="submitState === 'submitting'" class="loading-spinner" aria-hidden="true" />
                {{ submitState === 'submitting' ? '提交中...' : '立即订阅' }}
              </button>
            </form>

            <p class="privacy-note">邮箱仅用于发送博客更新，你可随时取消订阅。</p>
          </template>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import IconMaterialSymbolsCloseRounded from '~icons/material-symbols/close-rounded'
import IconMaterialSymbolsNotificationsActiveRounded from '~icons/material-symbols/notifications-active-rounded'
import { subscribeToUpdates } from '~/services/api/subscription'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
}>()

type SubmitState = 'idle' | 'submitting' | 'success' | 'already-subscribed'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const titleId = 'subscribe-dialog-title'
const descriptionId = 'subscribe-dialog-description'
const errorId = 'subscribe-email-error'

const emailInput = ref<HTMLInputElement | null>(null)
const email = ref('')
const errorMessage = ref('')
const submitState = ref<SubmitState>('idle')

let previousActiveElement: HTMLElement | null = null
let previousBodyOverflow = ''

const resultTitle = computed(() => (
  submitState.value === 'already-subscribed' ? '已经订阅过了' : '订阅成功'
))

const resultDescription = computed(() => (
  submitState.value === 'already-subscribed'
    ? '这个邮箱已在订阅列表中，无需重复提交。'
    : '订阅请求已提交，感谢你的关注。'
))

const clearError = () => {
  errorMessage.value = ''
}

const resetDialog = () => {
  email.value = ''
  errorMessage.value = ''
  submitState.value = 'idle'
}

const closeDialog = () => {
  if (submitState.value === 'submitting') {
    return
  }

  emit('update:modelValue', false)
}

const getErrorStatus = (error: unknown) => {
  if (!error || typeof error !== 'object') return undefined

  const fetchError = error as {
    status?: number
    statusCode?: number
    data?: { code?: number }
  }

  return fetchError.statusCode || fetchError.status || fetchError.data?.code
}

const handleSubmit = async () => {
  const normalizedEmail = email.value.trim().toLowerCase()

  if (!normalizedEmail) {
    errorMessage.value = '请输入邮箱地址。'
    emailInput.value?.focus()
    return
  }

  if (!EMAIL_PATTERN.test(normalizedEmail)) {
    errorMessage.value = '请输入正确的邮箱地址。'
    emailInput.value?.focus()
    return
  }

  errorMessage.value = ''
  submitState.value = 'submitting'

  try {
    const response = await subscribeToUpdates({ email: normalizedEmail })
    const responseSucceeded = response.code === 0 || (response.code >= 200 && response.code < 300)

    if (responseSucceeded) {
      submitState.value = 'success'
      return
    }

    if (response.code === 409) {
      submitState.value = 'already-subscribed'
      return
    }

    errorMessage.value = response.message || '订阅失败，请稍后重试。'
    submitState.value = 'idle'
  } catch (error) {
    if (getErrorStatus(error) === 409) {
      submitState.value = 'already-subscribed'
      return
    }

    console.error('Failed to subscribe:', error)
    errorMessage.value = '订阅失败，请检查网络后重试。'
    submitState.value = 'idle'
  }
}

watch(
  () => props.modelValue,
  async (isOpen) => {
    if (!import.meta.client) return

    if (isOpen) {
      previousActiveElement = document.activeElement as HTMLElement | null
      previousBodyOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      await nextTick()
      emailInput.value?.focus()
      return
    }

    document.body.style.overflow = previousBodyOverflow
    resetDialog()
    previousActiveElement?.focus()
    previousActiveElement = null
  }
)

onUnmounted(() => {
  if (!import.meta.client) return
  document.body.style.overflow = previousBodyOverflow
})
</script>

<style scoped lang="scss">
.subscribe-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: grid;
  place-items: center;
  padding: 16px;
  overflow-y: auto;
  background: rgba(0, 0, 0, 0.42);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.subscribe-dialog {
  --subscribe-error: #ff8b95;

  position: relative;
  width: min(100%, 440px);
  padding: 32px 28px 26px;
  border: 1px solid var(--border-color);
  border-radius: 18px;
  background: var(--bg-elevated);
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.24);
  color: var(--text-primary);
}

.close-button {
  position: absolute;
  top: 14px;
  right: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: color var(--transition-fast), background var(--transition-fast);

  :deep(svg) {
    width: 21px;
    height: 21px;
  }

  &:hover {
    color: var(--text-primary);
    background: var(--accent-soft);
  }

  &:focus-visible {
    outline: 2px solid var(--brand-accent);
    outline-offset: 2px;
  }
}

.dialog-icon {
  display: grid;
  place-items: center;
  width: 58px;
  height: 58px;
  margin: 2px auto 18px;
  border-radius: 18px;
  background: var(--brand-accent-soft);
  color: var(--brand-accent);

  :deep(svg) {
    width: 29px;
    height: 29px;
  }
}

.dialog-copy {
  text-align: center;

  h2 {
    margin: 0;
    color: var(--text-primary);
    font-size: 25px;
    line-height: 1.25;
  }

  p {
    margin: 9px 0 0;
    color: var(--text-secondary);
    font-size: 14px;
    line-height: 1.7;
  }
}

.success-copy {
  margin-bottom: 24px;
}

.subscribe-form {
  display: grid;
  gap: 18px;
  margin-top: 24px;
}

.form-field {
  display: grid;
  gap: 8px;

  label {
    color: var(--text-primary);
    font-size: 13px;
    font-weight: 600;
  }

  input {
    width: 100%;
    height: 54px;
    padding: 0 16px;
    border: 1px solid var(--border-color);
    border-radius: 14px;
    outline: 0;
    background: var(--bg-panel-solid);
    color: var(--text-primary);
    font: inherit;
    font-size: 15px;
    transition: border-color var(--transition-fast), box-shadow var(--transition-fast);

    &::placeholder {
      color: var(--text-muted);
    }

    &:focus {
      border-color: var(--brand-accent);
      box-shadow: 0 0 0 3px var(--brand-accent-soft);
    }

    &[aria-invalid='true'] {
      border-color: var(--subscribe-error);
    }

    &:disabled {
      cursor: wait;
      opacity: 0.72;
    }
  }
}

.field-error {
  margin: 0;
  color: var(--subscribe-error);
  font-size: 12px;
  line-height: 1.5;
}

:global([data-theme='blue-white']) .subscribe-dialog {
  --subscribe-error: #b4232c;
}

.primary-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  width: 100%;
  min-height: 52px;
  padding: 0 18px;
  border: 0;
  border-radius: 14px;
  background: var(--brand-accent-hover);
  color: var(--brand-accent-text);
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: filter var(--transition-fast), box-shadow var(--transition-fast);

  &:hover:not(:disabled) {
    filter: brightness(1.08);
    box-shadow: 0 10px 24px rgba(107, 109, 230, 0.2);
  }

  &:focus-visible {
    outline: 2px solid var(--brand-accent);
    outline-offset: 3px;
  }

  &:disabled {
    cursor: wait;
    opacity: 0.74;
  }
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.36);
  border-top-color: currentColor;
  border-radius: 50%;
  animation: subscribe-spin 0.7s linear infinite;
}

.privacy-note {
  margin: 14px 0 0;
  color: var(--text-muted);
  font-size: 12px;
  line-height: 1.6;
  text-align: center;
}

@keyframes subscribe-spin {
  to {
    transform: rotate(360deg);
  }
}

.subscribe-modal-enter-active,
.subscribe-modal-leave-active {
  transition: opacity 0.22s ease;

  .subscribe-dialog {
    transition: opacity 0.22s ease, transform 0.22s ease;
  }
}

.subscribe-modal-enter-from,
.subscribe-modal-leave-to {
  opacity: 0;

  .subscribe-dialog {
    opacity: 0;
    transform: translateY(12px) scale(0.98);
  }
}

@media (max-width: 480px) {
  .subscribe-overlay {
    align-items: end;
    padding: 12px;
  }

  .subscribe-dialog {
    padding: 28px 18px 22px;
    border-radius: 18px;
  }

  .dialog-copy h2 {
    font-size: 22px;
  }
}
</style>
