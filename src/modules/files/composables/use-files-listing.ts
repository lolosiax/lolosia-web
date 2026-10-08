import { ref } from 'vue'
import { listFiles, scanDir } from '../api'
import type { FileSortKey, FileSortOrder } from '../api'
import type { UiEntry } from '../types'

/** 当前目录的条目列表与加载态。 */
export function useFilesListing() {
  const entries = ref<UiEntry[]>([])
  const loading = ref(false)
  const error = ref('')

  async function load(path: string, sort: FileSortKey, order: FileSortOrder): Promise<boolean> {
    loading.value = true
    error.value = ''
    try {
      const result = await listFiles(path, sort, order)
      entries.value = result.entries.map(entry => ({ ...entry }))
      // 顺带让后端把本目录缺失的缩略图排队生成，失败不影响浏览
      void scanDir(path).catch(() => undefined)
      return true
    } catch (err) {
      entries.value = []
      error.value = err instanceof Error ? err.message : '目录读取失败'
      return false
    } finally {
      loading.value = false
    }
  }

  /** SSE 重签 / 索引更新时就地替换某一条。 */
  function patch(path: string, patchValue: Partial<UiEntry>): void {
    const index = entries.value.findIndex(entry => entry.path === path)
    if (index < 0) return
    entries.value[index] = { ...entries.value[index]!, ...patchValue }
  }

  return { entries, loading, error, load, patch }
}
