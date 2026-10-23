import { onBeforeUnmount, onMounted, ref } from 'vue'
import type { Ref } from 'vue'
import { createScene } from '../gpu/create-scene'
import { parseRgb } from '../gpu/scene'
import type { SceneBackend, SceneCard, SceneColor, SceneHandle } from '../gpu/scene'

interface UseGpuSceneOptions {
  canvas: Ref<HTMLCanvasElement | null>
  cardElements: () => HTMLElement[]
  cardColors: () => string[]
}

/** 设备像素比上限，避免 4K 屏把整屏填充率翻倍。 */
const MAX_DPR = 2

/** 把 GPU 渲染层挂到 canvas 上，并把 DOM 卡片的位置同步给着色器。 */
export function useGpuScene(options: UseGpuSceneOptions) {
  const backend = ref<SceneBackend | null>(null)
  const error = ref<string>()

  let handle: SceneHandle | null = null
  let observer: ResizeObserver | null = null
  let disposed = false

  function readCards(): SceneCard[] {
    return options.cardElements().map(element => {
      const rect = element.getBoundingClientRect()
      return { x: rect.left, y: rect.top, w: rect.width, h: rect.height }
    })
  }

  function readColors(): SceneColor[] {
    return options.cardColors().map(parseRgb)
  }

  function resize(): void {
    const canvas = options.canvas.value
    if (!canvas || !handle) return
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
    handle.resize(window.innerWidth, window.innerHeight, dpr)
    handle.setCards(readCards())
  }

  function handlePointer(event: PointerEvent): void {
    handle?.setPointer(event.clientX, event.clientY)
  }

  onMounted(async () => {
    const canvas = options.canvas.value
    if (!canvas) return

    try {
      const result = await createScene(canvas, readCards(), readColors())
      if (disposed) {
        result.handle.dispose()
        return
      }
      handle = result.handle
      backend.value = result.backend
      resize()

      observer = new ResizeObserver(() => resize())
      observer.observe(document.documentElement)
      options.cardElements().forEach(element => observer?.observe(element))
      window.addEventListener('resize', resize)
      window.addEventListener('pointermove', handlePointer, { passive: true })
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err)
    }
  })

  onBeforeUnmount(() => {
    disposed = true
    observer?.disconnect()
    observer = null
    window.removeEventListener('resize', resize)
    window.removeEventListener('pointermove', handlePointer)
    handle?.dispose()
    handle = null
  })

  return { backend, error }
}
