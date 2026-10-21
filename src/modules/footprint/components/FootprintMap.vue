<script setup lang="ts">
/**
 * 足迹地图：高德 JS API 2.0 容器。
 *
 * 只负责「画」与「交互」——数据由页面拉好传进来，选中态由 `selectedKey` 驱动，
 * 圈选模式下点地图把坐标丢回页面。标签布局、省界、路网显隐都在这里处理。
 */
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { loadAmap } from '../amap'
import type { AmapMap, AmapNamespace, AmapOverlay } from '../amap'
import { gcj02ToWgs84, wgs84ToGcj02 } from '../coord'
import { createProvinceLayer } from '../district'
import { buildLabelItems, createLabelPainter, layoutLabels } from '../label-layout'
import { fitClusters, focusMap } from '../map-view'
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
    /** 右侧浮层占用的像素宽度：聚焦时把目标让到左边可见区。 */
    insetRight: number
  }>(),
  {
    clusters: () => [],
    regions: () => [],
    points: () => [],
    selectedKey: '',
    drawMode: false,
    focus: null,
    preview: null,
    insetRight: 0
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
/** 缩放到这个级别以上算「聚焦在一片」：被区域覆盖的热点也一并画出来。 */
const FOCUS_ZOOM = 12.5
/** 缩放到地级市 / 区县大小（约 10 级）以上才显示路网与建筑物。 */
const ROAD_ZOOM = 10

const el = ref<HTMLDivElement | null>(null)
const loading = ref(true)
const ready = ref(false)
const error = ref('')

let AMap: AmapNamespace
let map: AmapMap
let clusterCircles: AmapOverlay[] = []
let regionCircles: AmapOverlay[] = []
let pointMarkers: AmapOverlay[] = []
let labelOverlays: AmapOverlay[] = []
let previewOverlay: AmapOverlay | null = null
let districtLayer: AmapOverlay | null = null
let observer: ResizeObserver | null = null
let firstFit = false
/** 上次热点圆圈的显隐态（是否聚焦）：没变就不重画，免得每次缩放都闪一下。 */
let lastClusterFocused: boolean | null = null
/** 上次设置的地图要素集 key，避免重复 setFeatures。 */
let lastFeaturesKey: string | null = null

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
  ready.value = true
  map.on('click', onMapClick)
  map.on('moveend', onViewport)
  map.on('zoomend', onViewport)
  // 平移结束：标签的像素位置变了，重新避让一次
  map.on('moveend', relayoutLabels)
  // 缩放结束：切换路网 / 改热点显隐 / 重排标签
  map.on('zoomend', () => {
    syncMapFeatures()
    drawClusterCircles(false)
    relayoutLabels()
  })
  observer = new ResizeObserver(() => map?.resize?.())
  observer.observe(el.value)
  districtLayer = createProvinceLayer(AMap, map)
  syncMapFeatures()
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
  if (!ready.value || !map) return
  const bounds = map.getBounds?.()
  if (!bounds) return
  const sw = bounds.getSouthWest()
  const ne = bounds.getNorthEast()
  const [minLon, minLat] = gcj02ToWgs84(sw.getLng(), sw.getLat())
  const [maxLon, maxLat] = gcj02ToWgs84(ne.getLng(), ne.getLat())
  emit('viewport', { minLat, minLon, maxLat, maxLon, zoom: map.getZoom() })
}

/* ---------- 绘制 ---------- */

function redrawAll(): void {
  if (!ready.value) return
  drawClusterCircles(true)
  drawRegionCircles()
  relayoutLabels()
  drawPoints()
  maybeFit()
}

function clear(list: AmapOverlay[]): AmapOverlay[] {
  for (const overlay of list) {
    overlay?.off?.('click')
    map?.remove(overlay)
  }
  return []
}

/**
 * 自动热点：只画描边空心圆，数字交给标签层。
 *
 * 显隐规则（人工区域圈优先级更高）：
 * - 「聚焦」时（选中区域圈，或地图放大到 FOCUS_ZOOM 以上）→ 热点全画；
 * - 否则只画没被人工区域覆盖的热点；
 * - 当前选中的那一个始终画。
 */
function isFocusedOnRegion(): boolean {
  return props.selectedKey.startsWith('r:') || (map?.getZoom?.() ?? 0) >= FOCUS_ZOOM
}

function visibleClusters(): FootprintCluster[] {
  const focused = isFocusedOnRegion()
  return props.clusters.filter(cluster => {
    const selected = props.selectedKey === `c:${cluster.id}`
    return selected || focused || !covered(cluster)
  })
}

function drawClusterCircles(force: boolean): void {
  const focused = isFocusedOnRegion()
  if (!force && focused === lastClusterFocused) return
  lastClusterFocused = focused
  clusterCircles = clear(clusterCircles)
  if (!ready.value) return

  for (const cluster of visibleClusters()) {
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
    clusterCircles.push(circle)
  }
}

/** 热点中心是否落在某个区域圈里（以圆心纬度做等距圆柱，圆形包含判定）。 */
function covered(cluster: FootprintCluster): boolean {
  return props.regions.some(region => {
    const kx = Math.cos((region.lat * Math.PI) / 180) * 111320
    const dx = (cluster.lon - region.lon) * kx
    const dy = (cluster.lat - region.lat) * 111320
    return dx * dx + dy * dy <= region.radiusM * region.radiusM
  })
}

/** 人工区域：实心淡色圆（未选中虚线、选中实线）。 */
function drawRegionCircles(): void {
  regionCircles = clear(regionCircles)
  if (!ready.value) return

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
      strokeDasharray: selected ? undefined : [6, 4],
      cursor: 'pointer',
      bubble: true,
      zIndex: selected ? 30 : 22
    })
    circle.on('click', () => {
      if (!props.drawMode) emit('select-region', region)
    })
    map.add(circle)
    regionCircles.push(circle)
  }
}

/** 区域标签避让、热点数字都交给 label-layout；这里只提供上下文与回收。 */
function relayoutLabels(): void {
  labelOverlays = clear(labelOverlays)
  if (!ready.value || !map) return

  const painter = createLabelPainter(AMap, map, overlay => labelOverlays.push(overlay))
  const items = buildLabelItems(
    props.regions,
    visibleClusters(),
    props.selectedKey,
    region => {
      if (!props.drawMode) emit('select-region', region)
    },
    cluster => {
      if (!props.drawMode) emit('select-cluster', cluster)
    }
  )
  layoutLabels(
    {
      map,
      AMap,
      width: el.value?.clientWidth ?? 0,
      height: el.value?.clientHeight ?? 0,
      ...painter
    },
    items
  )
}

function syncMapFeatures(): void {
  if (!ready.value || !map) return
  const showRoads = (map.getZoom?.() ?? 0) >= ROAD_ZOOM
  const key = showRoads ? 'full' : 'base'
  if (key === lastFeaturesKey) return
  lastFeaturesKey = key
  map.setFeatures?.(showRoads ? ['bg', 'road', 'building', 'point'] : ['bg', 'point'])
  // 放大后底图自带省界，就不用重复描了；缩小到全国时才用自己那层
  districtLayer?.setMap?.(showRoads ? null : map)
}

function drawPoints(): void {
  pointMarkers = clear(pointMarkers)
  if (!ready.value) return
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
      cursor: 'pointer',
      bubble: true,
      zIndex: 40
    })
    map.add(marker)
    pointMarkers.push(marker)
  }
}

function drawPreview(): void {
  if (previewOverlay) {
    map?.remove(previewOverlay)
    previewOverlay = null
  }
  const preview = props.preview
  if (!ready.value || !preview) return
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

/** 首次拿到热点时自动把视野收到全部点上；之后交给用户自由缩放。 */
function maybeFit(): void {
  if (!ready.value || firstFit || !props.clusters.length) return
  firstFit = true
  fitClusters(AMap, map, props.clusters)
}

defineExpose({
  fit: () => {
    firstFit = false
    maybeFit()
    firstFit = true
  },
  resize: () => {
    map?.resize?.()
    relayoutLabels()
  }
})

watch(
  () => props.clusters,
  () => {
    drawClusterCircles(true)
    relayoutLabels()
    maybeFit()
  },
  { deep: true }
)
watch(
  () => props.regions,
  () => {
    drawRegionCircles()
    relayoutLabels()
  },
  { deep: true }
)
watch(() => props.points, drawPoints, { deep: true })
watch(() => props.preview, drawPreview, { deep: true })
watch(
  () => props.selectedKey,
  () => {
    drawClusterCircles(true)
    drawRegionCircles()
    relayoutLabels()
  }
)
watch(
  () => props.focus,
  target => {
    if (ready.value) focusMap(AMap, map, target, props.insetRight)
  }
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

  :deep(.amap-container) {
    border-radius: 16px;
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
