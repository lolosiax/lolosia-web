import { useHotkey } from '@/core/composables/use-keyboard'

interface ShortcutOptions {
  /** 弹窗 / 查看器打开时返回 false。 */
  enabled: () => boolean
  copy: () => void
  cut: () => void
  paste: () => void
  selectAll: () => void
  remove: () => void
}

/** 文件管理器的全局快捷键：复制 / 剪切 / 粘贴 / 全选 / 删除。 */
export function useFilesShortcuts(options: ShortcutOptions): void {
  const enabled = options.enabled

  useHotkey('mod+c', options.copy, { enabled })
  useHotkey('mod+x', options.cut, { enabled })
  useHotkey('mod+v', options.paste, { enabled })
  useHotkey('mod+a', options.selectAll, { enabled })
  useHotkey('delete', options.remove, { enabled })
}
