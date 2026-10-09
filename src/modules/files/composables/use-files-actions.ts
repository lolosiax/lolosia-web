import { ElMessage } from 'element-plus'
import {
  copyEntries,
  deleteEntry,
  mkdirFolder,
  moveEntries,
  renameEntry
} from '../api'
import { confirmAction } from '@/core/composables/use-dialog'
import { useFilesStore } from '../store'
import type { ClipboardMode } from '../store'
import { parentPath } from '../lib'

interface ActionOptions {
  /** 目录内容变更后：刷新列表 + 让目录树失效。 */
  changed: (dirs: string[]) => void
  /** 改名影响当前浏览路径时回调（页面负责导航）。 */
  renamed?: (from: string, to: string) => void
}

/** 文件操作：重命名 / 新建 / 删除 / 复制剪切粘贴 / 移动。 */
export function useFilesActions(options: ActionOptions) {
  const store = useFilesStore()

  async function rename(path: string, name: string): Promise<boolean> {
    if (!name.trim()) return false
    try {
      const result = await renameEntry(path, name.trim())
      options.changed([parentPath(path), result.path])
      options.renamed?.(path, result.path)
      ElMessage.success('已重命名')
      return true
    } catch (error) {
      ElMessage.error(error instanceof Error ? error.message : '重命名失败')
      return false
    }
  }

  async function mkdir(dir: string, name: string): Promise<boolean> {
    if (!name.trim()) return false
    try {
      const result = await mkdirFolder(dir, name.trim())
      options.changed([dir, result.path])
      ElMessage.success('文件夹已创建')
      return true
    } catch (error) {
      ElMessage.error(error instanceof Error ? error.message : '创建失败')
      return false
    }
  }

  async function remove(paths: string[]): Promise<boolean> {
    if (!paths.length) return false
    const label = paths.length === 1 ? paths[0]!.split('/').pop() ?? paths[0] : `${paths.length} 项`
    if (!(await confirmAction(`确定删除「${label}」吗？目录会连同子内容一起删除，且没有回收站。`, '删除'))) {
      return false
    }

    let failed = 0
    for (const path of paths) {
      try {
        await deleteEntry(path)
      } catch (error) {
        failed += 1
        ElMessage.error(error instanceof Error ? error.message : `删除 ${path} 失败`)
      }
    }
    options.changed(paths.map(parentPath))
    if (!failed) ElMessage.success('已删除')
    return failed === 0
  }

  function clipboard(mode: ClipboardMode, paths: string[]): void {
    store.setClipboard(mode, paths)
    ElMessage.success(mode === 'copy' ? '已复制到剪贴板' : '已剪切到剪贴板')
  }

  async function paste(dest: string): Promise<boolean> {
    const clip = store.clipboard
    if (!clip) {
      ElMessage.warning('剪贴板是空的')
      return false
    }

    try {
      const result =
        clip.mode === 'copy'
          ? await copyEntries(clip.paths, dest)
          : await moveEntries(clip.paths, dest)
      if (result.failed.length) ElMessage.warning(`部分失败：${result.failed.join('；')}`)
      if (clip.mode === 'cut') store.clearClipboard()
      options.changed([dest, ...clip.paths.map(parentPath)])
      if (!result.failed.length) ElMessage.success(clip.mode === 'copy' ? '已粘贴' : '已移动')
      return result.failed.length === 0
    } catch (error) {
      ElMessage.error(error instanceof Error ? error.message : '粘贴失败')
      return false
    }
  }

  async function moveInto(paths: string[], dest: string): Promise<boolean> {
    const targets = paths.filter(path => path !== dest && !dest.startsWith(`${path}/`))
    if (!targets.length) return false
    try {
      const result = await moveEntries(targets, dest)
      if (result.failed.length) ElMessage.warning(`部分失败：${result.failed.join('；')}`)
      options.changed([dest, ...targets.map(parentPath)])
      return result.failed.length === 0
    } catch (error) {
      ElMessage.error(error instanceof Error ? error.message : '移动失败')
      return false
    }
  }

  return { rename, mkdir, remove, clipboard, paste, moveInto }
}
