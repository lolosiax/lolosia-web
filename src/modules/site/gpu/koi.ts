import {
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  ConeGeometry,
  DoubleSide,
  Group,
  LatheGeometry,
  Mesh,
  MeshBasicMaterial,
  MeshToonMaterial,
  Points,
  PointsMaterial,
  RingGeometry,
  SRGBColorSpace,
  Shape,
  ShapeGeometry,
  SphereGeometry,
  Vector2,
  Vector3
} from 'three'
import type { Material } from 'three'

/** 起跳点范围（世界米）。落在角色身后的水面上，避免鱼挡住她或钻到右侧卡片后面。 */
const SPAWN_X_MIN = -3
const SPAWN_X_MAX = 0.2
const SPAWN_Z_NEAR = -2.6
const SPAWN_Z_FAR = -4.2
const LEAP_DISTANCE_MIN = 0.9
const LEAP_DISTANCE_MAX = 2.4
const LEAP_HEIGHT_MIN = 0.85
const LEAP_HEIGHT_MAX = 1.5
const LEAP_TIME_MIN = 1.05
const LEAP_TIME_MAX = 1.6
/** 两次跃水之间的间隔（秒）。 */
const GAP_MIN = 5
const GAP_MAX = 20
const FIRST_GAP_MIN = 2.5
const FIRST_GAP_MAX = 6

const BODY_LENGTH = 0.92
const TAIL_BASE = -Math.PI / 2
const FORWARD = new Vector3(0, 0, 1)

const DROP_COUNT = 72
const GRAVITY = 8.4
const JET_TIME = 0.72
const RING_TIME = 0.85

interface DropPool {
  positions: Float32Array
  velocities: Float32Array
  lives: Float32Array
  cursor: number
}

export interface KoiOptions {
  waterY: number
  emitRipple(x: number, z: number, strength: number): void
}

export interface KoiHandle {
  readonly root: Group
  /** 锦鲤当前位置；未腾空时停在上一次入水点。角色用它当注视目标。 */
  readonly position: Vector3
  /** 是否正有鱼在空中（角色只在这段时间里关注它）。 */
  readonly leaping: boolean
  /** avoid 通常传角色位置，用来避开她脚下的水域。 */
  update(delta: number, elapsed: number, avoid?: Vector3 | null): void
  dispose(): void
}

interface PendingRipple {
  x: number
  z: number
  strength: number
  delay: number
}

function between(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/** 锦鲤身体贴图：白底 + 橙斑 + 少量墨点。 */
function createBodyTexture(): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 128
  const context = canvas.getContext('2d')
  if (!context) throw new Error('无法创建锦鲤贴图')

  context.fillStyle = '#fbf7f0'
  context.fillRect(0, 0, 256, 128)

  const patches: Array<[number, number, number, number, number]> = [
    [30, 44, 30, 20, 0.4],
    [96, 78, 26, 18, -0.3],
    [150, 38, 34, 22, 0.2],
    [212, 86, 24, 16, 0.5],
    [62, 104, 18, 12, -0.6]
  ]
  context.fillStyle = '#e4632d'
  for (const [x, y, rx, ry, angle] of patches) {
    context.beginPath()
    context.ellipse(x, y, rx, ry, angle, 0, Math.PI * 2)
    context.fill()
  }

  const spots: Array<[number, number, number]> = [
    [120, 24, 7],
    [190, 60, 5],
    [40, 74, 6]
  ]
  context.fillStyle = '#2b2430'
  for (const [x, y, radius] of spots) {
    context.beginPath()
    context.arc(x, y, radius, 0, Math.PI * 2)
    context.fill()
  }

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  return texture
}

/** 圆形水珠贴图，避免 PointsMaterial 默认的方块像素感。 */
function createDropTexture(): CanvasTexture {
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d')
  if (!context) throw new Error('无法创建水花贴图')

  const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
  gradient.addColorStop(0.55, 'rgba(248, 251, 255, 0.9)')
  gradient.addColorStop(1, 'rgba(240, 246, 255, 0)')
  context.fillStyle = gradient
  context.fillRect(0, 0, size, size)

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  return texture
}

/** 车削出纺锤形鱼身，再转到 +Z 朝向。 */
function createBodyGeometry(): LatheGeometry {
  const profile: Vector2[] = []
  const segments = 18
  for (let i = 0; i <= segments; i += 1) {
    const t = i / segments
    const radius = 0.138 * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.82)), 0.6)
    profile.push(new Vector2(Math.max(radius, 0.004), BODY_LENGTH * (t - 0.5)))
  }
  const geometry = new LatheGeometry(profile, 16)
  geometry.rotateX(Math.PI / 2)
  return geometry
}

/** 平面鱼鳍：形状在 XY 里画，再转到 YZ 平面上。 */
function createFinGeometry(): ShapeGeometry {
  const shape = new Shape()
  shape.moveTo(0, 0)
  shape.quadraticCurveTo(-0.14, 0.08, -0.34, 0.26)
  shape.quadraticCurveTo(-0.24, 0.02, -0.34, -0.22)
  shape.quadraticCurveTo(-0.14, -0.08, 0, 0)
  const geometry = new ShapeGeometry(shape, 8)
  geometry.rotateY(-Math.PI / 2)
  return geometry
}

function buildKoiModel() {
  const texture = createBodyTexture()
  const bodyMaterial = new MeshToonMaterial({ map: texture })
  const finMaterial = new MeshToonMaterial({
    color: new Color('#ea7440'),
    side: DoubleSide,
    transparent: true,
    opacity: 0.92
  })
  const eyeMaterial = new MeshBasicMaterial({ color: 0x241d29 })

  const group = new Group()
  group.name = 'koi'

  const body = new Mesh(createBodyGeometry(), bodyMaterial)
  group.add(body)

  const tail = new Mesh(createFinGeometry(), finMaterial)
  tail.position.z = -BODY_LENGTH / 2 + 0.02
  tail.rotation.y = TAIL_BASE
  tail.scale.setScalar(0.78)
  group.add(tail)

  const dorsal = new Mesh(createFinGeometry(), finMaterial)
  dorsal.position.set(0, 0.1, 0.02)
  dorsal.scale.setScalar(0.6)
  group.add(dorsal)

  const pectoralGeometry = createFinGeometry()
  const leftFin = new Mesh(pectoralGeometry, finMaterial)
  leftFin.position.set(0.08, -0.03, 0.16)
  leftFin.scale.setScalar(0.45)
  leftFin.rotation.set(0, 0.7, 1.1)
  group.add(leftFin)

  const rightFin = new Mesh(pectoralGeometry, finMaterial)
  rightFin.position.set(-0.08, -0.03, 0.16)
  rightFin.scale.setScalar(0.45)
  rightFin.rotation.set(0, -0.7, -1.1)
  group.add(rightFin)

  const eyeGeometry = new SphereGeometry(0.022, 8, 6)
  const leftEye = new Mesh(eyeGeometry, eyeMaterial)
  leftEye.position.set(0.095, 0.03, 0.33)
  const rightEye = new Mesh(eyeGeometry, eyeMaterial)
  rightEye.position.set(-0.095, 0.03, 0.33)
  group.add(leftEye, rightEye)

  return { group, tail, texture }
}

function spawnDrops(pool: DropPool, x: number, z: number, waterY: number, power: number): void {
  const count = Math.round(18 + 30 * power)
  for (let i = 0; i < count; i += 1) {
    const index = pool.cursor % DROP_COUNT
    pool.cursor += 1
    const base = index * 3
    const angle = Math.random() * Math.PI * 2
    const speed = (0.3 + Math.random() * 1.0) * power
    pool.positions[base] = x + (Math.random() - 0.5) * 0.22
    pool.positions[base + 1] = waterY + 0.03
    pool.positions[base + 2] = z + (Math.random() - 0.5) * 0.22
    pool.velocities[base] = Math.cos(angle) * speed
    pool.velocities[base + 1] = (1.3 + Math.random() * 1.9) * power
    pool.velocities[base + 2] = Math.sin(angle) * speed
    pool.lives[index] = 0.55 + Math.random() * 0.75
  }
}

function advanceDrops(pool: DropPool, delta: number, waterY: number): void {
  for (let i = 0; i < DROP_COUNT; i += 1) {
    const life = pool.lives[i] ?? 0
    if (life <= 0) continue

    const base = i * 3
    const nextLife = life - delta
    if (nextLife <= 0) {
      pool.lives[i] = 0
      pool.positions[base + 1] = -999
      continue
    }
    pool.lives[i] = nextLife

    const vx = pool.velocities[base] ?? 0
    const vy = (pool.velocities[base + 1] ?? 0) - GRAVITY * delta
    const vz = pool.velocities[base + 2] ?? 0
    const px = (pool.positions[base] ?? 0) + vx * delta
    const py = (pool.positions[base + 1] ?? 0) + vy * delta
    const pz = (pool.positions[base + 2] ?? 0) + vz * delta

    if (py < waterY - 0.08) {
      pool.lives[i] = 0
      pool.positions[base + 1] = -999
      continue
    }

    pool.velocities[base + 1] = vy
    pool.positions[base] = px
    pool.positions[base + 1] = py
    pool.positions[base + 2] = pz
  }
}

/** 入水水花：飞溅水珠 + 一根向上反弹的水柱 + 一圈扩散白环。 */
function createSplash(waterY: number) {
  const pool: DropPool = {
    positions: new Float32Array(DROP_COUNT * 3),
    velocities: new Float32Array(DROP_COUNT * 3),
    lives: new Float32Array(DROP_COUNT),
    cursor: 0
  }
  pool.positions.fill(-999)

  const geometry = new BufferGeometry()
  const attribute = new BufferAttribute(pool.positions, 3)
  geometry.setAttribute('position', attribute)

  const dropTexture = createDropTexture()
  const dropMaterial = new PointsMaterial({
    color: 0xf4f8ff,
    map: dropTexture,
    size: 0.1,
    transparent: true,
    opacity: 0.9,
    depthWrite: false
  })
  const drops = new Points(geometry, dropMaterial)
  drops.name = 'splash'
  drops.frustumCulled = false

  const jetGeometry = new ConeGeometry(0.3, 1, 14, 1, true)
  jetGeometry.translate(0, 0.5, 0)
  const jetMaterial = new MeshBasicMaterial({
    color: 0xf8fbff,
    transparent: true,
    opacity: 0,
    depthWrite: false
  })
  const jet = new Mesh(jetGeometry, jetMaterial)
  jet.visible = false

  const ringGeometry = new RingGeometry(0.12, 0.26, 30)
  ringGeometry.rotateX(-Math.PI / 2)
  const ringMaterial = new MeshBasicMaterial({
    color: 0xf6f9ff,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    side: DoubleSide
  })
  const ring = new Mesh(ringGeometry, ringMaterial)
  ring.visible = false

  const group = new Group()
  group.name = 'splash-group'
  group.add(drops, jet, ring)

  let jetAge = 1
  let jetPower = 1
  let ringAge = 1
  const impact = new Vector3()

  function burst(x: number, z: number, power: number): void {
    spawnDrops(pool, x, z, waterY, power)
    impact.set(x, waterY + 0.01, z)
    jet.position.copy(impact)
    ring.position.copy(impact)
    jetAge = 0
    jetPower = power
    ringAge = 0
  }

  function updateJet(delta: number): void {
    if (jetAge >= 1) {
      jet.visible = false
      return
    }
    jetAge = Math.min(1, jetAge + delta / JET_TIME)
    const grow = Math.sin(Math.PI * jetAge)
    const width = 0.5 + jetAge * 0.35
    jet.scale.set(width, (0.4 + 1.0 * jetPower) * grow, width)
    jetMaterial.opacity = grow * 0.34
    jet.visible = true
  }

  function updateRing(delta: number): void {
    if (ringAge >= 1) {
      ring.visible = false
      return
    }
    ringAge = Math.min(1, ringAge + delta / RING_TIME)
    const spread = 0.4 + ringAge * 3.2
    ring.scale.set(spread, 1, spread)
    ringMaterial.opacity = (1 - ringAge) * 0.4
    ring.visible = true
  }

  function update(delta: number): void {
    advanceDrops(pool, delta, waterY)
    attribute.needsUpdate = true
    updateJet(delta)
    updateRing(delta)
  }

  function dispose(): void {
    geometry.dispose()
    dropTexture.dispose()
    dropMaterial.dispose()
    jetGeometry.dispose()
    jetMaterial.dispose()
    ringGeometry.dispose()
    ringMaterial.dispose()
  }

  return { group, burst, update, dispose }
}

interface LeapPath {
  startX: number
  startZ: number
  endX: number
  endZ: number
}

/** 随机挑一条不太靠近角色的起跳 / 入水路径。 */
function pickLeapPath(avoid: Vector3 | null): LeapPath {
  let path: LeapPath = {
    startX: between(SPAWN_X_MIN, SPAWN_X_MAX),
    startZ: between(SPAWN_Z_FAR, SPAWN_Z_NEAR),
    endX: 0,
    endZ: 0
  }
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const startX = between(SPAWN_X_MIN, SPAWN_X_MAX)
    const startZ = between(SPAWN_Z_FAR, SPAWN_Z_NEAR)
    const angle = Math.random() * Math.PI * 2
    const distance = between(LEAP_DISTANCE_MIN, LEAP_DISTANCE_MAX)
    const endX = clamp(startX + Math.cos(angle) * distance, SPAWN_X_MIN - 0.2, SPAWN_X_MAX + 0.3)
    const endZ = clamp(startZ + Math.sin(angle) * distance, SPAWN_Z_FAR, SPAWN_Z_NEAR)
    path = { startX, startZ, endX, endZ }
    if (!avoid) return path
    const nearStart = Math.hypot(startX - avoid.x, startZ - avoid.z) < 1.6
    const nearEnd = Math.hypot(endX - avoid.x, endZ - avoid.z) < 1.4
    if (!nearStart && !nearEnd) return path
  }
  return path
}

/** 一条会偶尔跃出水面的锦鲤：抛物线腾空、入水水花与多圈涟漪。 */
export function createKoi(options: KoiOptions): KoiHandle {
  const model = buildKoiModel()
  const splash = createSplash(options.waterY)

  const root = new Group()
  root.name = 'koi-root'
  root.add(model.group, splash.group)
  model.group.visible = false

  const heading = new Vector3()
  const pending: PendingRipple[] = []

  let gap = between(FIRST_GAP_MIN, FIRST_GAP_MAX)
  let jumping = false
  let progress = 0
  let duration = 1
  let height = 1
  let startX = 0
  let startZ = 0
  let endX = 0
  let endZ = 0

  function beginLeap(avoid: Vector3 | null): void {
    const path = pickLeapPath(avoid)
    startX = path.startX
    startZ = path.startZ
    endX = path.endX
    endZ = path.endZ
    height = between(LEAP_HEIGHT_MIN, LEAP_HEIGHT_MAX)
    duration = between(LEAP_TIME_MIN, LEAP_TIME_MAX)
    progress = 0
    jumping = true

    model.group.visible = true
    model.group.scale.setScalar(between(0.75, 1.05))
    model.group.position.set(startX, options.waterY, startZ)
    options.emitRipple(startX, startZ, 0.75)
    splash.burst(startX, startZ, 0.4)
  }

  function finishLeap(): void {
    jumping = false
    model.group.visible = false
    const power = 0.7 + height * 0.4
    options.emitRipple(endX, endZ, 1.9)
    // 入水后再补两圈涟漪，形成「砸下去—扩散开」的层次。
    pending.push({ x: endX, z: endZ, strength: 1.35, delay: 0.16 })
    pending.push({ x: endX, z: endZ, strength: 0.85, delay: 0.34 })
    splash.burst(endX, endZ, power)
    gap = between(GAP_MIN, GAP_MAX)
  }

  function followLeap(delta: number, elapsed: number): void {
    progress = Math.min(1, progress + delta / duration)
    const x = startX + (endX - startX) * progress
    const z = startZ + (endZ - startZ) * progress
    const y = options.waterY + Math.sin(Math.PI * progress) * height
    model.group.position.set(x, y, z)

    const vertical = (Math.cos(Math.PI * progress) * Math.PI * height) / duration
    const horizontal = Math.hypot(endX - startX, endZ - startZ) / duration
    heading.set(endX - startX, vertical + horizontal * 0.15, endZ - startZ).normalize()
    model.group.quaternion.setFromUnitVectors(FORWARD, heading)
    model.group.rotateZ(Math.sin(elapsed * 15) * 0.16)
    model.tail.rotation.y = TAIL_BASE + Math.sin(elapsed * 18) * 0.4

    if (progress >= 1) finishLeap()
  }

  function releasePending(delta: number): void {
    for (let i = pending.length - 1; i >= 0; i -= 1) {
      const item = pending[i]
      if (!item) continue
      item.delay -= delta
      if (item.delay > 0) continue
      options.emitRipple(item.x, item.z, item.strength)
      pending.splice(i, 1)
    }
  }

  function update(delta: number, elapsed: number, avoid: Vector3 | null = null): void {
    splash.update(delta)
    releasePending(delta)
    if (jumping) {
      followLeap(delta, elapsed)
      return
    }
    gap -= delta
    if (gap <= 0) beginLeap(avoid)
  }

  function dispose(): void {
    const geometries = new Set<BufferGeometry>()
    const materials = new Set<Material>()
    model.group.traverse(object => {
      const mesh = object as Mesh
      if (mesh.geometry) geometries.add(mesh.geometry)
      if (Array.isArray(mesh.material)) mesh.material.forEach(item => materials.add(item))
      else if (mesh.material) materials.add(mesh.material)
    })
    geometries.forEach(geometry => geometry.dispose())
    materials.forEach(material => material.dispose())
    model.texture.dispose()
    splash.dispose()
  }

  return {
    root,
    get position() {
      return model.group.position
    },
    get leaping() {
      return jumping
    },
    update,
    dispose
  }
}
