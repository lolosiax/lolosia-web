/**
 * 原地转身时的脚掌策略：身体转动、脚留在原来的世界朝向，
 * 单脚相对身体的偏角超过阈值就换步（抬脚 → 落到身体新朝向下），左右交替。
 *
 * 限位是刚性的：偏角被 clamp 在 MAX_OFFSET 内，且同一时刻只允许一只脚离地，
 * 因此大腿不会被无限拧转，两条腿也不会交叉。
 */

/** 单脚相对身体的最大偏角：再大就会扭到大腿。 */
const MAX_OFFSET = (50 * Math.PI) / 180
/** 触发换步的偏角：留出余量，避免贴着上限才动。 */
const STEP_AT = (26 * Math.PI) / 180
/** 一次换步的时长（秒）与抬脚高度（米）。 */
const STEP_TIME = 0.24
const STEP_LIFT = 0.05
/** 行走接管后偏移与权重的回落速率。 */
const DECAY = 10

export interface FootPivot {
  /** 相对身体的偏航偏移（弧度）：符号与身体转动方向相反，表示脚「落后」于身体。 */
  offset: number
  /** 换步时的抬脚高度（米）。 */
  lift: number
}

export interface TurnPivot {
  readonly left: FootPivot
  readonly right: FootPivot
  /** 站立转身时给腿部 IK 的权重：偏移越大越需要把脚钉在水面上。 */
  readonly weight: number
  /**
   * @param yawDelta 身体本帧的偏航增量（弧度）
   * @param standing 是否处于站立：false 时偏移与权重回收，交还给行走步态与程序化摆动
   */
  update(delta: number, yawDelta: number, standing: boolean): void
}

function smooth(t: number): number {
  return t * t * (3 - 2 * t)
}

function clampOffset(value: number): number {
  return Math.min(MAX_OFFSET, Math.max(-MAX_OFFSET, value))
}

export function createTurnPivot(): TurnPivot {
  const left: FootPivot = { offset: 0, lift: 0 }
  const right: FootPivot = { offset: 0, lift: 0 }
  let weight = 0
  /** 正在换步的脚；null 表示双脚都钉着。同一时刻只允许一只脚离地。 */
  let stepping: FootPivot | null = null
  let stepAge = 0
  let stepFrom = 0

  function beginStep(foot: FootPivot): void {
    stepping = foot
    stepAge = 0
    stepFrom = foot.offset
  }

  function advanceStep(delta: number): void {
    const foot = stepping
    if (!foot) return
    stepAge = Math.min(1, stepAge + delta / STEP_TIME)
    foot.offset = stepFrom * (1 - smooth(stepAge))
    foot.lift = STEP_LIFT * Math.sin(Math.PI * stepAge)
    if (stepAge >= 1) {
      foot.offset = 0
      foot.lift = 0
      stepping = null
    }
  }

  /** 偏角大的那只先换；它归零后另一只自然接上，于是左右交替。 */
  function pickStep(): void {
    const foot = Math.abs(left.offset) >= Math.abs(right.offset) ? left : right
    if (Math.abs(foot.offset) > STEP_AT) beginStep(foot)
  }

  function relax(foot: FootPivot, delta: number): void {
    foot.offset -= foot.offset * Math.min(1, delta * DECAY)
    foot.lift = 0
    if (Math.abs(foot.offset) < 1e-4) foot.offset = 0
  }

  function update(delta: number, yawDelta: number, standing: boolean): void {
    if (!standing) {
      stepping = null
      relax(left, delta)
      relax(right, delta)
      weight -= weight * Math.min(1, delta * DECAY)
      return
    }

    // 身体转了而脚没动：相对身体的偏角按相反方向累积。
    left.offset = clampOffset(left.offset - yawDelta)
    right.offset = clampOffset(right.offset - yawDelta)

    if (stepping) advanceStep(delta)
    else pickStep()

    const peak = Math.max(Math.abs(left.offset), Math.abs(right.offset)) / MAX_OFFSET
    const wanted = Math.max(stepping ? 0.7 : 0, Math.min(1, peak * 2.4))
    weight += (wanted - weight) * Math.min(1, delta * 14)
  }

  return {
    left,
    right,
    get weight() {
      return weight
    },
    update
  }
}
