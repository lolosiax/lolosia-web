import { Matrix4, Object3D, Vector3 } from 'three'
import {
  MAX_SUBSTEPS,
  SUBSTEP,
  buildPhysBoneChain,
  resetPhysBoneChain,
  solvePhysBoneChain,
  type PhysBoneChain,
  type PhysBoneCollider,
  type PhysBoneSpec
} from './physbone-solver'

/**
 * Moe 的动骨物理：20 条链的参数表 + 1/60 s 固定子步调度。
 *
 * 数值取自本项目自己的 Avatar 资产（Moe_Debug.unity，2026-10 导出），
 * 与 PhysBone 组件的参数语义一一对应；只保留 GLB 中实际存在、
 * 且影响观感的 20 条链。求解器见 `physbone-solver.ts`。
 */

interface ChainEntry {
  readonly root: string
  readonly spec: PhysBoneSpec
}

function curve(points: Array<[number, number]>): ReadonlyArray<readonly [number, number]> {
  return points
}

/** 头发系默认参数（Back Hair / Sides Hair / Bangs / Ahoge 共用）。 */
function spec(overrides: Partial<PhysBoneSpec> = {}): PhysBoneSpec {
  return {
    pull: 0.1,
    spring: 0.5,
    stiffness: 0.05,
    gravity: 0.08,
    gravityFalloff: 1,
    immobile: 0.5,
    radius: 0.01,
    limit: 'angle',
    maxAngleX: 90,
    maxAngleZ: 45,
    limitRotation: [0, 0, 0],
    ...overrides
  }
}

const CHAIN_SPECS: ChainEntry[] = [
  { root: 'Back Hair.001', spec: spec({ limitRotation: [-15, 0, 80] }) },
  { root: 'Back Hair_L.001', spec: spec({ limitRotation: [-30, 0, 80] }) },
  { root: 'Back Hair_R.001', spec: spec({ limitRotation: [-30, 0, -80] }) },
  { root: 'Back Hair_L.007', spec: spec({ limitRotation: [-30, 0, 80] }) },
  { root: 'Back Hair_R.007', spec: spec({ limitRotation: [-30, 0, -80] }) },
  { root: 'Sides Hair_L.001', spec: spec({ maxAngleX: 55, limitRotation: [-15, 0, -50] }) },
  { root: 'Sides Hair_R.001', spec: spec({ maxAngleX: 55, limitRotation: [-15, 0, 50] }) },
  { root: 'Sides Hair_L.006', spec: spec({ maxAngleX: 50, limitRotation: [-15, 0, -50] }) },
  { root: 'Sides Hair_R.006', spec: spec({ maxAngleX: 50, limitRotation: [-15, 0, 50] }) },
  { root: 'Bangs.001', spec: spec({ maxAngleX: 35, limitRotation: [0, 0, -30] }) },
  { root: 'Bangs_L.001', spec: spec({ maxAngleX: 35, limitRotation: [0, 0, -30] }) },
  { root: 'Bangs_R.001', spec: spec({ maxAngleX: 35, limitRotation: [0, 0, 30] }) },
  { root: 'Bangs_L.002', spec: spec({ maxAngleX: 35, limitRotation: [0, 0, -30] }) },
  { root: 'Bangs_R.002', spec: spec({ maxAngleX: 35, limitRotation: [0, 0, 30] }) },
  // Unity 里该 PhysBone 的 rootTransform 指向 Ahoge.004（Ahoge.001 只是挂载点）。
  { root: 'Ahoge.004', spec: spec({ gravity: 0, gravityFalloff: 0, maxAngleX: 35 }) },
  {
    root: 'Tail.001',
    spec: spec({
      pull: 0.05,
      spring: 0.8,
      gravity: 0,
      gravityFalloff: 0,
      radius: 0.1,
      limit: 'polar',
      maxAngleX: 10,
      maxAngleZ: 90,
      limitRotation: [10, 0, 0],
      curves: {
        spring: curve([
          [0, 0.694],
          [1, 1]
        ]),
        maxAngleZ: curve([
          [0, 0.298],
          [0.293, 0.315],
          [1, 1]
        ]),
        radius: curve([
          [0, 0.373],
          [0.587, 0.878],
          [1, 0.472]
        ])
      }
    })
  },
  {
    root: 'Ear_L.001',
    spec: spec({
      pull: 0.05,
      spring: 0.9,
      gravity: 0,
      gravityFalloff: 0,
      radius: 0.05,
      maxAngleX: 60,
      curves: {
        radius: curve([
          [0, 1],
          [1, 0.147]
        ])
      }
    })
  },
  {
    root: 'Ear_R.001',
    spec: spec({
      pull: 0.05,
      spring: 0.9,
      gravity: 0,
      gravityFalloff: 0,
      radius: 0.05,
      maxAngleX: 60,
      curves: {
        radius: curve([
          [0, 1],
          [1, 0.147]
        ])
      }
    })
  },
  {
    root: 'breast_L',
    spec: spec({
      pull: 0.65,
      spring: 0.8,
      stiffness: 0,
      gravity: 0,
      gravityFalloff: 0,
      radius: 0.04,
      limit: 'polar',
      maxAngleX: 15,
      maxAngleZ: 10,
      limitRotation: [7, 0, 0],
      curves: {
        pull: curve([
          [0, 1],
          [0.188, 0.378],
          [1, 0.095]
        ]),
        spring: curve([
          [0, 0.698],
          [0.216, 0.2],
          [1, 1]
        ]),
        immobile: curve([
          [0, 1],
          [1, 0.494]
        ]),
        radius: curve([
          [0, 0],
          [0.648, 0.81],
          [1, 0.347]
        ])
      }
    })
  },
  {
    root: 'breast_R',
    spec: spec({
      pull: 0.65,
      spring: 0.8,
      stiffness: 0,
      gravity: 0,
      gravityFalloff: 0,
      radius: 0.04,
      limit: 'polar',
      maxAngleX: 15,
      maxAngleZ: 10,
      limitRotation: [7, 0, 0],
      curves: {
        pull: curve([
          [0, 1],
          [0.188, 0.378],
          [1, 0.095]
        ]),
        spring: curve([
          [0, 0.698],
          [0.216, 0.2],
          [1, 1]
        ]),
        immobile: curve([
          [0, 1],
          [1, 0.494]
        ]),
        radius: curve([
          [0, 0],
          [0.648, 0.81],
          [1, 0.347]
        ])
      }
    })
  }
]

/**
 * Unity 场景里这 20 条链的 VRCPhysBone 均未配置碰撞体（`colliders` 为空，
 * allowCollision 只会引入手部/世界碰撞器，本场景没有），因此这里不建碰撞球。
 */
const COLLIDER_BONES: Array<[string, number]> = []

export interface HairPhysics {
  update(delta: number): void
}

/** GLTFLoader 会清洗节点名（点号被删、空格变下划线），统一归一化后再匹配。 */
function normalize(name: string): string {
  return name.replace(/[\s_.-]/g, '').toLowerCase()
}

export function createHairPhysics(root: Object3D): HairPhysics | null {
  root.updateMatrixWorld(true)
  const lookup = new Map<string, Object3D>()
  root.traverse(object => {
    if (object.name) lookup.set(normalize(object.name), object)
  })

  const chains: PhysBoneChain[] = []
  for (const entry of CHAIN_SPECS) {
    const bone = lookup.get(normalize(entry.root))
    if (!bone) continue
    const chain = buildPhysBoneChain(bone, entry.spec)
    if (chain) chains.push(chain)
  }
  if (chains.length === 0) return null

  const colliders: PhysBoneCollider[] = []
  for (const [name, radius] of COLLIDER_BONES) {
    const bone = lookup.get(normalize(name))
    if (bone) colliders.push({ bone, center: new Vector3(), radius })
  }

  const immobile = new Matrix4()
  const invImmobile = new Matrix4()
  const origin = new Vector3()
  /** 尚未消费的时间（秒），对应 VRC 的 fixedTime / realTime 累加。 */
  let pending = 0

  function update(delta: number): void {
    // 物理结果不能反过来当输入：每帧先把骨链恢复到动画姿态。
    for (const chain of chains) resetPhysBoneChain(chain)

    // immobileType = World：只锁角色根节点的**位移**，旋转与动画照常生效。
    root.getWorldPosition(origin)
    immobile.makeTranslation(origin.x, origin.y, origin.z)
    invImmobile.copy(immobile).invert()
    for (const collider of colliders) collider.center.setFromMatrixPosition(collider.bone.matrixWorld)

    pending = Math.min(pending + Math.min(Math.max(delta, 0), 0.1), SUBSTEP * MAX_SUBSTEPS)
    const executions = Math.min(pending / SUBSTEP, MAX_SUBSTEPS)
    const count = Math.max(1, Math.ceil(executions))
    for (let i = 0; i < count; i++) {
      const ratio = Math.min(1, executions - i)
      if (ratio <= 0) continue
      for (const chain of chains) solvePhysBoneChain(chain, ratio, immobile, invImmobile, colliders)
    }
    if (executions >= 1) pending = (executions % 1) * SUBSTEP
  }

  return { update }
}
