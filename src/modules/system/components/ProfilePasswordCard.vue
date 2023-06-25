<script setup lang="ts">
import LiquidBox from '@/core/ui/LiquidBox.vue'
import { usePassword } from '../composables/use-password'

defineOptions({ name: 'ProfilePasswordCard' })

const { saving, form, rules, submit } = usePassword()
</script>

<template>
  <LiquidBox white class="profile-password">
    <h3 class="profile-password__title">修改密码</h3>
    <ElForm ref="formRef" :model="form" :rules="rules" label-width="90px" class="profile-password__form">
      <ElFormItem label="当前密码" prop="origin">
        <ElInput v-model="form.origin" type="password" show-password autocomplete="current-password" />
      </ElFormItem>
      <ElFormItem label="新密码" prop="target">
        <ElInput v-model="form.target" type="password" show-password autocomplete="new-password" />
      </ElFormItem>
      <ElFormItem label="确认新密码" prop="confirm">
        <ElInput v-model="form.confirm" type="password" show-password autocomplete="new-password" />
      </ElFormItem>
      <ElFormItem>
        <ElButton type="primary" :loading="saving" @click="submit">更新密码</ElButton>
      </ElFormItem>
    </ElForm>
  </LiquidBox>
</template>

<style scoped lang="scss">
.profile-password {
  &__title {
    margin-bottom: 12px;
    font-size: 16px;
    font-weight: 600;
    color: #4a3d4d;
  }

  &__form {
    max-width: 460px;
  }
}
</style>
