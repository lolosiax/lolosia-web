import { onUnmounted, ref } from 'vue'

export interface MarqueeBox {
  left: number
  top: number
  right: number
  bottom: number
}

interface MarqueeOptions {
  /** 文件区根元素：矩形换算与命中判定都以它为坐标系。 */
  root: () => HTMLElement | undefined
  /** 框选结束：命中的路径；`additive` 表示按住 Ctrl 并进已有选择。 */
  onMarquee: (paths: string[], additive: boolean) => void
}

/** 移动未超过这个像素数就仍然算点击。 */
const THRESHOLD = 4
const ITEM_SELECTOR = '.file-tile, .file-row'

/**
 * 文件区的框选。
 *
 * 只处理「按在空白处拖动」；按在卡片 / 行上的点击交给各自的 click。
 * 事件挂在 window 上，鼠标拖出面板再松手也能收尾。
 */
export function useFilesMarquee(options: MarqueeOptions) {
  const marquee = ref<MarqueeBox | null>(null)
  let start: { x: number; y: number } | null = null
  let additive = false
  let justEnded = false

  /** 视口坐标 → 内容坐标（减容器位置、加滚动量）。 */
  function localPoint(event: PointerEvent): { x: number; y: number } {
    const root = options.root()
    if (!root) return { x: event.clientX, y: event.clientY }
    const rect = root.getBoundingClientRect()
    return {
      x: event.clientX - rect.left + root.scrollLeft,
      y: event.clientY - rect.top + root.scrollTop
    }
  }

  /** 与矩形有重叠就算命中：缩略图很大，按中心点判定反而难选。 */
  function hitPaths(box: MarqueeBox): string[] {
    const root = options.root()
    if (!root) return []
    const rootRect = root.getBoundingClientRect()
    return Array.from(root.querySelectorAll<HTMLElement>('[data-entry-path]'))
      .filter(element => {
        const rect = element.getBoundingClientRect()
        const left = rect.left - rootRect.left + root.scrollLeft
        const top = rect.top - rootRect.top + root.scrollTop
        return left + rect.width > box.left && left < box.right && top + rect.height > box.top && top < box.bottom
      })
      .map(element => element.dataset.entryPath ?? '')
      .filter(Boolean)
  }

  function onPointerMove(event: PointerEvent): void {
    if (!start) return
    const point = localPoint(event)
    const box: MarqueeBox = {
      left: Math.min(start.x, point.x),
      top: Math.min(start.y, point.y),
      right: Math.max(start.x, point.x),
      bottom: Math.max(start.y, point.y)
    }
    if (!marquee.value && box.right - box.left < THRESHOLD && box.bottom - box.top < THRESHOLD) return
    marquee.value = box
  }

  function onPointerUp(): void {
    const box = marquee.value
    const merge = additive
    reset()
    if (!box) return
    justEnded = true
    options.onMarquee(hitPaths(box), merge)
  }

  function reset(): void {
    marquee.value = null
    start = null
    additive = false
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', onPointerUp)
  }

  function onPointerDown(event: PointerEvent): void {
    if (event.button !== 0) return
    justEnded = false
    if ((event.target as HTMLElement | null)?.closest(ITEM_SELECTOR)) return
    event.preventDefault()
    start = localPoint(event)
    additive = event.ctrlKey || event.metaKey
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
  }

  /** 拖拽收尾后浏览器还会补一次 click：读一次就清掉，避免被当成「点空白」。 */
  function consumeJustEnded(): boolean {
    const value = justEnded
    justEnded = false
    return value
  }

  onUnmounted(reset)

  return { marquee, onPointerDown, consumeJustEnded }
}
