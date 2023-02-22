import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useLayoutStore } from '@/core/stores/layout'

/** 窗口宽度低于该值时侧栏自动收起。 */
export const MOBILE_BREAKPOINT = 992

/** 窄屏自动收起侧栏，宽屏自动展开；只在跨过阈值时改变状态。 */
export function useResponsiveSidebar(breakpoint = MOBILE_BREAKPOINT): void {
  const layout = useLayoutStore()
  let narrow = window.innerWidth < breakpoint

  function apply(): void {
    const next = window.innerWidth < breakpoint
    if (next === narrow) return
    narrow = next
    layout.setSidebarOpened(!next)
  }

  onMounted(() => {
    layout.setSidebarOpened(!narrow)
    window.addEventListener('resize', apply)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('resize', apply)
  })
}

/** 监听元素尺寸变化（ResizeObserver），返回当前宽高。 */
export function useElementResize(target: () => HTMLElement | null) {
  const width = ref(0)
  const height = ref(0)
  let observer: ResizeObserver | null = null

  onMounted(() => {
    const element = target()
    if (!element) return
    observer = new ResizeObserver(entries => {
      const entry = entries[0]
      if (!entry) return
      width.value = entry.contentRect.width
      height.value = entry.contentRect.height
    })
    observer.observe(element)
  })

  onBeforeUnmount(() => {
    observer?.disconnect()
    observer = null
  })

  return { width, height }
}
