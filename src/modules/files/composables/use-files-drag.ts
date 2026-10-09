import { onUnmounted, ref } from 'vue'
import { collectFiles, hasFiles } from '../drop'
import type { UiEntry } from '../types'

interface DragOptions {
  entries: () => UiEntry[]
  selection: () => Set<string>
  /** 当前目录：拖到空白处即上传到这里（不能用空串，否则子目录会上传到根）。 */
  currentPath: () => string
  onDropFiles: (files: File[], dir: string) => void
  onMoveInto: (paths: string[], dir: string) => void
}

/** 移动未超过这个像素数就仍然算点击。 */
const THRESHOLD = 4
/** 只认图标与文件名本身；格子里其余空白留给框选。 */
const DRAG_HANDLE = '.file-tile__thumb, .file-tile__name, .cell.icon, .name-text'

/**
 * 文件区的拖拽：拖住条目移进文件夹，以及从系统拖文件上传。
 *
 * 框选由 `use-files-marquee` 负责；两者只在各自的命中区域启动，互不干扰。
 */
export function useFilesDrag(options: DragOptions) {
  const dropDir = ref('')
  const dropBox = ref(false)
  const dragGhost = ref<{ x: number; y: number; label: string } | null>(null)

  let pressEntry: UiEntry | null = null
  let pressStart = { x: 0, y: 0 }
  let dragging = false
  let paths: string[] = []
  let justEnded = false

  function entryAt(element: HTMLElement): UiEntry | null {
    const path = element.closest('[data-entry-path]')?.getAttribute('data-entry-path') ?? ''
    return options.entries().find(item => item.path === path) ?? null
  }

  /** 光标下的可落点文件夹；不能把项拖进它自己或自己的子目录。 */
  function droppableDir(event: PointerEvent): string | null {
    const element = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement | null
    const tile = element?.closest('[data-drop-dir]') as HTMLElement | null
    const dir = tile?.dataset.dropDir
    if (!dir) return null
    if (paths.some(path => dir === path || dir.startsWith(`${path}/`))) return null
    return dir
  }

  function onMove(event: PointerEvent): void {
    if (!pressEntry) return
    if (!dragging) {
      if (
        Math.abs(event.clientX - pressStart.x) < THRESHOLD &&
        Math.abs(event.clientY - pressStart.y) < THRESHOLD
      ) {
        return
      }
      dragging = true
      const selected = options.selection()
      paths = selected.has(pressEntry.path) && selected.size > 1 ? [...selected] : [pressEntry.path]
    }
    dragGhost.value = {
      x: event.clientX + 12,
      y: event.clientY + 12,
      label: paths.length > 1 ? `移动 ${paths.length} 项` : `移动「${pressEntry.name}」`
    }
    dropDir.value = droppableDir(event) ?? ''
  }

  function onUp(): void {
    const dragged = dragging
    const dir = dropDir.value
    const moving = paths
    resetPress()
    if (!dragged) return
    justEnded = true
    if (dir && moving.length) options.onMoveInto(moving, dir)
  }

  function resetPress(): void {
    pressEntry = null
    dragging = false
    paths = []
    dragGhost.value = null
    dropDir.value = ''
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
  }

  function onItemPointerDown(event: PointerEvent): void {
    if (event.button !== 0) return
    justEnded = false
    const handle = (event.target as HTMLElement | null)?.closest(DRAG_HANDLE) as HTMLElement | null
    if (!handle) return
    pressEntry = entryAt(handle)
    if (!pressEntry) return
    pressStart = { x: event.clientX, y: event.clientY }
    dragging = false
    paths = []
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  /** 一次拖拽刚结束：吞掉随后补发的 click。 */
  function consumeJustEnded(): boolean {
    const value = justEnded
    justEnded = false
    return value
  }

  /* ---------- 从系统拖文件进来 ---------- */

  function dropDirAt(event: DragEvent): { dir: string; tile: boolean } {
    const tile = (event.target as HTMLElement | null)?.closest('[data-drop-dir]') as HTMLElement | null
    return { dir: tile?.dataset.dropDir ?? options.currentPath(), tile: Boolean(tile) }
  }

  function onDragOver(event: DragEvent): void {
    if (!hasFiles(event)) return
    event.preventDefault()
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy'
    const { dir, tile } = dropDirAt(event)
    dropDir.value = tile ? dir : ''
    dropBox.value = !tile
  }

  function onDragLeave(event: DragEvent): void {
    const next = event.relatedTarget as Node | null
    if (next && (event.currentTarget as HTMLElement).contains(next)) return
    resetDrop()
  }

  function onDrop(event: DragEvent): void {
    if (!hasFiles(event)) return
    event.preventDefault()
    const { dir } = dropDirAt(event)
    const files = collectFiles(event.dataTransfer)
    resetDrop()
    if (files.length) options.onDropFiles(files, dir)
  }

  function resetDrop(): void {
    dropBox.value = false
    dropDir.value = ''
  }

  onUnmounted(resetPress)

  return {
    dropDir,
    dropBox,
    dragGhost,
    onItemPointerDown,
    consumeJustEnded,
    onDragOver,
    onDragLeave,
    onDrop
  }
}
