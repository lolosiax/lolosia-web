import type { Object3D } from 'three'
import { getRoot } from '@/core/lib/http'
import type { CharacterMode } from './character'
import { createClipPlayer, loadClip, type ClipPlayer } from './clip-animation'

/**
 * 烘焙动画（Unity 采样结果）目录。
 *
 * 动画体积大且不入库（`web/public/res` 已移除），由后端 `/res/resources/**`
 * 从 `<workDir>/resources/**` 直接读盘下发，不再打进 .exe 的内嵌 classpath。
 */
const CLIP_BASE = `${getRoot()}/res/resources/animations/`
/** AFK 动画（Unity Moe_AFK_Loop_by_Levin 烘焙结果）。 */
export const AFK_CLIP_URL = `${CLIP_BASE}moe_afk.json`
/** 行走剪辑（Unity 行走2 重定向烘焙结果），调试面板用来和程序化步态对比。 */
const WALK_CLIP_URL = `${CLIP_BASE}moe_walk.json`
/** 跑步剪辑：只在长程移动里出现。 */
const RUN_CLIP_URL = `${CLIP_BASE}moe_run.json`
/** 跑步的基础速度倍率区间：每次选中跑步时在其中随机，播放速率同步加快，避免脚打滑。 */
const RUN_RATE_MIN = 1.5
const RUN_RATE_MAX = 3
/** 目标直线距离超过该值才算「长程」，才有机会跑步。 */
const RUN_MIN_DISTANCE = 2
/** 与上一次同一种步态的权重倍数：提高连续性，但其他步态仍有机会被选中。 */
const REPEAT_BOOST = 3
/**
 * 三种移动剪辑与对应的移动速度（世界单位/秒）。
 * 速度 = 支撑相内脚相对髋部后退的距离 ÷ 支撑相时长（离线采样，1.15 单位身高）：
 * 行走1 每步 0.44（周期 1.36 s，支撑 60%）、行走2 0.33（1.30 s，60%）、
 * 跑步 0.24（0.93 s，59%）。按这个速度平移，脚在支撑相相对地面静止，不会打滑。
 * 进入 walk 时按距离与上次选择加权抽样；跑步额外乘 1.5~3 倍播放速率。
 */
const GAIT_CLIPS: ReadonlyArray<{ url: string; speed: number; weight: number }> = [
  { url: `${CLIP_BASE}moe_walk1.json`, speed: 0.54, weight: 0.4 },
  { url: WALK_CLIP_URL, speed: 0.42, weight: 0.45 },
  { url: RUN_CLIP_URL, speed: 0.44, weight: 0.6 }
]

export interface GaitPlayer {
  readonly url: string
  readonly speed: number
  /** 剪辑播放速率：跑步加速时同步放大，脚才不会打滑。 */
  readonly rate: number
  readonly player: ClipPlayer
}

export interface WalkControl {
  readonly player: ClipPlayer | null
  readonly mode: CharacterMode
  /** 按目标距离与上一次步态加权挑一个移动剪辑；剪辑未就绪时返回 null（退回程序化步态）。 */
  pickGait(distance: number): GaitPlayer | null
  setMode(mode: CharacterMode): void
}

/** 已载入的剪辑与抽样权重。 */
interface GaitEntry {
  url: string
  speed: number
  weight: number
  player: ClipPlayer
}

/** 三个移动剪辑并行载入；单个失败不影响其余剪辑与程序化步态。 */
async function loadGaitPlayers(root: Object3D, procedural?: ReadonlySet<Object3D>): Promise<GaitEntry[]> {
  const loaded = await Promise.all(
    GAIT_CLIPS.map(async entry => {
      try {
        const clip = await loadClip(entry.url)
        const player = clip ? createClipPlayer(root, clip, procedural) : null
        return player ? { url: entry.url, speed: entry.speed, weight: entry.weight, player } : null
      } catch (err) {
        console.warn('移动剪辑载入失败，退回程序化步态', entry.url, err)
        return null
      }
    })
  )
  return loaded.filter((entry): entry is GaitEntry => entry !== null)
}

/** 移动剪辑必须在骨骼静止时创建播放器，因此这里统一负责加载与开关。 */
export async function createWalkControl(
  root: Object3D,
  afk: boolean,
  onEnter: () => void,
  procedural?: ReadonlySet<Object3D>
): Promise<WalkControl> {
  const gaits = afk ? [] : await loadGaitPlayers(root, procedural)
  const player = gaits.find(entry => entry.url === WALK_CLIP_URL)?.player ?? null
  if (!afk && !player) console.warn('行走剪辑与骨骼不匹配，保持程序化步态')
  let mode: CharacterMode = 'auto'
  /** 上一次选中的步态下标；只加权不锁死，其他步态仍能出现。 */
  let lastGait = -1

  function pickGait(distance: number): GaitPlayer | null {
    if (gaits.length === 0) return null
    const weights = gaits.map((entry, index) => {
      if (entry.url === RUN_CLIP_URL && distance < RUN_MIN_DISTANCE) return 0
      return index === lastGait ? entry.weight * REPEAT_BOOST : entry.weight
    })
    let total = 0
    for (const weight of weights) total += weight
    if (total <= 0) return null

    let roll = Math.random() * total
    let index = gaits.length - 1
    for (let i = 0; i < weights.length; i++) {
      roll -= weights[i] ?? 0
      if (roll <= 0) {
        index = i
        break
      }
    }
    const entry = gaits[index]
    if (!entry) return null
    lastGait = index

    const rate = entry.url === RUN_CLIP_URL ? RUN_RATE_MIN + Math.random() * (RUN_RATE_MAX - RUN_RATE_MIN) : 1
    return { url: entry.url, speed: entry.speed * rate, rate, player: entry.player }
  }

  function setMode(next: CharacterMode): void {
    if (afk || next === mode) return
    if (next === 'clip' && !player) {
      console.warn('行走剪辑未就绪，保持自动步态')
      return
    }
    mode = next
    if (mode === 'clip') {
      onEnter()
      return
    }
    // 退出剪辑时把未被程序化步态覆盖的骨骼（手指、头等）还原，避免残留上一帧。
    gaits.forEach(entry => entry.player.reset())
    root.updateMatrixWorld(true)
  }

  return {
    player,
    pickGait,
    get mode() {
      return mode
    },
    setMode
  }
}

/** 剪辑权重按固定时间常数逼近目标（0 = 程序化步态，1 = 完全由剪辑驱动）。 */
export function blendGaitWeight(weight: number, walking: boolean, delta: number): number {
  const target = walking ? 1 : 0
  return weight + (target - weight) * Math.min(1, delta * 6)
}

/** 按权重驱动选中的剪辑；权重归零后还原骨骼并返回 null，交还程序化步态。 */
export function applyGaitClip(
  gait: GaitPlayer | null,
  weight: number,
  walking: boolean,
  delta: number,
  root: Object3D
): GaitPlayer | null {
  if (!gait) return null
  // 权重已淡到接近 0，骨骼基本就是程序化姿态，直接交还即可。
  // 不能在这里 reset()：那会把全身写回 bind（A/T-pose），收尾会闪一下骨架张开。
  if (!walking && weight < 0.01) return null
  gait.player.update(delta * gait.rate, weight)
  root.updateMatrixWorld(true)
  return gait
}
