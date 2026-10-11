import { onBeforeUnmount, onMounted, ref } from 'vue'
import { dashboardMetrics } from '../api'

const METRICS_POLL_MS = 5000

/** 指标曲线：按区间拉取，轮询保留上一份数据。 */
export function useDashboardMetrics() {
  const activeRange = ref('1h')
  const seriesMap = ref<Record<string, number[]>>({})
  let timer: ReturnType<typeof setInterval> | undefined

  async function load(): Promise<void> {
    const range = activeRange.value
    try {
      const result = await dashboardMetrics(range)
      if (range !== activeRange.value) return
      const next: Record<string, number[]> = {}
      for (const series of result.series) next[series.key] = series.points
      seriesMap.value = next
    } catch {
      // 保留上一次的取值
    }
  }

  function setRange(range: string): void {
    if (activeRange.value === range) return
    activeRange.value = range
    void load()
  }

  onMounted(() => {
    void load()
    timer = setInterval(() => void load(), METRICS_POLL_MS)
  })

  onBeforeUnmount(() => {
    if (timer) clearInterval(timer)
  })

  return { activeRange, seriesMap, setRange, load }
}
