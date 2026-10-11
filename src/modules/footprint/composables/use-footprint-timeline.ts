import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { footprintPeriodPhotos, footprintTimeline } from '../api'
import type { FootprintPeriod, FootprintTimeline } from '../api'
import type { FootprintPoint } from '../api'
import { sortByTimeDesc } from '../lib'

/** 时间模式：按拍摄间隔切出的会话与选中会话的照片。 */
export function useFootprintTimeline() {
  const timeline = ref<FootprintTimeline | null>(null)
  const loading = ref(false)
  const photos = ref<FootprintPoint[]>([])
  const photosLoading = ref(false)

  const periods = computed(() => timeline.value?.periods ?? [])

  async function loadTimeline(gapHours: number): Promise<void> {
    loading.value = true
    try {
      timeline.value = await footprintTimeline(gapHours, 400)
    } catch (err) {
      timeline.value = null
      ElMessage.error(err instanceof Error ? err.message : '时间线加载失败')
    } finally {
      loading.value = false
    }
  }

  async function loadPeriodPhotos(period: FootprintPeriod): Promise<void> {
    photosLoading.value = true
    photos.value = []
    try {
      const rows = await footprintPeriodPhotos(period.startAt, period.endAt, 800)
      photos.value = sortByTimeDesc(rows)
    } catch {
      photos.value = []
    } finally {
      photosLoading.value = false
    }
  }

  return { timeline, loading, photos, photosLoading, periods, loadTimeline, loadPeriodPhotos }
}
