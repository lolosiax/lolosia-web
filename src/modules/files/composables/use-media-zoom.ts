import { computed, ref } from 'vue'

const MIN_SCALE = 0.02
const MAX_SCALE = 20
/** 「适应屏幕」时图片最长边占画面的比例。 */
const FIT_RATIO = 0.8

/** 图片查看器的缩放与平移；舞台铺满整个浮层，放大后可以拖到屏幕边缘。 */
export function useMediaZoom(stage: () => HTMLElement | null, image: () => HTMLImageElement | null) {
  const scale = ref(1)
  const tx = ref(0)
  const ty = ref(0)
  const natural = ref({ w: 0, h: 0 })
  const ready = ref(false)

  const style = computed(() => ({
    transform: `translate(${tx.value}px, ${ty.value}px) scale(${scale.value})`
  }))
  const percent = computed(() => Math.round(scale.value * 100))

  function fitScreen(): void {
    const element = stage()
    const { w, h } = natural.value
    if (!element || !w || !h) {
      scale.value = 1
      tx.value = 0
      ty.value = 0
      return
    }
    const rect = element.getBoundingClientRect()
    scale.value = Math.min((rect.width * FIT_RATIO) / w, (rect.height * FIT_RATIO) / h)
    tx.value = 0
    ty.value = 0
  }

  /** 把平移夹在「图不整个跑出画面」的范围里。 */
  function clampPan(): void {
    const element = stage()
    if (!element) return
    const rect = element.getBoundingClientRect()
    const maxX = Math.max(0, (natural.value.w * scale.value - rect.width) / 2) + 48
    const maxY = Math.max(0, (natural.value.h * scale.value - rect.height) / 2) + 48
    tx.value = Math.min(maxX, Math.max(-maxX, tx.value))
    ty.value = Math.min(maxY, Math.max(-maxY, ty.value))
  }

  /** 以画面上某点为锚点缩放：缩放前后该点下的图像位置不动。 */
  function zoomAt(clientX: number, clientY: number, factor: number): void {
    const element = stage()
    if (!element) return
    const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale.value * factor))
    if (next === scale.value) return
    const rect = element.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const dx = (clientX - cx - tx.value) / scale.value
    const dy = (clientY - cy - ty.value) / scale.value
    tx.value = clientX - cx - dx * next
    ty.value = clientY - cy - dy * next
    scale.value = next
    clampPan()
  }

  function zoomBy(factor: number): void {
    const rect = stage()?.getBoundingClientRect()
    if (!rect) return
    zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, factor)
  }

  /** 1:1：一个图像像素对一个屏幕像素。 */
  function actualSize(): void {
    const element = image()
    if (!element || !natural.value.w) return
    const fitted = element.getBoundingClientRect().width / scale.value
    if (!fitted) return
    scale.value = natural.value.w / fitted
    tx.value = 0
    ty.value = 0
    clampPan()
  }

  function onImageLoad(): void {
    const element = image()
    if (!element) return
    natural.value = { w: element.naturalWidth, h: element.naturalHeight }
    fitScreen()
    ready.value = true
  }

  function onDragStart(event: PointerEvent, disabled: boolean): void {
    if (event.button !== 0 || disabled || !ready.value) return
    event.preventDefault()
    const startX = event.clientX
    const startY = event.clientY
    const baseX = tx.value
    const baseY = ty.value
    const onMove = (move: PointerEvent): void => {
      tx.value = baseX + (move.clientX - startX)
      ty.value = baseY + (move.clientY - startY)
      clampPan()
    }
    const onUp = (): void => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  function reset(): void {
    scale.value = 1
    tx.value = 0
    ty.value = 0
    natural.value = { w: 0, h: 0 }
    ready.value = false
  }

  return { scale, tx, ty, natural, ready, style, percent, fitScreen, zoomAt, zoomBy, actualSize, onImageLoad, onDragStart, reset }
}
