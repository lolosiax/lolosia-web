import { Object3D, Quaternion, Vector3 } from 'three'

/**
 * 鱼跃出时的注意力遮罩：只在动画/IK/剪辑之后叠加颈部与头骨的旋转，
 * 不改写任何轨道，因此追踪结束、或中途放弃时，头部姿态会自然交还给动画。
 *
 * 规则：
 * - 头部相对身体的偏航超过 MAX_HEAD_YAW（60°）就不追；先进入过范围、之后又超出的，本轮放弃。
 * - 站立时额外提供一个转身角增量，让身体尽快面向目标，头部只需补剩下的小角度。
 */

/** 头部追踪的最大偏航：再大就不是「转头」而是「扭脖子」了，直接放弃。 */
const MAX_HEAD_YAW = (60 * Math.PI) / 180
/** 俯仰上限：鱼出水时抬头，但不能把脖子折断。 */
const MAX_HEAD_PITCH = (22 * Math.PI) / 180
/** 颈部承担的偏航/俯仰比例，其余交给头骨，避免整颗头硬转。 */
const NECK_SHARE = 0.35
/** 关注权重淡入/淡出速率（每秒）：淡出完成后动画重新独占头部。 */
const FADE_IN = 9
const FADE_OUT = 6
/** 站立转身角速度（弧度/秒，约 240°/s）与对准死区（约 1.1°）。 */
const TURN_SPEED = 4.2
const TURN_DEAD_ZONE = 0.02
/** 头部大致高度（角色局部米），只用来折算俯仰角。 */
const HEAD_HEIGHT = 0.95

const worldUp = new Vector3(0, 1, 0)
const bodyRight = new Vector3(1, 0, 0)
const rootQuat = new Quaternion()
const boneQuat = new Quaternion()
const axis = new Vector3()
const spin = new Quaternion()

/** 叠加记账：撤回时要同时知道「叠加前」和「叠加后」的局部姿态。 */
interface Overlay {
  bone: Object3D | null
  base: Quaternion
  applied: Quaternion
}

const neckOverlay: Overlay = { bone: null, base: new Quaternion(), applied: new Quaternion() }
const headOverlay: Overlay = { bone: null, base: new Quaternion(), applied: new Quaternion() }

/**
 * 撤回上一帧的叠加。只有骨骼仍停在上次的叠加结果时才撤：
 * 行走剪辑会在同一帧写 Head/Neck，那种情况必须保留它写好的姿态。
 */
function restore(overlay: Overlay): void {
  const bone = overlay.bone
  if (!bone) return
  if (bone.quaternion.equals(overlay.applied)) bone.quaternion.copy(overlay.base)
  overlay.bone = null
}

function wrapAngle(angle: number): number {
  let value = angle
  while (value > Math.PI) value -= Math.PI * 2
  while (value < -Math.PI) value += Math.PI * 2
  return value
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export interface AttentionBones {
  neck: Object3D | null
  head: Object3D | null
}

export interface Attention {
  /** 腾空中每帧传入目标世界位置；同一轮事件里重复调用只更新目标。 */
  notice(target: Vector3): void
  /** 腾空结束：停止追踪，头部在 FADE_OUT 内淡回动画姿态。 */
  release(): void
  /** 站立时朝目标转身的角增量（弧度）；不需要转身返回 0。 */
  turnStep(root: Object3D, yaw: number, delta: number): number
  /** 姿态、IK、剪辑都写完之后调用：把颈/头叠加向目标。 */
  follow(delta: number, root: Object3D, yaw: number, bones: AttentionBones): void
}

export function createAttention(): Attention {
  const target = new Vector3()
  /** 本轮事件是否仍在关注（false 后权重只降不升）。 */
  let tracking = false
  /** 是否进入过 60° 范围：进入过再超出，说明追不上，本轮彻底放弃。 */
  let armed = false
  let abandoned = false
  let weight = 0

  function relativeYaw(root: Object3D, yaw: number): number {
    return wrapAngle(Math.atan2(target.x - root.position.x, target.z - root.position.z) - yaw)
  }

  function relativePitch(root: Object3D): number {
    const flat = Math.hypot(target.x - root.position.x, target.z - root.position.z)
    const rise = target.y - (root.position.y + HEAD_HEIGHT)
    return clamp(Math.atan2(rise, Math.max(flat, 0.001)), -MAX_HEAD_PITCH, MAX_HEAD_PITCH)
  }

  function notice(point: Vector3): void {
    target.copy(point)
    if (tracking) return
    tracking = true
    armed = false
    abandoned = false
  }

  function release(): void {
    tracking = false
  }

  function turnStep(root: Object3D, yaw: number, delta: number): number {
    if (!tracking) return 0
    const gap = relativeYaw(root, yaw)
    if (Math.abs(gap) <= TURN_DEAD_ZONE) return 0
    return Math.sign(gap) * Math.min(Math.abs(gap), TURN_SPEED * delta)
  }

  /** 绕世界轴后乘一段旋转：轴先换算到骨骼局部，原有姿态不会被破坏。 */
  function applyBone(
    bone: Object3D | null,
    overlay: Overlay,
    share: number,
    yawAngle: number,
    pitchAngle: number
  ): void {
    if (!bone || (yawAngle === 0 && pitchAngle === 0)) return
    overlay.base.copy(bone.quaternion)
    bone.getWorldQuaternion(boneQuat)
    const inverse = boneQuat.invert()
    const offset = overlay.applied.identity()
    axis.copy(worldUp).applyQuaternion(inverse).normalize()
    offset.multiply(spin.setFromAxisAngle(axis, yawAngle * share))
    axis.copy(bodyRight).applyQuaternion(rootQuat).applyQuaternion(inverse).normalize()
    // 绕 +X 正方向是低头，抬头取负角度。
    offset.multiply(spin.setFromAxisAngle(axis, -pitchAngle * share))
    bone.quaternion.multiply(offset)
    overlay.applied.copy(bone.quaternion)
    overlay.bone = bone
  }

  function follow(delta: number, root: Object3D, yaw: number, bones: AttentionBones): void {
    // 先撤掉上一帧的叠加：idle 时没有动画写 Head/Neck，不撤就会逐帧累积转圈。
    restore(neckOverlay)
    restore(headOverlay)

    const gap = relativeYaw(root, yaw)
    if (tracking && !abandoned) {
      if (Math.abs(gap) <= MAX_HEAD_YAW) armed = true
      else if (armed) abandoned = true
    }

    const wanted = tracking && !abandoned && Math.abs(gap) <= MAX_HEAD_YAW ? 1 : 0
    const rate = wanted > weight ? FADE_IN : FADE_OUT
    weight += (wanted - weight) * Math.min(1, delta * rate)
    if (weight < 0.002) {
      weight = 0
      return
    }

    root.getWorldQuaternion(rootQuat)
    const yawAngle = clamp(gap, -MAX_HEAD_YAW, MAX_HEAD_YAW) * weight
    const pitchAngle = relativePitch(root) * weight
    applyBone(bones.neck, neckOverlay, NECK_SHARE, yawAngle, pitchAngle)
    applyBone(bones.head, headOverlay, 1 - NECK_SHARE, yawAngle, pitchAngle)
  }

  return { notice, release, turnStep, follow }
}
