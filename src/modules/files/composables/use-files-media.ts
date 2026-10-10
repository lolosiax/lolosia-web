import type { ComputedRef, Ref } from 'vue'
import { ElMessage } from 'element-plus'
import { confirmAction } from '@/core/composables/use-dialog'
import {
  analyzeMediaIndex,
  attachMediaTags,
  detachMediaTags,
  isNoCrop,
  NO_CROP_TAG,
  regenerateThumbs,
  scanMediaIndex
} from '../api'
import { mapLimit } from '../lib'
import type { UiEntry } from '../types'

interface MediaOptions {
  currentPath: ComputedRef<string>
  menuEntry: Ref<UiEntry | null>
  menuTargets: ComputedRef<UiEntry[]>
  closeMenu: () => void
}

/** 索引扫描 / 外发打标 / 重算缩略图 / 批量「不裁剪」。 */
export function useFilesMedia(options: MediaOptions) {
  /** 工具栏「刷新索引」：只做本地扫描（EXIF / 规则打标），不出网。 */
  async function onIndexScan(): Promise<void> {
    try {
      const result = await scanMediaIndex(options.currentPath.value)
      ElMessage.success(result.message)
    } catch (err) {
      ElMessage.error(err instanceof Error ? err.message : '索引扫描失败')
    }
  }

  /** 工具栏「开始打标」：对当前目录递归做外发分析。 */
  async function onAnalyze(): Promise<void> {
    await runAnalyze(options.currentPath.value)
  }

  async function runAnalyze(path: string, reanalyze = false): Promise<void> {
    try {
      const result = await analyzeMediaIndex(path, true, reanalyze)
      ElMessage.success(result.message)
    } catch (err) {
      ElMessage.error(err instanceof Error ? err.message : '打标请求失败')
    }
  }

  function analyzeEntry(): void {
    const entry = options.menuEntry.value
    options.closeMenu()
    if (entry) void runAnalyze(entry.path)
  }

  async function reanalyzeEntry(): Promise<void> {
    const entry = options.menuEntry.value
    options.closeMenu()
    if (!entry) return
    const confirmed = await confirmAction(
      `将对「${entry.name}」及其子目录的全部素材重新外发打标（含已分析项），素材会交给外部大模型并产生费用。`,
      '重新打标（全部）'
    )
    if (confirmed) await runAnalyze(entry.path, true)
  }

  async function regenerateSelectedThumbs(): Promise<void> {
    const paths = options.menuTargets.value.filter(item => !item.directory).map(item => item.path)
    options.closeMenu()
    if (!paths.length) {
      ElMessage.warning('请选择图片文件')
      return
    }
    try {
      const result = await regenerateThumbs(paths)
      ElMessage.success(result.message || `已重新排队 ${paths.length} 个文件`)
    } catch (err) {
      ElMessage.error(err instanceof Error ? err.message : '重新生成缩略图失败')
    }
  }

  /** 批量切换「不裁剪」；变更后重算涉及图片的缩略图。 */
  async function toggleNoCropOnSelection(): Promise<void> {
    const files = options.menuTargets.value.filter(item => !item.directory)
    const enabled = files.length > 0 && files.every(isNoCrop)
    options.closeMenu()
    if (!files.length) {
      ElMessage.warning('「不裁剪」只对图片文件有效')
      return
    }
    let failed = 0
    await mapLimit(files, 6, async entry => {
      if (!entry.indexed) {
        failed += 1
        return
      }
      const tags = [{ ...NO_CROP_TAG }]
      try {
        if (enabled) await detachMediaTags({ path: entry.path, tags })
        else await attachMediaTags({ path: entry.path, tags })
      } catch {
        failed += 1
      }
    })
    if (failed) ElMessage.error(`${failed} 项处理失败`)
    const paths = files.filter(item => item.indexed).map(item => item.path)
    if (paths.length) await regenerateThumbs(paths).catch(() => undefined)
    if (!failed) ElMessage.success(enabled ? '已取消不裁剪' : '已标记不裁剪')
  }

  return { onIndexScan, onAnalyze, analyzeEntry, reanalyzeEntry, regenerateSelectedThumbs, toggleNoCropOnSelection }
}
