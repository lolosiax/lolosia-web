import { Object3D, Quaternion } from 'three'

/** Unity 动画剪辑烘焙后的骨骼轨道；`path` 仅作调试参考，播放按 `name` 匹配。 */
export interface ClipBone {
  name: string
  path?: string
  rot: number[][]
}

export interface ClipData {
  name: string
  fps: number
  duration: number
  loop: boolean
  /** true 时 `rot` 是世界空间相对静止姿态的旋转增量（跨骨架轴向差异更稳）。 */
  worldDelta: boolean
  bones: ClipBone[]
}

export interface ClipPlayer {
  /** 当前播放时间（秒，0..duration），供诊断采样对齐使用。 */
  readonly time: number
  /** `weight` < 1 时与当前骨骼姿态做 slerp，用于 idle ↔ walk 的交叉淡化。 */
  update(delta: number, weight?: number): void
  /** 回到模型静止姿态，退出剪辑驱动时用。 */
  reset(): void
}

interface Track {
  node: Object3D
  /** 相对角色根节点的静止世界旋转，播放时再叠加根节点当前朝向。 */
  rest: Quaternion
  /**
   * 构造时的局部姿态（骨骼静止姿态）。
   *
   * 程序化骨架之外的骨骼（头、颈、肩、手、髋）淡入淡出都以它为落点：
   * 每次覆写而不是在当前姿态上叠加，头颈上的注意力遮罩才不会逐帧累积。
   */
  bind: Quaternion
  /** 该骨骼是否由程序化姿态/IK 每帧写入（手臂、腿、脊柱、手指）。 */
  procedural: boolean
  rot: number[][]
  depth: number
}

/** GLTFLoader 会清洗节点名（点号被删、空格变下划线），统一归一化后再匹配。 */
function normalize(name: string): string {
  return name.replace(/[\s_.-]/g, '').toLowerCase()
}

function depthOf(node: Object3D): number {
  let depth = 0
  for (let parent = node.parent; parent; parent = parent.parent) depth++
  return depth
}

/** Unity(左手, x 向右) → three(右手, x 向左) 的世界旋转换算。 */
function mirrorInPlace(q: Quaternion): Quaternion {
  q.y = -q.y
  q.z = -q.z
  return q
}

export async function loadClip(url: string): Promise<ClipData | null> {
  const response = await fetch(url)
  if (!response.ok) return null
  return (await response.json()) as ClipData
}

/**
 * 按 fps 插值循环播放剪辑。
 * worldDelta 模式：目标世界旋转 = Δ × 静止世界旋转，再换算回局部四元数，
 * 这样 Unity 骨架与 Blender 导出骨架的骨骼轴向差异不会把角色拧倒。
 *
 * Δ 是 Unity 世界系（左手、位置 x 向右）里的旋转；three 是右手系且位置 x 相反，
 * 所以要先做镜像换算 (x, y, z, w) → (x, -y, -z, w)，否则四肢会朝反方向摆
 * （典型表现：手臂甩到背后/头顶，腿抬反）。
 */
export function createClipPlayer(
  root: Object3D,
  clip: ClipData,
  procedural?: ReadonlySet<Object3D>
): ClipPlayer | null {
  if (!clip.bones.length || clip.fps <= 0 || clip.duration <= 0) return null

  const lookup = new Map<string, Object3D>()
  root.traverse(object => {
    if (object.name) lookup.set(normalize(object.name), object)
  })

  const tracks: Track[] = []
  for (const bone of clip.bones) {
    const node = lookup.get(normalize(bone.name))
    if (node) {
      tracks.push({
        node,
        rest: new Quaternion(),
        bind: node.quaternion.clone(),
        procedural: procedural?.has(node) ?? false,
        rot: bone.rot,
        depth: depthOf(node)
      })
    }
  }
  if (tracks.length === 0) return null

  // 父骨先应用，子骨才能拿到本帧的父级世界旋转。
  tracks.sort((a, b) => a.depth - b.depth)
  root.updateMatrixWorld(true)
  const rootRest = root.getWorldQuaternion(new Quaternion()).invert()
  for (const track of tracks) {
    track.rest.copy(track.node.getWorldQuaternion(new Quaternion()).premultiply(rootRest))
  }

  const rotA = new Quaternion()
  const rotB = new Quaternion()
  const parentQ = new Quaternion()
  const rootQ = new Quaternion()
  const target = new Quaternion()
  let time = 0

  function update(delta: number, weight = 1): void {
    time = (time + delta) % clip.duration
    const frame = time * clip.fps
    const index = Math.floor(frame)
    const alpha = frame - index
    const blend = Math.min(1, Math.max(0, weight))
    root.getWorldQuaternion(rootQ)

    for (const track of tracks) {
      const count = track.rot.length
      const first = track.rot[0]
      if (!first) continue
      const a = index % count
      const b = (a + 1) % count
      rotA.fromArray(track.rot[a] ?? first)
      rotB.fromArray(track.rot[b] ?? first)
      rotA.slerp(rotB, alpha)

      if (clip.worldDelta) {
        if (track.node.parent) track.node.parent.getWorldQuaternion(parentQ)
        else parentQ.identity()
        // 根节点朝向 × 世界增量 × 根局部静止旋转：角色转身时骨骼跟着转，而不是锁死在世界朝向。
        target.copy(track.rest).premultiply(mirrorInPlace(rotA)).premultiply(rootQ)
        target.copy(parentQ.invert().multiply(target))
      } else {
        target.copy(rotA)
      }

      // 程序化骨骼从「本帧姿态」开始插值，两端都是自然姿态，不经过 A/T-pose；
      // 其余骨骼（头颈肩手髋）每帧从 bind 覆写，避免把注意力遮罩当成基准逐帧累积。
      if (blend >= 1) track.node.quaternion.copy(target)
      else if (track.procedural) track.node.quaternion.slerp(target, blend)
      else track.node.quaternion.copy(track.bind).slerp(target, blend)
    }
  }

  function reset(): void {
    for (const track of tracks) track.node.quaternion.copy(track.bind)
  }

  return {
    get time() {
      return time
    },
    update,
    reset
  }
}
