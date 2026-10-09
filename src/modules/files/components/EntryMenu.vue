<script setup lang="ts">
import type { UiEntry } from '../types'

defineOptions({ name: 'EntryMenu' })

defineProps<{
  open: boolean
  x: number
  y: number
  entry: UiEntry | null
  single: boolean
  hasFiles: boolean
  allNoCrop: boolean
  canPaste: boolean
}>()

const emit = defineEmits<{
  close: []
  rename: []
  'folder-tags': []
  analyze: []
  reanalyze: []
  'no-crop': []
  regenerate: []
  copy: []
  cut: []
  remove: []
  mkdir: []
  paste: []
}>()
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="entry-menu__mask" @click="emit('close')" @contextmenu.prevent="emit('close')" />
    <div v-if="open" class="entry-menu" :style="{ left: `${x}px`, top: `${y}px` }">
      <template v-if="entry">
        <button v-if="single" type="button" class="entry-menu__item" @click="emit('rename')">
          <i class="bi bi-pencil-square" />
          重命名
        </button>
        <button v-if="entry.directory && single" type="button" class="entry-menu__item" @click="emit('folder-tags')">
          <i class="bi bi-tags" />
          标签…
        </button>
        <button v-if="entry.directory && single" type="button" class="entry-menu__item" @click="emit('analyze')">
          <i class="bi bi-stars" />
          开始打标
        </button>
        <button v-if="entry.directory && single" type="button" class="entry-menu__item" @click="emit('reanalyze')">
          <i class="bi bi-arrow-repeat" />
          重新打标（全部）
        </button>
        <button v-if="hasFiles" type="button" class="entry-menu__item" @click="emit('no-crop')">
          <i class="bi bi-crop" />
          {{ allNoCrop ? '恢复裁剪' : '不裁剪' }}
        </button>
        <button v-if="hasFiles" type="button" class="entry-menu__item" @click="emit('regenerate')">
          <i class="bi bi-arrow-repeat" />
          重新生成缩略图
        </button>
        <button type="button" class="entry-menu__item" @click="emit('copy')">
          <i class="bi bi-files" />
          复制
        </button>
        <button type="button" class="entry-menu__item" @click="emit('cut')">
          <i class="bi bi-scissors" />
          剪切
        </button>
        <button type="button" class="entry-menu__item is-danger" @click="emit('remove')">
          <i class="bi bi-trash3" />
          删除
        </button>
      </template>
      <template v-else>
        <button type="button" class="entry-menu__item" @click="emit('mkdir')">
          <i class="bi bi-folder-plus" />
          新建文件夹
        </button>
        <button v-if="canPaste" type="button" class="entry-menu__item" @click="emit('paste')">
          <i class="bi bi-clipboard-check" />
          粘贴
        </button>
      </template>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
.entry-menu__mask {
  position: fixed;
  inset: 0;
  z-index: 2000;
}

.entry-menu {
  position: fixed;
  z-index: 2001;
  min-width: 132px;
  padding: 4px;
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 6px 20px rgba(31, 38, 135, 0.18);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);

  &__item {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 7px 10px;
    border: 0;
    border-radius: 7px;
    background: transparent;
    color: inherit;
    font: inherit;
    font-size: 13px;
    text-align: left;
    cursor: pointer;

    &:hover {
      background: rgba(194, 150, 205, 0.22);
    }

    &.is-danger {
      color: var(--el-color-danger, #f56c6c);

      &:hover {
        background: rgba(245, 108, 108, 0.14);
      }
    }
  }
}
</style>
