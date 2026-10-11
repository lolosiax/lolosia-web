<script setup lang="ts">
/**
 * 足迹地图：高德 JS API 2.0 容器。
 *
 * 只负责「画」与「交互」——数据由页面拉好传进来，选中态由 `selectedKey` 驱动，
 * 圈选模式下点地图把坐标丢回页面。标签采用居中排布，不做复杂的避让引线。
 */
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { loadAmap } from '../amap'
import type { AmapMap, AmapNamespace, AmapOverlay } from '../amap'
import { gcj02ToWgs84, wgs84ToGcj02 } from '../coord'
import type { FootprintCluster, FootprintPoint, FootprintRegion } from '../api'

defineOptions({ name: 'FootprintMap' })

const props = withDefaults(
  defineProps<{
    clusters: FootprintCluster[]
    regions: FootprintRegion[]
    points: FootprintPoint[]
    /** 当前选中项的 key：`c:<热点id>` / `r:<区域id>`；空串表示没选中。 */
    selectedKey: string
    /** 圈选模式：点图落点交给页面去开「新建区域」对话框。 */
    drawMode: boolean
    /** 焦点目标：侧栏点某一项时让地图飞过去；带 `radiusM` 时把整个圆收进视野。 */
    focus: { lat: number; lon: number; zoom?: number; radiusM?: number } | null
    /** 圈选模式下待确认的圆（画在图上预览）。 */
    preview: { lat: number; lon: number; radiusM: number } | null
  }>(),
  {
    clusters: () => [],
    regions: () => [],
    points: () => [],
    selectedKey: '',
    drawMode: false,
    focus: null,
    preview: null
  }
)

const emit = defineEmits<{
  'select-cluster': [cluster: FootprintCluster]
  'select-region': [region: FootprintRegion]
  'pick-point': [point: { lat: number; lon: number }]
  viewport: [box: { minLat: number; minLon: number; maxLat: number; maxLon: number; zoom: number }]
  error: [message: string]
}>()

const CLUSTER_COLOR = '#7c74a8'
const REGION_COLOR = '#e0703c'
/** 缩放到这个级别以上才显示路网，免得全国视图被路网糊满。 */
const ROAD_ZOOM = 10

const el = ref<HTMLDivElement | null>(null)
const loading = ref(true)
const error = ref('')

let AMap: AmapNamespace
let map: AmapMap
let clusterOverlays: AmapOverlay[] = []
let regionOverlays: AmapOverlay[] = []
let pointOverlays: AmapOverlay[] = []
let previewOverlay: AmapOverlay | null = null
let observer: ResizeObserver | null = null
let firstFit = false

onMounted(async () => {
  try {
    AMap = await loadAmap()
  } catch (err) {
    loading.value = false
    error.value = err instanceof Error ? err.message : '地图加载失败'
    emit('error', error.value)
    return
  }
  if (!el.value) return
  map = new AMap.Map(el.value, {
    zoom: 11,
    center: [113.9, 30.6],
    viewMode: '2D',
    resizeEnable: true
  })
  loading.value = false
  map.on('click', onMapClick)
  map.on('moveend', onViewport)
  map.on('zoomend', onViewport)
  observer = new ResizeObserver(() => map?.resize?.())
  observer.observe(el.value)
  syncFeatures()
  redrawAll()
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
  map?.destroy?.()
  map = null as unknown as AmapMap
})

function onMapClick(event: { lnglat?: { getLng?: () => number; getLat?: () => number } }): void {
  if (!props.drawMode) return
  const lng = event.lnglat?.getLng?.()
  const lat = event.lnglat?.getLat?.()
  if (lng === undefined || lat === undefined) return
  // 地图落点是 GCJ-02，转回 WGS-84 再交给页面（数据层统一 WGS-84）
  const [wlon, wlat] = gcj02ToWgs84(lng, lat)
  emit('pick-point', { lat: wlat, lon: wlon })
}

function onViewport(): void {
  if (!map) return
  syncFeatures()
  const bounds = map.getBounds?.()
  if (!bounds) return
  const sw = bounds.getSouthWest()
  const ne = bounds.getNorthEast()
  const [minLon, minLat] = gcj02ToWgs84(sw.getLng(), sw.getLat())
  const [maxLon, maxLat] = gcj02ToWgs84(ne.getLng(), ne.getLat())
  emit('viewport', { minLat, minLon, maxLat, maxLon, zoom: map.getZoom() })
}

function syncFeatures(): void {
  if (!map) return
  const showRoads = (map.getZoom?.() ?? 0) >= ROAD_ZOOM
  map.setFeatures?.(showRoads ? ['bg', 'road', 'building', 'point'] : ['bg', 'point'])
}

/* ---------- 绘制 ---------- */

function clear(list: AmapOverlay[]): AmapOverlay[] {
  for (const overlay of list) {
    overlay?.off?.('click')
    map?.remove(overlay)
  }
  return []
}

function redrawAll(): void {
  drawClusters()
  drawRegions()
  drawPoints()
  maybeFit()
}

/** 自动热点：描边空心圆 + 数量；人工区域已覆盖的热点不再重复画。 */
function drawClusters(): void {
  clusterOverlays = clear(clusterOverlays)
  if (!map) return
  for (const cluster of props.clusters) {
    if (covered(cluster) && props.selectedKey !== `c:${cluster.id}`) continue
    const selected = props.selectedKey === `c:${cluster.id}`
    const [lng, lat] = wgs84ToGcj02(cluster.lon, cluster.lat)
    const circle = new AMap.Circle({
      center: [lng, lat],
      radius: Math.max(cluster.radiusM, 60),
      strokeColor: CLUSTER_COLOR,
      strokeWeight: selected ? 3 : 1.4,
      strokeOpacity: selected ? 1 : 0.85,
      fillColor: CLUSTER_COLOR,
      fillOpacity: 0,
      cursor: 'pointer',
      bubble: true,
      zIndex: selected ? 20 : 10
    })
    circle.on('click', () => {
      if (!props.drawMode) emit('select-cluster', cluster)
    })
    map.add(circle)
    clusterOverlays.push(circle)

    const label = new AMap.Text({
      text: String(cluster.count),
      position: [lng, lat],
      anchor: 'center',
      zIndex: selected ? 21 : 11,
      style: {
        'background-color': 'transparent',
        border: 'none',
        color: selected ? '#4a4363' : CLUSTER_COLOR,
        'font-size': '12px',
        'font-weight': '700',
        'text-shadow': '0 0 3px #fff, 0 0 3px #fff, 0 0 3px #fff'
      }
    })
    label.on('click', () => {
      if (!props.drawMode) emit('select-cluster', cluster)
    })
    map.add(label)
    clusterOverlays.push(label)
  }
}

function covered(cluster: FootprintCluster): boolean {
  return props.regions.some(region => {
    const kx = Math.cos((region.lat * Math.PI) / 180) * 111320
    const dx = (cluster.lon - region.lon) * kx
    const dy = (cluster.lat - region.lat) * 111320
    return dx * dx + dy * dy <= region.radiusM * region.radiusM
  })
}

/** 人工区域：实心淡色圆 + 名称。 */
function drawRegions(): void {
  regionOverlays = clear(regionOverlays)
  if (!map) return
  for (const region of props.regions) {
    const selected = props.selectedKey === `r:${region.id}`
    const color = region.color || REGION_COLOR
    const [lng, lat] = wgs84ToGcj02(region.lon, region.lat)
    const circle = new AMap.Circle({
      center: [lng, lat],
      radius: Math.max(region.radiusM, 30),
      strokeColor: color,
      strokeWeight: selected ? 3.5 : 2,
      strokeOpacity: 1,
      fillColor: color,
      fillOpacity: selected ? 0.32 : 0.18,
      strokeStyle: 'solid',
      cursor: 'pointer',
      bubble: true,
      zIndex: selected ? 30 : 22
    })
    circle.on('click', () => {
      if (!props.drawMode) emit('select-region', region)
    })
    map.add(circle)
    regionOverlays.push(circle)

    const label = new AMap.Text({
      text: `${region.name} · ${region.count}`,
      position: [lng, lat],
      anchor: 'center',
      zIndex: selected ? 31 : 23,
      style: {
        'background-color': selected ? color : 'rgba(224,112,60,0.9)',
        color: '#fff',
        border: 'none',
        'border-radius': '9px',
        padding: '1px 6px',
        'font-size': '12px',
        'font-weight': '600',
        'white-space': 'nowrap'
      }
    })
    label.on('click', () => {
      if (!props.drawMode) emit('select-region', region)
    })
    map.add(label)
    regionOverlays.push(label)
  }
}

function drawPoints(): void {
  pointOverlays = clear(pointOverlays)
  if (!map) return
  for (const point of props.points) {
    if (!Number.isFinite(point.lat) || !Number.isFinite(point.lon)) continue
    if (point.lat === 0 && point.lon === 0) continue
    const [lng, lat] = wgs84ToGcj02(point.lon, point.lat)
    const marker = new AMap.CircleMarker({
      center: [lng, lat],
      radius: 4,
      strokeColor: '#fff',
      strokeWeight: 1,
      fillColor: point.rating === 'explicit' || point.rating === 'questionable' ? '#d9534f' : '#4a90d9',
      fillOpacity: 0.9,
      bubble: true,
      zIndex: 40
    })
    map.add(marker)
    pointOverlays.push(marker)
  }
}

function drawPreview(): void {
  if (previewOverlay) {
    map?.remove(previewOverlay)
    previewOverlay = null
  }
  const preview = props.preview
  if (!map || !preview) return
  const [lng, lat] = wgs84ToGcj02(preview.lon, preview.lat)
  previewOverlay = new AMap.Circle({
    center: [lng, lat],
    radius: Math.max(preview.radiusM, 30),
    strokeColor: '#2f9e44',
    strokeWeight: 2.5,
    strokeOpacity: 1,
    fillColor: '#2f9e44',
    fillOpacity: 0.25,
    cursor: 'crosshair',
    zIndex: 50
  })
  map.add(previewOverlay)
  map.setCenter?.(new AMap.LngLat(lng, lat))
}

/* ---------- 视野 ---------- */

function maybeFit(): void {
  if (firstFit || !props.clusters.length || !map) return
  firstFit = true
  fitAll()
}

/** 把视野收进全部热点；只有一个点时直接放大到它。 */
function fitAll(): void {
  if (!map) return
  const points = props.clusters.map(cluster => wgs84ToGcj02(cluster.lon, cluster.lat))
  if (!points.length) return
  const lons = points.map(point => point[0])
  const lats = points.map(point => point[1])
  const minLon = Math.min(...lons)
  const maxLon = Math.max(...lons)
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const padLon = (maxLon - minLon) * 0.08 || 0.05
  const padLat = (maxLat - minLat) * 0.08 || 0.05
  map.setBounds?.(new AMap.Bounds([minLon - padLon, minLat - padLat], [maxLon + padLon, maxLat + padLat]))
  if (props.clusters.length === 1) map.setZoomAndCenter?.(13, [lons[0], lats[0]])
}

/** 侧栏选某一项 → 地图飞过去；带 `radiusM` 时按整个圆 fitBounds。 */
function focusOn(target: { lat: number; lon: number; zoom?: number; radiusM?: number } | null): void {
  if (!map || !target) return
  const [lng, lat] = wgs84ToGcj02(target.lon, target.lat)
  if (target.radiusM) {
    const dLat = (target.radiusM * 1.15) / 111320
    const dLon = dLat / Math.max(Math.cos((lat * Math.PI) / 180), 0.01)
    map.setBounds?.(new AMap.Bounds([lng - dLon, lat - dLat], [lng + dLon, lat + dLat]))
    return
  }
  map.setZoomAndCenter?.(target.zoom ?? 14, [lng, lat])
}

defineExpose({
  fit: () => {
    firstFit = false
    fitAll()
    firstFit = true
  },
  resize: () => map?.resize?.()
})

watch(
  () => props.clusters,
  () => {
    drawClusters()
    maybeFit()
  },
  { deep: true }
)
watch(
  () => props.regions,
  () => drawRegions(),
  { deep: true }
)
watch(() => props.points, drawPoints, { deep: true })
watch(() => props.preview, drawPreview, { deep: true })
watch(
  () => props.selectedKey,
  () => {
    drawClusters()
    drawRegions()
  }
)
watch(
  () => props.focus,
  target => focusOn(target)
)
</script>

<template>
  <div class="footprint-map" :class="{ 'is-draw': drawMode }">
    <div ref="el" class="footprint-map__canvas" />
    <div v-if="loading" class="footprint-map__mask">地图加载中…</div>
    <div v-else-if="error" class="footprint-map__mask is-error">{{ error }}</div>
    <div v-if="drawMode && !loading && !error" class="footprint-map__hint">
      <i class="bi bi-crosshair" />
      点击地图选择新区域中心点
    </div>
  </div>
</template>

<style scoped lang="scss">
.footprint-map {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  border-radius: 16px;

  &.is-draw .footprint-map__canvas {
    cursor: crosshair;
  }

  &__canvas {
    width: 100%;
    height: 100%;
  }

  &__mask {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 24px;
    background: rgba(255, 255, 255, 0.6);
    color: var(--el-text-color-secondary, #909399);
    font-size: 13px;
    text-align: center;
    backdrop-filter: blur(4px);

    &.is-error {
      color: var(--el-color-danger, #f56c6c);
    }
  }

  &__hint {
    position: absolute;
    top: 12px;
    left: 50%;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 5px 14px;
    border-radius: 999px;
    background: rgba(47, 158, 68, 0.9);
    box-shadow: 0 4px 12px rgba(31, 38, 135, 0.25);
    color: #fff;
    font-size: 12px;
    pointer-events: none;
    transform: translateX(-50%);
  }
}
</style>
