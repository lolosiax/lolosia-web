/** 仪表盘的视图模型：接口 DTO 在 `api.ts`，这里只放组件要画的形状。 */

export type MetricKey = 'cpu' | 'mem' | 'net' | 'disk' | 'token'

export interface MetricSeriesDef {
  key: string
  name: string
  color: string
  /** 对应 `/dashboard/metrics` 返回的系列 key。 */
  apiKey: string
}

export interface MetricDef {
  key: MetricKey
  label: string
  unit: string
  color: string
  icon: string
  /** 百分比 / 速率 / 计数：决定格式化与纵轴范围。 */
  kind: 'percent' | 'rate' | 'count'
  series: MetricSeriesDef[]
}

export interface RingView {
  key: string
  label: string
  color: string
  pct: number
  sub: string
}

export interface StatusPill {
  icon: string
  label: string
  value: string
  title: string
}

export interface PhotoView {
  path: string
  name: string
  src: string
  port: boolean
}

export interface HotTagView {
  namespace: string
  name: string
  count: number
}

export interface RankRow {
  key: string
  name: string
  sub: string
  hits: number
  color?: string
}

export interface ActiveFileView {
  path: string
  name: string
  dir: string
  time: string
  color: string
  icon: string
}

export interface RecentFileView {
  path: string
  name: string
  ext: string
  time: string
  color: string
}
