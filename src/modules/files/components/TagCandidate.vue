<script setup lang="ts">
// 标签候选胶囊：把按钮内部的排版从 TagPicker 里拿出来，免得模板嵌套过深。
import type { MediaTagItem } from '../api'

defineOptions({ name: 'TagCandidate' })

defineProps<{
  tag: MediaTagItem
  used: boolean
  count: number
  showNamespace: boolean
}>()

const emit = defineEmits<{
  pick: []
}>()
</script>

<template>
  <button
    type="button"
    class="tag-candidate"
    :class="{ 'is-used': used }"
    :title="`${tag.namespace}:${tag.name}`"
    @click="emit('pick')"
  >
    <span v-if="showNamespace" class="tag-candidate__ns">{{ tag.namespace }}</span>
    <span class="tag-candidate__name">{{ tag.name }}</span>
    <em v-if="used" class="tag-candidate__count">{{ count || '' }}</em>
  </button>
</template>

<style scoped lang="scss">
.tag-candidate {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  max-width: 100%;
  padding: 2px 8px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.85);
  color: var(--el-text-color-regular, #444);
  font: inherit;
  font-size: 12px;
  line-height: 1.6;
  cursor: pointer;

  &:hover {
    border-color: var(--lolosia-color-primary, #a06bb0);
    color: var(--lolosia-color-primary-dark-2, #7d4a8c);
  }

  &.is-used {
    border-color: var(--lolosia-color-primary-light-3, #c296cd);
    background: rgba(160, 107, 176, 0.1);
  }

  &__ns {
    color: var(--el-text-color-secondary, #999);
    font-size: 11px;
  }

  &__name {
    max-width: 160px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  &__count {
    color: var(--el-text-color-secondary, #999);
    font-size: 11px;
    font-style: normal;
  }
}
</style>
