<template>
  <Teleport to="body">
    <Transition name="subscribe-modal" :css="!motionInstant">
      <div
        v-if="modelValue"
        class="subscribe-overlay"
        role="dialog"
        aria-modal="true"
        tabindex="-1"
        ref="overlay"
        :aria-labelledby="titleId"
        :aria-describedby="descriptionId"
        @click.self="closeDialog"
        @keydown.esc="closeDialog"
      >
        <section class="subscribe-dialog">
          <button class="close-button" type="button" aria-label="关闭订阅弹窗" :disabled="submitState === 'submitting'" @click="closeDialog">
            <Cross1Icon aria-hidden="true" />
          </button>

          <div class="dialog-icon" :class="{ 'is-submitting': submitState === 'submitting' && !motionInstant }" aria-hidden="true">
            <SubscriptionIcon :active="isComplete" :instant="motionInstant" />
          </div>

          <template v-if="isComplete">
            <div class="dialog-copy success-copy" aria-live="polite">
              <h2 :id="titleId">{{ resultTitle }}</h2>
              <p :id="descriptionId">{{ resultDescription }}</p>
            </div>

            <button ref="completeButton" class="primary-button" type="button" @click="closeDialog">
              完成
            </button>
          </template>

          <template v-else>
            <div class="dialog-copy">
              <h2 :id="titleId">订阅更新</h2>
              <p :id="descriptionId">{{ accountEmail ? '使用登录邮箱订阅，有新文章时及时收到通知。' : '留下邮箱，有新文章时及时收到通知。' }}</p>
            </div>

            <form class="subscribe-form" novalidate :aria-busy="submitState === 'submitting'" @submit.prevent="handleSubmit" @keydown.enter="motionInstant = true">
              <div v-if="accountEmail" class="account-email">
                <span>登录邮箱</span>
                <strong>{{ accountEmail }}</strong>
              </div>
              <div v-else class="form-field">
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
                <p v-if="isLoggedIn" class="email-hint">当前账号尚未绑定真实邮箱，请填写用于接收更新的邮箱。</p>
              </div>
              <p v-if="errorMessage" :id="errorId" class="field-error" role="alert">{{ errorMessage }}</p>

              <button class="primary-button" type="submit" :disabled="submitState === 'submitting'" @pointerdown="motionInstant = false">
                <span v-if="submitState === 'submitting'" class="loading-spinner" aria-hidden="true" />
                <span aria-live="polite">{{ submitState === 'submitting' ? '正在订阅...' : errorMessage ? '重试订阅' : '立即订阅' }}</span>
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
import { SubscriptionIcon, Cross1Icon } from '~/utils/siteIcons'
import { subscribeToUpdates } from '~/services/api/subscription'
import { useCommentAuth } from '~/composables/useCommentAuth'

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
const overlay = ref<HTMLElement | null>(null)
const motionInstant = ref(false)
const completeButton = ref<HTMLButtonElement | null>(null)
const { currentUser, isLoggedIn } = useCommentAuth()
const accountEmail = computed(() => {
  const value = currentUser.value?.email?.trim().toLowerCase() || ''
  return isLoggedIn.value && !currentUser.value?.is_virtual_email && !/@virtual\.local$/i.test(value) && EMAIL_PATTERN.test(value) ? value : ''
})
const email = ref('')
const submittedEmail = ref('')
const errorMessage = ref('')
const submitState = ref<SubmitState>('idle')
const isComplete = computed(() => submitState.value === 'success' || submitState.value === 'already-subscribed')

let previousActiveElement: HTMLElement | null = null
let previousBodyOverflow = ''

const resultTitle = computed(() => (
  submitState.value === 'already-subscribed' ? '已经订阅过了' : '订阅成功'
))

const resultDescription = computed(() => (
  submitState.value === 'already-subscribed'
    ? '这个邮箱已在订阅列表中，无需重复提交。'
    : `将通过 ${submittedEmail.value} 接收博客更新。`
))

const clearError = () => {
  errorMessage.value = ''
}

const resetDialog = () => {
  email.value = ''
  submittedEmail.value = ''
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
  if (submitState.value === 'submitting' || isComplete.value) return
  const normalizedEmail = accountEmail.value || email.value.trim().toLowerCase()

  if (!normalizedEmail) {
    errorMessage.value = '请输入邮箱地址。'
    emailInput.value?.focus()
    return
  }

  if (!EMAIL_PATTERN.test(normalizedEmail) || /@virtual\.local$/i.test(normalizedEmail)) {
    errorMessage.value = '请输入正确的邮箱地址。'
    emailInput.value?.focus()
    return
  }

  errorMessage.value = ''
  submittedEmail.value = normalizedEmail
  submitState.value = 'submitting'

  try {
    const response = await subscribeToUpdates({ email: normalizedEmail })
    const responseSucceeded = response.code === 0 || (response.code >= 200 && response.code < 300)

    if (responseSucceeded) {
      submitState.value = 'success'
      return
    }

    if (response.code === 409 || response.message === '该邮箱已订阅') {
      submitState.value = 'already-subscribed'
      return
    }

    errorMessage.value = response.message || '订阅失败，请稍后重试。'
    submitState.value = 'idle'
  } catch (error) {
    if (getErrorStatus(error) === 409 || (error as { data?: { message?: string } })?.data?.message === '该邮箱已订阅') {
      submitState.value = 'already-subscribed'
      return
    }

    console.error('Failed to subscribe:', error)
    errorMessage.value = (error as { data?: { message?: string } })?.data?.message || '订阅失败，请检查网络后重试。'
    submitState.value = 'idle'
  }
}

watch(
  () => props.modelValue,
  async (isOpen) => {
    if (!import.meta.client) return

    if (isOpen) {
      previousActiveElement = document.activeElement as HTMLElement | null
      motionInstant.value = previousActiveElement?.matches(':focus-visible') || false
      previousBodyOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      await nextTick()
      if (!props.modelValue) return
      if (accountEmail.value) {
        overlay.value?.focus()
        await handleSubmit()
        return
      }
      emailInput.value?.focus()
      return
    }

    document.body.style.overflow = previousBodyOverflow
    resetDialog()
    previousActiveElement?.focus()
    previousActiveElement = null
  }
)

watch(isComplete, async (complete) => {
  if (!complete || !props.modelValue) return
  await nextTick()
  completeButton.value?.focus()
})

onUnmounted(() => {
  if (!import.meta.client) return
  document.body.style.overflow = previousBodyOverflow
})
</script>

<style scoped lang="scss">
.subscribe-overlay {
  position: fixed;
  inset: 0;
  z-index: 600;
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
  width: 44px;
  height: 44px;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--text-primary);
  cursor: pointer;
  transition: color var(--transition-fast), background var(--transition-fast);

  :deep(svg) {
    width: 20px;
    height: 20px;
  }

  &:hover {
    color: var(--text-primary);
    background: transparent;
  }

  &:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 2px;
  }

  &:disabled {
    cursor: wait;
    opacity: 0.5;
  }
}

.dialog-icon {
  display: grid;
  place-items: center;
  width: 58px;
  height: 58px;
  margin: 2px auto 18px;
  border-radius: 18px;
  background: transparent;
  color: var(--brand-accent);

  :deep(svg) {
    width: 29px;
    height: 29px;
  }

  &.is-submitting :deep(svg) {
    transform-origin: 50% 20%;
    animation: subscribe-ring 0.8s ease-out infinite;
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
    overflow-wrap: anywhere;
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

.account-email {
  display: grid;
  gap: 8px;
  text-align: center;

  span {
    color: var(--text-secondary);
    font-size: 13px;
  }

  strong {
    font-size: 15px;
    overflow-wrap: anywhere;
  }
}

.email-hint {
  margin: 0;
  color: var(--text-secondary);
  font-size: 12px;
  line-height: 1.6;
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
  background: var(--text-primary);
  color: var(--bg-primary);
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 160ms ease-out, filter var(--transition-fast), box-shadow var(--transition-fast);

  &:active:not(:disabled) {
    transform: scale(0.97);
  }

  &:hover:not(:disabled) {
    filter: brightness(1.08);
    box-shadow: 0 10px 24px color-mix(in srgb, var(--brand-accent) 20%, transparent);
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
  border: 2px solid color-mix(in srgb, currentColor 36%, transparent);
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

@keyframes subscribe-ring {
  0%, 100% { transform: rotate(0); }
  20%, 60% { transform: rotate(12deg); }
  40%, 80% { transform: rotate(-9deg); }
}

@keyframes subscribe-spin {
  to {
    transform: rotate(360deg);
  }
}

.subscribe-modal-enter-active,
.subscribe-modal-leave-active {
  transition: opacity 220ms cubic-bezier(0.23, 1, 0.32, 1);

  .subscribe-dialog {
    transition: opacity 220ms cubic-bezier(0.23, 1, 0.32, 1), transform 220ms cubic-bezier(0.23, 1, 0.32, 1);
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

@media (prefers-reduced-motion: reduce) {
  .dialog-icon.is-submitting :deep(svg),
  .loading-spinner {
    animation: none;
  }

  .subscribe-modal-enter-active,
  .subscribe-modal-leave-active,
  .subscribe-modal-enter-active .subscribe-dialog,
  .subscribe-modal-leave-active .subscribe-dialog,
  .primary-button {
    transition: none;
  }

  .subscribe-modal-enter-from .subscribe-dialog,
  .subscribe-modal-leave-to .subscribe-dialog,
  .primary-button:active:not(:disabled) {
    transform: none;
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
