import { computed, ref } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import { isNoCrop } from '../api'
import type { UiEntry } from '../types'
import type { useFilesActions } from './use-files-actions'

interface MenuOptions {
  entries: Ref<UiEntry[]>
  currentPath: ComputedRef<string>
  selection: Ref<Set<string>>
  selectedEntries: ComputedRef<UiEntry[]>
  actions: ReturnType<typeof useFilesActions>
  onPick: (entry: UiEntry, mode: 'single' | 'toggle' | 'range') => void
}

/**
 * 条目右键菜单与命名对话框（改名 / 新建）。
 *
 * 只负责「菜单画在哪、作用于谁、名字怎么改」；复制粘贴、删除、打标等命令在
 * `use-files-clipboard` 与 `use-files-media` 里，页面按需组合。
 */
export function useFilesMenu(options: MenuOptions) {
  const menuPos = ref<{ x: number; y: number } | null>(null)
  const menuEntry = ref<UiEntry | null>(null)

  const nameOpen = ref(false)
  const nameMode = ref<'rename' | 'mkdir'>('rename')
  const nameEntry = ref<UiEntry | null>(null)
  const nameDir = ref('')
  const nameBusy = ref(false)

  /** 菜单作用于右键的那一项；目录树里的节点不在当前列表时只操作它自己。 */
  const menuTargets = computed<UiEntry[]>(() => {
    const entry = menuEntry.value
    if (entry && !options.entries.value.some(item => item.path === entry.path)) return [entry]
    return options.selectedEntries.value
  })

  const menuSingle = computed(() => menuTargets.value.length <= 1)
  const menuHasFiles = computed(() => menuTargets.value.some(item => !item.directory))
  const menuAllNoCrop = computed(() => {
    const files = menuTargets.value.filter(item => !item.directory)
    return files.length > 0 && files.every(isNoCrop)
  })

  const nameTitle = computed(() => {
    if (nameMode.value === 'mkdir') return '新建文件夹'
    return nameEntry.value?.directory ? '重命名文件夹' : '重命名文件'
  })

  const nameInitial = computed(() => (nameMode.value === 'rename' ? (nameEntry.value?.name ?? '') : '新建文件夹'))

  function menuAt(entry: UiEntry | null, x: number, y: number): void {
    menuEntry.value = entry
    menuPos.value = {
      x: Math.min(x, window.innerWidth - 152),
      y: Math.min(y, window.innerHeight - 320)
    }
  }

  function openContextMenu(entry: UiEntry, x: number, y: number): void {
    const inListing = options.entries.value.some(item => item.path === entry.path)
    if (inListing && !options.selection.value.has(entry.path)) options.onPick(entry, 'single')
    menuAt(entry, x, y)
  }

  function openBlankMenu(event: MouseEvent): void {
    menuAt(null, event.clientX, event.clientY)
  }

  function closeMenu(): void {
    menuPos.value = null
    menuEntry.value = null
  }

  function startRename(): void {
    const entry = menuEntry.value
    closeMenu()
    if (!entry) return
    nameMode.value = 'rename'
    nameEntry.value = entry
    nameOpen.value = true
  }

  function startMkdir(): void {
    closeMenu()
    nameMode.value = 'mkdir'
    nameEntry.value = null
    nameDir.value = options.currentPath.value
    nameOpen.value = true
  }

  async function submitName(value: string): Promise<void> {
    if (nameMode.value === 'rename' && value === nameEntry.value?.name) {
      nameOpen.value = false
      return
    }
    nameBusy.value = true
    try {
      const ok =
        nameMode.value === 'rename' && nameEntry.value
          ? await options.actions.rename(nameEntry.value.path, value)
          : await options.actions.mkdir(nameDir.value, value)
      if (ok) nameOpen.value = false
    } finally {
      nameBusy.value = false
    }
  }

  return {
    menuPos,
    menuEntry,
    menuTargets,
    menuSingle,
    menuHasFiles,
    menuAllNoCrop,
    nameOpen,
    nameTitle,
    nameInitial,
    nameBusy,
    openContextMenu,
    openBlankMenu,
    closeMenu,
    startRename,
    startMkdir,
    submitName
  }
}
