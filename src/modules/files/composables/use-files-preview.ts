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
  /** 当前预览对应的路径；异步数据回来时用它认领，免得把上一项的结果画到新选中项上。 */
  const path = ref('')
  const detail = ref<FileDetail | null>(null)
  const media = ref<MediaDetail | null>(null)
  const tagsOfFolder = ref<MediaTagItem[]>([])
  const remarkOfFolder = ref('')
  const loading = ref(false)

  const remark = computed(() => {
    const entry = detail.value?.entry
    if (!entry) return ''
    return entry.directory ? remarkOfFolder.value : media.value?.caption ?? ''
  })

  async function load(entry: UiEntry): Promise<void> {
    path.value = entry.path
    detail.value = null
    media.value = null
    tagsOfFolder.value = []
    remarkOfFolder.value = ''
    loading.value = true
    try {
      if (entry.directory) {
        const [tags, mark] = await Promise.all([
          folderTags(entry.path).catch(() => []),
          folderRemark(entry.path).catch(() => ({ path: entry.path, remark: '' }))
        ])
        if (path.value !== entry.path) return
        tagsOfFolder.value = tags
        remarkOfFolder.value = mark.remark
        return
      }

      const [file, info] = await Promise.all([
        fileDetail(entry.path).catch(() => null),
        mediaDetail(entry.path).catch(() => null)
      ])
      if (path.value !== entry.path) return
      detail.value = file
      media.value = info
    } finally {
      if (path.value === entry.path) loading.value = false
    }
  }

  async function saveRemark(entry: UiEntry, value: string): Promise<void> {
    if (entry.directory) await saveFolderRemark(entry.path, value)
    else await saveMediaProperty({ path: entry.path, caption: value })
    await load(entry)
  }

  function clear(): void {
    path.value = ''
    detail.value = null
    media.value = null
    tagsOfFolder.value = []
    remarkOfFolder.value = ''
  }

  return { path, detail, media, tagsOfFolder, remark, loading, load, saveRemark, clear }
}
