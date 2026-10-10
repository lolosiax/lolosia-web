import type { ComputedRef } from 'vue'
import { confirmAction } from '@/core/composables/use-dialog'
import { parentPath } from '../lib'
import type { UiEntry } from '../types'
import type { useFilesActions } from './use-files-actions'

interface ClipboardOptions {
  menuTargets: ComputedRef<UiEntry[]>
  closeMenu: () => void
  currentPath: ComputedRef<string>
  actions: ReturnType<typeof useFilesActions>
  navigate: (path: string) => void
}

/** 右键菜单里的复制 / 剪切 / 粘贴 / 删除 / 移动到目录。 */
export function useFilesClipboard(options: ClipboardOptions) {
  function copySelection(cut: boolean): void {
    const targets = options.menuTargets.value
    options.closeMenu()
    if (!targets.length) return
    options.actions.clipboard(cut ? 'cut' : 'copy', targets.map(item => item.path))
  }

  async function pasteClipboard(): Promise<void> {
    options.closeMenu()
    await options.actions.paste(options.currentPath.value)
  }

  async function removeSelection(): Promise<void> {
    const targets = options.menuTargets.value
    options.closeMenu()
    if (!targets.length) return
    // 删掉的目录可能正是当前所在目录：先算好退路，删完再一次性导航
    const current = options.currentPath.value
    const removedDir = targets.find(
      item => item.directory && (current === item.path || current.startsWith(`${item.path}/`))
    )
    const fallback = removedDir ? parentPath(removedDir.path) : null
    const ok = await options.actions.remove(targets.map(item => item.path))
    if (ok && fallback !== null) options.navigate(fallback)
  }

  async function moveIntoDir(paths: string[], dir: string): Promise<void> {
    if (!paths.length) return
    const label = dir ? `/${dir}` : '根目录'
    if (!(await confirmAction(`要移动 ${paths.length} 项到${label}吗？`, '确认移动'))) return
    await options.actions.moveInto(paths, dir)
  }

  return { copySelection, pasteClipboard, removeSelection, moveIntoDir }
}
