<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormRules } from 'element-plus'
import { login, updatePassword } from '@/core/api/user'
import { buildSummary } from '@/core/config/env'
import { settings } from '@/core/config/settings'
import { useForm } from '@/core/composables/use-form'
import { confirmPasswordRule, requiredRule } from '@/core/lib/validate'
import { useAuthStore } from '@/core/stores/auth'
import LoginPanel from '../components/LoginPanel.vue'
import RegisterPanel from '../components/RegisterPanel.vue'
import logo from '@/core/icons/common/sidebar-logo.svg?url'

defineOptions({ name: 'LoginPage' })

interface LoginPayload {
  userName: string
  password: string
  keepSession: boolean
}

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const { validate: validateFirst } = useForm()

const mode = ref<'login' | 'register'>('login')
const loading = ref(false)
const firstVisible = ref(false)
const firstSaving = ref(false)
const first = reactive({ target: '', confirm: '' })

const firstRules: FormRules = {
  target: [requiredRule('请设置新密码'), { min: 6, message: '密码至少 6 位', trigger: 'blur' }],
  confirm: [requiredRule('请再次输入密码'), confirmPasswordRule(() => first.target)]
}

const buildText = computed(() => buildSummary())
const subtitle = computed(() => (mode.value === 'login' ? '登录后继续' : '创建一个新账户'))
const redirect = computed(() => {
  const target = route.query.redirect
  return typeof target === 'string' && target.startsWith('/') ? target : '/dashboard'
})

/** 登录成功后统一跳转；首次登录先弹设置密码。 */
async function enter(result: { Authorization: string; firstLogin?: boolean }, keepSession: boolean): Promise<void> {
  auth.setToken(result.Authorization, keepSession)
  if (result.firstLogin) {
    firstVisible.value = true
    return
  }
  await router.replace(redirect.value)
}

async function handleLogin(payload: LoginPayload): Promise<void> {
  loading.value = true
  try {
    const result = await login(payload.userName, payload.password || undefined)
    await enter(result, payload.keepSession)
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '登录失败')
  } finally {
    loading.value = false
  }
}

async function handleRegistered(payload: { userName: string; password: string }): Promise<void> {
  loading.value = true
  try {
    const result = await login(payload.userName, payload.password)
    await enter(result, true)
  } catch (error) {
    mode.value = 'login'
    ElMessage.warning(error instanceof Error ? error.message : '注册成功，请手动登录')
  } finally {
    loading.value = false
  }
}

/** 首次登录（库里没有密码）时补一个密码。 */
async function saveFirstPassword(): Promise<void> {
  if (!(await validateFirst())) return

  firstSaving.value = true
  try {
    await updatePassword({ origin: '', target: first.target })
    ElMessage.success('密码已设置')
    firstVisible.value = false
    await router.replace(redirect.value)
  } finally {
    firstSaving.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <section class="login-page__card">
      <header class="login-page__header">
        <img class="login-page__logo" :src="logo" alt="" />
        <h1 class="login-page__title">{{ settings.title }}</h1>
        <p class="login-page__subtitle">{{ subtitle }}</p>
      </header>

      <LoginPanel v-if="mode === 'login'" :loading="loading" @submit="handleLogin" />
      <RegisterPanel v-else @registered="handleRegistered" />

      <footer class="login-page__switch">
        <span>{{ mode === 'login' ? '还没有账户？' : '已经有账户了？' }}</span>
        <ElButton link type="primary" @click="mode = mode === 'login' ? 'register' : 'login'">
          {{ mode === 'login' ? '注册' : '去登录' }}
        </ElButton>
      </footer>
    </section>

    <footer class="login-page__footer">{{ buildText }}</footer>

    <ElDialog
      v-model="firstVisible"
      title="首次登录"
      width="380"
      :close-on-click-modal="false"
      :show-close="false"
      append-to-body
    >
      <p class="login-page__first-hint">这个账户还没有密码，先设置一个再继续。</p>
      <ElForm ref="formRef" :model="first" :rules="firstRules" label-position="top">
        <ElFormItem label="新密码" prop="target">
          <ElInput v-model="first.target" type="password" show-password autocomplete="new-password" />
        </ElFormItem>
        <ElFormItem label="确认密码" prop="confirm">
          <ElInput v-model="first.confirm" type="password" show-password autocomplete="new-password" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton type="primary" :loading="firstSaving" @click="saveFirstPassword">保存并进入</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<style scoped lang="scss">
.login-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  min-height: 100vh;
  min-height: 100dvh;
  padding: 24px;
  background: linear-gradient(to bottom, #d8abe2 0%, #fbf2ff 55%);

  &__card {
    width: min(400px, 100%);
    padding: 32px 28px;
    background: rgba(255, 255, 255, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.7);
    border-radius: 20px;
    box-shadow: 0 12px 40px rgba(31, 38, 135, 0.18);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }

  &__header {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    margin-bottom: 20px;
  }

  &__logo {
    width: 56px;
    height: 56px;
  }

  &__title {
    font-size: 20px;
    font-weight: 600;
    color: #4a3d4d;
  }

  &__subtitle {
    font-size: 12px;
    color: #8c7b90;
  }

  &__switch {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    margin-top: 12px;
    font-size: 12px;
    color: #8c7b90;
  }

  &__footer {
    font-size: 12px;
    color: #8c7b90;
  }

  &__first-hint {
    margin-bottom: 12px;
    font-size: 13px;
    color: #7a6a7e;
  }
}
</style>
