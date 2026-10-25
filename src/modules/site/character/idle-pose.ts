import { Quaternion, Vector3 } from 'three'
import type { Group, Object3D } from 'three'

/** 小臂向身体中线折的角度：左小臂向右、右小臂向左，收掉 A-pose 的直臂。 */
const ELBOW_INWARD = (15 * Math.PI) / 180

const elbowWorld = new Quaternion()
const rootWorld = new Quaternion()
const elbowLocal = new Quaternion()
const elbowAxis = new Vector3()
const elbowBend = new Quaternion()

/** 绕角色前后轴把两条小臂向内折；行走剪辑随后会覆盖手臂骨骼。 */
export function bendElbowsInward(root: Group, left: Object3D | null, right: Object3D | null): void {
  root.getWorldQuaternion(rootWorld)
  for (let i = 0; i < 2; i++) {
    const elbow = i === 0 ? left : right
    if (!elbow) continue
    elbow.getWorldQuaternion(elbowWorld)
    elbowAxis.set(0, 0, 1).applyQuaternion(rootWorld)
    elbowLocal.copy(elbowWorld).invert()
    elbowAxis.applyQuaternion(elbowLocal).normalize()
    elbow.quaternion.multiply(elbowBend.setFromAxisAngle(elbowAxis, i === 0 ? -ELBOW_INWARD : ELBOW_INWARD))
  }
}
