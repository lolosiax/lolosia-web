/** 足迹地图标签布局：先按优先级收集标签，再做像素级避让、侧边引线和兜底竖排。 */
import { wgs84ToGcj02 } from './coord'

export interface LabelItem {
  kind: 'region' | 'cluster'
  text: string
  weight: string
  lon: number
  lat: number
  radiusM: number
  color: string
  selected: boolean
  priority: number
  onClick: () => void
}

/** 布局需要的渲染上下文：坐标换算与最终绘制都交回组件。 */
export interface LabelContext {
  map: any
  AMap: any
  width: number
  height: number
  drawLabel: (item: LabelItem, x: number, y: number) => void
  drawLeader: (item: LabelItem, pts: [number, number][]) => void
}

interface RegionLike {
  id: number
  name: string
  count: number
  lat: number
  lon: number
  radiusM: number
  color?: string | null
}

interface ClusterLike {
  id: string | number
  count: number
  lat: number
  lon: number
  radiusM: number
}

interface Geo {
  item: LabelItem
  cx: number
  cy: number
  radiusPx: number
  w: number
  h: number
}

interface Rect {
  x: number
  y: number
  w: number
  h: number
}

interface Pt {
  x: number
  y: number
}

/** 最多给多少个热点画数字标签（画太多会糊成一片）。 */
const LABEL_LIMIT = 30
const LABEL_FONT_SIZE = 12
const LABEL_BOX_H = 18
const LABEL_BOX_PAD_X = 14
const LABEL_GAP = 4
/** 饼图式折线引线：圆周先斜拉 [LEADER_STUB] px 到拐点，再水平 [LEADER_RUN] px 接到标签。 */
const LEADER_STUB = 14
const LEADER_RUN = 16

const measureCtx = document.createElement('canvas').getContext('2d')

export function buildLabelItems<R extends RegionLike, C extends ClusterLike>(
  regions: R[],
  clusters: C[],
  selectedKey: string,
  onRegion: (region: R) => void,
  onCluster: (cluster: C) => void
): LabelItem[] {
  const items: LabelItem[] = []
  for (const region of regions) {
    items.push({
      kind: 'region',
      text: `${region.name} · ${region.count}`,
      weight: '600',
      lon: region.lon,
      lat: region.lat,
      radiusM: Math.max(region.radiusM, 30),
      color: region.color || '#e0703c',
      selected: selectedKey === `r:${region.id}`,
      priority: 1_000_000 + region.count,
      onClick: () => onRegion(region)
    })
  }
  for (const cluster of clusters.slice(0, LABEL_LIMIT)) {
    items.push({
      kind: 'cluster',
      text: String(cluster.count),
      weight: '700',
      lon: cluster.lon,
      lat: cluster.lat,
      radiusM: Math.max(cluster.radiusM, 60),
      color: '#7c74a8',
      selected: selectedKey === `c:${cluster.id}`,
      priority: cluster.count,
      onClick: () => onCluster(cluster)
    })
  }
  return items.sort((a, b) => b.priority - a.priority)
}

/** 主入口：热点数字居中，区域标签做避让 / 侧边引线 / 兜底竖排。 */
export function layoutLabels(ctx: LabelContext, items: LabelItem[]): void {
  const geos = collectGeos(ctx, items)
  for (const geo of geos) {
    if (geo.item.kind === 'cluster') ctx.drawLabel(geo.item, geo.cx, geo.cy)
  }
  layoutRegionLabels(ctx, geos)
}

/** 把 AMap.Text / Polyline 的创建收在这里，组件只负责收集 overlay。 */
export function createLabelPainter(
  AMap: any,
  map: any,
  collect: (overlay: any) => void
): Pick<LabelContext, 'drawLabel' | 'drawLeader'> {
  function drawLabel(item: LabelItem, x: number, y: number): void {
    const lnglat = map.containerToLngLat(new AMap.Pixel(x, y))
    const label = new AMap.Text({
      text: item.text,
      position: [lnglat.getLng(), lnglat.getLat()],
      anchor: 'center',
      zIndex: item.kind === 'region' ? (item.selected ? 31 : 23) : item.selected ? 21 : 11,
      style:
        item.kind === 'region'
          ? {
              'background-color': item.selected ? item.color : 'rgba(224,112,60,0.9)',
              color: '#fff',
              border: 'none',
              'border-radius': '9px',
              padding: '1px 6px',
              'font-size': `${LABEL_FONT_SIZE}px`,
              'font-weight': '600',
              'line-height': `${LABEL_BOX_H}px`,
              'white-space': 'nowrap'
            }
          : {
              'background-color': 'transparent',
              color: item.selected ? '#4a4363' : item.color,
              'font-weight': '700',
              'font-size': `${LABEL_FONT_SIZE}px`,
              'line-height': `${LABEL_BOX_H}px`,
              'white-space': 'nowrap',
              border: 'none',
              'text-shadow': '0 0 3px #fff, 0 0 3px #fff, 0 0 3px #fff'
            }
    })
    label.on('click', item.onClick)
    map.add(label)
    collect(label)
  }

  function drawLeader(item: LabelItem, pts: [number, number][]): void {
    const path = pts.map(point => {
      const lnglat = map.containerToLngLat(new AMap.Pixel(point[0], point[1]))
      return [lnglat.getLng(), lnglat.getLat()]
    })
    const line = new AMap.Polyline({
      path,
      strokeColor: item.color,
      strokeWeight: 1,
      strokeOpacity: 0.75,
      strokeStyle: 'solid',
      zIndex: item.kind === 'region' ? 22 : 10
    })
    map.add(line)
    collect(line)
  }

  return { drawLabel, drawLeader }
}

function measureWidth(text: string, weight: string): number {
  if (!measureCtx) return text.length * LABEL_FONT_SIZE
  measureCtx.font = `${weight} ${LABEL_FONT_SIZE}px sans-serif`
  return measureCtx.measureText(text).width
}

function collectGeos(ctx: LabelContext, items: LabelItem[]): Geo[] {
  const { map, AMap } = ctx
  const geos: Geo[] = []
  for (const item of items) {
    const [lng, lat] = wgs84ToGcj02(item.lon, item.lat)
    const center = map.lngLatToContainer(new AMap.LngLat(lng, lat))
    if (!center) continue
    const edgeLon = lng + item.radiusM / (111320 * Math.max(Math.cos((lat * Math.PI) / 180), 0.01))
    const edge = map.lngLatToContainer(new AMap.LngLat(edgeLon, lat))
    geos.push({
      item,
      cx: center.x,
      cy: center.y,
      radiusPx: edge ? Math.abs(edge.x - center.x) : 0,
      w: measureWidth(item.text, item.weight) + LABEL_BOX_PAD_X,
      h: LABEL_BOX_H
    })
  }
  return geos
}

function layoutRegionLabels(ctx: LabelContext, geos: Geo[]): void {
  const placed: Rect[] = []
  const vertical: Geo[] = []
  const bySide: Record<string, { geo: Geo; ax: number; ay: number }[]> = { '-1': [], '1': [] }

  for (const geo of geos) {
    if (geo.item.kind !== 'region') continue
    // 圆直径装得下整条标签 → 直接居中，不拉线
    if (geo.radiusPx * 2 >= geo.w + 6 && geo.radiusPx * 2 >= geo.h + 6) {
      ctx.drawLabel(geo.item, geo.cx, geo.cy)
      placed.push({ x: geo.cx, y: geo.cy, w: geo.w, h: geo.h })
      continue
    }
    const side = geo.cx <= ctx.width / 2 ? -1 : 1
    const radius = Math.max(geo.radiusPx, 3)
    bySide[String(side)]!.push({
      geo,
      ax: geo.cx + side * radius * 0.92,
      ay: geo.cy - Math.min(radius * 0.4, 12)
    })
  }

  for (const key of ['-1', '1'] as const) layoutSide(ctx, Number(key), bySide[key]!, placed, vertical)
  layoutVertical(ctx, vertical, placed)
}

/**
 * 同侧共用一根「脊柱」竖线：所有标签靠立一排，锚点一律落在脊柱内侧，
 * 这样引线永远伸向标签、不会横穿同侧别的标签。
 */
function layoutSide(
  ctx: LabelContext,
  side: number,
  list: { geo: Geo; ax: number; ay: number }[],
  placed: Rect[],
  vertical: Geo[]
): void {
  if (!list.length) return

  const spineX =
    list.reduce((acc, item) => {
      const outer = item.geo.cx + side * Math.max(item.geo.radiusPx, 3)
      return side > 0 ? Math.max(acc, outer) : Math.min(acc, outer)
    }, side > 0 ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY) + side * LEADER_STUB
  const labelEdgeX = spineX + side * LEADER_RUN

  list.sort((a, b) => a.ay - b.ay)
  let cursor = -Infinity
  for (const { geo, ax, ay } of list) {
    const fitsH = side > 0 ? labelEdgeX + geo.w <= ctx.width - 2 : labelEdgeX - geo.w >= 2
    if (!fitsH) {
      vertical.push(geo)
      continue
    }
    const labelCx = labelEdgeX + side * (geo.w / 2)
    const minY = geo.h / 2 + 2
    const maxY = ctx.height ? ctx.height - geo.h / 2 - 2 : Number.POSITIVE_INFINITY
    let y = Math.min(Math.max(ay, cursor + geo.h / 2 + LABEL_GAP, minY), maxY)
    let box: Rect = { x: labelCx, y, w: geo.w, h: geo.h }
    let path: Pt[] = [
      { x: ax, y: ay },
      { x: spineX, y },
      { x: labelEdgeX, y }
    ]
    for (let k = 0; k < 8 && conflicts(box, path, placed); k++) {
      if (y >= maxY) break
      y = Math.min(y + geo.h + LABEL_GAP, maxY)
      box = { x: labelCx, y, w: geo.w, h: geo.h }
      path = [
        { x: ax, y: ay },
        { x: spineX, y },
        { x: labelEdgeX, y }
      ]
    }
    cursor = Math.max(cursor, y + geo.h / 2)
    ctx.drawLeader(
      geo.item,
      path.map(point => [point.x, point.y] as [number, number])
    )
    ctx.drawLabel(geo.item, labelCx, y)
    placed.push(box)
  }
}

/** 左右都放不下时：退回圆下方竖排，从圆周正下方拉一条短线。 */
function layoutVertical(ctx: LabelContext, geos: Geo[], placed: Rect[]): void {
  for (const geo of geos) {
    const radius = Math.max(geo.radiusPx, 3)
    const base = { x: geo.cx, y: geo.cy + radius + geo.h / 2 + LABEL_GAP }
    const pos = placeLabel(base, geo.w, geo.h, placed)
    placed.push({ x: pos.x, y: pos.y, w: geo.w, h: geo.h })
    ctx.drawLabel(geo.item, pos.x, pos.y)
    const belowDx = pos.x - geo.cx
    const belowDy = Math.sqrt(Math.max(radius * radius - belowDx * belowDx, 0))
    ctx.drawLeader(geo.item, [
      [geo.cx, geo.cy + belowDy],
      [pos.x, pos.y - geo.h / 2]
    ])
  }
}

function overlaps(a: Rect, b: Rect): boolean {
  return Math.abs(a.x - b.x) < (a.w + b.w) / 2 + LABEL_GAP && Math.abs(a.y - b.y) < (a.h + b.h) / 2 + LABEL_GAP
}

function segSeg(a: Pt, b: Pt, c: Pt, d: Pt): boolean {
  const cross = (o: Pt, p: Pt, q: Pt): number => (p.x - o.x) * (q.y - o.y) - (p.y - o.y) * (q.x - o.x)
  const d1 = cross(c, d, a)
  const d2 = cross(c, d, b)
  const d3 = cross(a, b, c)
  const d4 = cross(a, b, d)
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))
}

function segRect(a: Pt, b: Pt, r: Rect, pad = 0): boolean {
  const hw = r.w / 2 + pad
  const hh = r.h / 2 + pad
  const inside = (p: Pt): boolean => Math.abs(p.x - r.x) <= hw && Math.abs(p.y - r.y) <= hh
  if (inside(a) || inside(b)) return true
  const corners: Pt[] = [
    { x: r.x - hw, y: r.y - hh },
    { x: r.x + hw, y: r.y - hh },
    { x: r.x + hw, y: r.y + hh },
    { x: r.x - hw, y: r.y + hh }
  ]
  for (let i = 0; i < 4; i++) {
    if (segSeg(a, b, corners[i]!, corners[(i + 1) % 4]!)) return true
  }
  return false
}

function conflicts(box: Rect, path: Pt[], placed: Rect[]): boolean {
  for (const item of placed) {
    if (overlaps(item, box)) return true
    for (let i = 0; i < path.length - 1; i++) {
      if (segRect(path[i]!, path[i + 1]!, item, 2)) return true
    }
  }
  return false
}

function placeLabel(base: Pt, w: number, h: number, placed: Rect[]): { x: number; y: number; moved: boolean } {
  const candidates: Pt[] = [{ ...base }]
  const stepY = h + LABEL_GAP
  for (let k = 1; k <= 5; k++) candidates.push({ x: base.x, y: base.y + k * stepY })
  for (let k = 1; k <= 3; k++) {
    candidates.push({ x: base.x + k * (w / 2 + 10), y: base.y })
    candidates.push({ x: base.x - k * (w / 2 + 10), y: base.y })
    candidates.push({ x: base.x + k * (w / 2 + 10), y: base.y + stepY })
    candidates.push({ x: base.x - k * (w / 2 + 10), y: base.y + stepY })
  }
  for (const candidate of candidates) {
    const box: Rect = { x: candidate.x, y: candidate.y, w, h }
    if (!placed.some(item => overlaps(item, box))) {
      return { x: candidate.x, y: candidate.y, moved: candidate.x !== base.x || candidate.y !== base.y }
    }
  }
  const last = candidates[candidates.length - 1]!
  return { x: last.x, y: last.y, moved: true }
}
