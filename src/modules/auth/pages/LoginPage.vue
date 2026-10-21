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
import logo from '@/core/icons/common/logo.png?url'

defineOptions({ name: 'LoginPage' })

interface LoginPayload {
  userName: string
  password: string
  keepSession: boolean
}

const POINTS = ['媒体库', '足迹地图', '番组追踪']

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
  <div class="auth">
    <div class="auth__bg" aria-hidden="true">
      <span class="auth__orb auth__orb--1" />
      <span class="auth__orb auth__orb--2" />
      <span class="auth__orb auth__orb--3" />
      <span class="auth__grid" />
    </div>

    <main class="auth__shell">
      <section class="auth__brand">
        <div class="auth__mark">
          <img :src="logo" alt="" />
        </div>
        <p class="auth__eyebrow">PRIVATE SPACE</p>
        <h1 class="auth__headline">{{ settings.title }}</h1>
        <p class="auth__tagline">文件、足迹与番组，都收进一个安静的角落。</p>
        <ul class="auth__points">
          <li v-for="point in POINTS" :key="point">{{ point }}</li>
        </ul>
      </section>

      <section class="auth__panel">
        <header class="auth__panel-head">
          <img :src="logo" alt="" />
          <h2>{{ settings.title }}</h2>
          <p>{{ subtitle }}</p>
        </header>

        <LoginPanel v-if="mode === 'login'" :loading="loading" @submit="handleLogin" />
        <RegisterPanel v-else @registered="handleRegistered" />

        <footer class="auth__switch">
          <span>{{ mode === 'login' ? '还没有账户？' : '已经有账户了？' }}</span>
          <button class="auth__switch-btn" type="button" @click="mode = mode === 'login' ? 'register' : 'login'">
            {{ mode === 'login' ? '立即注册' : '返回登录' }}
          </button>
        </footer>
      </section>
    </main>

    <footer class="auth__build">{{ buildText }}</footer>

    <ElDialog
      v-model="firstVisible"
      class="auth-dialog"
      title="首次登录"
      width="380"
      :close-on-click-modal="false"
      :show-close="false"
      append-to-body
    >
      <p class="auth__first-hint">这个账户还没有密码，先设置一个再继续。</p>
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
.auth {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  min-height: 100dvh;
  overflow: hidden;
  isolation: isolate;
  color: #2d1b3a;
  background:
    radial-gradient(120% 80% at 12% 8%, #f7e9fc 0%, transparent 55%),
    radial-gradient(90% 70% at 92% 12%, #e8d9fb 0%, transparent 52%),
    linear-gradient(160deg, #efe2f6 0%, #fdfaff 46%, #f3e9fb 100%);

  &__bg {
    position: fixed;
    inset: 0;
    z-index: 0;
    overflow: hidden;
    pointer-events: none;
  }

  &__orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(70px);
    opacity: 0.55;
    animation: auth-float 18s ease-in-out infinite;

    &--1 {
      top: -140px;
      left: -100px;
      width: 440px;
      height: 440px;
      background: radial-gradient(circle at 32% 30%, #e3bcef, #b792d8);
    }

    &--2 {
      right: -110px;
      bottom: -140px;
      width: 400px;
      height: 400px;
      background: radial-gradient(circle at 58% 42%, #cdb8f8, #9d8ad8);
      animation-delay: -7s;
    }

    &--3 {
      top: 10%;
      right: 16%;
      width: 260px;
      height: 260px;
      background: radial-gradient(circle at 50% 50%, #ffd9ea, #e6a9d3);
      opacity: 0.38;
      animation-delay: -12s;
    }
  }

  &__grid {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(164, 128, 171, 0.06) 1px, transparent 1px),
      linear-gradient(90deg, rgba(164, 128, 171, 0.06) 1px, transparent 1px);
    background-size: 48px 48px;
    mask-image: radial-gradient(ellipse at center, #000 25%, transparent 74%);
  }

  &__shell {
    position: relative;
    z-index: 1;
    display: grid;
    grid-template-columns: minmax(0, 1fr) 440px;
    align-items: center;
    gap: clamp(36px, 6vw, 96px);
    width: min(1140px, 100%);
    margin: auto;
    padding: 48px 32px;
  }

  &__brand {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
    animation: auth-rise 0.7s 0.05s both;
  }

  &__mark {
    width: 104px;
    height: 104px;
    margin-bottom: 6px;
    animation: auth-bob 6s ease-in-out infinite;

    img {
      width: 100%;
      height: 100%;
      border-radius: 26px;
      box-shadow: 0 22px 48px rgba(74, 45, 94, 0.28);
    }
  }

  &__eyebrow {
    margin: 0;
    color: #a480ab;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.32em;
  }

  &__headline {
    max-width: 560px;
    margin: 0;
    background: linear-gradient(120deg, #3a2347 0%, #7c5a8f 48%, #c296cd 100%);
    background-clip: text;
    -webkit-background-clip: text;
    color: transparent;
    font-size: clamp(34px, 4vw, 50px);
    font-weight: 800;
    line-height: 1.14;
    letter-spacing: -0.02em;
  }

  &__tagline {
    max-width: 420px;
    margin: 0;
    color: #7a6a7e;
    font-size: 15px;
    line-height: 1.8;
  }

  &__points {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin: 10px 0 0;
    padding: 0;
    list-style: none;

    li {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 9px 14px;
      border: 1px solid rgba(255, 255, 255, 0.78);
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.42);
      box-shadow: 0 8px 20px rgba(164, 128, 171, 0.08);
      backdrop-filter: blur(10px);
      color: #5d4b66;
      font-size: 12.5px;

      &::before {
        content: '';
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: linear-gradient(135deg, #c296cd, #8d6aa0);
        box-shadow: 0 0 0 3px rgba(194, 150, 205, 0.14);
      }
    }
  }

  &__panel {
    position: relative;
    padding: 34px 34px 26px;
    border: 1px solid rgba(255, 255, 255, 0.82);
    border-radius: 28px;
    background: linear-gradient(155deg, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.5));
    box-shadow:
      0 32px 80px rgba(74, 45, 94, 0.16),
      inset 0 1px 0 rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(24px) saturate(1.3);
    -webkit-backdrop-filter: blur(24px) saturate(1.3);
    animation: auth-rise 0.7s 0.12s both;

    :deep(.el-form-item) {
      margin-bottom: 16px;
    }

    :deep(.el-form-item__label) {
      padding-bottom: 6px;
      color: #6b5a73;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.03em;
    }

    :deep(.el-form-item.is-required:not(.is-no-asterisk) > .el-form-item__label::before) {
      margin-right: 4px;
      color: #c296cd;
    }

    :deep(.el-input__wrapper) {
      min-height: 46px;
      padding: 0 14px;
      border-radius: 14px;
      background: rgba(255, 255, 255, 0.66);
      box-shadow:
        inset 0 0 0 1px rgba(164, 128, 171, 0.2),
        0 2px 6px rgba(74, 45, 94, 0.03);
      transition: box-shadow 0.2s ease, background-color 0.2s ease;
    }

    :deep(.el-input__wrapper:hover) {
      box-shadow: inset 0 0 0 1px rgba(164, 128, 171, 0.38);
    }

    :deep(.el-input__wrapper.is-focus) {
      background: #fff;
      box-shadow:
        inset 0 0 0 1.5px #c296cd,
        0 0 0 4px rgba(194, 150, 205, 0.16);
    }

    :deep(.el-input__inner) {
      color: #3a2347;
      font-size: 13.5px;
    }

    :deep(.el-input__inner::placeholder) {
      color: #b0a2b6;
    }

    :deep(.el-input__prefix) {
      margin-right: 6px;
      color: #a480ab;
      font-size: 14px;
    }

    :deep(.el-form-item__error) {
      padding-top: 4px;
      color: #c95f7f;
      font-size: 11.5px;
    }

    :deep(.el-checkbox__inner) {
      width: 16px;
      height: 16px;
      border-color: rgba(164, 128, 171, 0.45);
      border-radius: 5px;
      background: rgba(255, 255, 255, 0.7);
    }

    :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
      border-color: #c296cd;
      background: #c296cd;
    }

    :deep(.el-checkbox__label) {
      color: #7a6a7e;
      font-size: 12.5px;
    }

    :deep(.el-button--primary) {
      width: 100%;
      min-height: 46px;
      margin-top: 4px;
      border: 0;
      border-radius: 14px;
      background: linear-gradient(135deg, #c296cd 0%, #a480ab 55%, #8d6aa0 100%);
      box-shadow:
        0 14px 28px rgba(164, 128, 171, 0.32),
        inset 0 1px 0 rgba(255, 255, 255, 0.35);
      color: #fff;
      font-size: 14px;
      font-weight: 600;
      letter-spacing: 0.12em;
      transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease;
    }

    :deep(.el-button--primary:hover),
    :deep(.el-button--primary:focus-visible) {
      filter: brightness(1.05);
      box-shadow: 0 18px 36px rgba(164, 128, 171, 0.4);
      transform: translateY(-1px);
    }

    :deep(.el-button--primary:active) {
      box-shadow: 0 10px 20px rgba(164, 128, 171, 0.28);
      transform: translateY(0);
    }
  }

  &__panel-head {
    display: grid;
    grid-template-columns: 46px minmax(0, 1fr);
    grid-template-rows: auto auto;
    align-items: center;
    column-gap: 12px;
    margin-bottom: 22px;

    > img {
      grid-row: 1 / span 2;
      width: 46px;
      height: 46px;
      border-radius: 12px;
      box-shadow: 0 8px 20px rgba(74, 45, 94, 0.2);
    }

    h2 {
      margin: 0;
      color: #2d1b3a;
      font-size: 19px;
      font-weight: 700;
      letter-spacing: -0.01em;
    }

    p {
      margin: 3px 0 0;
      color: #8c7b90;
      font-size: 12px;
    }
  }

  &__switch {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    margin-top: 18px;
    padding-top: 16px;
    border-top: 1px solid rgba(164, 128, 171, 0.16);
    color: #8c7b90;
    font-size: 12.5px;
  }

  &__switch-btn {
    position: relative;
    padding: 0;
    border: 0;
    background: none;
    color: #a480ab;
    font: inherit;
    font-weight: 700;
    cursor: pointer;

    &::after {
      content: '';
      position: absolute;
      right: 0;
      bottom: -2px;
      left: 0;
      height: 1.5px;
      border-radius: 2px;
      background: currentColor;
      transform: scaleX(0);
      transform-origin: left;
      transition: transform 0.25s ease;
    }

    &:hover::after,
    &:focus-visible::after {
      transform: scaleX(1);
    }
  }

  &__build {
    position: relative;
    z-index: 1;
    padding: 0 24px 22px;
    color: rgba(93, 75, 102, 0.6);
    font-size: 11.5px;
    letter-spacing: 0.06em;
    text-align: center;
  }

  &__first-hint {
    margin-bottom: 12px;
    color: #7a6a7e;
    font-size: 13px;
  }
}

@media (max-width: 900px) {
  .auth {
    &__shell {
      grid-template-columns: minmax(0, 1fr);
      gap: 24px;
      width: min(440px, 100%);
      padding: 32px 20px;
    }

    &__brand {
      display: none;
    }

    &__panel {
      padding: 28px 24px 24px;
      border-radius: 24px;
    }
  }
}

@media (max-width: 480px) {
  .auth {
    &__shell {
      padding: 20px 14px;
    }

    &__panel {
      padding: 24px 18px 20px;
    }

    &__panel-head {
      margin-bottom: 18px;
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  .auth *,
  .auth *::before,
  .auth *::after {
    animation: none !important;
    transition: none !important;
  }
}
</style>

<style scoped lang="scss">
:global(.auth-dialog) {
  border: 1px solid rgba(255, 255, 255, 0.85);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 30px 80px rgba(74, 45, 94, 0.24);
  backdrop-filter: blur(20px);

  .el-dialog__title {
    color: #3a2347;
    font-weight: 700;
  }

  .el-button--primary {
    border: 0;
    border-radius: 12px;
    background: linear-gradient(135deg, #c296cd, #8d6aa0);
    box-shadow: 0 10px 22px rgba(164, 128, 171, 0.3);
  }
}

@keyframes auth-rise {
  from {
    opacity: 0;
    transform: translateY(18px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes auth-float {
  0%,
  100% {
    transform: translate3d(0, 0, 0) scale(1);
  }

  50% {
    transform: translate3d(22px, -26px, 0) scale(1.06);
  }
}

@keyframes auth-bob {
  0%,
  100% {
    transform: translateY(0) rotate(-2deg);
  }

  50% {
    transform: translateY(-6px) rotate(2deg);
  }
}
</style>
