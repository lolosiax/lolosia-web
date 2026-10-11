import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { dashboardStatus, dashboardSystem } from '../api'
import type { DashboardStatus, DashboardSystem } from '../api'
import { bytesToGb, formatCount, uptimeText } from '../lib'
import type { RingView, StatusPill } from '../types'

const SYSTEM_POLL_MS = 5000
const STATUS_POLL_MS = 10000

/** 系统占用、在线会话与顶部状态胶囊；失败时保留上一次的取值。 */
export function useDashboardStatus() {
  const system = ref<DashboardSystem | null>(null)
  const status = ref<DashboardStatus | null>(null)

  const systemAvailable = computed(() => Boolean(system.value?.available))

  const rings = computed<RingView[]>(() => {
    const value = system.value
    if (!value?.available) {
      return [
        { key: 'cpu', label: 'CPU', color: '#a480ab', pct: 0, sub: value ? '本机不支持' : '加载中' },
        { key: 'mem', label: '内存', color: '#6f9bd8', pct: 0, sub: '' },
        { key: 'disk', label: '存储', color: '#4caf82', pct: 0, sub: '' }
      ]
    }
    return [
      { key: 'cpu', label: 'CPU', color: '#a480ab', pct: value.cpu, sub: '' },
      {
        key: 'mem',
        label: '内存',
        color: '#6f9bd8',
        pct: value.mem,
        sub: `${bytesToGb(value.memUsed)} / ${bytesToGb(value.memTotal)} GB`
      },
      {
        key: 'disk',
        label: '存储',
        color: '#4caf82',
        pct: value.disk,
        sub: value.diskTotal > 0 ? `${bytesToGb(value.diskUsed)} / ${bytesToGb(value.diskTotal)} GB` : '--'
      }
    ]
  })

  const pills = computed<StatusPill[]>(() => [
    {
      icon: 'bi bi-stopwatch',
      label: '运行时长',
      value: uptimeText(system.value?.uptimeMs),
      title: '进程已运行时长'
    },
    {
      icon: 'bi bi-people',
      label: '在线会话',
      value: status.value ? String(status.value.onlineSessions) : '--',
      title: '内存中活跃的会话数'
    },
    {
      icon: 'bi bi-arrow-left-right',
      label: '今日请求',
      value: status.value ? formatCount(status.value.todayRequests) : '--',
      title: '当日累计请求数'
    },
    {
      icon: 'bi bi-lightning-charge',
      label: '缓存命中',
      value: status.value ? `${status.value.cacheHitRate.toFixed(1)}%` : '--',
      title: 'HTTP 响应缓存命中率'
    },
    {
      icon: 'bi bi-coin',
      label: '词元成本',
      value: status.value ? `¥${status.value.totalCost.toFixed(2)}` : '--',
      title: 'LLM 累计成本（元）：按北京时间峰谷各半计价，谷段（含周末与法定节假日）为高峰半价'
    }
  ])

  async function loadSystem(): Promise<void> {
    try {
      system.value = await dashboardSystem()
    } catch {
      // 保留上一次的取值
    }
  }

  async function loadStatus(): Promise<void> {
    try {
      status.value = await dashboardStatus()
    } catch {
      // 保留上一次的取值
    }
  }

  let systemTimer: ReturnType<typeof setInterval> | undefined
  let statusTimer: ReturnType<typeof setInterval> | undefined

  onMounted(() => {
    void loadSystem()
    void loadStatus()
    systemTimer = setInterval(() => void loadSystem(), SYSTEM_POLL_MS)
    statusTimer = setInterval(() => void loadStatus(), STATUS_POLL_MS)
  })

  onBeforeUnmount(() => {
    if (systemTimer) clearInterval(systemTimer)
    if (statusTimer) clearInterval(statusTimer)
  })

  return { system, status, systemAvailable, rings, pills, loadSystem, loadStatus }
}
