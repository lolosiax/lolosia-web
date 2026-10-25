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
  update(delta: number): void
  /** 回到模型静止姿态，退出剪辑驱动时用。 */
  reset(): void
}

interface Track {
  node: Object3D
  rest: Quaternion
  restLocal: Quaternion
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
export function createClipPlayer(root: Object3D, clip: ClipData): ClipPlayer | null {
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
        restLocal: node.quaternion.clone(),
        rot: bone.rot,
        depth: depthOf(node)
      })
    }
  }
  if (tracks.length === 0) return null

  // 父骨先应用，子骨才能拿到本帧的父级世界旋转。
  tracks.sort((a, b) => a.depth - b.depth)
  root.updateMatrixWorld(true)
  for (const track of tracks) track.rest.copy(track.node.getWorldQuaternion(new Quaternion()))

  const rotA = new Quaternion()
  const rotB = new Quaternion()
  const parentQ = new Quaternion()
  const target = new Quaternion()
  let time = 0

  function update(delta: number): void {
    time = (time + delta) % clip.duration
    const frame = time * clip.fps
    const index = Math.floor(frame)
    const alpha = frame - index

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
        target.copy(track.rest).premultiply(mirrorInPlace(rotA))
        track.node.quaternion.copy(parentQ.invert().multiply(target))
      } else {
        track.node.quaternion.copy(rotA)
      }
    }
  }

  function reset(): void {
    for (const track of tracks) track.node.quaternion.copy(track.restLocal)
  }

  return {
    get time() {
      return time
    },
    update,
    reset
  }
}
