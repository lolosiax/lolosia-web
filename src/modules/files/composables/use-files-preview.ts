import { computed, ref } from 'vue'
import {
  fileDetail,
  folderRemark,
  folderTags,
  mediaDetail,
  saveFolderRemark,
  saveMediaProperty
} from '../api'
import type { FileDetail, MediaDetail, MediaTagItem } from '../api'
import type { UiEntry } from '../types'

/** 右侧预览：单文件详情、媒体信息、目录标签与备注。 */
export function useFilesPreview() {
  /** 已加载完成的预览路径；异步数据回来前保持上一项，标签栏据此判断数据是否属于当前项。 */
  const path = ref('')
  /** 最近一次请求的路径，用于丢弃过期响应。 */
  const requestPath = ref('')
  const detail = ref<FileDetail | null>(null)
  const media = ref<MediaDetail | null>(null)
  const tagsOfFolder = ref<MediaTagItem[]>([])
  const remarkOfFolder = ref('')
  const loading = ref(false)
  /** 当前预览项是不是目录（决定备注取 folder_remark 还是 caption）。 */
  const directory = ref(false)

  const remark = computed(() => (directory.value ? remarkOfFolder.value : media.value?.caption ?? ''))

  async function load(entry: UiEntry): Promise<void> {
    // 先保留上一项的详情：加载期间由面板显示 loading，避免先清空再填回造成频闪。
    requestPath.value = entry.path
    loading.value = true
    try {
      if (entry.directory) {
        const [tags, mark] = await Promise.all([
          folderTags(entry.path).catch(() => []),
          folderRemark(entry.path).catch(() => ({ path: entry.path, remark: '' }))
        ])
        if (requestPath.value !== entry.path) return
        path.value = entry.path
        directory.value = true
        detail.value = null
        media.value = null
        tagsOfFolder.value = tags
        remarkOfFolder.value = mark.remark
        return
      }

      const [file, info] = await Promise.all([
        fileDetail(entry.path).catch(() => null),
        mediaDetail(entry.path).catch(() => null)
      ])
      if (requestPath.value !== entry.path) return
      path.value = entry.path
      directory.value = false
      detail.value = file
      media.value = info
    } finally {
      if (requestPath.value === entry.path) loading.value = false
    }
  }

  async function saveRemark(entry: UiEntry, value: string): Promise<void> {
    if (entry.directory) await saveFolderRemark(entry.path, value)
    else await saveMediaProperty({ path: entry.path, caption: value })
    await load(entry)
  }

  function clear(): void {
    path.value = ''
    requestPath.value = ''
    detail.value = null
    media.value = null
    tagsOfFolder.value = []
    remarkOfFolder.value = ''
    directory.value = false
    loading.value = false
  }

  return { path, detail, media, tagsOfFolder, remark, loading, load, saveRemark, clear }
}
