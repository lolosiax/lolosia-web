import { computed, ref } from 'vue'
import { footprintOverview, footprintPoints } from '../api'
import type { FootprintOverview, FootprintPoint } from '../api'
import { boundsOf, sortByTimeDesc } from '../lib'

/** 地点模式：热点 / 区域总览、选中片区的照片、以及放大后按视野拉的散点。 */
export function useFootprintOverview() {
  const overview = ref<FootprintOverview | null>(null)
  const loading = ref(false)
  const error = ref('')

  const photos = ref<FootprintPoint[]>([])
  const photosLoading = ref(false)
  const viewportPoints = ref<FootprintPoint[]>([])

  const clusters = computed(() => overview.value?.clusters ?? [])
  const regions = computed(() => [...(overview.value?.regions ?? [])].sort((a, b) => b.count - a.count))

  async function loadOverview(eps: number): Promise<void> {
    loading.value = true
    error.value = ''
    try {
      overview.value = await footprintOverview(eps, 3, 500)
    } catch (err) {
      overview.value = null
      error.value = err instanceof Error ? err.message : '足迹数据加载失败'
    } finally {
      loading.value = false
    }
  }

  async function loadPhotosByBounds(lat: number, lon: number, radiusM: number): Promise<void> {
    photosLoading.value = true
    photos.value = []
    try {
      const rows = await footprintPoints({ ...boundsOf(lat, lon, radiusM), limit: 800 })
      photos.value = sortByTimeDesc(rows)
    } catch {
      photos.value = []
    } finally {
      photosLoading.value = false
    }
  }

  let viewportTimer: ReturnType<typeof setTimeout> | null = null

  /** 地图视野变化：缩放不够近就清空散点，否则防抖 700ms 再拉。 */
  function loadViewport(box: {
    minLat: number
    minLon: number
    maxLat: number
    maxLon: number
    zoom: number
  }): void {
    if (box.zoom < 14) {
      viewportPoints.value = []
      return
    }
    if (viewportTimer) clearTimeout(viewportTimer)
    viewportTimer = setTimeout(() => {
      void footprintPoints({
        minLat: box.minLat,
        maxLat: box.maxLat,
        minLon: box.minLon,
        maxLon: box.maxLon,
        limit: 2000
      })
        .then(rows => (viewportPoints.value = rows))
        .catch(() => (viewportPoints.value = []))
    }, 700)
  }

  return {
    overview,
    loading,
    error,
    photos,
    photosLoading,
    viewportPoints,
    clusters,
    regions,
    loadOverview,
    loadPhotosByBounds,
    loadViewport
  }
}
