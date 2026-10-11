import type { MetricDef } from './types'

/** 曲线画布（viewBox 600×200）的安全边距与基线。 */
const X0 = 8
const X1 = 592
const Y_TOP = 16
const Y_BOTTOM = 186

/** 纵轴范围：百分比固定 0~100，速率按峰值自适应，计数（累计值）贴合数据带。 */
export function scaleOf(metric: MetricDef, series: Record<string, number[]>): { min: number; max: number } {
  if (metric.kind === 'percent') return { min: 0, max: 100 }

  let min = Number.POSITIVE_INFINITY
  let max = Number.NEGATIVE_INFINITY
  for (const item of metric.series) {
    for (const value of series[item.apiKey] ?? []) {
      if (value < min) min = value
      if (value > max) max = value
    }
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) return { min: 0, max: 1 }

  if (metric.kind === 'count') {
    // 累计值基数高、波动小：用数据带撑开纵轴，免得曲线被压成一条直线
    const pad = max - min || Math.max(1, max * 0.1)
    return { min: Math.max(0, min - pad * 0.2), max: max + pad * 0.2 }
  }
  return { min: 0, max: max > 0 ? max * 1.15 : 1 }
}

/** 把一串点画成平滑曲线；`close` 时补到底边形成面积。 */
export function buildPath(
  metric: MetricDef,
  values: number[],
  allSeries: Record<string, number[]>,
  close: boolean
): string {
  if (!values.length) return ''
  const { min, max } = scaleOf(metric, allSeries)
  const span = max - min || 1
  const step = (X1 - X0) / Math.max(1, values.length - 1)
  const point = (value: number, index: number): [number, number] => [
    X0 + index * step,
    Y_BOTTOM - ((value - min) / span) * (Y_BOTTOM - Y_TOP)
  ]

  const points = values.map(point)
  const first = points[0]
  if (!first) return ''
  if (points.length === 1) return `M ${first[0].toFixed(1)} ${first[1].toFixed(1)}`

  let path = `M ${first[0].toFixed(1)} ${first[1].toFixed(1)}`
  for (let index = 0; index < points.length - 1; index += 1) {
    const [x0, y0] = points[index]!
    const [x1, y1] = points[index + 1]!
    const middle = (x0 + x1) / 2
    path += ` C ${middle.toFixed(1)} ${y0.toFixed(1)} ${middle.toFixed(1)} ${y1.toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`
  }
  if (close) path += ` L ${X1} ${Y_BOTTOM} L ${X0} ${Y_BOTTOM} Z`
  return path
}
