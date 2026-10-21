<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormRules } from 'element-plus'
import { captcha, register, verify } from '@/core/api/user'
import { useForm } from '@/core/composables/use-form'
import { confirmPasswordRule, emailRule, requiredRule } from '@/core/lib/validate'

defineOptions({ name: 'RegisterPanel' })

const emit = defineEmits<{
  registered: [payload: { userName: string; password: string }]
}>()

const { validate } = useForm()
const step = ref<1 | 2>(1)
const loading = ref(false)
const captchaImage = ref('')
const captchaId = ref('')

const model = reactive({
  userName: '',
  email: '',
  captchaValue: '',
  password: '',
  confirm: ''
})

const stepOneRules: FormRules = {
  userName: [requiredRule('请输入用户名')],
  email: emailRule('邮箱格式不正确'),
  captchaValue: [requiredRule('请输入验证码')]
}

const stepTwoRules: FormRules = {
  password: [requiredRule('请设置密码'), { min: 6, message: '密码至少 6 位', trigger: 'blur' }],
  confirm: [requiredRule('请再次输入密码'), confirmPasswordRule(() => model.password)]
}

/** 换一张验证码；失败时保留旧图并提示。 */
async function reloadCaptcha(): Promise<void> {
  try {
    const result = await captcha()
    captchaImage.value = `data:image/png;base64,${result.image}`
    captchaId.value = result.id
  } catch (error) {
    ElMessage.warning(error instanceof Error ? error.message : '验证码加载失败')
  }
}

async function next(): Promise<void> {
  if (!(await validate())) return

  loading.value = true
  try {
    await verify(captchaId.value, model.captchaValue, model.userName, model.email)
    step.value = 2
  } catch {
    model.captchaValue = ''
    await reloadCaptcha()
  } finally {
    loading.value = false
  }
}

async function submit(): Promise<void> {
  if (!(await validate())) return

  loading.value = true
  try {
    await register({ userName: model.userName, email: model.email, password: model.password })
    ElMessage.success('注册成功')
    emit('registered', { userName: model.userName, password: model.password })
  } finally {
    loading.value = false
  }
}

onMounted(reloadCaptcha)
</script>

<template>
  <ElForm v-if="step === 1" ref="formRef" class="register-panel" :model="model" :rules="stepOneRules" label-position="top">
    <p class="register-panel__step">第 1 步 · 验证账户</p>
    <ElFormItem label="用户名" prop="userName">
      <ElInput v-model="model.userName" placeholder="登录名" autocomplete="username">
        <template #prefix>
          <i class="bi bi-person" aria-hidden="true" />
        </template>
      </ElInput>
    </ElFormItem>
    <ElFormItem label="邮箱" prop="email">
      <ElInput v-model="model.email" placeholder="用于找回账户" autocomplete="email">
        <template #prefix>
          <i class="bi bi-envelope" aria-hidden="true" />
        </template>
      </ElInput>
    </ElFormItem>
    <ElFormItem label="验证码" prop="captchaValue">
      <div class="register-panel__captcha">
        <ElInput v-model="model.captchaValue" placeholder="输入图中字符" @keyup.enter="next" />
        <img v-if="captchaImage" :src="captchaImage" alt="图形验证码" title="点击刷新" @click="reloadCaptcha" />
      </div>
    </ElFormItem>
    <ElButton class="register-panel__submit" type="primary" round :loading="loading" @click="next">下一步</ElButton>
  </ElForm>

  <ElForm v-else ref="formRef" class="register-panel" :model="model" :rules="stepTwoRules" label-position="top">
    <p class="register-panel__step">第 2 步 · 设置密码</p>
    <p class="register-panel__hint">邮箱验证暂未启用，直接为 {{ model.userName }} 设置密码即可。</p>
    <ElFormItem label="密码" prop="password">
      <ElInput v-model="model.password" type="password" show-password autocomplete="new-password">
        <template #prefix>
          <i class="bi bi-lock" aria-hidden="true" />
        </template>
      </ElInput>
    </ElFormItem>
    <ElFormItem label="确认密码" prop="confirm">
      <ElInput
        v-model="model.confirm"
        type="password"
        show-password
        autocomplete="new-password"
        @keyup.enter="submit"
      >
        <template #prefix>
          <i class="bi bi-shield-lock" aria-hidden="true" />
        </template>
      </ElInput>
    </ElFormItem>
    <ElButton class="register-panel__submit" type="primary" round :loading="loading" @click="submit">完成注册</ElButton>
    <ElButton class="register-panel__back" text @click="step = 1">返回上一步</ElButton>
  </ElForm>
</template>

<style scoped lang="scss">
.register-panel {
  &__step {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin: 0 0 14px;
    padding: 5px 11px;
    border-radius: 999px;
    background: rgba(194, 150, 205, 0.12);
    color: #8d6aa0;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.04em;
  }

  &__captcha {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;

    :deep(.el-input) {
      flex: 1 1 auto;
      min-width: 0;
    }

    img {
      flex: 0 0 auto;
      height: 46px;
      border: 1px solid rgba(164, 128, 171, 0.2);
      border-radius: 12px;
      background: #fff;
      box-shadow: 0 4px 12px rgba(74, 45, 94, 0.06);
      cursor: pointer;
    }
  }

  &__hint {
    margin: 0 0 14px;
    padding: 10px 12px;
    border-radius: 12px;
    background: rgba(194, 150, 205, 0.1);
    color: #7a6a7e;
    font-size: 12px;
    line-height: 1.6;
  }

  &__submit {
    width: 100%;
    margin-top: 0;
  }

  &__back {
    width: 100%;
    margin-top: 8px;
    margin-left: 0;
    color: #8c7b90;
    font-size: 12.5px;

    &:hover {
      color: #a480ab;
      background: transparent;
    }
  }
}
</style>
