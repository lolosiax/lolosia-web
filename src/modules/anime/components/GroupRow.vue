<script setup lang="ts">
// 详情里的一个发布组：更新概况 + 关注按钮。
import { computed } from 'vue'
import type { AnimeGroup } from '../api'
import { formatTime } from '../lib'

defineOptions({ name: 'GroupRow' })

const props = defineProps<{
  group: AnimeGroup
  followed: boolean
  acting: boolean
}>()

const emit = defineEmits<{
  (e: 'toggle', name: string): void
}>()

const meta = computed(() => {
  const parts = [`${props.group.count} 条`]
  if (props.group.latestEpisodeNo) parts.push(`最新第 ${props.group.latestEpisodeNo} 话`)
  if (props.group.latestPublishedAt) parts.push(formatTime(props.group.latestPublishedAt))
  return parts.join(' · ')
})
</script>

<template>
  <li class="group">
    <div class="group__main">
      <span class="group__name">{{ group.groupName || '未知发布组' }}</span>
      <span class="group__meta">{{ meta }}</span>
    </div>
    <el-button :type="followed ? 'info' : 'primary'" size="small" plain :loading="acting" @click="emit('toggle', group.groupName)">
      {{ followed ? '已关注' : '关注' }}
    </el-button>
  </li>
</template>

<style scoped lang="scss">
.group {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 10px;
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.6);

  &__main {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  &__name {
    color: #3d2f42;
    font-size: 13px;
    font-weight: 600;
  }

  &__meta {
    color: #8d7f92;
    font-size: 11px;
  }
}
</style>
