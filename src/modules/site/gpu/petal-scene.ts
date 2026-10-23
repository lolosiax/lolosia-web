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
  Vector2,
  Vector3,
  WebGLRenderer
} from 'three'
import { createTree, disposeTree } from '../scenery/tree'
import { createCharacter } from '../character/character'
import type { CharacterHandle } from '../character/character'
import { createPetalField } from './petal-field'
import { createWaterSurface } from './water-surface'

const MAX_DPR = 2
const TILT = 0.055
const BASE_Y = 0.35
const WATER_Y = -1.9

const SKY = new Vector3(0.94, 0.91, 0.98)
const FOG = new Vector3(0.9, 0.86, 0.95)
const WATER_DEEP = new Vector3(0.5, 0.45, 0.66)
const WATER_PALE = new Vector3(0.82, 0.76, 0.92)

export interface PetalSceneHandle {
  resize(width: number, height: number, dpr: number): void
  setPointer(clientX: number, clientY: number): void
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

/** 建起「水面 + 花瓣 + 浮尘」的实时场景，返回可释放的句柄。 */
export function createPetalScene(canvas: HTMLCanvasElement): PetalSceneHandle {
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_DPR))
  renderer.setSize(window.innerWidth, window.innerHeight, false)
  renderer.setClearColor(0x000000, 0)

  const scene = new Scene()
  scene.fog = new Fog(0xe9e0f3, 10, 40)
  const camera = new PerspectiveCamera(40, 1, 0.1, 80)
  camera.position.set(0, BASE_Y, 4.2)
  camera.lookAt(0, -0.4, 0)
  camera.rotation.z += TILT

  const water = createWaterSurface({ deep: WATER_DEEP, pale: WATER_PALE, sky: SKY })
  const petals = createPetalField(new Color(FOG.x, FOG.y, FOG.z))
  const dust = createDust()
  scene.add(water.mesh, petals.mesh, dust)

  const tree = createTree()
  tree.position.set(-11.8, WATER_Y, -19.5)
  tree.scale.setScalar(1.55)
  scene.add(tree)

  scene.add(new AmbientLight(0xffffff, 0.55))
  const key = new DirectionalLight(0xfff1f8, 1.9)
  key.position.set(-2.5, 4, 3.5)
  scene.add(key)

  let character: CharacterHandle | null = null
  const avatarUrl = import.meta.env.VITE_APP_AVATAR_URL ?? `${import.meta.env.BASE_URL}res/characters/moe/Moe.glb`
  void createCharacter(scene, avatarUrl)
    .then(handle => {
      if (disposed) {
        handle.dispose()
        return
      }
      character = handle
      lastPosition.copy(handle.position)
    })
    .catch(err => {
      console.warn('角色载入失败', err)
    })

  const timer = new Timer()
  timer.connect(document)
  const pointer = new Vector2()
  const target = { x: 0, y: BASE_Y }
  const lastPosition = new Vector3()
  let stepDistance = 0
  let stepFoot = 0

  let frameId = 0
  let disposed = false
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  function render(): void {
    renderer.render(scene, camera)
  }

  function frame(): void {
    timer.update()
    const delta = Math.min(timer.getDelta(), 0.05)
    const elapsed = timer.getElapsed()

    camera.position.x += (target.x - camera.position.x) * 0.05
    camera.position.y += (target.y - camera.position.y) * 0.05
    camera.lookAt(0, -0.4, 0)
    camera.rotation.z += TILT

    petals.update(elapsed, delta)
    water.update(elapsed)
    if (character) {
      character.update(delta, elapsed, WATER_Y)
      stepDistance += character.position.distanceTo(lastPosition)
      lastPosition.copy(character.position)
      if (character.state === 'walk' && stepDistance > 0.16) {
        stepDistance = 0
        const foot = character.feet[stepFoot % 2]
        stepFoot += 1
        if (foot) water.emitRipple(foot.x, foot.z, 0.9)
      }
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
    renderer.setPixelRatio(Math.min(dpr, MAX_DPR))
    renderer.setSize(width, height, false)
    camera.aspect = width / Math.max(height, 1)
    camera.updateProjectionMatrix()
    if (still) render()
  }

  function setPointer(clientX: number, clientY: number): void {
    pointer.set((clientX / window.innerWidth) * 2 - 1, -(clientY / window.innerHeight) * 2 + 1)
    target.x = pointer.x * 0.22
    target.y = BASE_Y + pointer.y * 0.16
  }

  function dispose(): void {
    disposed = true
    stop()
    document.removeEventListener('visibilitychange', onVisibility)
    timer.dispose()
    character?.dispose()
    character = null
    disposeTree(tree)
    water.dispose()
    petals.dispose()
    dust.geometry.dispose()
    ;(dust.material as PointsMaterial).dispose()
    renderer.dispose()
  }

  document.addEventListener('visibilitychange', onVisibility)
  start()

  return { resize, setPointer, dispose }
}
