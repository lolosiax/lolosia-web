/** 视野操作：首次 fit 全部热点，以及侧栏选中后的聚焦。 */
import { wgs84ToGcj02 } from './coord'

interface ClusterLike {
  lat: number
  lon: number
}

interface FocusTarget {
  lat: number
  lon: number
  zoom?: number
  radiusM?: number
}

/** 首次自动取景时四周留出的余量（占视野跨度的比例）。 */
const FIT_PADDING_RATIO = 0.08

export function fitClusters(AMap: any, map: any, clusters: ClusterLike[]): void {
  const points = clusters.map(cluster => wgs84ToGcj02(cluster.lon, cluster.lat))
  if (!points.length) return

  const lons = points.map(point => point[0])
  const lats = points.map(point => point[1])
  const minLon = Math.min(...lons)
  const maxLon = Math.max(...lons)
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const padLon = (maxLon - minLon) * FIT_PADDING_RATIO || 0.05
  const padLat = (maxLat - minLat) * FIT_PADDING_RATIO || 0.05

  map.setBounds?.(new AMap.Bounds([minLon - padLon, minLat - padLat], [maxLon + padLon, maxLat + padLat]))
  if (clusters.length === 1) map.setZoomAndCenter?.(13, [lons[0], lats[0]])
}

/** 带 radiusM 时把整个圆收进视野，否则按缩放级别居中；右侧有浮层时把目标让到左边可见区。 */
export function focusMap(AMap: any, map: any, target: FocusTarget | null, insetRight = 0): void {
  if (!target) return
  const [lng, lat] = wgs84ToGcj02(target.lon, target.lat)
  if (target.radiusM) {
    const width = map.getSize?.()?.getWidth?.() ?? 0
    // 浮层占掉右侧一段：把经度跨度按比例放大，圆收进来后仍能整块落在可见区
    const fitFactor = insetRight > 0 && width > insetRight ? width / (width - insetRight) : 1
    const dLat = (target.radiusM * 1.15) / 111320
    const dLon = (dLat / Math.max(Math.cos((lat * Math.PI) / 180), 0.01)) * fitFactor
    map.setBounds?.(new AMap.Bounds([lng - dLon, lat - dLat], [lng + dLon, lat + dLat]), true)
  } else {
    map.setZoomAndCenter?.(target.zoom ?? 14, [lng, lat], true)
  }
  shiftForInset(AMap, map, insetRight)
}

/** 视野整体左移半个浮层宽度，让原本居中的目标落到「地图可见区」的中心。 */
function shiftForInset(AMap: any, map: any, insetRight: number): void {
  if (!insetRight) return
  const width = map.getSize?.()?.getWidth?.() ?? 0
  // 窄屏时浮层几乎占满地图，再左移会把目标推出屏幕，直接跳过
  if (width && insetRight > width - 160) return
  const center = map.getCenter?.()
  if (!center) return
  const pixel = map.lngLatToContainer(center)
  if (!pixel) return
  const next = map.containerToLngLat(new AMap.Pixel(pixel.x + insetRight / 2, pixel.y))
  map.setCenter?.(next, true)
}
