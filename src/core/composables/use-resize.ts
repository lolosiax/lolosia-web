import { onBeforeUnmount, onMounted, ref } from 'vue'

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
