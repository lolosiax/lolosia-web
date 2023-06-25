<script setup lang="ts">
import { useAuthStore } from '@/core/stores/auth'
import LiquidBox from '@/core/ui/LiquidBox.vue'
import { useProfileInfo } from '../composables/use-profile-info'

defineOptions({ name: 'ProfileInfoCard' })

const auth = useAuthStore()
const { editing, saving, form, canEdit, start, cancel, save } = useProfileInfo()
</script>

<template>
  <LiquidBox white class="profile-info">
    <header class="profile-info__header">
      <h3 class="profile-info__title">基本信息</h3>
      <ElButton v-if="!editing" :disabled="!canEdit" @click="start">修改</ElButton>
      <template v-else>
        <ElButton @click="cancel">取消</ElButton>
        <ElButton type="primary" :loading="saving" @click="save">保存</ElButton>
      </template>
    </header>

    <p v-if="!canEdit" class="profile-info__hint">当前权限组没有 `lolosia.user.write`，资料修改只读。</p>

    <ElDescriptions :column="2" border>
      <ElDescriptionsItem label="账号">{{ auth.userInfo?.userName ?? '—' }}</ElDescriptionsItem>
      <ElDescriptionsItem label="姓名">
        <ElInput v-if="editing" v-model="form.realName" placeholder="显示名称" />
        <span v-else>{{ auth.userInfo?.realName ?? '—' }}</span>
      </ElDescriptionsItem>
      <ElDescriptionsItem label="手机号">
        <ElInput v-if="editing" v-model="form.phone" placeholder="可选" />
        <span v-else>{{ auth.userInfo?.phone ?? '—' }}</span>
      </ElDescriptionsItem>
      <ElDescriptionsItem label="邮箱">
        <ElInput v-if="editing" v-model="form.email" placeholder="可选" />
        <span v-else>{{ auth.userInfo?.email ?? '—' }}</span>
      </ElDescriptionsItem>
      <ElDescriptionsItem label="UID">{{ auth.userInfo?.id ?? '—' }}</ElDescriptionsItem>
      <ElDescriptionsItem label="注册日期">{{ auth.userInfo?.createdAt ?? '—' }}</ElDescriptionsItem>
    </ElDescriptions>
  </LiquidBox>
</template>

<style scoped lang="scss">
.profile-info {
  &__header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
  }

  &__title {
    flex: 1;
    font-size: 16px;
    font-weight: 600;
    color: #4a3d4d;
  }

  &__hint {
    margin-bottom: 12px;
    font-size: 12px;
    color: #8c7b90;
  }
}
</style>
