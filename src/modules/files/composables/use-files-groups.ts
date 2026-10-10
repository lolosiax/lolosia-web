import { computed, ref, watch } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import { folderTags, isFavorite } from '../api'
import type { MediaTagItem } from '../api'
import { buildGroups } from '../lib'
import type { FileGroup, UiEntry } from '../types'

/**
 * 目录分组：日期分组与「喜欢优先」都由当前目录的 `feature:` 标签决定。
 *
 * 分组只影响摆放位置，不改排序、也不影响框选；「喜欢」判定用进目录时的快照，
 * 之后点心只换图标，不会让条目在画面上跳位。
 */
export function useFilesGroups(entries: Ref<UiEntry[]>, currentPath: ComputedRef<string>) {
  const folderTagList = ref<MediaTagItem[]>([])
  const group = ref<FileGroup>('none')
  const favSnapshot = ref<Set<string>>(new Set())

  const hasFeature = (name: string): boolean =>
    folderTagList.value.some(tag => tag.namespace === 'feature' && tag.name === name)

  const dateGroupEnabled = computed(() => hasFeature('日期分组'))
  const favFirstEnabled = computed(() => hasFeature('喜欢优先'))
  const groupEnabled = computed(() => dateGroupEnabled.value || favFirstEnabled.value)

  const autoGroup = computed<FileGroup>(() => {
    const tag = folderTagList.value.find(item => item.namespace === 'feature' && item.name.startsWith('自动分组-'))
    if (tag?.name === '自动分组-年份') return 'year'
    if (tag?.name === '自动分组-月份') return 'month'
    return 'none'
  })

  const defaultGroup = computed<FileGroup>(() => {
    if (dateGroupEnabled.value && autoGroup.value !== 'none') return autoGroup.value
    if (favFirstEnabled.value) return 'favorite'
    return 'none'
  })

  const displayGroups = computed(() => {
    if (!groupEnabled.value || group.value === 'none') return null
    return buildGroups(entries.value, group.value, entry => favSnapshot.value.has(entry.path), favFirstEnabled.value)
  })

  /** 显示顺序的扁平数组：分组时按组摊平，不分组时就是原样。 */
  const displayEntries = computed(() =>
    displayGroups.value ? displayGroups.value.flatMap(groupItem => groupItem.entries) : entries.value
  )

  async function loadFolderTags(): Promise<void> {
    try {
      folderTagList.value = await folderTags(currentPath.value)
    } catch {
      folderTagList.value = []
    }
    group.value = groupEnabled.value ? defaultGroup.value : 'none'
  }

  /** 进目录 / 重新列目录时冻结「喜欢」集合。 */
  function snapshotFavorites(): void {
    favSnapshot.value = new Set(entries.value.filter(isFavorite).map(entry => entry.path))
  }

  watch(currentPath, () => void loadFolderTags(), { immediate: true })

  return {
    group,
    folderTagList,
    dateGroupEnabled,
    favFirstEnabled,
    groupEnabled,
    displayGroups,
    displayEntries,
    loadFolderTags,
    snapshotFavorites
  }
}
