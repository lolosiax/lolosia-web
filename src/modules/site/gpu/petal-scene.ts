import {
  AmbientLight,
  BufferGeometry,
  Color,
  DirectionalLight,
  Float32BufferAttribute,
  Fog,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  Scene,
  Timer,
  Vector3,
  WebGLRenderer
} from 'three'
import { createTree, disposeTree } from '../scenery/tree'
import { createCharacter } from '../character/character'
import type { CharacterHandle, CharacterMode } from '../character/character'
import { useSiteSceneStore } from '../store'
import { createCameraRig } from './camera-rig'
import type { CameraMode, CameraRig, FlyMode } from './camera-rig'
import { createPetalField } from './petal-field'
import { createKoi } from './koi'
import { createWaterReflection } from './water-reflection'
import { createWaterSurface } from './water-surface'

const MAX_DPR = 2
const TILT = 0.055
const BASE_Y = 0.35
const WATER_Y = -1.9
const LOOK_Y = -0.4

const SKY = new Vector3(0.94, 0.91, 0.98)
const FOG = new Vector3(0.9, 0.86, 0.95)
const WATER_DEEP = new Vector3(0.5, 0.45, 0.66)
const WATER_PALE = new Vector3(0.82, 0.76, 0.92)

/** 反射画面只取一半出头分辨率，既省性能，也天然带一点柔化。 */
const REFLECTION_SCALE = 0.55

export interface PetalSceneHandle {
  readonly flyMode: FlyMode
  resize(width: number, height: number, dpr: number): void
  setPointer(clientX: number, clientY: number): void
  setCharacterMode(mode: CharacterMode): void
  setCameraMode(mode: CameraMode): void
  setFlyMode(mode: FlyMode): void
  dispose(): void
}

function createDust(): Points {
  const positions: number[] = []
  for (let i = 0; i < 90; i += 1) {
    positions.push((Math.random() - 0.5) * 13, Math.random() * 7 - 2.4, (Math.random() - 0.5) * 11 - 1.5)
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  const material = new PointsMaterial({
    color: 0xfff2f9,
    size: 0.045,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
    sizeAttenuation: true
  })
  const points = new Points(geometry, material)
  points.name = 'dust'
  points.frustumCulled = false
  return points
}

function createFootsteps(water: ReturnType<typeof createWaterSurface>) {
  const last = new Vector3()
  let distance = 0
  let foot = 0

  function reset(position: Vector3): void {
    last.copy(position)
  }

  function update(character: CharacterHandle): void {
    distance += character.position.distanceTo(last)
    last.copy(character.position)
    if (character.state !== 'walk' || distance <= 0.16) return
    distance = 0
    const step = character.feet[foot % 2]
    foot += 1
    if (step) water.emitRipple(step.x, step.z, 0.9)
  }

  return { reset, update }
}

/** 把锦鲤挂进场景；它入水时通过水面句柄生成涟漪。 */
function addKoiToScene(scene: Scene, water: ReturnType<typeof createWaterSurface>) {
  const koi = createKoi({ waterY: WATER_Y, emitRipple: water.emitRipple })
  scene.add(koi.root)
  return koi
}

/** 水面、花瓣、浮尘、倒影、树与灯光一次性装配好。 */
function buildEnvironment(scene: Scene) {
  const water = createWaterSurface({ deep: WATER_DEEP, pale: WATER_PALE, sky: SKY })
  water.mesh.position.y = WATER_Y
  const petals = createPetalField(new Color(FOG.x, FOG.y, FOG.z))
  const dust = createDust()
  scene.add(water.mesh, petals.mesh, dust)

  // 水面反射：用镜像相机把场景再渲染一遍到半分辨率目标，供水面着色器采样。
  const reflection = createWaterReflection({
    planeY: water.mesh.position.y,
    lookAt: new Vector3(0, LOOK_Y, 0)
  })

  const tree = createTree()
  tree.position.set(-11.8, WATER_Y, -19.5)
  tree.scale.setScalar(1.55)
  scene.add(tree)

  // 锦鲤：随机位置腾空，入水时砸出水花与多圈涟漪。
  const koi = addKoiToScene(scene, water)

  scene.add(new AmbientLight(0xffffff, 0.55))
  const key = new DirectionalLight(0xfff1f8, 1.9)
  key.position.set(-2.5, 4, 3.5)
  scene.add(key)

  return { water, petals, dust, reflection, tree, koi }
}

function loadCharacter(
  scene: Scene,
  url: string,
  isDisposed: () => boolean,
  onReady: (handle: CharacterHandle) => void
): void {
  void createCharacter(scene, url)
    .then(handle => {
      if (isDisposed()) {
        handle.dispose()
        return
      }
      onReady(handle)
    })
    .catch((err: unknown) => {
      console.warn('角色载入失败', err)
    })
}

/** 创建 WebGL 渲染器，并把像素比压在上限内。 */
function createRenderer(canvas: HTMLCanvasElement): WebGLRenderer {
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_DPR))
  renderer.setSize(window.innerWidth, window.innerHeight, false)
  renderer.setClearColor(0x000000, 0)
  return renderer
}

/** 视差相机 + 飞行相机控制器；位置从 Pinia 里恢复。 */
function createSceneCamera(
  lockTarget: HTMLElement,
  onActivityChange?: (active: boolean) => void,
  onModeChange?: (mode: CameraMode) => void
): { camera: PerspectiveCamera; rig: CameraRig } {
  const camera = new PerspectiveCamera(40, 1, 0.1, 80)
  camera.position.set(0, BASE_Y, 4.2)
  camera.lookAt(0, LOOK_Y, 0)
  camera.rotation.z += TILT

  const store = useSiteSceneStore()
  const rig = createCameraRig({
    camera,
    defaultPosition: new Vector3(0, BASE_Y, 4.2),
    defaultLookAt: new Vector3(0, LOOK_Y, 0),
    tilt: TILT,
    pose: store.cameraPose,
    lockTarget,
    onPose: pose => store.saveCameraPose(pose),
    onActivityChange,
    onModeChange
  })
  return { camera, rig }
}

interface PetalSceneOptions {
  onActivityChange?: (active: boolean) => void
  onModeChange?: (mode: CameraMode) => void
}

/** 建起「水面 + 花瓣 + 浮尘」的实时场景，返回可释放的句柄。 */
export function createPetalScene(canvas: HTMLCanvasElement, options: PetalSceneOptions = {}): PetalSceneHandle {
  const renderer = createRenderer(canvas)

  const scene = new Scene()
  scene.fog = new Fog(0xe9e0f3, 10, 40)
  const { camera, rig } = createSceneCamera(canvas, options.onActivityChange, options.onModeChange)
  let pendingCharacterMode: CharacterMode = 'auto'

  const { water, petals, dust, reflection, tree, koi } = buildEnvironment(scene)

  let character: CharacterHandle | null = null
  const footsteps = createFootsteps(water)
  const avatarUrl = import.meta.env.VITE_APP_AVATAR_URL ?? `${import.meta.env.BASE_URL}res/characters/moe/Moe.glb`
  loadCharacter(
    scene,
    avatarUrl,
    () => disposed,
    handle => {
      character = handle
      handle.setMode(pendingCharacterMode)
      footsteps.reset(handle.position)
    }
  )

  const timer = new Timer()
  timer.connect(document)

  let frameId = 0
  let disposed = false
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  function renderReflection(): void {
    const { texture, matrix } = reflection.render(renderer, scene, camera, [water.mesh, tree])
    water.setReflection(texture, matrix)
  }

  let reflectionTick = 0

  function render(): void {
    reflectionTick += 1
    // 反射画面隔帧更新：涟漪本身在扰动，肉眼看不出这一帧的延迟，但能省一半开销。
    if (reflectionTick % 2 === 1) renderReflection()
    renderer.render(scene, camera)
  }

  function frame(): void {
    timer.update()
    const delta = Math.min(timer.getDelta(), 0.05)
    const elapsed = timer.getElapsed()

    rig.update(delta)

    petals.update(elapsed, delta)
    water.update(elapsed)
    koi.update(delta, elapsed, character?.position ?? null)
    if (character) {
      character.update(delta, elapsed, WATER_Y)
      footsteps.update(character)
      water.setFocus(character.position.x, character.position.z)
    }
    render()
    frameId = window.requestAnimationFrame(frame)
  }

  function start(): void {
    if (disposed || still || frameId) return
    timer.update()
    frame()
  }

  function stop(): void {
    if (!frameId) return
    window.cancelAnimationFrame(frameId)
    frameId = 0
  }

  function onVisibility(): void {
    if (document.hidden) stop()
    else start()
  }

  function resize(width: number, height: number, dpr: number): void {
    const pixelRatio = Math.min(dpr, MAX_DPR)
    renderer.setPixelRatio(pixelRatio)
    renderer.setSize(width, height, false)
    camera.aspect = width / Math.max(height, 1)
    camera.updateProjectionMatrix()
    reflection.setSize(width * pixelRatio * REFLECTION_SCALE, height * pixelRatio * REFLECTION_SCALE)
    if (still) render()
  }

  function setPointer(clientX: number, clientY: number): void {
    rig.setPointer((clientX / window.innerWidth) * 2 - 1, -(clientY / window.innerHeight) * 2 + 1)
  }

  function setCharacterMode(mode: CharacterMode): void {
    pendingCharacterMode = mode
    character?.setMode(mode)
  }

  function dispose(): void {
    disposed = true
    stop()
    rig.dispose()
    document.removeEventListener('visibilitychange', onVisibility)
    timer.dispose()
    character?.dispose()
    character = null
    koi.dispose()
    disposeTree(tree)
    water.dispose()
    petals.dispose()
    reflection.dispose()
    dust.geometry.dispose()
    ;(dust.material as PointsMaterial).dispose()
    renderer.dispose()
  }

  document.addEventListener('visibilitychange', onVisibility)
  start()

  return {
    get flyMode() {
      return rig.flyMode
    },
    resize,
    setPointer,
    setCharacterMode,
    setCameraMode: (mode: CameraMode) => rig.setMode(mode),
    setFlyMode: (mode: FlyMode) => rig.setFlyMode(mode),
    dispose
  }
}
