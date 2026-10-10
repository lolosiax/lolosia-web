import { computed } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  attachFolderTags,
  attachMediaTags,
  detachFolderTags,
  detachMediaTags,
  FAVORITE_TAG,
  NO_CROP_TAG,
  regenerateThumbs
} from '../api'
import type { MediaTagRef } from '../api'
import { aggregateTags, mapLimit, tagKey } from '../lib'
import type { UiEntry } from '../types'

const CONCURRENCY = 6

/** 标签 / 喜欢 / 不裁剪：文件走媒体库，目录走 folder_tag。 */
export function useFilesTags(selection: Ref<Set<string>>, selectedEntries: ComputedRef<UiEntry[]>) {
  const groupTags = computed(() => aggregateTags(selectedEntries.value))

  function hasTag(entry: UiEntry, tag: MediaTagRef): boolean {
    return Boolean(entry.tags?.some(item => tagKey(item) === tagKey(tag)))
  }

  function writeLocal(entry: UiEntry, tags: MediaTagRef[]): void {
    entry.tags = tags
  }

  async function attach(entry: UiEntry, tag: MediaTagRef): Promise<void> {
    const body = { path: entry.path, tags: [tag] }
    if (entry.directory) await attachFolderTags(body)
    else await attachMediaTags(body)
    if (!hasTag(entry, tag)) writeLocal(entry, [...(entry.tags ?? []), tag])
  }

  async function detach(entry: UiEntry, tag: MediaTagRef): Promise<void> {
    const body = { path: entry.path, tags: [tag] }
    if (entry.directory) await detachFolderTags(body)
    else await detachMediaTags(body)
    writeLocal(entry, (entry.tags ?? []).filter(item => tagKey(item) !== tagKey(tag)))
  }

  /** 对每个选中项并发执行；单项失败只记录，不中断其它项。 */
  async function each(action: (entry: UiEntry) => Promise<void>): Promise<number> {
    let failed = 0
    const targets = selectedEntries.value
    await mapLimit(targets, CONCURRENCY, async entry => {
      try {
        await action(entry)
      } catch (error) {
        failed += 1
        const message = error instanceof Error ? error.message : '操作失败'
        ElMessage.error(`${entry.name}：${message}`)
      }
    })
    return failed
  }

  async function toggleFavorite(entry: UiEntry): Promise<void> {
    const favorite = hasTag(entry, FAVORITE_TAG)
    try {
      await (favorite ? detach(entry, FAVORITE_TAG) : attach(entry, FAVORITE_TAG))
    } catch (error) {
      ElMessage.error(error instanceof Error ? error.message : '操作失败')
    }
  }

  async function addTags(tags: MediaTagRef[]): Promise<void> {
    if (!tags.length) return
    const failed = await each(async entry => {
      for (const tag of tags) {
        if (!hasTag(entry, tag)) await attach(entry, tag)
      }
    })
    if (!failed) ElMessage.success('标签已更新')
  }

  async function removeTag(tag: MediaTagRef): Promise<void> {
    const failed = await each(async entry => {
      if (hasTag(entry, tag)) await detach(entry, tag)
    })
    if (!failed) ElMessage.success('标签已移除')
  }

  /** 批量切换「不裁剪」；变更后重算涉及的图片缩略图。 */
  async function toggleNoCrop(): Promise<void> {
    const targets = selectedEntries.value
    const enabled = targets.every(entry => hasTag(entry, NO_CROP_TAG))
    const failed = await each(async entry => {
      if (enabled) await detach(entry, NO_CROP_TAG)
      else await attach(entry, NO_CROP_TAG)
    })
    if (failed) return

    const paths = targets.filter(entry => !entry.directory).map(entry => entry.path)
    if (paths.length) {
      try {
        await regenerateThumbs(paths)
      } catch (error) {
        ElMessage.warning(error instanceof Error ? error.message : '缩略图重建失败')
      }
    }
    ElMessage.success(enabled ? '已取消不裁剪' : '已标记不裁剪')
  }

  /** 当前选中项是否都已标心（右键菜单/工具栏展示用）。 */
  const allFavorite = computed(
    () => selectedEntries.value.length > 0 && selectedEntries.value.every(entry => hasTag(entry, FAVORITE_TAG))
  )

  const allNoCrop = computed(
    () => selectedEntries.value.length > 0 && selectedEntries.value.every(entry => hasTag(entry, NO_CROP_TAG))
  )

  return {
    groupTags,
    allFavorite,
    allNoCrop,
    isFavorite: (entry: UiEntry) => hasTag(entry, FAVORITE_TAG),
    toggleFavorite,
    addTags,
    removeTag,
    toggleNoCrop,
    selectionCount: computed(() => selection.value.size)
  }
}
