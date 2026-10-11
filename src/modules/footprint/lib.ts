import { footprintRawUrl, footprintThumbUrl } from './api'
import type { FootprintCluster, FootprintPoint, FootprintRegion, FootprintPeriod } from './api'

export const DEFAULT_REGION_COLOR = '#e0703c'

/** 缩略图 / 原图直链。 */
export function thumbOf(item: { path: string; exp: number; sig: string }, size = 256): string {
  return footprintThumbUrl(item, size)
}

export function rawOf(item: { path: string; exp: number; sig: string }): string {
  return footprintRawUrl(item)
}

/** 露骨 / 擦边图默认糊上，点一下才看（与文件管理器同口径）。 */
export function isSensitive(rating: string): boolean {
  return rating === 'explicit' || rating === 'questionable'
}

export function sortByTimeDesc(rows: FootprintPoint[]): FootprintPoint[] {
  return [...rows].sort((a, b) => b.takenAt - a.takenAt)
}

const pad = (value: number): string => String(value).padStart(2, '0')

export function fmtDate(ms: number): string {
  if (!ms) return '时间未知'
  const date = new Date(ms)
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function fmtDateTime(ms: number): string {
  if (!ms) return '时间未知'
  const date = new Date(ms)
  return `${fmtDate(ms)} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function fmtRadius(metres: number): string {
  return metres >= 1000 ? `${(metres / 1000).toFixed(1)} km` : `${Math.round(metres)} m`
}

export function periodRange(period: FootprintPeriod): string {
  const same = fmtDate(period.startAt) === fmtDate(period.endAt)
  return same ? fmtDate(period.startAt) : `${fmtDate(period.startAt)} ~ ${fmtDate(period.endAt)}`
}

export function clusterRange(cluster: FootprintCluster): string {
  if (!cluster.firstAt) return '时间未知'
  if (cluster.firstAt === cluster.lastAt) return fmtDateTime(cluster.firstAt)
  const same = fmtDate(cluster.firstAt) === fmtDate(cluster.lastAt)
  return same ? `${fmtDate(cluster.firstAt)} 起` : `${fmtDate(cluster.firstAt)} ~ ${fmtDate(cluster.lastAt)}`
}

/** 热点中心是否被某个区域圈住（以圆心纬度做等距圆柱，圆形包含判定）。 */
export function coveredByRegion(cluster: FootprintCluster, regions: FootprintRegion[]): boolean {
  return regions.some(region => {
    const kx = Math.cos((region.lat * Math.PI) / 180) * 111320
    const dx = (cluster.lon - region.lon) * kx
    const dy = (cluster.lat - region.lat) * 111320
    return dx * dx + dy * dy <= region.radiusM * region.radiusM
  })
}

/** 由「中心点 + 半径」反算外接矩形，向后端要这一片里的散点。 */
export function boundsOf(lat: number, lon: number, radiusM: number): {
  minLat: number
  maxLat: number
  minLon: number
  maxLon: number
} {
  const dLat = (Math.max(radiusM, 50) * 1.3) / 111320
  const dLon = dLat / Math.max(Math.cos((lat * Math.PI) / 180), 0.01)
  return { minLat: lat - dLat, maxLat: lat + dLat, minLon: lon - dLon, maxLon: lon + dLon }
}
