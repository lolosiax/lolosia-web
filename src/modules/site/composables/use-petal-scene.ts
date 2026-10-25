import { onBeforeUnmount, onMounted, ref } from 'vue'
import type { Ref } from 'vue'
import { createPetalScene } from '../gpu/petal-scene'
import type { PetalSceneHandle } from '../gpu/petal-scene'
import type { CameraMode, FlyMode } from '../gpu/camera-rig'
import type { CharacterMode } from '../character/character'

export type PetalSceneStatus = 'initializing' | 'ready' | 'unsupported'

/** 把 Three.js 花瓣场景挂到 canvas 上，并跟随视口尺寸。 */
export function usePetalScene(canvas: Ref<HTMLCanvasElement | null>) {
  const status = ref<PetalSceneStatus>('initializing')
  const error = ref<string>()
  const characterMode = ref<CharacterMode>('auto')
  const cameraMode = ref<CameraMode>('default')
  const flyMode = ref<FlyMode>('mc')
  /** MC 指针已锁定 / Maya 已进入操作态（两侧面板淡出）。 */
  const active = ref(false)

  let handle: PetalSceneHandle | null = null
  let disposed = false

  function setCharacterMode(mode: CharacterMode): void {
    characterMode.value = mode
    handle?.setCharacterMode(mode)
  }

  function setCameraMode(mode: CameraMode): void {
    cameraMode.value = mode
    handle?.setCameraMode(mode)
  }

  function setFlyMode(mode: FlyMode): void {
    flyMode.value = mode
    handle?.setFlyMode(mode)
  }

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
      handle = createPetalScene(element, {
        onActivityChange: value => {
          active.value = value
        },
        onModeChange: mode => {
          cameraMode.value = mode
        }
      })
      if (disposed) {
        handle.dispose()
        handle = null
        return
      }
      flyMode.value = handle.flyMode
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
    active.value = false
  })

  return {
    status,
    error,
    characterMode,
    cameraMode,
    flyMode,
    active,
    setCharacterMode,
    setCameraMode,
    setFlyMode
  }
}
