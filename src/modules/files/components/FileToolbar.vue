<script setup lang="ts">
import { computed } from 'vue'
import type { FileSortKey, FileSortOrder } from '../api'
import type { FileGroup, FileView, NsfwMode } from '../types'

defineOptions({ name: 'FileToolbar' })

const props = defineProps<{
  path: string
  view: FileView
  sort: FileSortKey
  order: FileSortOrder
  group: FileGroup
  groupEnabled: boolean
  dateGroupEnabled: boolean
  favFirstEnabled: boolean
  previewOpen: boolean
  total: number
  selectedCount: number
  loading: boolean
  nsfwMode: NsfwMode
}>()

const emit = defineEmits<{
  navigate: [path: string]
  'update:view': [value: FileView]
  'update:sort': [value: FileSortKey]
  'update:order': [value: FileSortOrder]
  'update:group': [value: FileGroup]
  'update:previewOpen': [value: boolean]
  'update:nsfwMode': [value: NsfwMode]
  'index-scan': []
  analyze: []
  refresh: []
  setting: []
}>()

/** 面包屑：空串表示根目录。 */
const crumbs = computed(() => {
  const list = [{ name: '根目录', path: '' }]
  let prefix = ''
  for (const segment of props.path ? props.path.split('/') : []) {
    prefix = prefix ? `${prefix}/${segment}` : segment
    list.push({ name: segment, path: prefix })
  }
  return list
})

const SORTS: { key: FileSortKey; label: string }[] = [
  { key: 'name', label: '名称' },
  { key: 'size', label: '大小' },
  { key: 'mtime', label: '时间' },
  { key: 'type', label: '类型' }
]

/** 分组栏只影响摆放位置；按钮按当前目录的能力给。 */
const groupItems = computed<{ key: FileGroup; label: string }[]>(() => {
  const items: { key: FileGroup; label: string }[] = [{ key: 'none', label: '不分组' }]
  if (props.dateGroupEnabled) items.push({ key: 'year', label: '年份' }, { key: 'month', label: '月份' })
  if (props.favFirstEnabled) items.push({ key: 'favorite', label: '喜欢' })
  return items
})
</script>

<template>
  <div class="file-toolbar">
    <div class="file-toolbar__crumbs">
      <template v-for="(crumb, index) in crumbs" :key="crumb.path">
        <span v-if="index" class="file-toolbar__separator">/</span>
        <span
          class="file-toolbar__crumb"
          :class="{ 'is-current': index === crumbs.length - 1 }"
          @click="emit('navigate', crumb.path)"
        >
          {{ crumb.name }}
        </span>
      </template>
      <span class="file-toolbar__counter">{{ total }} 项</span>
      <span v-if="selectedCount" class="file-toolbar__counter is-selected">已选 {{ selectedCount }} 项</span>
    </div>

    <div class="file-toolbar__actions">
      <div v-if="groupEnabled" class="file-toolbar__segment" title="分组摆放（只影响位置，不影响框选）">
        <button
          v-for="item in groupItems"
          :key="item.key"
          type="button"
          class="file-toolbar__segment-item"
          :class="{ 'is-active': group === item.key }"
          @click="emit('update:group', item.key)"
        >
          {{ item.label }}
        </button>
      </div>

      <div class="file-toolbar__segment">
        <button
          v-for="item in SORTS"
          :key="item.key"
          type="button"
          class="file-toolbar__segment-item"
          :class="{ 'is-active': sort === item.key }"
          @click="emit('update:sort', item.key)"
        >
          {{ item.label }}
        </button>
      </div>

      <button
        type="button"
        class="file-toolbar__icon"
        :title="order === 'asc' ? '升序' : '降序'"
        @click="emit('update:order', order === 'asc' ? 'desc' : 'asc')"
      >
        <i class="bi" :class="order === 'asc' ? 'bi-sort-down-alt' : 'bi-sort-up-alt'" />
      </button>

      <div class="file-toolbar__segment">
        <button
          type="button"
          class="file-toolbar__segment-item"
          :class="{ 'is-active': view === 'grid' }"
          title="图标视图"
          @click="emit('update:view', 'grid')"
        >
          <i class="bi bi-grid-3x3-gap-fill" />
        </button>
        <button
          type="button"
          class="file-toolbar__segment-item"
          :class="{ 'is-active': view === 'list' }"
          title="列表视图"
          @click="emit('update:view', 'list')"
        >
          <i class="bi bi-list-ul" />
        </button>
      </div>

      <button
        type="button"
        class="file-toolbar__icon"
        :title="previewOpen ? '关闭预览' : '打开预览'"
        @click="emit('update:previewOpen', !previewOpen)"
      >
        <i class="bi bi-layout-sidebar-inset-reverse" />
      </button>

      <button
        type="button"
        class="file-toolbar__icon"
        :title="nsfwMode === 'blur' ? '敏感内容：已遮罩（点击直接显示）' : '敏感内容：直接显示（点击改为遮罩）'"
        @click="emit('update:nsfwMode', nsfwMode === 'blur' ? 'always' : 'blur')"
      >
        <i class="bi" :class="nsfwMode === 'blur' ? 'bi-eye-slash' : 'bi-eye'" />
      </button>

      <button type="button" class="file-toolbar__icon" title="刷新索引（本地扫描，不外发）" @click="emit('index-scan')">
        <i class="bi bi-arrow-repeat" />
      </button>

      <button type="button" class="file-toolbar__icon" title="开始打标（递归外发分析）" @click="emit('analyze')">
        <i class="bi bi-stars" />
      </button>

      <button
        type="button"
        class="file-toolbar__icon"
        :class="{ 'is-spinning': loading }"
        title="刷新"
        @click="emit('refresh')"
      >
        <i class="bi bi-arrow-clockwise" />
      </button>

      <button type="button" class="file-toolbar__icon" title="设置" @click="emit('setting')">
        <i class="bi bi-gear" />
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.file-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;

  &__crumbs {
    display: flex;
    flex: 1;
    align-items: center;
    gap: 4px;
    min-width: 0;
    overflow: hidden;
    font-size: 13px;
  }

  &__separator {
    color: var(--el-text-color-secondary, #aaa);
  }

  &__crumb {
    padding: 3px 8px;
    border-radius: 8px;
    color: var(--el-text-color-regular, #555);
    white-space: nowrap;
    cursor: pointer;
    transition: background-color 0.15s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.7);
    }

    &.is-current {
      color: var(--lolosia-color-primary-dark-2);
      font-weight: 600;
      cursor: default;
    }
  }

  &__counter {
    margin-left: 8px;
    color: var(--el-text-color-secondary, #999);
    font-size: 12px;
    white-space: nowrap;

    &.is-selected {
      color: var(--lolosia-color-primary-dark-2);
      font-weight: 600;
    }
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__segment {
    display: flex;
    padding: 2px;
    border: 1px solid rgba(255, 255, 255, 0.6);
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.5);
  }

  &__segment-item {
    padding: 4px 10px;
    border: none;
    border-radius: 8px;
    background: transparent;
    color: var(--el-text-color-regular, #555);
    font-size: 12px;
    line-height: 1.2;
    cursor: pointer;
    transition: all 0.15s ease;

    &:hover {
      color: var(--lolosia-color-primary-dark-2);
    }

    &.is-active {
      background: var(--lolosia-color-primary);
      color: #fff;
    }
  }

  &__icon {
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    border: 1px solid rgba(255, 255, 255, 0.6);
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.5);
    color: var(--el-text-color-regular, #555);
    cursor: pointer;
    transition: all 0.15s ease;

    &:hover {
      color: var(--lolosia-color-primary-dark-2);
      background: rgba(255, 255, 255, 0.85);
    }

    &.is-spinning i {
      animation: file-toolbar-spin 0.9s linear infinite;
    }
  }
}

@keyframes file-toolbar-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
