<script setup lang="ts">
import { computed } from 'vue'
import type { RoleRow } from '@/core/api/role'

defineOptions({ name: 'RoleRowActions' })

const props = defineProps<{ row: RoleRow }>()

const emit = defineEmits<{
  edit: [row: RoleRow]
  rules: [row: RoleRow]
  remove: [row: RoleRow]
}>()

/** 拥有者组由后端兜底保护，界面上也直接锁掉。 */
const locked = computed(() => props.row.type === 'owner')
</script>

<template>
  <div class="role-row-actions">
    <ElButton link type="primary" :disabled="locked" @click="emit('edit', row)">编辑</ElButton>
    <ElButton link type="primary" :disabled="locked" @click="emit('rules', row)">权限</ElButton>
    <ElButton link type="danger" :disabled="locked" @click="emit('remove', row)">删除</ElButton>
  </div>
</template>

<style scoped lang="scss">
.role-row-actions {
  display: flex;
  justify-content: center;
  gap: 2px;
}
</style>
