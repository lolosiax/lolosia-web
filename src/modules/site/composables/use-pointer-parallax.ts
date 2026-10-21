import { onBeforeUnmount, onMounted, ref } from 'vue'

/** 指针相对屏幕中心的偏移（最大 `max` 像素），用于卡片视差。 */
export function usePointerParallax(max = 10) {
  const offsetX = ref(0)
  const offsetY = ref(0)

  function onMove(event: PointerEvent): void {
    offsetX.value = ((event.clientX - window.innerWidth / 2) / (window.innerWidth / 2)) * max
    offsetY.value = ((event.clientY - window.innerHeight / 2) / (window.innerHeight / 2)) * max
  }

  onMounted(() => window.addEventListener('pointermove', onMove, { passive: true }))
  onBeforeUnmount(() => window.removeEventListener('pointermove', onMove))

  return { offsetX, offsetY }
}
