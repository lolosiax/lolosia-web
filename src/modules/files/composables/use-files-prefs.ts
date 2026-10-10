import { reactive, watch } from 'vue'
import type { FilesPrefs } from '../types'

const STORAGE_KEY = 'files:prefs'

const DEFAULT_PREFS: FilesPrefs = {
  view: 'grid',
  sort: 'name',
  order: 'asc',
  previewOpen: true,
  nsfwMode: 'blur'
}

function loadPrefs(): FilesPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_PREFS }
    return { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<FilesPrefs>) }
  } catch {
    return { ...DEFAULT_PREFS }
  }
}

/** 视图偏好（网格/列表、排序、分组、预览、敏感模式），持久化到 localStorage。 */
export function useFilesPrefs() {
  const prefs = reactive<FilesPrefs>(loadPrefs())

  watch(
    prefs,
    value => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
    },
    { deep: true }
  )

  return prefs
}
