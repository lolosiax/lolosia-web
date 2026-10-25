import {
  Box3,
  Color,
  DataTexture,
  Group,
  Mesh,
  MeshStandardMaterial,
  MeshToonMaterial,
  NearestFilter,
  Object3D,
  Quaternion,
  RedFormat,
  Scene,
  Vector3
} from 'three'
import type { Material } from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { createHairPhysics } from './hair-physics'
import type { HairPhysics } from './hair-physics'
import { createClipPlayer, loadClip, type ClipPlayer } from './clip-animation'
import { AFK_CLIP_URL, applyGaitClip, blendGaitWeight, createWalkControl, type GaitPlayer } from './gait-clips'
import { bendElbowsInward } from './idle-pose'
import { createAttention, type Attention, type AttentionBones } from './attention'
import { buildIkLeg, solveFoot, LEG_CYCLE_SECONDS, WALK_SPEED, type FootPlan, type IkLeg } from './leg-ik'
import { createTurnPivot, type TurnPivot } from './turn-in-place'
import { useSiteSceneStore } from '../store'
import type { CharacterPose } from '../store'

const TARGET_HEIGHT = 1.15
const IDLE_MIN = 1.2
const IDLE_MAX = 3.6
const BOUNDS = { xMin: -2, xMax: 1.2, zNear: -0.6, zFar: -2 }
const ARM_DROP = 1.05
/** 大臂在垂下的基础上再向身体中线收 8°。 */
const ARM_INWARD = (8 * Math.PI) / 180
const FINGER_CURL = 0.2
const FINGER_PARTS = ['Index', 'Middle', 'Ring', 'Little', 'Thumb'] as const
const FINGER_JOINTS = ['Proximal', 'Intermediate', 'Distal'] as const
const FINGER_SIDES = ['L', 'R'] as const
const FINGER_AXIS = new Vector3(0, 0, 1)
const FINGER_AXIS_LEFT = new Vector3(0, 0, -1)
const Y_AXIS = new Vector3(0, 1, 0)
/** 每次选目标点时抽多少个候选：按「与当前朝向的夹角」加权，钝角比锐角更容易被选中。 */
const TARGET_SAMPLES = 12
/** 太近的目标点没有意义，直接跳过。 */
const MIN_TARGET_DISTANCE = 0.4
/** 落点写回 Pinia 的间隔（秒）。每帧写会在 localStorage 上打出大量小写入。 */
const POSE_SAVE_INTERVAL = 1.5

export type CharacterState = 'idle' | 'walk'
/** auto：自动漫步时随机选一个移动剪辑，剪辑缺失时退回程序化步态；clip：原地循环播放烘焙行走剪辑。 */
export type CharacterMode = 'auto' | 'clip'

export interface CharacterHandle {
  readonly state: CharacterState
  readonly mode: CharacterMode
  readonly position: Vector3
  readonly feet: Vector3[]
  setMode(mode: CharacterMode): void
  /** focus 为突发事件（鱼腾空）的目标点；为 null 时不关注任何东西。 */
  update(delta: number, elapsed: number, waterY: number, focus?: Vector3 | null): void
  dispose(): void
}

interface AnimatedBone {
  node: Object3D
  rest: Quaternion
  bendAxis: Vector3
  dropAxis: Vector3 | null
  dropAngle: number
}

type Rig = Record<
  | 'leftLeg'
  | 'rightLeg'
  | 'leftKnee'
  | 'rightKnee'
  | 'leftArm'
  | 'rightArm'
  | 'leftElbow'
  | 'rightElbow'
  | 'spine'
  | 'neck'
  | 'head',
  AnimatedBone | null
> & { fingers: AnimatedBone[] }

function between(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function insideBounds(x: number, z: number): boolean {
  return x >= BOUNDS.xMin && x <= BOUNDS.xMax && z >= BOUNDS.zFar && z <= BOUNDS.zNear
}

/** 两个朝向之间的最小夹角（0..π）。 */
function angleGap(from: number, to: number): number {
  let diff = to - from
  while (diff > Math.PI) diff -= Math.PI * 2
  while (diff < -Math.PI) diff += Math.PI * 2
  return Math.abs(diff)
}

/** 把角度收敛到 (-π, π]。 */
function wrapAngle(angle: number): number {
  let value = angle
  while (value > Math.PI) value -= Math.PI * 2
  while (value < -Math.PI) value += Math.PI * 2
  return value
}

/**
 * 抽若干候选点，按「朝当前方向的直行程度」加权：钝角（接近直行）权重高、锐角（急折）权重低。
 * 返回选中点与直线距离，距离用来决定这次是否允许跑步。
 */
function chooseTarget(position: Vector3, yaw: number): { x: number; z: number; distance: number } {
  let bestX = position.x
  let bestZ = position.z
  let bestDistance = 0
  let bestScore = -1

  for (let i = 0; i < TARGET_SAMPLES; i++) {
    const x = between(BOUNDS.xMin, BOUNDS.xMax)
    const z = between(BOUNDS.zFar, BOUNDS.zNear)
    const distance = Math.hypot(x - position.x, z - position.z)
    if (distance < MIN_TARGET_DISTANCE) continue
    const turn = angleGap(yaw, Math.atan2(x - position.x, z - position.z))
    const straightness = 1 - turn / Math.PI
    const score = (0.08 + straightness * straightness) * Math.random()
    if (score <= bestScore) continue
    bestScore = score
    bestX = x
    bestZ = z
    bestDistance = distance
  }

  return { x: bestX, z: bestZ, distance: bestDistance }
}

function findBone(root: Group, name: string): Object3D | null {
  const wanted = name.replace(/[\s_.-]/g, '').toLowerCase()
  let found: Object3D | null = null
  root.traverse(object => {
    if (!found && object.name.replace(/[\s_.-]/g, '').toLowerCase() === wanted) found = object
  })
  return found
}

function buildBone(root: Group, name: string, dropAngle = 0, bendWorld = new Vector3(1, 0, 0)): AnimatedBone | null {
  const node = findBone(root, name)
  if (!node) return null

  const rest = node.quaternion.clone()
  const world = node.getWorldQuaternion(new Quaternion())
  const dropAxis = dropAngle ? new Vector3(0, 0, 1).applyQuaternion(world.clone().invert()).normalize() : null
  const posed = dropAxis ? world.clone().multiply(new Quaternion().setFromAxisAngle(dropAxis, dropAngle)) : world
  const bendAxis = bendWorld.clone().applyQuaternion(posed.clone().invert()).normalize()

  return { node, rest, bendAxis, dropAxis, dropAngle }
}

function buildRig(root: Group): Rig {
  root.updateMatrixWorld(true)
  const fingers = FINGER_SIDES.flatMap(side =>
    FINGER_PARTS.flatMap(part =>
      FINGER_JOINTS.map(joint =>
        buildBone(root, `${part}_${joint}_${side}`, 0, side === 'L' ? FINGER_AXIS_LEFT : FINGER_AXIS)
      )
    )
  ).filter((bone): bone is AnimatedBone => bone !== null)
  return {
    leftLeg: buildBone(root, 'Left leg'),
    rightLeg: buildBone(root, 'Right leg'),
    leftKnee: buildBone(root, 'Left knee'),
    rightKnee: buildBone(root, 'Right knee'),
    leftArm: buildBone(root, 'Left arm', -ARM_DROP - ARM_INWARD),
    rightArm: buildBone(root, 'Right arm', ARM_DROP + ARM_INWARD),
    leftElbow: buildBone(root, 'Left elbow'),
    rightElbow: buildBone(root, 'Right elbow'),
    spine: buildBone(root, 'Spine'),
    neck: buildBone(root, 'Neck'),
    head: buildBone(root, 'Head'),
    fingers
  }
}

const tempQuat = new Quaternion()

/** 程序化姿态每帧覆写的骨骼：剪辑淡化时从当前姿态插值，不能从 bind 出发（会张开成 A-pose）。 */
function proceduralBones(rig: Rig): Set<Object3D> {
  const bones = [rig.leftLeg, rig.rightLeg, rig.leftKnee, rig.rightKnee, rig.leftArm, rig.rightArm]
  bones.push(rig.leftElbow, rig.rightElbow, rig.spine)
  const nodes = bones.filter((bone): bone is AnimatedBone => bone !== null).map(bone => bone.node)
  return new Set([...nodes, ...rig.fingers.map(finger => finger.node)])
}

function buildLegRig(root: Group, rig: Rig): { left: IkLeg | null; right: IkLeg | null } {
  const left = buildIkLeg(
    findBone(root, 'Left leg'),
    findBone(root, 'Left knee'),
    findBone(root, 'Left ankle'),
    rig.leftKnee?.bendAxis
  )
  const right = buildIkLeg(
    findBone(root, 'Right leg'),
    findBone(root, 'Right knee'),
    findBone(root, 'Right ankle'),
    rig.rightKnee?.bendAxis
  )
  return { left, right }
}

/** 五阶色调阶梯，让漫射光呈现赛璐璐式的硬边分层。 */
let rampTexture: DataTexture | null = null

function getRamp(): DataTexture {
  if (rampTexture) return rampTexture
  const steps = new Uint8Array([70, 120, 175, 225, 255])
  const texture = new DataTexture(steps, steps.length, 1, RedFormat)
  texture.minFilter = NearestFilter
  texture.magFilter = NearestFilter
  texture.generateMipmaps = false
  texture.needsUpdate = true
  rampTexture = texture
  return texture
}

const RIM_ANCHOR =
  'vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;'

/** 把 GLTF 的 PBR 材质换成 Toon 材质，并叠一层边缘光。 */
function toToonMaterial(source: Material, ramp: DataTexture): MeshToonMaterial {
  const pbr = source as MeshStandardMaterial
  const material = new MeshToonMaterial({
    color: pbr.color ? pbr.color.clone() : new Color(0xffffff),
    map: pbr.map ?? null,
    normalMap: pbr.normalMap ?? null,
    normalScale: pbr.normalScale?.clone(),
    alphaMap: pbr.alphaMap ?? null,
    alphaTest: pbr.alphaTest,
    transparent: pbr.transparent,
    opacity: pbr.opacity,
    side: pbr.side,
    depthWrite: pbr.depthWrite,
    vertexColors: pbr.vertexColors,
    gradientMap: ramp
  })
  material.name = source.name
  material.onBeforeCompile = shader => {
    shader.fragmentShader = shader.fragmentShader.replace(
      RIM_ANCHOR,
      `${RIM_ANCHOR}
       float rim = pow(1.0 - clamp(dot(normalize(normal), normalize(vViewPosition)), 0.0, 1.0), 2.6);
       outgoingLight += vec3(1.0, 0.85, 0.94) * rim * 0.22;`
    )
  }
  material.customProgramCacheKey = () => 'toon-rim'
  return material
}

function applyToonShader(model: Object3D): void {
  const ramp = getRamp()
  const previous = new Set<Material>()
  model.traverse(object => {
    if (!(object instanceof Mesh)) return
    const source = object.material
    if (Array.isArray(source)) {
      source.forEach(material => previous.add(material))
      object.material = source.map(material => toToonMaterial(material, ramp))
    } else {
      previous.add(source)
      object.material = toToonMaterial(source, ramp)
    }
  })
  previous.forEach(material => material.dispose())
}

function pose(bone: AnimatedBone | null, angle: number): void {
  if (!bone) return
  bone.node.quaternion.copy(bone.rest)
  if (bone.dropAxis) bone.node.quaternion.multiply(tempQuat.setFromAxisAngle(bone.dropAxis, bone.dropAngle))
  bone.node.quaternion.multiply(tempQuat.setFromAxisAngle(bone.bendAxis, angle))
}

/** 载入 GLB，缩放到目标身高并把脚底对齐到 root 原点。 */
async function loadModel(url: string): Promise<Group> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`角色模型加载失败：${response.status}`)
  const gltf = await new GLTFLoader().parseAsync(await response.arrayBuffer(), '')

  const model = gltf.scene
  const box = new Box3().setFromObject(model)
  model.scale.setScalar(TARGET_HEIGHT / Math.max(box.max.y - box.min.y, 0.001))
  // 把最低点对齐到 root 原点，避免鞋底离水面浮空。
  const scaledBox = new Box3().setFromObject(model)
  model.position.y -= scaledBox.min.y
  applyToonShader(model)

  const root = new Group()
  root.name = 'moe'
  root.add(model)
  return root
}

/** 诊断模式：`?afk=1` 时角色站立并播放烘焙好的 AFK 动画，同时暴露骨骼供采样对比。 */
async function setupAfkMode(
  root: Object3D,
  getState: () => CharacterState
): Promise<{ afk: boolean; player: ClipPlayer | null }> {
  const afk = new URLSearchParams(location.search).has('afk')
  if (!afk) {
    ;(window as unknown as { __moe?: unknown }).__moe = { root, state: getState }
    return { afk, player: null }
  }
  const clip = await loadClip(AFK_CLIP_URL)
  const player = clip ? createClipPlayer(root, clip) : null
  // 诊断：把播放器一并暴露，采样时可读到精确的剪辑时间。
  ;(window as unknown as { __moe?: unknown }).__moe = { root, state: getState, player }
  return { afk, player }
}

/** 刷新后从上次离开的位置继续，而不是每次回到出生点。 */
function initialPose(store: ReturnType<typeof useSiteSceneStore>): { position: Vector3; yaw: number } {
  const saved = store.characterPose
  const resume = saved && insideBounds(saved.x, saved.z) ? saved : null
  const position = resume
    ? new Vector3(resume.x, 0, resume.z)
    : new Vector3(between(-1.2, 0.4), 0, between(BOUNDS.zFar + 0.4, BOUNDS.zNear - 0.3))
  return { position, yaw: resume ? resume.yaw : 0 }
}

interface CharacterCore {
  root: Group
  rig: Rig
  leftFoot: Object3D | null
  rightFoot: Object3D | null
  leftFootPos: Vector3
  rightFootPos: Vector3
  ikLeft: IkLeg | null
  ikRight: IkLeg | null
  hair: HairPhysics | null
  store: ReturnType<typeof useSiteSceneStore>
  initial: { position: Vector3; yaw: number }
}

/** 载入模型，并一次性准备好绑定、脚踝与头发物理。 */
async function prepareCharacter(scene: Scene, url: string): Promise<CharacterCore> {
  const root = await loadModel(url)
  scene.add(root)
  const rig = buildRig(root)
  const { left: ikLeft, right: ikRight } = buildLegRig(root, rig)
  const store = useSiteSceneStore()
  return {
    root,
    rig,
    leftFoot: findBone(root, 'Left ankle'),
    rightFoot: findBone(root, 'Right ankle'),
    leftFootPos: new Vector3(),
    rightFootPos: new Vector3(),
    ikLeft,
    ikRight,
    hair: createHairPhysics(root),
    store,
    initial: initialPose(store)
  }
}

interface Persistence {
  tick(delta: number): void
  save(): void
}

/** 把角色落点按固定间隔写回 Pinia，避免每帧都碰 localStorage。 */
function createPersistence(store: ReturnType<typeof useSiteSceneStore>, readPose: () => CharacterPose): Persistence {
  let timer = 0

  function save(): void {
    store.saveCharacterPose(readPose())
  }

  function tick(delta: number): void {
    timer += delta
    if (timer < POSE_SAVE_INTERVAL) return
    timer = 0
    save()
  }

  return { tick, save }
}

interface MotionPhase {
  gait: number
  phase: number
}

/** 程序化步态：手臂与脊椎始终驱动，缺 IK 时退回纯 FK 腿部摆动。 */
function animateCharacter(
  rig: Rig,
  state: CharacterState,
  motion: MotionPhase,
  delta: number,
  elapsed: number,
  hasIk: boolean
): void {
  motion.gait += ((state === 'walk' ? 1 : 0) - motion.gait) * Math.min(1, delta * 6)
  motion.phase += (delta * Math.PI * 2) / LEG_CYCLE_SECONDS

  const swing = Math.sin(motion.phase) * 0.32 * motion.gait
  pose(rig.leftArm, -swing)
  pose(rig.rightArm, swing)
  pose(rig.leftElbow, Math.max(0, swing) * 0.25)
  pose(rig.rightElbow, Math.max(0, -swing) * 0.25)
  for (const finger of rig.fingers) pose(finger, FINGER_CURL)
  pose(rig.spine, Math.sin(elapsed * 1.5) * 0.015 + Math.sin(motion.phase * 2) * 0.025 * motion.gait)

  if (hasIk) return

  const legSwing = Math.sin(motion.phase) * 0.55 * motion.gait
  pose(rig.leftLeg, legSwing)
  pose(rig.rightLeg, -legSwing)
  pose(rig.leftKnee, Math.max(0, Math.sin(motion.phase - 1.1)) * 0.85 * motion.gait)
  pose(rig.rightKnee, Math.max(0, Math.sin(motion.phase - 1.1 + Math.PI)) * 0.85 * motion.gait)
}

/**
 * 每帧姿态装配的运行状态。集中成一个对象，update 才不会因为十几个局部变量而失控；
 * 其中 gait / gaitWeight 由 poseLocomotion 原地更新，其余每帧同步。
 */
interface LocomotionFrame {
  root: Group
  rig: Rig
  attention: Attention
  attentionBones: AttentionBones
  pivot: TurnPivot
  motion: MotionPhase
  footPlan: FootPlan
  ikLeft: IkLeg | null
  ikRight: IkLeg | null
  hair: HairPhysics | null
  clipPlayer: ClipPlayer | null
  afk: boolean
  state: CharacterState
  yaw: number
  yawStart: number
  waterY: number
  delta: number
  elapsed: number
  walking: boolean
  gait: GaitPlayer | null
  gaitWeight: number
}

function createLocomotionFrame(
  core: CharacterCore,
  motion: MotionPhase,
  footPlan: FootPlan,
  clipPlayer: ClipPlayer | null,
  afk: boolean
): LocomotionFrame {
  const { root, rig, ikLeft, ikRight, hair } = core
  return {
    root,
    rig,
    attention: createAttention(),
    attentionBones: { neck: rig.neck?.node ?? null, head: rig.head?.node ?? null },
    pivot: createTurnPivot(),
    motion,
    footPlan,
    ikLeft,
    ikRight,
    hair,
    clipPlayer,
    afk,
    state: 'idle',
    yaw: core.initial.yaw,
    yawStart: core.initial.yaw,
    waterY: 0,
    delta: 0,
    elapsed: 0,
    walking: false,
    gait: null,
    gaitWeight: 0
  }
}

/**
 * 摆根节点 → 转身换步 → IK → 剪辑 → 注意力遮罩 → 动骨物理，顺序不能换：
 * IK 依赖已更新的根节点世界矩阵，遮罩依赖动画/剪辑写完之后（权重归零即交还），
 * 动骨物理读的又是最终的头颈姿态。
 */
function poseLocomotion(frame: LocomotionFrame): void {
  const { root, rig, afk, state, delta, elapsed, waterY } = frame
  const blend = 1 - frame.gaitWeight

  const bob = afk
    ? 0
    : state === 'walk'
      ? Math.abs(Math.sin(frame.motion.phase)) * 0.02 * blend
      : Math.sin(elapsed * 1.4) * 0.007
  root.position.set(frame.footPlan.position.x, waterY + bob, frame.footPlan.position.z)
  root.quaternion.setFromAxisAngle(Y_AXIS, frame.yaw)
  root.rotateZ(state === 'walk' ? Math.sin(frame.motion.phase) * 0.02 * blend : 0)
  root.updateMatrixWorld(true)

  // 身体转了、脚先留在原地：超过阈值才换步，站立以外的状态把偏移收回。
  frame.pivot.update(delta, wrapAngle(frame.yaw - frame.yawStart), !afk && state === 'idle')

  // 程序化手臂在根节点摆好后内折一点；随后的行走剪辑（若有）会覆盖手臂骨骼。
  if (!afk) bendElbowsInward(root, rig.leftElbow?.node ?? null, rig.rightElbow?.node ?? null)

  if (afk) {
    frame.clipPlayer?.update(delta)
    root.updateMatrixWorld(true)
  } else if (frame.ikLeft && frame.ikRight) {
    const plan = frame.footPlan
    plan.yaw = frame.yaw
    plan.waterY = waterY
    plan.stride = frame.motion.gait
    plan.weight = Math.max(frame.motion.gait, frame.pivot.weight)
    solveFoot(frame.ikLeft, frame.motion.phase, plan, frame.pivot.left)
    solveFoot(frame.ikRight, frame.motion.phase + Math.PI, plan, frame.pivot.right)
    root.updateMatrixWorld(true)
  }

  // 移动剪辑放在 IK 之后混合：权重归零后还原骨骼，交还给程序化步态。
  frame.gait = applyGaitClip(frame.gait, frame.gaitWeight, frame.walking, delta, root)
  if (!frame.gait) frame.gaitWeight = 0

  // 注意力遮罩放在最后：只叠加头颈，权重归零后动画重新独占头部。
  frame.attention.follow(delta, root, frame.yaw, frame.attentionBones)
  root.updateMatrixWorld(true)

  // 头发/尾巴/耳朵/胸部：只动 Head、Hips 子树，放在 IK 之后执行。
  frame.hair?.update(delta)
}

function updateFeet(leftFoot: Object3D | null, rightFoot: Object3D | null, leftPos: Vector3, rightPos: Vector3): void {
  leftFoot?.getWorldPosition(leftPos)
  rightFoot?.getWorldPosition(rightPos)
}

/** 释放角色网格与材质，并把当前位置留作下次刷新。 */
function disposeCharacter(scene: Scene, root: Group, persistence: Persistence): void {
  persistence.save()
  scene.remove(root)
  root.traverse(object => {
    const mesh = object as {
      geometry?: { dispose(): void }
      material?: { dispose(): void } | Array<{ dispose(): void }>
    }
    mesh.geometry?.dispose()
    if (Array.isArray(mesh.material)) mesh.material.forEach(material => material.dispose())
    else mesh.material?.dispose()
  })
}

/** 载入 GLB 角色，并用一个极简状态机让她在水面上散步。 */
export async function createCharacter(scene: Scene, url: string): Promise<CharacterHandle> {
  const core = await prepareCharacter(scene, url)
  const { root, rig, leftFoot, rightFoot, leftFootPos, rightFootPos, ikLeft, ikRight, store } = core
  const feet = [leftFootPos, rightFootPos]
  const position = core.initial.position
  const target = new Vector3().copy(position)
  const forward = new Vector3()
  let state: CharacterState = 'idle'
  let idleFor = between(0.6, 1.8)
  let yaw = core.initial.yaw
  const motion: MotionPhase = { gait: 0, phase: 0 }
  const footPlan: FootPlan = { position, yaw: 0, waterY: 0, weight: 0, stride: 0 }

  const { afk, player: clipPlayer } = await setupAfkMode(root, () => state)
  const frame = createLocomotionFrame(core, motion, footPlan, clipPlayer, afk)
  const walk = await createWalkControl(
    root,
    afk,
    () => {
      state = 'idle'
      frame.gait = null
      frame.gaitWeight = 0
    },
    proceduralBones(rig)
  )
  const persistence = createPersistence(store, () => ({ x: position.x, z: position.z, yaw }))

  function pickTarget(): void {
    const picked = chooseTarget(position, yaw)
    target.set(picked.x, 0, picked.z)
    frame.gait = walk.pickGait(picked.distance)
    state = 'walk'
  }

  function move(delta: number): void {
    forward.set(target.x - position.x, 0, target.z - position.z)
    const distance = forward.length()
    if (distance < 0.04) {
      state = 'idle'
      idleFor = between(IDLE_MIN, IDLE_MAX)
      return
    }
    forward.normalize()
    const wanted = Math.atan2(forward.x, forward.z)
    let turn = wanted - yaw
    while (turn > Math.PI) turn -= Math.PI * 2
    while (turn < -Math.PI) turn += Math.PI * 2
    yaw += turn * Math.min(1, delta * 7)
    position.addScaledVector(forward, Math.min((frame.gait?.speed ?? WALK_SPEED) * delta, distance))
  }

  /** 剪辑模式：站在原地循环播放烘焙行走，不跑状态机与 IK。 */
  function updateClipPose(delta: number, waterY: number): void {
    root.position.set(position.x, waterY, position.z)
    root.quaternion.setFromAxisAngle(Y_AXIS, yaw)
    root.updateMatrixWorld(true)
    walk.player?.update(delta)
    root.updateMatrixWorld(true)
    frame.attention.follow(delta, root, yaw, frame.attentionBones)
    root.updateMatrixWorld(true)
    frame.hair?.update(delta)
    updateFeet(leftFoot, rightFoot, leftFootPos, rightFootPos)
    persistence.tick(delta)
  }

  function update(delta: number, elapsed: number, waterY: number, focus: Vector3 | null = null): void {
    if (focus) frame.attention.notice(focus)
    else frame.attention.release()

    if (walk.mode === 'clip' && walk.player) {
      updateClipPose(delta, waterY)
      return
    }

    const yawStart = yaw
    if (afk) {
      state = 'idle'
    } else if (state === 'idle') {
      idleFor -= delta
      if (idleFor <= 0) pickTarget()
    } else {
      move(delta)
    }

    // 站立时鱼跃出：身体先快速转向目标，头部只需补 60° 以内的小角度。
    if (!afk && state === 'idle') {
      const step = frame.attention.turnStep(root, yaw, delta)
      if (step !== 0) yaw = wrapAngle(yaw + step)
    }

    if (!afk) animateCharacter(rig, state, motion, delta, elapsed, Boolean(ikLeft && ikRight))

    const walking = !afk && state === 'walk' && frame.gait !== null
    frame.gaitWeight = blendGaitWeight(frame.gaitWeight, walking, delta)

    frame.state = state
    frame.yaw = yaw
    frame.yawStart = yawStart
    frame.waterY = waterY
    frame.delta = delta
    frame.elapsed = elapsed
    frame.walking = walking
    poseLocomotion(frame)

    updateFeet(leftFoot, rightFoot, leftFootPos, rightFootPos)
    persistence.tick(delta)
  }

  return {
    get state() {
      return state
    },
    get mode() {
      return walk.mode
    },
    position,
    feet,
    setMode: walk.setMode,
    update,
    dispose: () => disposeCharacter(scene, root, persistence)
  }
}
