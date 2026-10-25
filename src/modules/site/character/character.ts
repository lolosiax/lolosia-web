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
import { createClipPlayer, loadClip, type ClipPlayer } from './clip-animation'
import { useSiteSceneStore } from '../store'

const TARGET_HEIGHT = 1.15
const WALK_SPEED = 0.36
const IDLE_MIN = 1.2
const IDLE_MAX = 3.6
const BOUNDS = { xMin: -2, xMax: 1.2, zNear: -0.6, zFar: -2 }
const ARM_DROP = 1.05
/** 落点写回 Pinia 的间隔（秒）。每帧写会在 localStorage 上打出大量小写入。 */
const POSE_SAVE_INTERVAL = 1.5
/** 步态周期（秒）：一次循环 = 左右各迈一步。步幅由移动速度反推，保证脚不打滑。 */
const LEG_CYCLE_SECONDS = 1
/** 单个周期里脚掌贴地（支撑相）的占比。 */
const STANCE_RATIO = 0.5
/** 摆动相抬脚高度（米，角色局部坐标）。 */
const STEP_LIFT = 0.05
/** AFK 动画（Unity Moe_AFK_Loop_by_Levin 烘焙结果）。 */
const AFK_CLIP_URL = `${import.meta.env.BASE_URL}res/animations/moe_afk.json`

export type CharacterState = 'idle' | 'walk'

export interface CharacterHandle {
  readonly state: CharacterState
  readonly position: Vector3
  readonly feet: Vector3[]
  update(delta: number, elapsed: number, waterY: number): void
  dispose(): void
}

interface AnimatedBone {
  node: Object3D
  rest: Quaternion
  bendAxis: Vector3
  dropAxis: Vector3 | null
  dropAngle: number
}

type Rig = Record<'leftLeg' | 'rightLeg' | 'leftKnee' | 'rightKnee' | 'leftArm' | 'rightArm' | 'leftElbow' | 'rightElbow' | 'spine', AnimatedBone | null>

/** 一条腿做 IK 需要的常量：骨骼、静止姿态、骨长与静止脚踝位置。 */
interface IkLeg {
  thigh: Object3D
  shin: Object3D
  ankle: Object3D
  thighRest: Quaternion
  shinRest: Quaternion
  ankleRest: Quaternion
  footRestWorld: Quaternion
  kneeAxis: Vector3
  hipLength: number
  shinLength: number
  restKneeAngle: number
  footX: number
  footY: number
  footZ: number
}

function between(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function insideBounds(x: number, z: number): boolean {
  return x >= BOUNDS.xMin && x <= BOUNDS.xMax && z >= BOUNDS.zFar && z <= BOUNDS.zNear
}

function findBone(root: Group, name: string): Object3D | null {
  const wanted = name.replace(/[\s_.-]/g, '').toLowerCase()
  let found: Object3D | null = null
  root.traverse(object => {
    if (!found && object.name.replace(/[\s_.-]/g, '').toLowerCase() === wanted) found = object
  })
  return found
}

function buildBone(root: Group, name: string, dropAngle = 0): AnimatedBone | null {
  const node = findBone(root, name)
  if (!node) return null

  const rest = node.quaternion.clone()
  const world = node.getWorldQuaternion(new Quaternion())
  const dropAxis = dropAngle
    ? new Vector3(0, 0, 1).applyQuaternion(world.clone().invert()).normalize()
    : null
  const posed = dropAxis ? world.clone().multiply(new Quaternion().setFromAxisAngle(dropAxis, dropAngle)) : world
  const bendAxis = new Vector3(1, 0, 0).applyQuaternion(posed.clone().invert()).normalize()

  return { node, rest, bendAxis, dropAxis, dropAngle }
}

function buildRig(root: Group): Rig {
  root.updateMatrixWorld(true)
  return {
    leftLeg: buildBone(root, 'Left leg'),
    rightLeg: buildBone(root, 'Right leg'),
    leftKnee: buildBone(root, 'Left knee'),
    rightKnee: buildBone(root, 'Right knee'),
    leftArm: buildBone(root, 'Left arm', -ARM_DROP),
    rightArm: buildBone(root, 'Right arm', ARM_DROP),
    leftElbow: buildBone(root, 'Left elbow'),
    rightElbow: buildBone(root, 'Right elbow'),
    spine: buildBone(root, 'Spine')
  }
}

const tempQuat = new Quaternion()

function buildIkLeg(root: Group, hipName: string, kneeName: string, ankleName: string, kneeAxis: Vector3): IkLeg | null {
  const thigh = findBone(root, hipName)
  const shin = findBone(root, kneeName)
  const ankle = findBone(root, ankleName)
  if (!thigh || !shin || !ankle) return null

  const hipPos = thigh.getWorldPosition(new Vector3())
  const kneePos = shin.getWorldPosition(new Vector3())
  const anklePos = ankle.getWorldPosition(new Vector3())
  const upper = hipPos.clone().sub(kneePos).normalize()
  const lower = anklePos.clone().sub(kneePos).normalize()
  const shinRest = shin.quaternion.clone()
  const ankleRest = ankle.quaternion.clone()
  const footRestWorld = ankle.getWorldQuaternion(new Quaternion())

  // 探测膝盖的弯曲方向：膝盖必须落在「髋→踝」连线的前方（模型局部 +Z），
  // 否则说明轴的反向是反的，人腿不能反折。
  const resolvedAxis = kneeAxis.clone()
  const probe = new Quaternion()
  shin.quaternion.copy(shinRest).multiply(probe.setFromAxisAngle(resolvedAxis, 0.3))
  shin.updateWorldMatrix(true, true)
  const kneeProbe = shin.getWorldPosition(new Vector3())
  const ankleProbe = ankle.getWorldPosition(new Vector3())
  shin.quaternion.copy(shinRest)
  shin.updateWorldMatrix(true, true)

  const chord = ankleProbe.clone().sub(hipPos)
  const kneeOffset = kneeProbe.clone().sub(hipPos)
  const nearest = hipPos.clone().addScaledVector(chord, kneeOffset.dot(chord) / chord.lengthSq())
  if (kneeProbe.clone().sub(nearest).z < 0) resolvedAxis.negate()

  return {
    thigh,
    shin,
    ankle,
    thighRest: thigh.quaternion.clone(),
    shinRest,
    ankleRest,
    footRestWorld,
    kneeAxis: resolvedAxis,
    hipLength: hipPos.distanceTo(kneePos),
    shinLength: kneePos.distanceTo(anklePos),
    restKneeAngle: Math.acos(Math.min(1, Math.max(-1, upper.dot(lower)))),
    footX: anklePos.x,
    footY: anklePos.y,
    footZ: anklePos.z
  }
}

function buildLegRig(root: Group, rig: Rig): { left: IkLeg | null; right: IkLeg | null } {
  return {
    left: rig.leftKnee ? buildIkLeg(root, 'Left leg', 'Left knee', 'Left ankle', rig.leftKnee.bendAxis) : null,
    right: rig.rightKnee ? buildIkLeg(root, 'Right leg', 'Right knee', 'Right ankle', rig.rightKnee.bendAxis) : null
  }
}

const ikHip = new Vector3()
const ikTarget = new Vector3()
const ikAnkle = new Vector3()
const ikTempQuat = new Quaternion()
const ikAlign = new Quaternion()
const ikWorld = new Quaternion()
const ikParent = new Quaternion()
const ikShinWorld = new Quaternion()
const ikDesired = new Quaternion()
const ikYawQuat = new Quaternion()
const ikUpAxis = new Vector3(0, 1, 0)

/**
 * 解析式两骨 IK：先按目标距离算出膝盖弯曲量，再用大腿旋转把脚踝对准目标。
 * 目标在角色局部空间里按「支撑相脚掌不动」推导，因此脚不会相对地面打滑。
 * 脚踝额外锁回静止世界朝向（只跟随角色朝向），避免随小腿一起翘脚尖。
 */
function solveIkLeg(leg: IkLeg, target: Vector3, weight: number, yaw: number): void {
  leg.thigh.quaternion.copy(leg.thighRest)
  leg.shin.quaternion.copy(leg.shinRest)
  leg.thigh.updateWorldMatrix(true, false)

  const hip = leg.thigh.getWorldPosition(ikHip)
  ikTarget.copy(target).sub(hip)
  const raw = ikTarget.length()
  if (raw < 1e-4) return

  const reach = (leg.hipLength + leg.shinLength) * 0.995
  const minReach = Math.abs(leg.hipLength - leg.shinLength) + 1e-3
  const distance = Math.min(Math.max(raw, minReach), reach)
  ikTarget.normalize()

  const cosine = (leg.hipLength ** 2 + leg.shinLength ** 2 - distance ** 2) / (2 * leg.hipLength * leg.shinLength)
  const kneeAngle = Math.acos(Math.min(1, Math.max(-1, cosine)))
  // 膝盖内角越小 = 屈曲越多；正角度在 kneeAxis 上表示屈曲（小腿向后收）。
  const shinSolved = leg.shinRest.clone().multiply(ikTempQuat.setFromAxisAngle(leg.kneeAxis, leg.restKneeAngle - kneeAngle))
  leg.shin.quaternion.copy(shinSolved)
  leg.shin.updateWorldMatrix(false, true)

  const ankleDir = leg.ankle.getWorldPosition(ikAnkle).sub(hip).normalize()
  const align = ikAlign.setFromUnitVectors(ankleDir, ikTarget)
  const thighWorld = leg.thigh.getWorldQuaternion(ikWorld).premultiply(align)
  const parentWorld = leg.thigh.parent ? leg.thigh.parent.getWorldQuaternion(ikParent) : ikParent.identity()
  const thighSolved = parentWorld.invert().multiply(thighWorld)

  leg.thigh.quaternion.copy(thighSolved)
  leg.shin.updateWorldMatrix(true, false)
  const shinWorld = leg.shin.getWorldQuaternion(ikShinWorld)
  const desired = ikDesired.copy(leg.footRestWorld).premultiply(ikYawQuat.setFromAxisAngle(ikUpAxis, yaw))
  const footSolved = shinWorld.invert().multiply(desired)

  leg.thigh.quaternion.copy(leg.thighRest).slerp(thighSolved, weight)
  leg.shin.quaternion.copy(leg.shinRest).slerp(shinSolved, weight)
  leg.ankle.quaternion.copy(leg.ankleRest).slerp(footSolved, weight)
}

interface FootPlan {
  position: Vector3
  yaw: number
  waterY: number
  weight: number
}

const footTarget = new Vector3()

/**
 * 按步态相位算出脚踝目标：支撑相脚掌以移动速度相对身体后移（世界坐标里不动），
 * 摆动相则平滑抬脚前摆。步幅由 WALK_SPEED × 周期反推，所以脚不再追不上身体。
 */
function solveFoot(leg: IkLeg, legPhase: number, plan: FootPlan): void {
  const cycle = ((legPhase / (Math.PI * 2)) % 1 + 1) % 1
  const halfStep = (WALK_SPEED * LEG_CYCLE_SECONDS) / 4
  let offsetZ: number
  let lift = 0

  if (cycle < STANCE_RATIO) {
    const t = cycle / STANCE_RATIO
    offsetZ = halfStep * (1 - 2 * t)
  } else {
    const t = (cycle - STANCE_RATIO) / (1 - STANCE_RATIO)
    offsetZ = halfStep * (-1 + 2 * t * t * (3 - 2 * t))
    lift = STEP_LIFT * Math.sin(Math.PI * t)
  }

  const localZ = leg.footZ + offsetZ
  const cos = Math.cos(plan.yaw)
  const sin = Math.sin(plan.yaw)
  footTarget.set(
    plan.position.x + leg.footX * cos + localZ * sin,
    plan.waterY + leg.footY + lift,
    plan.position.z - leg.footX * sin + localZ * cos
  )
  solveIkLeg(leg, footTarget, plan.weight, plan.yaw)
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

/** 载入 GLB 角色，并用一个极简状态机让她在水面上散步。 */
export async function createCharacter(scene: Scene, url: string): Promise<CharacterHandle> {
  const root = await loadModel(url)
  scene.add(root)

  const rig = buildRig(root)
  const leftFoot = findBone(root, 'Left ankle')
  const rightFoot = findBone(root, 'Right ankle')
  const leftFootPos = new Vector3()
  const rightFootPos = new Vector3()
  const feet = [leftFootPos, rightFootPos]

  const { left: ikLeft, right: ikRight } = buildLegRig(root, rig)
  const hair = createHairPhysics(root)

  const store = useSiteSceneStore()
  const initial = initialPose(store)
  const position = initial.position
  const target = new Vector3().copy(position)
  const forward = new Vector3()
  let state: CharacterState = 'idle'
  let idleFor = between(0.6, 1.8)
  let yaw = initial.yaw
  let phase = 0
  let gait = 0
  let saveTimer = 0
  const yawAxis = new Vector3(0, 1, 0)
  const { afk, player: clipPlayer } = await setupAfkMode(root, () => state)

  function persistPose(): void {
    store.saveCharacterPose({ x: position.x, z: position.z, yaw })
  }

  function pickTarget(): void {
    target.set(between(BOUNDS.xMin, BOUNDS.xMax), 0, between(BOUNDS.zFar, BOUNDS.zNear))
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
    position.addScaledVector(forward, Math.min(WALK_SPEED * delta, distance))
  }

  function animate(delta: number, elapsed: number): void {
    gait += ((state === 'walk' ? 1 : 0) - gait) * Math.min(1, delta * 6)
    phase += (delta * Math.PI * 2) / LEG_CYCLE_SECONDS

    const swing = Math.sin(phase) * 0.32 * gait
    pose(rig.leftArm, -swing)
    pose(rig.rightArm, swing)
    pose(rig.leftElbow, 0.18 + Math.max(0, swing) * 0.25)
    pose(rig.rightElbow, 0.18 + Math.max(0, -swing) * 0.25)
    pose(rig.spine, Math.sin(elapsed * 1.5) * 0.015 + Math.sin(phase * 2) * 0.025 * gait)

    // 骨骼缺失时退回纯 FK 步态，避免整套动作消失。
    if (!ikLeft || !ikRight) {
      const legSwing = Math.sin(phase) * 0.55 * gait
      pose(rig.leftLeg, legSwing)
      pose(rig.rightLeg, -legSwing)
      pose(rig.leftKnee, Math.max(0, Math.sin(phase - 1.1)) * 0.85 * gait)
      pose(rig.rightKnee, Math.max(0, Math.sin(phase - 1.1 + Math.PI)) * 0.85 * gait)
    }
  }

  const footPlan: FootPlan = { position, yaw: 0, waterY: 0, weight: 0 }

  function update(delta: number, elapsed: number, waterY: number): void {
    if (afk) {
      state = 'idle'
    } else if (state === 'idle') {
      idleFor -= delta
      if (idleFor <= 0) pickTarget()
    } else {
      move(delta)
    }

    if (!afk) animate(delta, elapsed)

    const bob = afk ? 0 : state === 'walk' ? Math.abs(Math.sin(phase)) * 0.02 : Math.sin(elapsed * 1.4) * 0.007
    root.position.set(position.x, waterY + bob, position.z)
    root.quaternion.setFromAxisAngle(yawAxis, yaw)
    root.rotateZ(state === 'walk' ? Math.sin(phase) * 0.02 : 0)
    root.updateMatrixWorld(true)

    // IK 需要角色世界矩阵已更新，因此放在根节点摆好之后。
    if (afk) {
      clipPlayer?.update(delta)
      root.updateMatrixWorld(true)
    } else if (ikLeft && ikRight) {
      footPlan.yaw = yaw
      footPlan.waterY = waterY
      footPlan.weight = gait
      solveFoot(ikLeft, phase, footPlan)
      solveFoot(ikRight, phase + Math.PI, footPlan)
      root.updateMatrixWorld(true)
    }

    // 头发/尾巴/耳朵/胸部：只动 Head、Hips 子树，放在 IK 之后执行。
    hair?.update(delta)

    leftFoot?.getWorldPosition(leftFootPos)
    rightFoot?.getWorldPosition(rightFootPos)

    saveTimer += delta
    if (saveTimer >= POSE_SAVE_INTERVAL) {
      saveTimer = 0
      persistPose()
    }
  }

  function dispose(): void {
    persistPose()
    scene.remove(root)
    root.traverse(object => {
      const mesh = object as { geometry?: { dispose(): void }; material?: { dispose(): void } | Array<{ dispose(): void }> }
      mesh.geometry?.dispose()
      if (Array.isArray(mesh.material)) mesh.material.forEach(material => material.dispose())
      else mesh.material?.dispose()
    })
  }

  return {
    get state() {
      return state
    },
    position,
    feet,
    update,
    dispose
  }
}
