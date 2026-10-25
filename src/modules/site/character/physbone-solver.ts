import { Euler, Matrix4, Object3D, Quaternion, Vector3 } from 'three'

/**
 * 弹簧骨求解器：pull / spring / stiffness / gravity / immobile / 角度限制。
 *
 * 骨骼用「端点位置 + 速度」推进（不是 DynamicBone 的 Verlet），参数语义与 VRChat 的
 * PhysBone 组件一致，便于直接沿用 Avatar 上已有的调参结果。实现为独立的 TypeScript
 * 版本：不包含、不链接、也不随仓库分发 VRChat SDK 的任何代码或二进制。
 *
 * VRChat、PhysBone 为 VRChat Inc. 的名称，此处仅用于说明参数与行为的兼容性；
 * 本项目与 VRChat Inc. 无关联。许可与第三方声明见仓库根目录 THIRD-PARTY-NOTICES.md。
 */

/** 固定子步：与 VRChat 的 PhysBoneManager 一致（1/60 s，最多 6 步）。 */
export const SUBSTEP = 1 / 60
export const MAX_SUBSTEPS = 6

const DEG = Math.PI / 180
const DOWN = new Vector3(0, -1, 0)
const UP = new Vector3(0, 1, 0)
const RIGHT = new Vector3(1, 0, 0)
const MIN_LENGTH = 8e-6

export type PhysBoneCurve = ReadonlyArray<readonly [number, number]>
export type PhysBoneScalar =
  | 'pull'
  | 'spring'
  | 'stiffness'
  | 'gravity'
  | 'gravityFalloff'
  | 'immobile'
  | 'radius'
  | 'maxAngleX'
  | 'maxAngleZ'

export interface PhysBoneSpec {
  pull: number
  spring: number
  stiffness: number
  gravity: number
  gravityFalloff: number
  immobile: number
  radius: number
  limit: 'angle' | 'polar'
  maxAngleX: number
  maxAngleZ: number
  limitRotation: readonly [number, number, number]
  /** 沿骨链的值曲线，t = 骨索引 / (骨数 - 1)。为空时取常数。 */
  curves?: Partial<Record<PhysBoneScalar, PhysBoneCurve>>
}

export interface PhysBoneCollider {
  bone: Object3D
  center: Vector3
  radius: number
}

interface BoneState {
  node: Object3D
  posePosition: Vector3
  poseRotation: Quaternion
  poseScale: Vector3
  /** 子骨在本地空间的位置（VRC 的 originalLocalVector）。 */
  localVector: Vector3
  localDir: Vector3
  hasChild: boolean
  limitAxisX: Vector3
  limitAxisY: Vector3
  /** 世界重力方向在该骨静止姿态本地空间中的方向。 */
  gravityLocal: Vector3
  /** 上一次求解后的世界朝向：VRC 的重力衰减按上一帧朝向计算。 */
  prevWorldQuat: Quaternion
  pull: number
  spring: number
  stiffness: number
  gravity: number
  gravityFalloff: number
  immobile: number
  radius: number
  maxAngleX: number
  maxAngleZ: number
  limit: 'angle' | 'polar'
  /** 模拟端点（世界坐标），跨帧保留。 */
  endPoint: Vector3
  prevEnd: Vector3
  /** 上一整步的骨向量（世界），stiffness 用它回正。 */
  prevVector: Vector3
  prevVelocity: Vector3
  /** 端点在 immobile 空间中的位置。 */
  immobileEndpoint: Vector3
  immobileReady: boolean
}

export interface PhysBoneChain {
  spec: PhysBoneSpec
  bones: BoneState[]
}

const IDENTITY = new Matrix4()
const poseMatrix = new Matrix4()
const poseWorld = new Matrix4()
const invPose = new Matrix4()
const basis = new Matrix4()
const basisInv = new Matrix4()
const tmpBegin = new Vector3()
const poseEnd = new Vector3()
const velocity = new Vector3()
const dir = new Vector3()
const axis = new Vector3()
const align = new Quaternion()
const gravDir = new Vector3()
const before = new Vector3()
const immobileWorld = new Vector3()
const colDir = new Vector3()
const crossAxis = new Vector3()
const normal = new Vector3()
const localAxis = new Vector3()
const cart = new Vector3()
const q1 = new Quaternion()
const q2 = new Quaternion()
const euler = new Euler()
const tmpVec = new Vector3()
const tmpQuat = new Quaternion()

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}

function evaluateCurve(points: PhysBoneCurve, t: number): number {
  const first = points[0]
  if (!first) return 1
  if (t <= first[0]) return first[1]
  let prev = first
  for (let i = 1; i < points.length; i++) {
    const point = points[i]
    if (!point) continue
    if (t <= point[0]) {
      const span = point[0] - prev[0]
      if (span <= 1e-6) return point[1]
      const w = (t - prev[0]) / span
      return prev[1] + (point[1] - prev[1]) * w
    }
    prev = point
  }
  return prev[1]
}

function scalarAt(spec: PhysBoneSpec, key: PhysBoneScalar, t: number): number {
  const base = spec[key]
  const curve = spec.curves?.[key]
  if (!curve || curve.length === 0) return base
  return base * evaluateCurve(curve, t)
}

/** 角度限制轴：由本地骨向量和 limitRotation 构造。 */
function calcLimitAxes(
  boneVector: Vector3,
  rotation: readonly [number, number, number],
  outX: Vector3,
  outY: Vector3
): void {
  const direction = boneVector.lengthSq() > 1e-12 ? tmpVec.copy(boneVector).normalize() : tmpVec.copy(UP)
  q1.setFromUnitVectors(UP, direction)
  q2.setFromEuler(euler.set(rotation[0] * DEG, rotation[1] * DEG, rotation[2] * DEG, 'XYZ'))
  q1.multiply(q2)
  outX.copy(RIGHT).applyQuaternion(q1)
  outY.copy(UP).applyQuaternion(q1)
}

function collectChain(root: Object3D): Object3D[] {
  const chain: Object3D[] = [root]
  let current = root
  for (;;) {
    const next = current.children[0]
    if (!next || !next.name || (next as { isMesh?: boolean }).isMesh) break
    chain.push(next)
    current = next
  }
  return chain
}

function createBone(
  node: Object3D,
  child: Object3D | undefined,
  spec: PhysBoneSpec,
  forceT: number,
  radiusT: number
): BoneState {
  const localVector = child ? child.position.clone() : new Vector3()
  const hasChild = localVector.lengthSq() > 1e-12
  const localDir = hasChild ? localVector.clone().normalize() : new Vector3(0, 1, 0)
  const limitAxisX = new Vector3()
  const limitAxisY = new Vector3()
  if (hasChild) calcLimitAxes(localVector, spec.limitRotation, limitAxisX, limitAxisY)

  const restWorldQuat = node.getWorldQuaternion(new Quaternion())
  const gravityLocal = DOWN.clone().applyQuaternion(restWorldQuat.clone().invert())

  const endPoint = new Vector3()
  if (child) child.getWorldPosition(endPoint)
  else node.getWorldPosition(endPoint)

  const prevVector = new Vector3()
  if (child) prevVector.copy(endPoint).sub(node.getWorldPosition(tmpVec))

  return {
    node,
    posePosition: node.position.clone(),
    poseRotation: node.quaternion.clone(),
    poseScale: node.scale.clone(),
    localVector,
    localDir,
    hasChild,
    limitAxisX,
    limitAxisY,
    gravityLocal,
    prevWorldQuat: restWorldQuat,
    pull: clamp01(scalarAt(spec, 'pull', forceT)),
    spring: clamp01(scalarAt(spec, 'spring', forceT)),
    stiffness: clamp01(scalarAt(spec, 'stiffness', forceT)),
    gravity: scalarAt(spec, 'gravity', forceT),
    gravityFalloff: clamp01(scalarAt(spec, 'gravityFalloff', forceT)),
    immobile: clamp01(scalarAt(spec, 'immobile', forceT)),
    radius: Math.max(0, scalarAt(spec, 'radius', radiusT)),
    maxAngleX: Math.max(0, scalarAt(spec, 'maxAngleX', forceT)),
    maxAngleZ: Math.max(0, scalarAt(spec, 'maxAngleZ', forceT)),
    limit: spec.limit,
    endPoint,
    prevEnd: endPoint.clone(),
    prevVector,
    prevVelocity: new Vector3(),
    immobileEndpoint: new Vector3(),
    immobileReady: false
  }
}

export function buildPhysBoneChain(rootBone: Object3D, spec: PhysBoneSpec): PhysBoneChain | null {
  const nodes = collectChain(rootBone)
  if (nodes.length < 2) return null
  const bones: BoneState[] = []
  const last = nodes.length - 1
  // 曲线参数：力参数的分母是 n-2，半径的分母是 n-1（沿用 PhysBone 的取值规则）。
  const forceDen = Math.max(1, last - 1)
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]
    if (!node) continue
    const forceT = clamp01(i / forceDen)
    const radiusT = last > 0 ? i / last : 0
    bones.push(createBone(node, nodes[i + 1], spec, forceT, radiusT))
  }
  return { spec, bones }
}

/** 每帧求解前把骨骼恢复到动画姿态（物理结果不能反过来当输入）。 */
export function resetPhysBoneChain(chain: PhysBoneChain): void {
  for (const bone of chain.bones) {
    bone.node.position.copy(bone.posePosition)
    bone.node.quaternion.copy(bone.poseRotation)
  }
}

function applyGravity(bone: BoneState, length: number, velocity: Vector3): void {
  if (bone.gravity === 0) return
  let g = bone.gravity * length
  if (bone.gravityFalloff > 0) {
    gravDir.copy(bone.gravityLocal).applyQuaternion(bone.prevWorldQuat)
    // 骨自身越接近“顺重力下垂”，重力越小（VRC 的 gravityFalloff）。
    const factor = Math.min(1, 1 - gravDir.dot(DOWN))
    g *= 1 - bone.gravityFalloff + bone.gravityFalloff * factor
  }
  velocity.y -= g
}

function clampLength(bone: BoneState, begin: Vector3, length: number): void {
  dir.copy(bone.endPoint).sub(begin)
  const current = dir.length()
  if (current > 1e-6) bone.endPoint.copy(begin).addScaledVector(dir.divideScalar(current), length)
  else bone.endPoint.copy(begin).addScaledVector(bone.localDir, length)
}

function pushOut(bone: BoneState, poseEnd: Vector3, colliders: PhysBoneCollider[]): void {
  for (const collider of colliders) {
    const reach = collider.radius + bone.radius
    // 静止姿态就已经在碰撞体内部（例如被头球包住的耳骨/侧发）：不强行推出去，
    // 否则整条链会被顶到球面上，产生几十度的常量偏转。VRC 用的是贴合模型的
    // 胶囊/平面碰撞体，不会出现这种“吞掉骨链”的情况。
    if (poseEnd.distanceToSquared(collider.center) < reach * reach) continue
    colDir.copy(bone.endPoint).sub(collider.center)
    const distance = colDir.length()
    if (distance <= 1e-5 || distance >= reach) continue
    bone.endPoint.copy(collider.center).addScaledVector(colDir.divideScalar(distance), reach)
  }
}

function cartesianToPolar(x: number, y: number, z: number): { x: number; y: number } {
  const flatLength = Math.hypot(x, z)
  const flatX = flatLength > 1e-6 ? x / flatLength : 0
  const flatZ = flatLength > 1e-6 ? z / flatLength : 1
  let polarX = Math.acos(Math.min(1, Math.max(-1, flatZ)))
  if (flatX < 0) polarX = -polarX
  const polarY = Math.acos(Math.min(1, Math.max(-1, y))) - Math.PI / 2
  return { x: polarX / DEG, y: polarY / DEG }
}

function polarToCartesian(polarX: number, polarY: number): Vector3 {
  euler.set(polarY * DEG, polarX * DEG, 0, 'ZXY')
  tmpQuat.setFromEuler(euler)
  return cart.set(0, 0, 1).applyQuaternion(tmpQuat)
}

function applyLimits(bone: BoneState, direction: Vector3): void {
  if (bone.limit === 'angle') {
    const angle = bone.limitAxisY.angleTo(direction)
    if (angle <= bone.maxAngleX * DEG) return
    crossAxis.crossVectors(bone.limitAxisY, direction)
    if (crossAxis.lengthSq() < 1e-12) crossAxis.copy(bone.limitAxisX)
    direction.copy(bone.limitAxisY).applyAxisAngle(crossAxis.normalize(), bone.maxAngleX * DEG)
    return
  }

  normal.crossVectors(bone.limitAxisX, bone.limitAxisY)
  if (normal.lengthSq() < 1e-12) return
  normal.normalize()
  basis.makeBasis(normal, bone.limitAxisX, bone.limitAxisY)
  basisInv.copy(basis).invert()
  localAxis.copy(direction).applyMatrix4(basisInv)
  if (localAxis.lengthSq() < 1e-12) return
  localAxis.normalize()
  const polar = cartesianToPolar(localAxis.x, localAxis.y, localAxis.z)
  polar.x = Math.min(bone.maxAngleX, Math.max(-bone.maxAngleX, polar.x))
  polar.y = Math.min(bone.maxAngleZ, Math.max(-bone.maxAngleZ, polar.y))
  cart.copy(polarToCartesian(polar.x, polar.y)).applyMatrix4(basis)
  if (cart.lengthSq() > 1e-12) direction.copy(cart.normalize())
}

function applyRotation(bone: BoneState, pose: Matrix4): void {
  invPose.copy(pose).invert()
  axis.copy(bone.endPoint).applyMatrix4(invPose)
  if (axis.lengthSq() < 1e-12) axis.copy(bone.localDir)
  else axis.normalize()
  applyLimits(bone, axis)
  align.setFromUnitVectors(bone.localDir, axis)
  bone.node.quaternion.copy(bone.poseRotation).multiply(align)
  bone.node.updateWorldMatrix(false, false)
  bone.prevWorldQuat.setFromRotationMatrix(bone.node.matrixWorld)
  bone.endPoint.copy(bone.localVector).applyMatrix4(bone.node.matrixWorld)
}

function stepBone(
  bone: BoneState,
  begin: Vector3,
  pose: Matrix4,
  ratio: number,
  immobile: Matrix4,
  invImmobile: Matrix4,
  colliders: PhysBoneCollider[]
): void {
  // VRC 每个子步都从「上一个整步」的端点重新求解：部分步只做预览，不累加。
  bone.endPoint.copy(bone.prevEnd)
  if (bone.immobile > 0) {
    if (!bone.immobileReady) {
      bone.immobileEndpoint.copy(bone.endPoint).applyMatrix4(invImmobile)
      bone.immobileReady = true
    }
    immobileWorld.copy(bone.immobileEndpoint).applyMatrix4(immobile)
    bone.endPoint.addScaledVector(tmpVec.copy(immobileWorld).sub(bone.endPoint), bone.immobile)
  }
  before.copy(bone.endPoint)

  poseEnd.copy(bone.localVector).applyMatrix4(pose)
  const poseLength = Math.max(poseEnd.distanceTo(begin), MIN_LENGTH)
  const currentLength = Math.max(bone.endPoint.distanceTo(begin), MIN_LENGTH)

  velocity.copy(bone.prevVelocity).multiplyScalar(bone.spring)
  dir.copy(poseEnd).sub(bone.endPoint).sub(velocity).multiplyScalar(bone.pull)
  velocity.add(dir)
  applyGravity(bone, currentLength, velocity)
  velocity.addScaledVector(bone.prevVector, bone.stiffness)
  bone.endPoint.add(velocity)

  clampLength(bone, begin, poseLength)
  pushOut(bone, poseEnd, colliders)
  const resolvedLength = bone.endPoint.distanceTo(begin)

  if (ratio < 1) {
    const t = ratio / (1 + (ratio - 1) * bone.pull)
    bone.endPoint.lerpVectors(before, bone.endPoint, t)
    dir.copy(bone.endPoint).sub(begin)
    const length = dir.length()
    if (length > 1e-6) bone.endPoint.copy(begin).addScaledVector(dir.divideScalar(length), resolvedLength)
  }

  applyRotation(bone, pose)

  if (ratio >= 1) {
    bone.prevEnd.copy(bone.endPoint)
    bone.prevVector.copy(bone.endPoint).sub(begin)
    bone.prevVelocity.copy(bone.endPoint).sub(before)
    bone.immobileEndpoint.copy(bone.endPoint).applyMatrix4(invImmobile)
    bone.immobileReady = true
  }
}

/** 求解一条链的一次子步；`ratio` < 1 表示本帧最后一步不足 1/60 s。 */
export function solvePhysBoneChain(
  chain: PhysBoneChain,
  ratio: number,
  immobile: Matrix4,
  invImmobile: Matrix4,
  colliders: PhysBoneCollider[]
): void {
  const bones = chain.bones
  const first = bones[0]
  if (!first) return
  const parentWorld = first.node.parent ? first.node.parent.matrixWorld : IDENTITY
  const begin = tmpBegin
  for (let i = 0; i < bones.length; i++) {
    const bone = bones[i]
    if (!bone) continue
    const previous = bones[i - 1]
    const parent = i === 0 ? parentWorld : previous ? previous.node.matrixWorld : parentWorld
    poseMatrix.compose(bone.posePosition, bone.poseRotation, bone.poseScale)
    poseWorld.multiplyMatrices(parent, poseMatrix)
    if (i === 0) begin.setFromMatrixPosition(poseWorld)
    if (bone.hasChild) stepBone(bone, begin, poseWorld, ratio, immobile, invImmobile, colliders)
    else {
      bone.node.quaternion.copy(bone.poseRotation)
      bone.node.updateWorldMatrix(false, false)
    }
    begin.copy(bone.endPoint)
  }
}
