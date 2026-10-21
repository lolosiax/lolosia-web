<script setup lang="ts">
import MenuIcon from '@/core/ui/MenuIcon.vue'
import { usePassword } from '../composables/use-password'

defineOptions({ name: 'ProfilePasswordCard' })

const { saving, form, rules, submit } = usePassword()
</script>

<template>
  <section class="security">
    <header class="security__head">
      <div class="security__heading">
        <MenuIcon icon="shield-lock" />
        <h2>账户安全</h2>
      </div>
      <span class="security__badge">
        <i class="bi bi-check-circle-fill" aria-hidden="true" />
        已启用
      </span>
    </header>

    <p class="security__hint">定期更换密码，避免与其它站点复用。</p>

    <ElForm ref="formRef" class="security__form" :model="form" :rules="rules" label-position="top">
      <ElFormItem label="当前密码" prop="origin">
        <ElInput v-model="form.origin" type="password" show-password autocomplete="current-password" />
      </ElFormItem>
      <ElFormItem label="新密码" prop="target">
        <ElInput v-model="form.target" type="password" show-password autocomplete="new-password" />
      </ElFormItem>
      <ElFormItem label="确认新密码" prop="confirm">
        <ElInput v-model="form.confirm" type="password" show-password autocomplete="new-password" />
      </ElFormItem>
      <ElButton class="security__submit" type="primary" round :loading="saving" @click="submit">更新密码</ElButton>
    </ElForm>
  </section>
</template>

<style scoped lang="scss">
.security {
  padding: 24px 26px;
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.62);
  box-shadow: 0 18px 44px rgba(74, 45, 94, 0.1);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 10px;
  }

  &__heading {
    display: flex;
    align-items: center;
    gap: 9px;

    .menu-icon {
      display: grid;
      place-items: center;
      width: 32px;
      height: 32px;
      border-radius: 10px;
      background: linear-gradient(135deg, #efe1f7, #dcc6ec);
      color: #8d6aa0;
      font-size: 15px;
    }

    h2 {
      margin: 0;
      color: #2d1b3a;
      font-size: 16px;
      font-weight: 700;
    }
  }

  &__badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 9px;
    border-radius: 999px;
    background: rgba(76, 175, 130, 0.12);
    color: #3d9c72;
    font-size: 11px;
    font-weight: 600;

    i {
      font-size: 10px;
    }
  }

  &__hint {
    margin: 0 0 16px;
    color: #8c7b90;
    font-size: 12px;
    line-height: 1.7;
  }

  &__form {
    :deep(.el-form-item) {
      margin-bottom: 14px;
    }

    :deep(.el-form-item__label) {
      padding-bottom: 5px;
      color: #6b5a73;
      font-size: 11.5px;
      font-weight: 600;
    }

    :deep(.el-input__wrapper) {
      min-height: 42px;
      padding: 0 12px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.7);
      box-shadow: inset 0 0 0 1px rgba(164, 128, 171, 0.2);
    }

    :deep(.el-input__wrapper.is-focus) {
      background: #fff;
      box-shadow:
        inset 0 0 0 1.5px #c296cd,
        0 0 0 4px rgba(194, 150, 205, 0.14);
    }
  }

  &__submit {
    width: 100%;
    margin-top: 4px;
  }
}
</style>
