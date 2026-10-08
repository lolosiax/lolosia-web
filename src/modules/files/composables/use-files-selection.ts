import { computed, ref } from 'vue'
import type { UiEntry } from '../types'

export type PickMode = 'single' | 'toggle' | 'range'

/** 单选 + Ctrl 多选 + Shift 区间；主选中项单独保存，供预览面板使用。 */
export function useFilesSelection(getEntries: () => UiEntry[]) {
  const selected = ref<UiEntry | null>(null)
  const selection = ref<Set<string>>(new Set())
  const anchor = ref('')
  const revealed = ref<Record<string, boolean>>({})

  const selectedEntries = computed(() => getEntries().filter(entry => selection.value.has(entry.path)))

  function setSelection(paths: string[]): void {
    selection.value = new Set(paths)
  }

  function onPick(entry: UiEntry, mode: PickMode): void {
    const list = getEntries()

    if (mode === 'range' && anchor.value) {
      const from = list.findIndex(item => item.path === anchor.value)
      const to = list.findIndex(item => item.path === entry.path)
      if (from >= 0 && to >= 0) {
        const [start, end] = from < to ? [from, to] : [to, from]
        setSelection(list.slice(start, end + 1).map(item => item.path))
        selected.value = entry
        return
      }
    }

    if (mode === 'toggle') {
      const next = new Set(selection.value)
      if (next.has(entry.path)) next.delete(entry.path)
      else next.add(entry.path)
      selection.value = next
      selected.value = next.has(entry.path) ? entry : null
      anchor.value = entry.path
      return
    }

    setSelection([entry.path])
    selected.value = entry
    anchor.value = entry.path
    if (entry.image) reveal(entry.path)
  }

  function selectAll(): void {
    setSelection(getEntries().filter(entry => entry.path).map(entry => entry.path))
  }

  /** 框选收尾：整份替换，或按住 Ctrl 并进已有选择；主项落到最后命中的那一项。 */
  function applyMarquee(paths: string[], additive: boolean): void {
    const list = getEntries()
    const next = additive ? Array.from(new Set([...selection.value, ...paths])) : paths
    setSelection(next)
    const last = list.find(item => item.path === paths[paths.length - 1])
    if (last) {
      selected.value = last
      anchor.value = last.path
      return
    }
    if (!additive) selected.value = null
  }

  function clear(): void {
    setSelection([])
    selected.value = null
    anchor.value = ''
  }

  function reveal(path: string): void {
    revealed.value = { ...revealed.value, [path]: true }
  }

  function isRevealed(path: string): boolean {
    return Boolean(revealed.value[path])
  }

  return {
    selected,
    selection,
    selectedEntries,
    revealed,
    onPick,
    selectAll,
    applyMarquee,
    clear,
    reveal,
    isRevealed
  }
}
