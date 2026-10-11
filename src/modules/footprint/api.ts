import { apiBaseUrl, get, post } from '@/core/lib/http'

/**
 * 足迹地图接口（与后端 `dto.FootprintDtos` 一一对应）。
 *
 * 聚类粒度（`eps` / `minPts` / `gapHours`）由前端按缩放级别 / 用户偏好传入，后端不预设阈值。
 */

/** 一个自动热点（空间聚类）。 */
export interface FootprintCluster {
  id: string
  lat: number
  lon: number
  count: number
  /** 覆盖半径（米）。 */
  radiusM: number
  /** 最早 / 最晚拍摄时刻（毫秒）；没有拍摄时间为 0。 */
  firstAt: number
  lastAt: number
  /** 代表图（离中心最近的那张），用来出缩略图。 */
  samplePath: string
  sampleName: string
  sampleRating: string
  exp: number
  sig: string
}

/** 一个人工命名的区域圈。 */
export interface FootprintRegion {
  id: number
  name: string
  lat: number
  lon: number
  radiusM: number
  color: string | null
  description: string | null
  /** 圈内图数（后端现算）。 */
  count: number
  /** 代表图：圈内优先取带「喜欢」标签且离圆心最近的一张；空串 = 圈里没图。 */
  samplePath: string
  sampleName: string
  sampleRating: string
  exp: number
  sig: string
}

/** 地图上的一颗散点。 */
export interface FootprintPoint {
  path: string
  name: string
  lat: number
  lon: number
  takenAt: number
  rating: string
  exp: number
  sig: string
}

/** 地点总览。 */
export interface FootprintOverview {
  /** 带 GPS 的图片 / 视频数。 */
  total: number
  /** 没有 GPS 的图片 / 视频数。 */
  noGps: number
  minLat: number | null
  minLon: number | null
  maxLat: number | null
  maxLon: number | null
  clusters: FootprintCluster[]
  regions: FootprintRegion[]
}

/** 一个时间会话（时间聚类）。 */
export interface FootprintPeriod {
  id: string
  startAt: number
  endAt: number
  count: number
  samplePath: string
  sampleName: string
  sampleRating: string
  exp: number
  sig: string
}

/** 时间总览。 */
export interface FootprintTimeline {
  /** 带拍摄时间的图片 / 视频数。 */
  total: number
  /** 没有拍摄时间的图片 / 视频数。 */
  noTime: number
  periods: FootprintPeriod[]
}

/** 保存区域圈的请求体；`id` 为空 = 新建。 */
export interface FootprintRegionReq {
  id?: number
  name: string
  lat: number
  lon: number
  radiusM: number
  color?: string | null
  description?: string | null
}

/** 地点总览：自动热点 + 人工区域圈。 */
export function footprintOverview(eps?: number, minPts?: number, maxClusters?: number): Promise<FootprintOverview> {
  return get<FootprintOverview>('/media/footprint/overview', { eps, minPts, maxClusters })
}

/** 视图范围内的散点（放大后逐点显示）。 */
export function footprintPoints(bounds: {
  minLat?: number
  maxLat?: number
  minLon?: number
  maxLon?: number
  limit?: number
}): Promise<FootprintPoint[]> {
  return get<FootprintPoint[]>('/media/footprint/points', bounds)
}

/** 时间总览：按拍摄间隔切成会话。 */
export function footprintTimeline(gapHours?: number, limit?: number): Promise<FootprintTimeline> {
  return get<FootprintTimeline>('/media/footprint/timeline', { gapHours, limit })
}

/** 某个时间段内的全部图（含没有 GPS 的）。 */
export function footprintPeriodPhotos(from: number, to: number, limit?: number): Promise<FootprintPoint[]> {
  return get<FootprintPoint[]>('/media/footprint/period/photos', { from, to, limit })
}

/** 保存区域圈。 */
export function saveFootprintRegion(body: FootprintRegionReq): Promise<{ message: string }> {
  return post<{ message: string }>('/media/footprint/region/save', body)
}

/** 删除区域圈。 */
export function deleteFootprintRegion(id: number): Promise<{ message: string }> {
  return post<{ message: string }>('/media/footprint/region/delete', { id })
}

/** 由 `path` + `exp` + `sig` 拼缩略图直链（`<img src>` 直接可用）。 */
export function footprintThumbUrl(item: { path: string; exp: number; sig: string }, size: number, token?: number): string {
  const bust = token ? `&t=${token}` : ''
  return `${apiBaseUrl}files/thumb?path=${encodeURIComponent(item.path)}&size=${size}&exp=${item.exp}&sig=${item.sig}${bust}`
}

/** 原图直链（全屏查看用）。 */
export function footprintRawUrl(item: { path: string; exp: number; sig: string }, token?: number): string {
  const bust = token ? `&t=${token}` : ''
  return `${apiBaseUrl}files/raw?path=${encodeURIComponent(item.path)}&exp=${item.exp}&sig=${item.sig}${bust}`
}
