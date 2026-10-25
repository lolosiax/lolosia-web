import { onBeforeUnmount, onMounted, ref } from 'vue'

export type QuickMode = 'play' | 'mc' | 'maya'

const MODES: QuickMode[] = ['play', 'mc', 'maya']

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)
}

function isKey(code: string, digit: string): boolean {
  return code === `Digit${digit}` || code === `Numpad${digit}`
}

/**
 * Minecraft F3 + F4 风格的模式窗：
 * 按住 3 点一下 4 打开（高亮停在当前模式，不切换）；再点 4 高亮右移一格；
 * 松开 3 应用高亮项，Esc 取消。
 */
export function useModeWheel(onSelect: (mode: QuickMode) => void, getCurrent: () => QuickMode | null) {
  const open = ref(false)
  const highlight = ref(0)
  const pressed = new Set<string>()

  function indexOf(mode: QuickMode | null): number {
    const index = mode ? MODES.indexOf(mode) : -1
    return index < 0 ? 0 : index
  }

  function onKeyDown(event: KeyboardEvent): void {
    if (isEditable(event.target) || event.repeat) return

    if (event.code === 'Escape') {
      if (!open.value) return
      event.preventDefault()
      open.value = false
      return
    }

    pressed.add(event.code)

    if (!isKey(event.code, '4')) return
    if (!pressed.has('Digit3') && !pressed.has('Numpad3')) return

    event.preventDefault()
    if (!open.value) {
      open.value = true
      highlight.value = indexOf(getCurrent())
      return
    }
    highlight.value = (highlight.value + 1) % MODES.length
  }

  function onKeyUp(event: KeyboardEvent): void {
    pressed.delete(event.code)
    if (!open.value || !isKey(event.code, '3')) return
    open.value = false
    const mode = MODES[highlight.value]
    if (mode) onSelect(mode)
  }

  function onBlur(): void {
    pressed.clear()
    open.value = false
  }

  onMounted(() => {
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('keydown', onKeyDown)
    window.removeEventListener('keyup', onKeyUp)
    window.removeEventListener('blur', onBlur)
  })

  return { open, highlight }
}
