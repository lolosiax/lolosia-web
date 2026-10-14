import { computed, ref } from 'vue'
import { animeSearch, animeTimetable } from '../api'
import type { AnimeSeries } from '../api'
import { buildWeekColumns, seasonOptionsOf } from '../lib'

/** 番组表：目录、季度筛选与关键词搜索。失败时保留上一次的取值。 */
export function useAnimeTimetable() {
  const series = ref<AnimeSeries[]>([])
  const loading = ref(false)
  const season = ref('')

  const keyword = ref('')
  const searching = ref(false)
  const searchMode = ref(false)
  const searchResults = ref<AnimeSeries[]>([])

  const seasons = computed(() => seasonOptionsOf(series.value))
  const columns = computed(() => buildWeekColumns(series.value, season.value))
  const total = computed(() => series.value.length)

  async function load(): Promise<void> {
    loading.value = true
    try {
      series.value = await animeTimetable()
    } catch {
      // 接口不可用：保留上一次的取值
    } finally {
      loading.value = false
    }
  }

  async function search(): Promise<void> {
    const value = keyword.value.trim()
    if (!value) {
      clearSearch()
      return
    }
    searching.value = true
    try {
      searchResults.value = await animeSearch(value)
      searchMode.value = true
    } catch {
      // 拦截器已提示
    } finally {
      searching.value = false
    }
  }

  function clearSearch(): void {
    searchMode.value = false
    searchResults.value = []
    keyword.value = ''
  }

  return {
    series,
    loading,
    season,
    keyword,
    searching,
    searchMode,
    searchResults,
    seasons,
    columns,
    total,
    load,
    search,
    clearSearch
  }
}
