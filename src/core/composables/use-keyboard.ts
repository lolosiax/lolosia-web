import { onMounted, onUnmounted } from 'vue'

export interface HotkeyOptions {
  /** 默认 true：吃掉浏览器默认行为 */
  prevent?: boolean
  /** 默认 false：在输入框/可编辑区域里不触发 */
  inInput?: boolean
  /** 返回 false 时跳过（比如弹窗打开时不该响应） */
  enabled?: () => boolean
}

interface ParsedCombo {
  key: string
  /** Ctrl / Command 视为同一类修饰键 */
  primary: boolean
  shift: boolean
  alt: boolean
}

function parseCombo(combo: string): ParsedCombo {
  const parts = combo
    .toLowerCase()
    .split('+')
    .map(part => part.trim())
    .filter(Boolean)
  const key = parts.pop() ?? ''
  return {
    key,
    primary: parts.some(part => part === 'mod' || part === 'ctrl' || part === 'meta' || part === 'cmd'),
    shift: parts.includes('shift'),
    alt: parts.includes('alt')
  }
}

function isEditing(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null
  if (!element) return false
  return (
    element.tagName === 'INPUT' ||
    element.tagName === 'TEXTAREA' ||
    element.tagName === 'SELECT' ||
    element.isContentEditable
  )
}

/**
 * 注册全局快捷键，组件卸载时自动摘掉。
 *
 * 组合键写法：`mod+c`、`ctrl+shift+v`、`delete`、`f2`；
 * 未写进组合的修饰键必须恰好没按下，避免 `delete` 被 `Ctrl+Delete` 误触发。
 */
export function useHotkey(combo: string, handler: (event: KeyboardEvent) => void, options: HotkeyOptions = {}): void {
  const parsed = parseCombo(combo)

  function matches(event: KeyboardEvent): boolean {
    if ((event.ctrlKey || event.metaKey) !== parsed.primary) return false
    if (event.shiftKey !== parsed.shift || event.altKey !== parsed.alt) return false
    return event.key.toLowerCase() === parsed.key
  }

  function onKeydown(event: KeyboardEvent): void {
    if (!matches(event)) return
    if (!options.inInput && isEditing(event.target)) return
    if (options.enabled && !options.enabled()) return
    if (options.prevent !== false) event.preventDefault()
    handler(event)
  }

  onMounted(() => window.addEventListener('keydown', onKeydown))
  onUnmounted(() => window.removeEventListener('keydown', onKeydown))
}
