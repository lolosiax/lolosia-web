<script setup lang="ts">
// 目录树节点（递归自身）：状态全在 FileTree，通过 inject 读取。
import { computed, inject } from 'vue'
import type { FileEntry } from '../api'
import { FILE_TREE_KEY } from '../keys'

defineOptions({ name: 'FileTreeNode' })

const props = defineProps<{
  node: FileEntry
  depth: number
  current: string
}>()

const emit = defineEmits<{
  navigate: [path: string]
  menu: [node: FileEntry, x: number, y: number]
}>()

const tree = inject(FILE_TREE_KEY)
if (!tree) throw new Error('FileTreeNode 必须在 FileTree 内使用')

const isExpanded = computed(() => tree.expanded.has(props.node.path))
const children = computed(() => tree.childrenMap[props.node.path] ?? [])
const isLoading = computed(() => tree.loading.has(props.node.path))
const folderIcon = computed(() => {
  if (isExpanded.value) return 'bi-folder2-open'
  return props.node.hasChildren ? 'bi-folder-fill' : 'bi-folder'
})

function contextMenu(event: MouseEvent): void {
  event.preventDefault()
  emit('menu', props.node, event.clientX, event.clientY)
}

function forwardMenu(node: FileEntry, x: number, y: number): void {
  emit('menu', node, x, y)
}
</script>

<template>
  <div class="file-tree-node">
    <div
      class="file-tree-node__row"
      :class="{
        'is-active': current === node.path,
        'is-drop-target': tree.dropPath.current === node.path
      }"
      :style="{ paddingLeft: `${depth * 12 + 2}px` }"
      :data-drop-dir="node.path"
      role="button"
      tabindex="0"
      @click="emit('navigate', node.path)"
      @contextmenu="contextMenu"
      @keydown.enter.prevent="emit('navigate', node.path)"
    >
      <i
        class="bi file-tree-node__caret"
        :class="node.hasSubdirs ? (isExpanded ? 'bi-caret-down-fill' : 'bi-caret-right-fill') : ''"
        @click.stop="node.hasSubdirs ? tree.toggle(node.path) : emit('navigate', node.path)"
      />
      <i
        class="bi file-tree-node__folder"
        :class="[folderIcon, { 'is-empty': !node.hasChildren }]"
      />
      <span class="file-tree-node__name">{{ node.name }}</span>
    </div>

    <template v-if="isExpanded">
      <FileTreeNode
        v-for="child in children"
        :key="child.path"
        :node="child"
        :depth="depth + 1"
        :current="current"
        @navigate="emit('navigate', $event)"
        @menu="forwardMenu"
      />
      <div
        v-if="isLoading"
        class="file-tree-node__hint"
        :style="{ paddingLeft: `${(depth + 1) * 12 + 2}px` }"
      >
        加载中…
      </div>
      <div
        v-else-if="!children.length"
        class="file-tree-node__hint"
        :style="{ paddingLeft: `${(depth + 1) * 12 + 2}px` }"
      >
        {{ node.hasChildren ? '（没有子文件夹）' : '（空）' }}
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.file-tree-node {
  &__row {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 4px 8px 4px 0;
    border-radius: 8px;
    font-size: 13px;
    white-space: nowrap;
    cursor: pointer;
    overflow: hidden;
    transition: background-color 0.15s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.6);
    }

    &.is-active {
      background: var(--lolosia-color-primary);
      color: #fff;

      .file-tree-node__folder {
        color: #fff;
      }

      .file-tree-node__caret {
        color: rgba(255, 255, 255, 0.75);
      }
    }

    &.is-drop-target {
      background: rgba(194, 150, 205, 0.3);
      color: inherit;
      box-shadow: inset 0 0 0 2px var(--lolosia-color-primary-light-3, #c296cd);
    }
  }

  &__caret {
    flex: none;
    width: 12px;
    color: var(--el-text-color-placeholder, #a8abb2);
    font-size: 9px;
    text-align: center;
  }

  &__folder {
    flex: none;
    color: #d9a441;

    &.is-empty {
      opacity: 0.45;
    }
  }

  &__name {
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__hint {
    padding-top: 2px;
    padding-bottom: 2px;
    color: var(--el-text-color-secondary, #999);
    font-size: 12px;
  }
}
</style>
