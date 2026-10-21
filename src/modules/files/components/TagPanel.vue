<script setup lang="ts">
// 右侧「标签」栏：标签跟着当前整份选择走；文件与目录由外层分派到各自接口。
import { ref } from 'vue'
import type { MediaTagRef } from '../api'
import type { TagRow } from '../types'
import TagPicker from './TagPicker.vue'

defineOptions({ name: 'TagPanel' })

const props = defineProps<{
  rows: TagRow[]
  canTag: boolean
  hint: string
  path: string
}>()

const emit = defineEmits<{
  add: [tags: MediaTagRef[]]
  menu: [row: TagRow, x: number, y: number]
}>()

const adding = ref(false)

function startAdd(): void {
  if (!props.canTag) return
  adding.value = true
}

function onPick(tag: MediaTagRef): void {
  emit('add', [tag])
}
</script>

<template>
  <div class="tag-panel">
    <div class="tag-panel__head">
      <span class="tag-panel__title"><i class="bi bi-tags" /> 标签</span>
      <button
        v-if="!adding"
        type="button"
        class="tag-panel__add"
        :disabled="!canTag"
        :title="canTag ? '给当前选择添加标签（可连点批量）' : '先选中文件或文件夹'"
        @click="startAdd"
      >
        <i class="bi bi-plus-lg" />
      </button>
    </div>

    <div class="tag-panel__body">
      <TagPicker v-if="adding" :path="path" @select="onPick" @close="adding = false" />

      <span
        v-for="row in rows"
        :key="row.key"
        class="tag-panel__chip"
        :class="{ 'is-denied': row.negative }"
        :title="row.title"
        @contextmenu.prevent="emit('menu', row, $event.clientX, $event.clientY)"
      >
        {{ row.namespace }}:{{ row.name }}
        <em v-if="row.count != null" class="tag-panel__count">{{ row.count }}</em>
      </span>

      <p v-if="!rows.length && !adding" class="tag-panel__hint">{{ hint }}</p>
    </div>
  </div>
</template>

<style scoped lang="scss">
.tag-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;

  &__head {
    display: flex;
    flex: none;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 8px 10px 6px;
  }

  &__title {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--el-text-color-regular, #555);
    font-size: 12px;
    font-weight: 600;
  }

  &__add {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 3px 9px;
    border: 1px solid rgba(255, 255, 255, 0.7);
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.6);
    color: var(--el-text-color-regular, #555);
    font: inherit;
    font-size: 12px;
    line-height: 1.4;
    cursor: pointer;
    transition: all 0.15s ease;

    &:hover:not(:disabled) {
      color: var(--lolosia-color-primary-dark-2);
      background: rgba(255, 255, 255, 0.9);
    }

    &:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }
  }

  &__body {
    display: flex;
    flex: 0 1 auto;
    flex-wrap: wrap;
    align-content: flex-start;
    align-items: center;
    gap: 6px;
    min-height: 0;
    max-height: 140px;
    padding: 0 10px 10px;
    overflow-x: hidden;
    overflow-y: auto;
  }

  &__chip {
    padding: 2px 8px;
    border: 1px solid rgba(255, 255, 255, 0.85);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.7);
    color: var(--el-text-color-regular, #444);
    font-size: 12px;
    line-height: 1.6;
    word-break: break-all;

    &.is-denied {
      color: var(--el-text-color-secondary, #999);
      text-decoration: line-through;
      opacity: 0.8;
    }
  }

  &__count {
    margin-left: 4px;
    color: var(--el-text-color-secondary, #999);
    font-size: 11px;
    font-style: normal;
  }

  &__hint {
    margin: 0;
    color: var(--el-text-color-secondary, #999);
    font-size: 12px;
  }
}
</style>
