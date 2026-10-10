import { computed, ref, watch } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import type { MediaDetail, MediaTagItem, MediaTagRef } from '../api'
import type { GroupTag, TagRow, UiEntry } from '../types'

interface TagPanelOptions {
  selectedEntries: ComputedRef<UiEntry[]>
  selection: Ref<Set<string>>
  groupTags: ComputedRef<GroupTag[]>
  current: ComputedRef<UiEntry | null>
  selectedCount: ComputedRef<number>
  previewPath: Ref<string>
  previewFolderTags: Ref<MediaTagItem[]>
  previewMedia: Ref<MediaDetail | null>
  addTags: (tags: MediaTagRef[]) => Promise<void>
  removeTag: (tag: MediaTagRef) => Promise<void>
  refreshPreview: () => Promise<void>
}

/**
 * 右侧「标签」栏：行数据来自多选聚合或单选详情；右键菜单只做批量加 / 摘。
 *
 * 单项数据认路径（预览是异步的），主项一换、数据没回来时先当空。
 */
export function useFilesTagPanel(options: TagPanelOptions) {
  const tagMenuPos = ref<{ x: number; y: number } | null>(null)
  const tagMenuRow = ref<TagRow | null>(null)

  const tagRows = computed<TagRow[]>(() => {
    const items = options.selectedEntries.value
    if (items.length > 1) {
      const total = items.length
      return options.groupTags.value.map(tag => ({
        key: `${tag.namespace}:${tag.name}`,
        namespace: tag.namespace,
        name: tag.name,
        count: tag.count,
        title: `${tag.namespace}:${tag.name}：${tag.count}/${total} 项 · 右键管理`
      }))
    }
    const entry = items[0]
    if (!entry) return []
    const tags =
      entry.directory
        ? options.previewPath.value === entry.path
          ? options.previewFolderTags.value
          : []
        : options.previewMedia.value?.path === entry.path
          ? options.previewMedia.value.tags
          : (entry.tags ?? [])
    return tags.map(tag => {
      const negative = 'negative' in tag && Boolean(tag.negative)
      return {
        key: `${tag.namespace}:${tag.name}`,
        namespace: tag.namespace,
        name: tag.name,
        negative,
        title: negative ? '已否决：这一项明确不是该标签' : `${tag.namespace}:${tag.name}`
      }
    })
  })

  const tagHint = computed(() => {
    if (!options.selectedCount.value) return '先选中文件或文件夹，再用 ＋ 打标。'
    if (options.selectedCount.value > 1) return '这些项还没有标签，点 ＋ 批量添加。'
    return options.current.value?.directory ? '这个文件夹还没有标签，点 ＋ 添加。' : '这一项还没有标签，点 ＋ 添加。'
  })

  function openTagMenu(row: TagRow, x: number, y: number): void {
    tagMenuRow.value = row
    tagMenuPos.value = {
      x: Math.min(x, window.innerWidth - 152),
      y: Math.min(y, window.innerHeight - 92)
    }
  }

  function closeTagMenu(): void {
    tagMenuPos.value = null
    tagMenuRow.value = null
  }

  /** ＋ 号提交：把这一批标签加到当前整份选择上（文件与目录各走各的关联表）。 */
  async function addTagsToSelection(tags: MediaTagRef[]): Promise<void> {
    await options.addTags(tags)
    await options.refreshPreview()
  }

  /** 右键标签 →「应用到全部」：把这个标签加到全部已选项上。 */
  async function applyTagToAll(): Promise<void> {
    const row = tagMenuRow.value
    closeTagMenu()
    if (!row) return
    await options.addTags([{ namespace: row.namespace, name: row.name }])
    await options.refreshPreview()
  }

  /** 右键标签 →「删除该标签」：从全部已选项上摘掉（只摘关联，不删词表里的标签）。 */
  async function removeTagFromAll(): Promise<void> {
    const row = tagMenuRow.value
    closeTagMenu()
    if (!row) return
    await options.removeTag({ namespace: row.namespace, name: row.name })
    await options.refreshPreview()
  }

  // 选择一换，聚合标签的右键菜单就失去意义
  watch(options.selection, () => closeTagMenu())

  return {
    tagRows,
    tagHint,
    tagMenuPos,
    openTagMenu,
    closeTagMenu,
    addTagsToSelection,
    applyTagToAll,
    removeTagFromAll
  }
}
