import { onMounted, ref } from 'vue'
import { dashboardOverview, thumbUrl } from '../api'
import { buildPhotoWall, toActiveFiles, toRecentFiles } from '../lib'
import type { ActiveFileView, HotTagView, PhotoView, RankRow, RecentFileView } from '../types'

const ORIGIN_COLORS = ['#a480ab', '#6f9bd8', '#4caf82', '#e08bb0', '#8a7a94', '#d0a45c']

/** 首屏汇总：推荐、热门标签、排行与最近文件；空数组即空态。 */
export function useDashboardOverview() {
  const recommended = ref<PhotoView[]>([])
  const watching = ref<{ path: string; name: string; src: string }[]>([])
  const hotTags = ref<HotTagView[]>([])
  const ipRows = ref<RankRow[]>([])
  const originRows = ref<RankRow[]>([])
  const activeFiles = ref<ActiveFileView[]>([])
  const recentFiles = ref<RecentFileView[]>([])

  async function load(): Promise<void> {
    try {
      const overview = await dashboardOverview()
      hotTags.value = overview.hotTags.map(tag => ({
        namespace: tag.namespace,
        name: tag.name,
        count: Number(tag.count)
      }))
      ipRows.value = overview.topIps.map(row => ({
        key: row.ip,
        name: row.ip,
        sub: row.region ?? '',
        hits: Number(row.hits)
      }))
      originRows.value = overview.origins.map((row, index) => ({
        key: row.host,
        name: row.host,
        sub: '',
        hits: Number(row.hits),
        color: ORIGIN_COLORS[index % ORIGIN_COLORS.length]
      }))
      recommended.value = buildPhotoWall(overview.recommended)
      const viewing = overview.popular.length ? overview.popular : overview.recentActive
      watching.value = viewing.slice(0, 6).map(row => ({
        path: row.path,
        name: row.name,
        src: thumbUrl(row, 512)
      }))
      activeFiles.value = toActiveFiles(overview.recentActive)
      recentFiles.value = toRecentFiles(overview.recentAdded)
    } catch {
      // 接口不可用：保留上一次的取值
    }
  }

  onMounted(() => void load())

  return { recommended, watching, hotTags, ipRows, originRows, activeFiles, recentFiles, load }
}
