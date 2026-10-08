<script setup lang="ts">
import { computed } from 'vue'
import { RATING_LABELS } from '../api'
import type { FileDetail } from '../api'
import { formatDateTime, formatSize, typeLabel } from '../lib'
import type { NsfwMode, UiEntry } from '../types'
import FileRemark from './FileRemark.vue'
import FileThumb from './FileThumb.vue'

defineOptions({ name: 'FilePreview' })

const props = defineProps<{
  entry: UiEntry | null
  detail: FileDetail | null
  selection: UiEntry[]
  loading: boolean
  nsfwMode: NsfwMode
  revealed: boolean
  remark: string
  remarkDisabled: boolean
}>()

const emit = defineEmits<{
  property: []
  reveal: []
  'save-remark': [value: string]
}>()

const multi = computed(() => props.selection.length > 1)
const fileCount = computed(() => props.selection.filter(item => !item.directory).length)
const dirCount = computed(() => props.selection.filter(item => item.directory).length)
const totalSize = computed(() =>
  props.selection.reduce((sum, item) => sum + (item.directory ? 0 : item.size), 0)
)

const summaryTitle = computed(() => {
  const first = props.selection[0]
  if (!first) return ''
  const suffix = dirCount.value === 0 ? '个文件' : '项'
  return `「${first.name}」等 ${props.selection.length} ${suffix}`
})

const summaryMeta = computed(() => {
  const parts: string[] = []
  if (fileCount.value) parts.push(`共 ${formatSize(totalSize.value)}`)
  if (dirCount.value) parts.push(`${dirCount.value} 个文件夹`)
  return parts.join(' · ')
})

const ratingLabel = computed(
  () => RATING_LABELS.find(item => item.value === props.entry?.rating)?.label ?? '未定级'
)

const rows = computed(() => {
  const entry = props.entry
  if (!entry) return []
  const result: { label: string; value: string }[] = [{ label: '类型', value: typeLabel(entry) }]
  if (!entry.directory) result.push({ label: '大小', value: formatSize(entry.size) })
  const detail = props.detail
  if (detail?.width && detail.height) result.push({ label: '尺寸', value: `${detail.width} × ${detail.height}` })
  if (entry.takenAt > 0) result.push({ label: '拍摄时间', value: formatDateTime(entry.takenAt) })
  result.push(
    { label: '修改时间', value: entry.mtime > 0 ? formatDateTime(entry.mtime) : '—' },
    { label: '评级', value: ratingLabel.value },
    { label: '路径', value: `/${entry.path}` }
  )
  return result
})

/** 有图但缩略图还没生成：提示后端正在排队。 */
const pending = computed(() => Boolean(props.entry?.image && !props.entry.thumb))
</script>

<template>
  <div class="file-preview">
    <div v-if="!entry && !multi" class="file-preview__placeholder">
      <i class="bi bi-image" />
      <p>选中一个文件查看详情</p>
    </div>

    <template v-else-if="multi">
      <div class="file-preview__name" :title="summaryTitle">{{ summaryTitle }}</div>
      <div class="file-preview__summary">{{ summaryMeta }}</div>
    </template>

    <template v-else-if="entry">
      <div class="file-preview__stage" @click="emit('reveal')">
        <FileThumb
          v-if="entry.image"
          :entry="entry"
          :size="1024"
          :token="entry.thumbToken"
          :nsfw-mode="nsfwMode"
          :revealed="revealed"
          allow-raw
        />
        <i
          v-else
          class="bi file-preview__icon"
          :class="entry.directory ? (entry.hasChildren ? 'bi-folder-fill' : 'bi-folder') : 'bi-file-earmark-fill'"
        />
        <span v-if="pending" class="file-preview__pending">缩略图生成中…</span>
      </div>

      <div class="file-preview__name" :title="entry.name">{{ entry.name }}</div>

      <div class="file-preview__remark">
        <FileRemark :value="remark" :disabled="remarkDisabled" @save="emit('save-remark', $event)" />
      </div>

      <button v-if="!entry.directory" type="button" class="file-preview__property" @click="emit('property')">
        <i class="bi bi-sliders" />
        属性与评级
      </button>

      <div v-if="loading" class="file-preview__loading">读取详情…</div>
      <dl v-else class="file-preview__rows">
        <template v-for="row in rows" :key="row.label">
          <dt>{{ row.label }}</dt>
          <dd :title="row.value">{{ row.value }}</dd>
        </template>
      </dl>
    </template>
  </div>
</template>

<style scoped lang="scss">
.file-preview {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  padding: 14px;
  overflow: auto;

  &__placeholder {
    display: flex;
    flex: 1;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    color: var(--el-text-color-secondary, #999);
    font-size: 13px;

    i {
      font-size: 3em;
      opacity: 0.4;
    }
  }

  &__stage {
    position: relative;
    display: grid;
    place-items: center;
    min-height: 200px;
    max-height: 46vh;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.7);
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.55);

    :deep(.file-thumb) {
      width: auto;
      height: auto;
      max-width: 100%;
      max-height: 46vh;
      min-width: 120px;
      min-height: 120px;
    }

    :deep(.file-thumb__image) {
      width: auto;
      height: auto;
      max-width: 100%;
      max-height: 46vh;
      object-fit: contain;
    }
  }

  &__icon {
    padding: 40px 0;
    color: var(--el-text-color-secondary, #999);
    font-size: 3.4em;
  }

  &__pending {
    position: absolute;
    right: 10px;
    bottom: 8px;
    color: var(--el-text-color-secondary, #999);
    font-size: 12px;
  }

  &__name {
    font-size: 14px;
    font-weight: 600;
    line-height: 1.4;
    word-break: break-all;
  }

  &__summary {
    color: var(--el-text-color-secondary, #999);
    font-size: 12px;
  }

  &__property {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 6px 10px;
    border: 1px solid rgba(255, 255, 255, 0.7);
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.6);
    color: var(--el-text-color-regular, #555);
    font-size: 12px;
    cursor: pointer;

    &:hover {
      color: var(--lolosia-color-primary-dark-2);
      background: rgba(255, 255, 255, 0.9);
    }
  }

  &__loading {
    color: var(--el-text-color-secondary, #999);
    font-size: 12px;
  }

  &__rows {
    display: grid;
    grid-template-columns: 68px 1fr;
    gap: 6px 10px;
    margin: 0;
    font-size: 12px;

    dt {
      color: var(--el-text-color-secondary, #999);
    }

    dd {
      margin: 0;
      color: var(--el-text-color-regular, #444);
      word-break: break-all;
    }
  }
}
</style>
