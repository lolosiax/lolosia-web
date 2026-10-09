import { defineStore } from 'pinia'
import { ref } from 'vue'
import { uploadEntry } from './api'

export type UploadStatus = 'pending' | 'uploading' | 'done' | 'error'

export interface UploadItem {
  name: string
  size: number
  loaded: number
  status: UploadStatus
  error?: string
  file: File
}

export interface UploadGroup {
  dir: string
  items: UploadItem[]
}

export type ClipboardMode = 'copy' | 'cut'

export interface FileClipboard {
  mode: ClipboardMode
  paths: string[]
}

const TREE_WIDTH_MIN = 160
const TREE_WIDTH_MAX = 560
const DEFAULT_TREE_WIDTH = 220
const AUTO_DISMISS_MS = 3000

/** 文件模块的跨组件状态：上传队列、内部剪贴板、目录树宽度。 */
export const useFilesStore = defineStore(
  'files',
  () => {
    const treeWidth = ref(DEFAULT_TREE_WIDTH)
    const clipboard = ref<FileClipboard | null>(null)
    const uploads = ref<UploadGroup[]>([])

    const running = new Set<UploadGroup>()
    const completions = new Map<UploadGroup, Promise<void>>()
    const dismissTimers = new Map<UploadGroup, number>()

    function setTreeWidth(width: number): void {
      treeWidth.value = Math.min(TREE_WIDTH_MAX, Math.max(TREE_WIDTH_MIN, width))
    }

    function setClipboard(mode: ClipboardMode, paths: string[]): void {
      clipboard.value = paths.length ? { mode, paths } : null
    }

    function clearClipboard(): void {
      clipboard.value = null
    }

    function scheduleDismiss(group: UploadGroup): void {
      if (group.items.some(item => item.status === 'error')) return
      const timer = window.setTimeout(() => removeGroup(group.dir), AUTO_DISMISS_MS)
      dismissTimers.set(group, timer)
    }

    function cancelDismiss(group: UploadGroup): void {
      const timer = dismissTimers.get(group)
      if (timer !== undefined) window.clearTimeout(timer)
      dismissTimers.delete(group)
    }

    async function runGroup(group: UploadGroup): Promise<void> {
      if (running.has(group)) return
      running.add(group)

      for (const item of group.items) {
        if (item.status !== 'pending') continue
        item.status = 'uploading'
        try {
          await uploadEntry(group.dir, item.file, loaded => {
            item.loaded = loaded
          })
          item.status = 'done'
          item.loaded = item.size
        } catch (error) {
          item.status = 'error'
          item.error = error instanceof Error ? error.message : '上传失败'
        }
      }

      running.delete(group)
      scheduleDismiss(group)
    }

    /** 同目录串行、不同目录并行；返回本组全部传完（含后续追加）的 Promise。 */
    async function enqueue(dir: string, files: File[]): Promise<void> {
      if (!files.length) return

      let group = uploads.value.find(item => item.dir === dir)
      if (!group) {
        group = { dir, items: [] }
        uploads.value.push(group)
      }
      cancelDismiss(group)

      for (const file of files) {
        group.items.push({ name: file.name, size: file.size, loaded: 0, status: 'pending', file })
      }
      await startGroup(group)
    }

    /** 组已在跑时复用同一个 Promise；新追加的项会被现有循环继续消费。 */
    function startGroup(group: UploadGroup): Promise<void> {
      const existing = completions.get(group)
      if (existing) return existing
      const task = runGroup(group).finally(() => {
        completions.delete(group)
      })
      completions.set(group, task)
      return task
    }

    function removeGroup(dir: string): void {
      const index = uploads.value.findIndex(group => group.dir === dir)
      if (index < 0) return
      const [group] = uploads.value.splice(index, 1)
      if (group) cancelDismiss(group)
    }

    function clearFinished(): void {
      uploads.value = uploads.value.filter(group => group.items.some(item => item.status !== 'done'))
    }

    return {
      treeWidth,
      clipboard,
      uploads,
      setTreeWidth,
      setClipboard,
      clearClipboard,
      enqueue,
      removeGroup,
      clearFinished
    }
  },
  {
    persist: {
      key: 'files',
      storage: localStorage,
      pick: ['treeWidth']
    }
  }
)
