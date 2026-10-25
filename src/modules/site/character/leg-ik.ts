import { Object3D, Quaternion, Vector3 } from 'three'
import type { FootPivot } from './turn-in-place'

/** 移动速度（世界单位/秒）：程序化步态的基准，也是剪辑缺失时的兜底。 */
export const WALK_SPEED = 0.36
/** 步态周期（秒）：一次循环 = 左右各迈一步。步幅由移动速度反推，保证脚不打滑。 */
export const LEG_CYCLE_SECONDS = 1
/** 单个周期里脚掌贴地（支撑相）的占比。 */
const STANCE_RATIO = 0.5
/** 摆动相抬脚高度（米，角色局部坐标）。 */
const STEP_LIFT = 0.05

/** 一条腿做 IK 需要的常量：骨骼、静止姿态、骨长与静止脚踝位置。 */
export interface IkLeg {
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

export interface FootPlan {
  position: Vector3
  yaw: number
  waterY: number
  weight: number
  /** 步态相位带来的前后位移/抬脚权重：站立（原地转身）时为 0，脚不迈步。 */
  stride: number
}

/**
 * 建腿：记录静止姿态与骨长，并探测膝盖弯曲方向。
 * 膝盖必须落在「髋→踝」连线的前方（模型局部 +Z），否则说明轴的反向是反的，人腿不能反折。
 */
export function buildIkLeg(
  thigh: Object3D | null,
  shin: Object3D | null,
  ankle: Object3D | null,
  kneeAxis: Vector3 | undefined
): IkLeg | null {
  if (!thigh || !shin || !ankle || !kneeAxis) return null

  const hipPos = thigh.getWorldPosition(new Vector3())
  const kneePos = shin.getWorldPosition(new Vector3())
  const anklePos = ankle.getWorldPosition(new Vector3())
  const upper = hipPos.clone().sub(kneePos).normalize()
  const lower = anklePos.clone().sub(kneePos).normalize()
  const shinRest = shin.quaternion.clone()
  const ankleRest = ankle.quaternion.clone()
  const footRestWorld = ankle.getWorldQuaternion(new Quaternion())

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
 * 脚踝额外锁回静止世界朝向（只跟随传入的偏航），避免随小腿一起翘脚尖。
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
  const shinSolved = leg.shinRest
    .clone()
    .multiply(ikTempQuat.setFromAxisAngle(leg.kneeAxis, leg.restKneeAngle - kneeAngle))
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

const footTarget = new Vector3()

/**
 * 按步态相位算出脚踝目标：支撑相脚掌以移动速度相对身体后移（世界坐标里不动），
 * 摆动相则平滑抬脚前摆。步幅由 WALK_SPEED × 周期反推，所以脚不再追不上身体。
 * pivot 提供原地转身时的额外偏航与抬脚：脚钉在原来的世界朝向，身体先转。
 */
export function solveFoot(leg: IkLeg, legPhase: number, plan: FootPlan, pivot: FootPivot): void {
  const cycle = (((legPhase / (Math.PI * 2)) % 1) + 1) % 1
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

  const localZ = leg.footZ + offsetZ * plan.stride
  const footYaw = plan.yaw + pivot.offset
  const cos = Math.cos(footYaw)
  const sin = Math.sin(footYaw)
  footTarget.set(
    plan.position.x + leg.footX * cos + localZ * sin,
    plan.waterY + leg.footY + lift * plan.stride + pivot.lift,
    plan.position.z - leg.footX * sin + localZ * cos
  )
  solveIkLeg(leg, footTarget, plan.weight, footYaw)
}
