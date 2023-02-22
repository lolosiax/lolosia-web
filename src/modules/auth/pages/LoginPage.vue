<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormRules } from 'element-plus'
import { login } from '@/core/api/user'
import { buildSummary } from '@/core/config/env'
import { settings } from '@/core/config/settings'
import { useForm } from '@/core/composables/use-form'
import { requiredRule } from '@/core/lib/validate'
import { useAuthStore } from '@/core/stores/auth'
import logo from '@/core/icons/common/sidebar-logo.svg?url'

defineOptions({ name: 'LoginPage' })

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const { validate } = useForm()

const loading = ref(false)
const model = reactive({ userName: '', password: '' })
const rules: FormRules = {
  userName: [requiredRule('请输入用户名')],
  password: [requiredRule('请输入密码')]
}

const buildText = computed(() => buildSummary())
const redirect = computed(() => {
  const target = route.query.redirect
  return typeof target === 'string' && target.startsWith('/') ? target : '/dashboard'
})

async function submit(): Promise<void> {
  if (!(await validate())) return
  loading.value = true
  try {
    const result = await login(model.userName, model.password)
    auth.setToken(result.Authorization, true)
    await router.replace(redirect.value)
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '登录失败')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <section class="login-page__card">
      <header class="login-page__header">
        <img class="login-page__logo" :src="logo" alt="" />
        <h1 class="login-page__title">{{ settings.title }}</h1>
        <p class="login-page__subtitle">登录后继续</p>
      </header>

      <ElForm ref="formRef" :model="model" :rules="rules" label-position="top" @submit.prevent="submit">
        <ElFormItem label="用户名" prop="userName">
          <ElInput v-model="model.userName" placeholder="用户名" autocomplete="username" />
        </ElFormItem>
        <ElFormItem label="密码" prop="password">
          <ElInput
            v-model="model.password"
            type="password"
            placeholder="密码"
            show-password
            autocomplete="current-password"
            @keyup.enter="submit"
          />
        </ElFormItem>
        <ElButton class="login-page__submit" type="primary" round :loading="loading" native-type="submit">
          登录
        </ElButton>
      </ElForm>
    </section>

    <footer class="login-page__footer">{{ buildText }}</footer>
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

  &__submit {
    width: 100%;
    margin-top: 4px;
  }

  &__footer {
    font-size: 12px;
    color: #8c7b90;
  }
}
</style>
