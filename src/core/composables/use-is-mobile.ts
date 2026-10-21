import { onBeforeUnmount, onMounted, ref } from 'vue'

/** 与布局/页面样式里的移动端断点保持一致。 */
export const MOBILE_MAX_WIDTH = 768

/**
 * 响应式判断当前是否为移动端视口。
 *
 * 用 `matchMedia` 而不是监听 `resize`：移动端地址栏收起/展开会让 innerWidth 抖动，
 * 直接比较宽度容易在临界值附近反复切换布局。
 */
export function useIsMobile() {
  const isMobile = ref(false)

  if (typeof window === 'undefined') return isMobile

  const query = window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH}px)`)
  const update = (event?: MediaQueryListEvent) => {
    isMobile.value = event ? event.matches : query.matches
  }

  update()
  onMounted(() => query.addEventListener('change', update))
  onBeforeUnmount(() => query.removeEventListener('change', update))

  return isMobile
}
