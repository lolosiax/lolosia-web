import { onBeforeUnmount, onMounted, ref } from 'vue'
import type { Ref } from 'vue'
import { createPetalScene } from '../gpu/petal-scene'
import type { PetalSceneHandle } from '../gpu/petal-scene'

export type PetalSceneStatus = 'initializing' | 'ready' | 'unsupported'

/** 把 Three.js 花瓣场景挂到 canvas 上，并跟随视口尺寸。 */
export function usePetalScene(canvas: Ref<HTMLCanvasElement | null>) {
  const status = ref<PetalSceneStatus>('initializing')
  const error = ref<string>()

  let handle: PetalSceneHandle | null = null
  let disposed = false

  function resize(): void {
    handle?.resize(window.innerWidth, window.innerHeight, window.devicePixelRatio || 1)
  }

  function onPointer(event: PointerEvent): void {
    handle?.setPointer(event.clientX, event.clientY)
  }

  onMounted(() => {
    const element = canvas.value
    if (!element) return

    try {
      handle = createPetalScene(element)
      if (disposed) {
        handle.dispose()
        handle = null
        return
      }
      status.value = 'ready'
      resize()
      window.addEventListener('resize', resize)
      window.addEventListener('pointermove', onPointer, { passive: true })
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err)
      status.value = 'unsupported'
    }
  })

  onBeforeUnmount(() => {
    disposed = true
    window.removeEventListener('resize', resize)
    window.removeEventListener('pointermove', onPointer)
    handle?.dispose()
    handle = null
  })

  return { status, error }
}
