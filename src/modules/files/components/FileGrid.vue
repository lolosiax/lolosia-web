<script setup lang="ts">
import { computed, ref } from 'vue'
import type { FileSortKey, FileSortOrder } from '../api'
import type { NsfwMode, UiEntry } from '../types'
import { useFilesMarquee } from '../composables/use-files-marquee'
import FileListRow from './FileListRow.vue'
import FileTile from './FileTile.vue'

defineOptions({ name: 'FileGrid' })

const props = defineProps<{
  entries: UiEntry[]
  view: 'grid' | 'list'
  sort: FileSortKey
  order: FileSortOrder
  selected: string
  selection: Set<string>
  loading: boolean
  path: string
  nsfwMode: NsfwMode
  revealedPaths: Record<string, boolean>
}>()

const emit = defineEmits<{
  pick: [entry: UiEntry, mode: 'single' | 'toggle' | 'range']
  'pick-blank': []
  marquee: [paths: string[], additive: boolean]
  open: [entry: UiEntry]
  sort: [key: FileSortKey]
  menu: [entry: UiEntry, event: MouseEvent]
  'menu-blank': [event: MouseEvent]
}>()

const gridRef = ref<HTMLElement>()

const { marquee, onPointerDown, consumeJustEnded } = useFilesMarquee({
  root: () => gridRef.value,
  onMarquee: (paths, additive) => emit('marquee', paths, additive)
})

const COLUMNS: { key: FileSortKey; label: string; width?: string }[] = [
  { key: 'name', label: '名称' },
  { key: 'mtime', label: '修改时间', width: '170px' },
  { key: 'type', label: '类型', width: '120px' },
  { key: 'size', label: '大小', width: '110px' }
]

const rowCount = computed(() => props.entries.length)

function pick(entry: UiEntry, event: MouseEvent | KeyboardEvent): void {
  const mode = event.shiftKey ? 'range' : event.ctrlKey || event.metaKey ? 'toggle' : 'single'
  emit('pick', entry, mode)
}

function gridClick(event: MouseEvent): void {
  if (consumeJustEnded()) return
  if ((event.target as HTMLElement | null)?.closest('.file-tile, .file-row')) return
  emit('pick-blank')
}

function contextMenu(entry: UiEntry, event: MouseEvent): void {
  event.preventDefault()
  emit('menu', entry, event)
}

function blankMenu(event: MouseEvent): void {
  if ((event.target as HTMLElement | null)?.closest('.file-tile, .file-row')) return
  event.preventDefault()
  emit('menu-blank', event)
}
</script>

<template>
  <div
    ref="gridRef"
    class="file-grid"
    :class="`file-grid--${view}`"
    @contextmenu="blankMenu"
    @click="gridClick"
    @pointerdown="onPointerDown"
    @dragstart.prevent
  >
    <div v-if="loading" class="file-grid__overlay">
      <i class="bi bi-arrow-repeat spinning" />
      读取中…
    </div>

    <div v-else-if="!rowCount" class="file-grid__empty">
      <i class="bi bi-folder2-open" />
      <p>这个文件夹是空的</p>
      <p class="file-grid__empty-hint">右键空白处可以新建文件夹，或者把文件拖进来上传</p>
    </div>

    <template v-else-if="view === 'grid'">
      <FileTile
        v-for="entry in entries"
        :key="entry.path"
        :entry="entry"
        :selected="selection.has(entry.path)"
        :primary="selected === entry.path"
        :nsfw-mode="nsfwMode"
        :revealed="Boolean(revealedPaths[entry.path])"
        @pick="pick"
        @open="emit('open', $event)"
        @menu="contextMenu"
      />
    </template>

    <template v-else>
      <div class="file-grid__head">
        <span class="cell icon" />
        <span
          v-for="column in COLUMNS"
          :key="column.key"
          class="cell"
          :class="{ 'is-sorted': sort === column.key }"
          :style="{ width: column.width }"
          @click="emit('sort', column.key)"
        >
          {{ column.label }}
          <i
            v-if="sort === column.key"
            class="bi"
            :class="order === 'asc' ? 'bi-caret-up-fill' : 'bi-caret-down-fill'"
          />
        </span>
      </div>
      <FileListRow
        v-for="entry in entries"
        :key="entry.path"
        :entry="entry"
        :selected="selection.has(entry.path)"
        :primary="selected === entry.path"
        :nsfw-mode="nsfwMode"
        :revealed="Boolean(revealedPaths[entry.path])"
        @pick="pick"
        @open="emit('open', $event)"
        @menu="contextMenu"
      />
    </template>

    <div
      v-if="marquee"
      class="file-grid__marquee"
      :style="{
        left: `${marquee.left}px`,
        top: `${marquee.top}px`,
        width: `${marquee.right - marquee.left}px`,
        height: `${marquee.bottom - marquee.top}px`
      }"
    />
  </div>
</template>

<style scoped lang="scss">
.file-grid {
  position: relative;
  height: 100%;
  padding: 4px 8px 16px;
  overflow: auto;
  user-select: none;
  -webkit-user-select: none;

  :deep(img) {
    -webkit-user-drag: none;
  }

  &__overlay,
  &__empty {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    color: var(--el-text-color-secondary, #999);
    font-size: 13px;

    i {
      font-size: 2.4em;
      opacity: 0.5;
    }
  }

  &__empty-hint {
    margin: 0;
    font-size: 12px;
    opacity: 0.75;
  }

  &__marquee {
    position: absolute;
    z-index: 5;
    border: 1px solid var(--lolosia-color-primary-light-3, #c296cd);
    border-radius: 4px;
    background: rgba(194, 150, 205, 0.16);
    pointer-events: none;
  }
}

.spinning {
  animation: file-grid-spin 0.9s linear infinite;
}

@keyframes file-grid-spin {
  to {
    transform: rotate(360deg);
  }
}

.file-grid--grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(132px, 1fr));
  gap: 6px;
  align-content: start;
}

.file-grid--list {
  .file-grid__head {
    position: sticky;
    top: 0;
    z-index: 1;
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 4px;
    padding: 6px 10px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.75);
    backdrop-filter: blur(8px);
    color: var(--el-text-color-secondary, #888);
    font-size: 12px;

    .cell {
      cursor: pointer;
      white-space: nowrap;

      &.is-sorted {
        color: var(--lolosia-color-primary-dark-2);
        font-weight: 600;
      }
    }

    .icon {
      width: 30px;
      flex: none;
    }
  }
}
</style>
