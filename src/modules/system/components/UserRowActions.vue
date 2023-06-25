<script setup lang="ts">
import { computed } from 'vue'
import type { UserListRow } from '@/core/api/user'

defineOptions({ name: 'UserRowActions' })

const props = defineProps<{ row: UserListRow }>()

const emit = defineEmits<{
  edit: [row: UserListRow]
  rules: [row: UserListRow]
  remove: [row: UserListRow]
}>()

/** 拥有者组不允许在这里改/删。 */
const locked = computed(() => (props.row.roleType ?? props.row.type) === 'owner')
</script>

<template>
  <div class="user-row-actions">
    <ElButton link type="primary" :disabled="locked" @click="emit('edit', row)">编辑</ElButton>
    <ElButton link type="primary" @click="emit('rules', row)">权限</ElButton>
    <ElButton link type="danger" :disabled="locked" @click="emit('remove', row)">删除</ElButton>
  </div>
</template>

<style scoped lang="scss">
.user-row-actions {
  display: flex;
  justify-content: center;
  gap: 2px;
}
</style>
