<script setup lang="ts">
import { reactive } from 'vue'
import type { FormRules } from 'element-plus'
import { useForm } from '@/core/composables/use-form'
import { requiredRule } from '@/core/lib/validate'

defineOptions({ name: 'LoginPanel' })

const props = withDefaults(defineProps<{ loading?: boolean }>(), { loading: false })

const emit = defineEmits<{
  submit: [payload: { userName: string; password: string; keepSession: boolean }]
}>()

const { validate } = useForm()
const model = reactive({ userName: '', password: '', keepSession: true })

const rules: FormRules = {
  userName: [requiredRule('请输入用户名')]
}

async function submit(): Promise<void> {
  if (!(await validate())) return
  emit('submit', { ...model })
}
</script>

<template>
  <ElForm ref="formRef" :model="model" :rules="rules" label-position="top" @submit.prevent="submit">
    <ElFormItem label="用户名" prop="userName">
      <ElInput v-model="model.userName" placeholder="用户名或手机号" autocomplete="username" />
    </ElFormItem>
    <ElFormItem label="密码">
      <ElInput
        v-model="model.password"
        type="password"
        placeholder="首次登录可留空"
        show-password
        autocomplete="current-password"
        @keyup.enter="submit"
      />
    </ElFormItem>
    <ElFormItem>
      <ElCheckbox v-model="model.keepSession">保持登录</ElCheckbox>
    </ElFormItem>
    <ElButton class="login-panel__submit" type="primary" round :loading="props.loading" native-type="submit">
      登录
    </ElButton>
  </ElForm>
</template>

<style scoped lang="scss">
.login-panel__submit {
  width: 100%;
  margin-top: 4px;
}
</style>
