<script setup lang="ts">
// 足迹：地点（地图热点 / 区域圈）与时间（拍摄会话）两种视角。
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import AppPage from '@/core/ui/AppPage.vue'
import FootprintGallery from '../components/FootprintGallery.vue'
import FootprintMap from '../components/FootprintMap.vue'
import FootprintSidebar from '../components/FootprintSidebar.vue'
import RegionDialog from '../components/RegionDialog.vue'
import { useFootprintOverview } from '../composables/use-footprint-overview'
import { useFootprintTimeline } from '../composables/use-footprint-timeline'
import { coveredByRegion, rawOf } from '../lib'
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
const drawMode = ref(false)
const preview = ref<{ lat: number; lon: number; radiusM: number } | null>(null)

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
        <ElRadioGroup v-model="mode" size="small">
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
        <ElSelect v-if="mode === 'place'" v-model="eps" size="small" class="footprint__select">
          <ElOption v-for="option in EPS_OPTIONS" :key="option.value" :label="option.label" :value="option.value" />
        </ElSelect>
        <ElButton v-if="mode === 'place'" size="small" :type="drawMode ? 'success' : 'primary'" @click="startDraw">
          <i class="bi bi-plus-circle" />
          新建区域
        </ElButton>
        <span v-if="mode === 'time'" class="footprint__label">会话间隔</span>
        <ElSelect v-if="mode === 'time'" v-model="gapHours" size="small" class="footprint__select is-narrow">
          <ElOption v-for="option in GAP_OPTIONS" :key="option.value" :label="option.label" :value="option.value" />
        </ElSelect>

        <ElButton
          size="small"
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
          :error="placeError"
          :regions="regions"
          :clusters="hotspotClusters"
          :periods="periods"
          :selected-key="selectedKey"
          :broken-thumbs="brokenThumbs"
          @select-region="selectRegion"
          @select-cluster="selectCluster"
          @select-period="selectPeriod"
          @edit-region="editRegion"
          @broken="markBroken"
        />

        <section class="footprint__main">
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
            @select-cluster="selectCluster"
            @select-region="selectRegion"
            @pick-point="onPickPoint"
            @viewport="onViewport"
            @error="placeError = $event"
          />
          <FootprintGallery
            v-if="mode === 'time'"
            :photos="timePhotos"
            :loading="timePhotosLoading"
            :broken-thumbs="brokenThumbs"
            :revealed="revealed"
            @pick="openViewer(timePhotos, $event)"
            @reveal="reveal"
            @broken="markBroken"
          />
        </section>
      </div>

      <ElDrawer v-model="drawerOpen" :title="drawerTitle" size="440px" append-to-body>
        <div class="footprint__drawer-actions">
          <ElButton v-if="selectedCluster" size="small" type="primary" @click="newRegionFromCluster">
            保存为区域
          </ElButton>
          <ElButton v-if="selectedRegion" size="small" @click="editRegion(selectedRegion)">
            编辑区域
          </ElButton>
        </div>
        <FootprintGallery
          :photos="placePhotos"
          :loading="placePhotosLoading"
          :broken-thumbs="brokenThumbs"
          :revealed="revealed"
          @pick="openViewer(placePhotos, $event)"
          @reveal="reveal"
          @broken="markBroken"
        />
      </ElDrawer>

      <RegionDialog
        v-model="regionDialog.open"
        :region="regionDialog.region"
        :lat="regionDialog.lat"
        :lon="regionDialog.lon"
        :radius-m="regionDialog.radiusM"
        @saved="onRegionSaved"
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
  }

  &__map {
    border-radius: 16px;
  }

  &__drawer-actions {
    display: flex;
    gap: 8px;
    margin-bottom: 10px;
  }
}
</style>
