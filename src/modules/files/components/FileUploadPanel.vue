<script setup lang="ts">
// 上传进度面板：每个目标目录一条，同一目录合成一条按字节计的进度。
import type { UploadGroup } from '../store'
import { formatSize } from '../lib'

defineOptions({ name: 'FileUploadPanel' })

defineProps<{ groups: UploadGroup[] }>()

const emit = defineEmits<{
  clear: []
  remove: [dir: string]
}>()

function loadedBytes(group: UploadGroup): number {
  return group.items.reduce((sum, item) => sum + item.loaded, 0)
}

function totalBytes(group: UploadGroup): number {
  return group.items.reduce((sum, item) => sum + item.size, 0)
}

function percent(group: UploadGroup): number {
  const total = totalBytes(group)
  if (!total) return group.items.every(item => item.status === 'done') ? 100 : 0
  return Math.min(100, Math.round((loadedBytes(group) / total) * 100))
}

function doneCount(group: UploadGroup): number {
  return group.items.filter(item => item.status === 'done').length
}

function failedCount(group: UploadGroup): number {
  return group.items.filter(item => item.status === 'error').length
}

function statusText(group: UploadGroup): string {
  if (group.items.some(item => item.status === 'uploading' || item.status === 'pending')) return '传输中'
  return failedCount(group) ? '有失败' : '已完成'
}

function failureText(group: UploadGroup): string {
  const failed = group.items.filter(item => item.status === 'error')
  if (!failed.length) return ''
  return failed.length === 1 ? `${failed[0]!.name}：${failed[0]!.error ?? '上传失败'}` : `${failed.length} 个文件上传失败`
}

function dirLabel(dir: string): string {
  return dir ? `/${dir}` : '根目录'
}
</script>

<template>
  <div class="upload-panel">
    <div class="upload-panel__head">
      <span class="upload-panel__title"><i class="bi bi-cloud-arrow-up" /> 上传</span>
      <button type="button" class="upload-panel__clear" @click="emit('clear')">清除已完成</button>
    </div>

    <div class="upload-panel__groups">
      <div v-for="group in groups" :key="group.dir" class="upload-panel__group">
        <div class="upload-panel__group-head">
          <span class="upload-panel__dir" :title="dirLabel(group.dir)">{{ dirLabel(group.dir) }}</span>
          <span class="upload-panel__status" :class="{ 'is-failed': failedCount(group) > 0 }">
            {{ statusText(group) }}
          </span>
          <button
            type="button"
            class="upload-panel__close"
            title="移除这条记录"
            aria-label="移除这条记录"
            @click="emit('remove', group.dir)"
          />
        </div>

        <ElProgress
          :percentage="percent(group)"
          :stroke-width="6"
          :show-text="false"
          :status="failedCount(group) ? 'exception' : undefined"
        />

        <div class="upload-panel__meta">
          <span class="upload-panel__bytes">{{ formatSize(loadedBytes(group)) }} / {{ formatSize(totalBytes(group)) }}</span>
          <span class="upload-panel__count">{{ doneCount(group) }}/{{ group.items.length }} 个文件</span>
        </div>

        <div v-if="failureText(group)" class="upload-panel__error" :title="failureText(group)">
          {{ failureText(group) }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.upload-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
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

  &__clear {
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--el-text-color-secondary, #999);
    font: inherit;
    font-size: 12px;
    cursor: pointer;

    &:hover {
      color: var(--lolosia-color-primary-dark-2);
    }
  }

  &__groups {
    display: flex;
    flex: 0 1 auto;
    flex-direction: column;
    gap: 6px;
    min-height: 0;
    padding: 0 10px 10px;
    overflow-x: hidden;
    overflow-y: auto;
  }

  &__group {
    display: flex;
    flex: none;
    flex-direction: column;
    gap: 4px;
    width: 100%;
    padding: 6px 8px;
    border: 1px solid rgba(255, 255, 255, 0.75);
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.55);
  }

  &__group-head {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  &__dir {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    font-size: 12px;
    font-weight: 600;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  &__close {
    flex: none;
    padding: 0 2px;
    border: 0;
    background: transparent;
    color: var(--el-text-color-placeholder, #a8abb2);
    font-size: 13px;
    line-height: 1;
    cursor: pointer;

    &::before {
      content: '×';
    }

    &:hover {
      color: var(--el-color-danger, #f56c6c);
    }
  }

  &__status {
    flex: none;
    color: var(--el-text-color-secondary, #999);
    font-size: 11px;

    &.is-failed {
      color: var(--el-color-danger, #f56c6c);
    }
  }

  &__meta {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
    font-size: 11px;
  }

  &__bytes {
    color: var(--el-text-color-regular, #555);
    font-variant-numeric: tabular-nums;
  }

  &__count {
    flex: none;
    color: var(--el-text-color-secondary, #999);
  }

  &__error {
    display: -webkit-box;
    overflow: hidden;
    color: var(--el-color-danger, #f56c6c);
    font-size: 11px;
    line-height: 1.4;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }
}
</style>
