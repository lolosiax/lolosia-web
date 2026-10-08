<script setup lang="ts">
// 目录树：懒加载子目录；当前路径变化时只展开祖先，让选中的目录可见。
import { provide, reactive, ref, watch } from 'vue'
import { listDirs } from '../api'
import type { FileEntry } from '../api'
import { collectFiles, hasFiles } from '../drop'
import { FILE_TREE_KEY } from '../keys'
import FileTreeNode from './FileTreeNode.vue'

defineOptions({ name: 'FileTree' })

const props = defineProps<{ current: string }>()

const emit = defineEmits<{
  navigate: [path: string]
  menu: [node: FileEntry, x: number, y: number]
  'drop-files': [files: File[], path: string]
}>()

const childrenMap = reactive<Record<string, FileEntry[]>>({})
const expanded = reactive(new Set<string>())
const loading = reactive(new Set<string>())
const error = ref('')
const dropPath = reactive<{ current: string | null }>({ current: null })

async function ensureChildren(path: string): Promise<void> {
  if (childrenMap[path] || loading.has(path)) return
  loading.add(path)
  try {
    childrenMap[path] = await listDirs(path)
  } catch (err) {
    error.value = err instanceof Error ? err.message : '读取目录失败'
  } finally {
    loading.delete(path)
  }
}

function toggle(path: string): void {
  if (expanded.has(path)) {
    expanded.delete(path)
    return
  }
  expanded.add(path)
  void ensureChildren(path)
}

provide(FILE_TREE_KEY, { childrenMap, expanded, loading, toggle, dropPath })

/** 只展开祖先目录，目标目录本身交给用户点箭头。 */
async function revealAncestors(path: string): Promise<void> {
  const segments = path ? path.split('/') : []
  const chain = ['']
  let prefix = ''
  for (const segment of segments.slice(0, -1)) {
    prefix = prefix ? `${prefix}/${segment}` : segment
    chain.push(prefix)
  }
  for (const item of chain) {
    expanded.add(item)
    await ensureChildren(item)
  }
}

watch(() => props.current, value => void revealAncestors(value), { immediate: true })

/** 目录改名 / 新建 / 删除后重拉某一层；先请求再整体替换，避免树高度闪一下。 */
async function invalidate(path: string): Promise<void> {
  if (loading.has(path)) return
  loading.add(path)
  try {
    childrenMap[path] = await listDirs(path)
  } catch (err) {
    error.value = err instanceof Error ? err.message : '读取目录失败'
  } finally {
    loading.delete(path)
  }
}

function dropDirAt(event: DragEvent): string | null {
  const row = (event.target as HTMLElement | null)?.closest('[data-drop-dir]') as HTMLElement | null
  return row ? (row.dataset.dropDir ?? '') : null
}

function dragOver(event: DragEvent): void {
  const dir = dropDirAt(event)
  if (dir === null || !hasFiles(event)) return
  event.preventDefault()
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy'
  dropPath.current = dir
}

function dragLeave(event: DragEvent): void {
  const next = event.relatedTarget as Node | null
  if (next && (event.currentTarget as HTMLElement).contains(next)) return
  dropPath.current = null
}

function drop(event: DragEvent): void {
  const dir = dropDirAt(event)
  if (dir === null || !hasFiles(event)) return
  event.preventDefault()
  const files = collectFiles(event.dataTransfer)
  dropPath.current = null
  if (files.length) emit('drop-files', files, dir)
}

function forwardMenu(node: FileEntry, x: number, y: number): void {
  emit('menu', node, x, y)
}

defineExpose({ invalidate })
</script>

<template>
  <div class="file-tree" @dragover="dragOver" @dragleave="dragLeave" @drop="drop">
    <div
      class="file-tree__row file-tree__root"
      :class="{ 'is-active': current === '', 'is-drop-target': dropPath.current === '' }"
      data-drop-dir=""
      @click="emit('navigate', '')"
    >
      <i class="bi bi-hdd-fill file-tree__root-icon" />
      <span>根目录</span>
    </div>

    <FileTreeNode
      v-for="node in childrenMap[''] ?? []"
      :key="node.path"
      :node="node"
      :depth="1"
      :current="current"
      @navigate="emit('navigate', $event)"
      @menu="forwardMenu"
    />

    <div v-if="loading.has('')" class="file-tree__hint">加载中…</div>
    <div v-if="error" class="file-tree__hint is-error">{{ error }}</div>
  </div>
</template>

<style scoped lang="scss">
.file-tree {
  height: 100%;
  padding: 8px 6px;
  overflow: auto;

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
  }

  &__root {
    gap: 6px;
    margin-bottom: 4px;
    padding: 5px 8px;
    font-weight: 600;

    &:hover {
      background: rgba(255, 255, 255, 0.6);
    }

    &.is-active {
      background: var(--lolosia-color-primary);
      color: #fff;

      .file-tree__root-icon {
        color: #fff;
      }
    }

    &.is-drop-target {
      background: rgba(194, 150, 205, 0.3);
      box-shadow: inset 0 0 0 2px var(--lolosia-color-primary-light-3, #c296cd);
    }
  }

  &__root-icon {
    color: var(--lolosia-color-primary-dark-2);
  }

  &__hint {
    padding: 4px 8px;
    color: var(--el-text-color-secondary, #999);
    font-size: 12px;

    &.is-error {
      color: var(--el-color-danger, #f56c6c);
    }
  }
}
</style>
