<script setup lang="ts">
// 足迹：地点（地图热点 / 区域圈）与时间（拍摄会话）两种视角。
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import AppPage from '@/core/ui/AppPage.vue'
import FootprintGallery from '../components/FootprintGallery.vue'
import FootprintMap from '../components/FootprintMap.vue'
import FootprintMinimap from '../components/FootprintMinimap.vue'
import FootprintPanel from '../components/FootprintPanel.vue'
import FootprintSidebar from '../components/FootprintSidebar.vue'
import RegionDialog from '../components/RegionDialog.vue'
import { useFootprintOverview } from '../composables/use-footprint-overview'
import { useFootprintTimeline } from '../composables/use-footprint-timeline'
import { coveredByRegion, periodRange, rawOf } from '../lib'
import type { FootprintCluster, FootprintPeriod, FootprintPoint, FootprintRegion } from '../api'

defineOptions({ name: 'Footprint' })

const EPS_OPTIONS = [
  { label: '精细 · 100m', value: 100 },
  { label: '标准 · 250m', value: 250 },
  { label: '片区 · 500m', value: 500 },
  { label: '城市 · 1500m', value: 1500 }
]

const GAP_OPTIONS = [
  { label: '2 小时', value: 2 },
  { label: '6 小时', value: 6 },
  { label: '12 小时', value: 12 },
  { label: '1 天', value: 24 }
]

const mode = ref<'place' | 'time'>('place')
const eps = ref(250)
const gapHours = ref(6)
/** 右侧浮层宽度（含外边距）：聚焦时让地图把目标挪到左侧可见区。 */
const PANEL_INSET = 460

const {
  overview,
  loading: placeLoading,
  error: placeError,
  photos: placePhotos,
  photosLoading: placePhotosLoading,
  viewportPoints,
  clusters,
  regions,
  loadOverview,
  loadPhotosByBounds,
  loadViewport
} = useFootprintOverview()

const {
  timeline,
  loading: timelineLoading,
  photos: timePhotos,
  photosLoading: timePhotosLoading,
  periods,
  loadTimeline,
  loadPeriodPhotos
} = useFootprintTimeline()

const selectedKey = ref('')
const drawerOpen = ref(false)
const focus = ref<{ lat: number; lon: number; zoom?: number; radiusM?: number } | null>(null)
/** 小地图上悬浮的区域：其余点位变灰。 */
const hoveredRegionId = ref<number | null>(null)
/** 主地图当前视口（WGS-84），给小地图画取景框。 */
const viewportBox = ref<{ minLat: number; minLon: number; maxLat: number; maxLon: number } | null>(null)
const drawMode = ref(false)
const preview = ref<{ lat: number; lon: number; radiusM: number } | null>(null)
/** 地图 SDK / key 加载失败：和列表错误一样显示在侧栏。 */
const mapError = ref('')

/** 新建 / 编辑区域：组件自己保存，页面只提供落点与编辑目标。 */
const regionDialog = reactive({
  open: false,
  region: null as FootprintRegion | null,
  lat: 0,
  lon: 0,
  radiusM: 300
})

/** 已放行遮罩的路径；缩略图取不到的路径退回图标占位。 */
const revealed = ref<Record<string, boolean>>({})
const brokenThumbs = ref<Set<string>>(new Set())

const viewer = reactive({ open: false, urls: [] as string[], index: 0 })
const mapRef = ref<InstanceType<typeof FootprintMap> | null>(null)

/** 已被人工区域圈住的热点不在侧栏重复列。 */
const hotspotClusters = computed(() => clusters.value.filter(cluster => !coveredByRegion(cluster, regions.value)))

const selectedCluster = computed<FootprintCluster | null>(
  () => clusters.value.find(cluster => `c:${cluster.id}` === selectedKey.value) ?? null
)
const selectedRegion = computed<FootprintRegion | null>(
  () => regions.value.find(region => `r:${region.id}` === selectedKey.value) ?? null
)
const selectedPeriod = computed<FootprintPeriod | null>(
  () => periods.value.find(period => period.id === selectedKey.value) ?? null
)
const drawerTitle = computed(() => {
  if (selectedRegion.value) return `${selectedRegion.value.name} · ${selectedRegion.value.count} 张`
  if (selectedCluster.value) return `热点 · ${selectedCluster.value.count} 张`
  return ''
})

function selectCluster(cluster: FootprintCluster): void {
  selectedKey.value = `c:${cluster.id}`
  focus.value = { lat: cluster.lat, lon: cluster.lon, zoom: 15 }
  void loadPhotosByBounds(cluster.lat, cluster.lon, Math.max(cluster.radiusM, 120))
  drawerOpen.value = true
}

function selectRegion(region: FootprintRegion): void {
  selectedKey.value = `r:${region.id}`
  focus.value = { lat: region.lat, lon: region.lon, radiusM: Math.max(region.radiusM, 150) }
  void loadPhotosByBounds(region.lat, region.lon, region.radiusM)
  drawerOpen.value = true
}

function selectPeriod(period: FootprintPeriod): void {
  selectedKey.value = period.id
  void loadPeriodPhotos(period)
}

function onViewport(box: { minLat: number; minLon: number; maxLat: number; maxLon: number; zoom: number }): void {
  viewportBox.value = { minLat: box.minLat, minLon: box.minLon, maxLat: box.maxLat, maxLon: box.maxLon }
  if (mode.value === 'place') loadViewport(box)
}

/* ---------- 区域圈 ---------- */

function startDraw(): void {
  drawMode.value = true
  ElMessage.info('点击地图选择新区域中心点')
}

function openRegion(region: FootprintRegion | null, lat: number, lon: number, radiusM: number): void {
  regionDialog.region = region
  regionDialog.lat = lat
  regionDialog.lon = lon
  regionDialog.radiusM = radiusM
  regionDialog.open = true
}

function onPickPoint(point: { lat: number; lon: number }): void {
  if (!drawMode.value) return
  drawMode.value = false
  openRegion(null, point.lat, point.lon, 300)
}

function newRegionFromCluster(): void {
  const cluster = selectedCluster.value
  if (!cluster) return
  drawerOpen.value = false
  openRegion(null, cluster.lat, cluster.lon, Math.max(cluster.radiusM, 150))
}

function editRegion(region: FootprintRegion): void {
  openRegion(region, region.lat, region.lon, region.radiusM)
}

function editSelectedRegion(): void {
  if (selectedRegion.value) editRegion(selectedRegion.value)
}

/** 编辑半径时把预览圆跟着改，和旧版实时反馈一致。 */
function onPreviewRadius(radiusM: number): void {
  if (!preview.value) return
  preview.value = { ...preview.value, radiusM }
}

function onRegionSaved(): void {
  void loadOverview(eps.value)
}

watch(
  () => regionDialog.open,
  open => {
    if (open) preview.value = { lat: regionDialog.lat, lon: regionDialog.lon, radiusM: regionDialog.radiusM }
    else preview.value = null
  }
)

/* ---------- 照片 ---------- */

function reveal(path: string): void {
  revealed.value = { ...revealed.value, [path]: true }
}

function markBroken(path: string): void {
  const next = new Set(brokenThumbs.value)
  next.add(path)
  brokenThumbs.value = next
}

function openViewer(list: FootprintPoint[], index: number): void {
  viewer.urls = list.map(item => rawOf(item))
  viewer.index = index
  viewer.open = true
}

/* ---------- 模式切换 ---------- */

watch(mode, async value => {
  selectedKey.value = ''
  drawerOpen.value = false
  hoveredRegionId.value = null
  if (value === 'time') {
    viewportPoints.value = []
    if (!timeline.value) await loadTimeline(gapHours.value)
    if (periods.value.length) selectPeriod(periods.value[0]!)
    return
  }
  await nextTick()
  mapRef.value?.resize()
})

watch(eps, value => {
  if (mode.value === 'place') void loadOverview(value)
})

watch(gapHours, value => void loadTimeline(value))

onMounted(() => void loadOverview(eps.value))
</script>

<template>
  <AppPage>
    <div class="footprint">
      <header class="footprint__toolbar">
        <ElRadioGroup v-model="mode">
          <ElRadioButton value="place">地点</ElRadioButton>
          <ElRadioButton value="time">时间</ElRadioButton>
        </ElRadioGroup>

        <span v-if="mode === 'place'" class="footprint__stat">
          共 <b>{{ overview?.total ?? 0 }}</b> 张带定位 · 另有 <b>{{ overview?.noGps ?? 0 }}</b> 张无定位
        </span>
        <span v-else class="footprint__stat">
          共 <b>{{ timeline?.total ?? 0 }}</b> 张有时间 · 另有 <b>{{ timeline?.noTime ?? 0 }}</b> 张无时间
        </span>

        <span v-if="mode === 'place'" class="footprint__label">聚簇粒度</span>
        <ElSelect v-if="mode === 'place'" v-model="eps" class="footprint__select">
          <ElOption v-for="option in EPS_OPTIONS" :key="option.value" :label="option.label" :value="option.value" />
        </ElSelect>
        <ElButton
          v-if="mode === 'place'"
          size="default"
          :type="drawMode ? 'success' : 'primary'"
          @click="startDraw"
        >
          <i class="bi bi-plus-circle" />
          新建区域
        </ElButton>
        <span v-if="mode === 'time'" class="footprint__label">会话间隔</span>
        <ElSelect v-if="mode === 'time'" v-model="gapHours" class="footprint__select is-narrow">
          <ElOption v-for="option in GAP_OPTIONS" :key="option.value" :label="option.label" :value="option.value" />
        </ElSelect>

        <ElButton
          size="default"
          :loading="mode === 'place' ? placeLoading : timelineLoading"
          @click="mode === 'place' ? loadOverview(eps) : loadTimeline(gapHours)"
        >
          <i class="bi bi-arrow-clockwise" />
          刷新
        </ElButton>
      </header>

      <div class="footprint__body">
        <FootprintSidebar
          :mode="mode"
          :loading="mode === 'place' ? placeLoading : timelineLoading"
          :error="placeError || mapError"
          :regions="regions"
          :clusters="hotspotClusters"
          :periods="periods"
          :selected-key="selectedKey"
          :broken-thumbs="brokenThumbs"
          @select-region="selectRegion"
          @select-cluster="selectCluster"
          @select-period="selectPeriod"
          @edit-region="editRegion"
          @hover-region="hoveredRegionId = $event"
          @broken="markBroken"
        />

        <section class="footprint__main" :class="{ 'is-time': mode === 'time' }">
          <FootprintMap
            v-show="mode === 'place'"
            ref="mapRef"
            class="footprint__map"
            :clusters="clusters"
            :regions="regions"
            :points="viewportPoints"
            :selected-key="selectedKey"
            :draw-mode="drawMode"
            :focus="focus"
            :preview="preview"
            :inset-right="drawerOpen ? PANEL_INSET : 0"
            @select-cluster="selectCluster"
            @select-region="selectRegion"
            @pick-point="onPickPoint"
            @viewport="onViewport"
            @error="mapError = $event"
          />
          <FootprintGallery
            v-if="mode === 'time'"
            :title="selectedPeriod ? periodRange(selectedPeriod) : '拍摄会话'"
            :subtitle="selectedPeriod ? `${selectedPeriod.count} 张` : ''"
            :photos="timePhotos"
            :loading="timePhotosLoading"
            :broken-thumbs="brokenThumbs"
            :revealed="revealed"
            @pick="openViewer(timePhotos, $event)"
            @reveal="reveal"
            @broken="markBroken"
          />
          <FootprintPanel
            v-if="drawerOpen && mode === 'place'"
            :title="drawerTitle"
            :photos="placePhotos"
            :loading="placePhotosLoading"
            :broken-thumbs="brokenThumbs"
            :revealed="revealed"
            :can-save-region="!!selectedCluster"
            :can-edit-region="!!selectedRegion"
            @close="drawerOpen = false"
            @save-region="newRegionFromCluster"
            @edit-region="editSelectedRegion"
            @pick="openViewer(placePhotos, $event)"
            @reveal="reveal"
            @broken="markBroken"
          />
          <FootprintMinimap
            v-show="mode === 'place'"
            :regions="regions"
            :active-id="selectedRegion?.id ?? null"
            :hovered-id="hoveredRegionId"
            :bounds="viewportBox"
            :shifted="drawerOpen"
            @select="selectRegion"
            @hover="hoveredRegionId = $event"
          />
        </section>
      </div>

      <RegionDialog
        v-model="regionDialog.open"
        :region="regionDialog.region"
        :lat="regionDialog.lat"
        :lon="regionDialog.lon"
        :radius-m="regionDialog.radiusM"
        @saved="onRegionSaved"
        @preview-radius="onPreviewRadius"
      />

      <ElImageViewer
        v-if="viewer.open"
        :url-list="viewer.urls"
        :initial-index="viewer.index"
        :z-index="3000"
        hide-on-click-modal
        teleported
        @close="viewer.open = false"
      />
    </div>
  </AppPage>
</template>

<style scoped lang="scss">
.footprint {
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 10px;
  height: 100%;
  min-height: 0;

  &__toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
    padding: 10px 16px;
    border: 1px solid rgba(255, 255, 255, 0.6);
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.45);
    box-shadow: 0 4px 16px rgba(31, 38, 135, 0.12);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);

    :deep(.el-radio-group) {
      height: 38px;
    }

    :deep(.el-radio-button__inner) {
      height: 38px;
      padding: 0 18px;
      border: 0;
      border-radius: 0;
      background: #f2eaf8;
      box-shadow: none;
      color: #6b5a73;
      font-size: 12px;
      font-weight: 600;
      line-height: 38px;
    }

    :deep(.el-radio-button:first-child .el-radio-button__inner) {
      border-radius: 12px 0 0 12px;
    }

    :deep(.el-radio-button:last-child .el-radio-button__inner) {
      border-radius: 0 12px 12px 0;
    }

    :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
      background: linear-gradient(135deg, #c296cd, #8d6aa0);
      box-shadow: none;
      color: #fff;
    }

    :deep(.el-button > i) {
      margin-right: 5px;
    }
  }

  &__stat {
    margin-right: auto;
    color: var(--el-text-color-secondary, #909399);
    font-size: 12px;

    b {
      color: var(--lolosia-color-primary, #7c74a8);
      font-weight: 600;
    }
  }

  &__label {
    color: var(--el-text-color-secondary, #909399);
    font-size: 12px;
  }

  &__select {
    width: 130px;

    &.is-narrow {
      width: 110px;
    }
  }

  &__body {
    display: grid;
    grid-template-columns: 280px minmax(0, 1fr);
    gap: 10px;
    min-height: 0;
  }

  &__main {
    position: relative;
    display: grid;
    grid-template-rows: 1fr;
    min-height: 0;
    padding: 0;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.6);
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.45);
    box-shadow: 0 4px 16px rgba(31, 38, 135, 0.12);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);

    /* 时间模式：标题 + 画廊上下排，旧版主面板同样留 12px 内边距 */
    &.is-time {
      display: flex;
      flex-direction: column;
      padding: 12px;
    }
  }

  &__map {
    border-radius: 16px;
  }
}
</style>
