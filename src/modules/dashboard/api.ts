import { apiBaseUrl, get } from '@/core/lib/http'

/** 仪表盘接口（与后端 `controller.DashboardController` 的 DTO 一一对应）。 */

/** 文件卡片一行。 */
export interface DashboardFileRow {
  /** 相对浏览根的路径，根目录是空串。 */
  path: string
  name: string
  size: number
  /** 修改时间（毫秒）。 */
  mtime: number
  /** 资产类型（`image` / `video` / 其它），未索引为 `null`。 */
  kind: string | null
  /** 像素宽度 / 高度（未探测为 `null`），用于判断横竖屏排版。 */
  width: number | null
  height: number | null
  /** 直链签名：`exp` + `sig` 覆盖「路径 + 过期时间」，可用于 `files/thumb`。 */
  exp: number
  sig: string
}

/** top-ip 一行。 */
export interface DashboardIpRow {
  ip: string
  /** 归属地；当前不解析，恒为 `null`。 */
  region: string | null
  hits: number
}

/** top-host 一行。 */
export interface DashboardOriginRow {
  host: string
  hits: number
}

/** 热门标签一行。 */
export interface DashboardTagRow {
  namespace: string
  name: string
  count: number
}

/** 综合概览。 */
export interface DashboardOverview {
  topIps: DashboardIpRow[]
  origins: DashboardOriginRow[]
  recentAdded: DashboardFileRow[]
  recentActive: DashboardFileRow[]
  hotTags: DashboardTagRow[]
  recommended: DashboardFileRow[]
  popular: DashboardFileRow[]
}

/** 系统概览；Windows 恒 `available = false`。 */
export interface DashboardSystem {
  available: boolean
  cpu: number
  mem: number
  memUsed: number
  memTotal: number
  disk: number
  diskUsed: number
  diskTotal: number
  uptimeMs: number | null
}

/** 一条曲线。 */
export interface DashboardSeries {
  key: string
  name: string
  points: number[]
}

/** 指标曲线集合；Windows 恒 `available = false`。 */
export interface DashboardMetrics {
  range: string
  available: boolean
  series: DashboardSeries[]
}

/** 顶部状态胶囊：在线会话 / 今日请求 / 缓存命中 / token 用量。 */
export interface DashboardStatus {
  onlineSessions: number
  todayRequests: number
  cacheHits: number
  cacheMisses: number
  cacheHitRate: number
  /** 今日（北京时间）LLM token 累计用量。 */
  todayTokens: number
  /** LLM 累计成本（元）；按每个小时桶的峰谷档位逐桶折算。 */
  totalCost: number
}

/** 首屏汇总：IP / Origin 排行、最近文件、热门标签、推荐与受欢迎。 */
export function dashboardOverview(): Promise<DashboardOverview> {
  return get<DashboardOverview>('/dashboard/overview')
}

/** 系统概览（占用率 / 容量 / 运行时长）。 */
export function dashboardSystem(): Promise<DashboardSystem> {
  return get<DashboardSystem>('/dashboard/system')
}

/** 指标曲线（CPU / 内存 / 入站 / 出站 / 读 / 写）。 */
export function dashboardMetrics(range: string): Promise<DashboardMetrics> {
  return get<DashboardMetrics>('/dashboard/metrics', { range })
}

/** 顶部胶囊统计（在线会话 / 今日请求 / 缓存命中率）。 */
export function dashboardStatus(): Promise<DashboardStatus> {
  return get<DashboardStatus>('/dashboard/status')
}

/** 由 `exp` + `sig` 拼出缩略图直链（`<img src>` 直接可用）。 */
export function thumbUrl(row: DashboardFileRow, size: number): string {
  return `${apiBaseUrl}files/thumb?path=${encodeURIComponent(row.path)}&size=${size}&exp=${row.exp}&sig=${row.sig}`
}
