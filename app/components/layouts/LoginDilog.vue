<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="modal-overlay" @click.self="closeModal">
        <div class="modal-container">
          <button class="close-btn" type="button" @click="closeModal">
            ×
          </button>

          <div class="modal-header">
            <h2>登录</h2>
            <p>该弹窗已迁移到 Nuxt，表单逻辑可在后续继续补充。</p>
          </div>

          <form class="login-form" @submit.prevent="handleLogin">
            <div class="form-group">
              <label for="email">邮箱</label>
              <input id="email" v-model="formState.email" type="email" placeholder="name@example.com">
            </div>

            <div class="form-group">
              <label for="password">密码</label>
              <input id="password" v-model="formState.password" type="password" placeholder="请输入密码">
            </div>

            <button class="submit-btn" type="submit" :disabled="loading">
              {{ loading ? '登录中...' : '登录' }}
            </button>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'

defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'login-success'): void
}>()

const formState = ref({
  email: '',
  password: ''
})

const loading = ref(false)

const closeModal = () => {
  emit('update:modelValue', false)
}

const handleLogin = async () => {
  loading.value = true

  try {
    await new Promise((resolve) => setTimeout(resolve, 300))
    ElMessage.info('登录接口还没有接回，当前先保留可用弹窗。')
    emit('login-success')
    closeModal()
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
}

.modal-container {
  background-color: var(--bg-panel-solid, #111);
  border-radius: 1rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 420px;
  padding: 2rem;
  position: relative;
  animation: slideUp 0.3s ease;
}

.close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 2rem;
  height: 2rem;
  border: 0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: transparent;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 1.25rem;

  &:hover {
    background-color: var(--bg-soft);
    transform: rotate(90deg);
  }
}

.modal-header {
  text-align: center;
  margin-bottom: 1.5rem;

  h2 {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 0.5rem;
  }

  p {
    color: var(--text-muted);
    font-size: 0.95rem;
    margin: 0;
    line-height: 1.6;
  }
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  label {
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--text-primary);
  }

  input {
    width: 100%;
    padding: 0.75rem 1rem;
    border: 1px solid var(--border-color);
    border-radius: 0.5rem;
    font-size: 1rem;
    color: var(--text-primary);
    background-color: var(--bg-secondary);

    &:focus {
      outline: none;
      border-color: var(--accent);
    }
  }
}

.submit-btn {
  width: 100%;
  padding: 0.875rem;
  background: var(--accent);
  color: var(--text-on-accent);
  border: 0;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;

  .modal-container {
    transition: all 0.3s ease;
  }
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;

  .modal-container {
    transform: scale(0.9) translateY(20px);
  }
}
</style>
