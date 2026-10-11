<script setup lang="ts">
// 实时监控：指标切换 + 平滑面积曲线。数据由外层轮询，这里只负责画。
import { computed, ref } from 'vue'
import { buildPath } from '../chart'
import { formatCount } from '../lib'
import type { MetricDef, MetricKey } from '../types'

defineOptions({ name: 'MetricsCard' })

const props = defineProps<{
  ranges: { key: string; label: string }[]
  range: string
  seriesMap: Record<string, number[]>
}>()

const emit = defineEmits<{
  'update:range': [range: string]
}>()

const METRICS: MetricDef[] = [
  {
    key: 'cpu',
    label: 'CPU',
    unit: '%',
    color: '#a480ab',
    icon: 'bi bi-cpu',
    kind: 'percent',
    series: [{ key: 'cpu', name: '使用率', color: '#a480ab', apiKey: 'cpu' }]
  },
  {
    key: 'mem',
    label: '内存',
    unit: '%',
    color: '#6f9bd8',
    icon: 'bi bi-memory',
    kind: 'percent',
    series: [{ key: 'mem', name: '占用', color: '#6f9bd8', apiKey: 'mem' }]
  },
  {
    key: 'net',
    label: '流量',
    unit: 'MB/s',
    color: '#4caf82',
    icon: 'bi bi-arrow-left-right',
    kind: 'rate',
    series: [
      { key: 'net-in', name: '入站', color: '#4caf82', apiKey: 'netIn' },
      { key: 'net-out', name: '出站', color: '#8fd6b0', apiKey: 'netOut' }
    ]
  },
  {
    key: 'disk',
    label: '磁盘',
    unit: 'MB/s',
    color: '#e08bb0',
    icon: 'bi bi-device-hdd',
    kind: 'rate',
    series: [
      { key: 'disk-r', name: '读', color: '#e08bb0', apiKey: 'read' },
      { key: 'disk-w', name: '写', color: '#f0b6cf', apiKey: 'write' }
    ]
  },
  {
    key: 'token',
    label: 'Token',
    unit: 'tokens（今日）',
    color: '#e6a53c',
    icon: 'bi bi-coin',
    kind: 'count',
    series: [{ key: 'token', name: '用量', color: '#e6a53c', apiKey: 'token' }]
  }
]

const AXIS_LABEL: Record<string, string[]> = {
  '30m': ['30m 前', '22m', '15m', '7m', '现在'],
  '1h': ['60m 前', '45m', '30m', '15m', '现在'],
  '6h': ['6h 前', '4.5h', '3h', '1.5h', '现在'],
  '24h': ['24h 前', '18h', '12h', '6h', '现在']
}

const activeKey = ref<MetricKey>('cpu')
const activeMetric = computed(() => METRICS.find(item => item.key === activeKey.value) ?? METRICS[0]!)

function seriesData(seriesKey: string): number[] {
  const def = activeMetric.value.series.find(item => item.key === seriesKey)
  return def ? (props.seriesMap[def.apiKey] ?? []) : []
}

const hasData = computed(() => activeMetric.value.series.some(item => seriesData(item.key).length > 0))
const axisTicks = computed(() => AXIS_LABEL[props.range] ?? [])

function formatMetric(metric: MetricDef, value: number): string {
  if (metric.kind === 'percent') return value.toFixed(0)
  if (metric.kind === 'count') return formatCount(Math.round(value))
  return value.toFixed(1)
}

const currentValue = computed(() => {
  // 多系列指标取各自最新值之和；单系列就是它本身。
  const lasts = activeMetric.value.series.map(item => {
    const values = seriesData(item.key)
    return values.length ? values[values.length - 1]! : null
  })
  if (lasts.every(value => value === null)) return '--'
  const total = lasts.reduce<number>((sum, value) => sum + (value ?? 0), 0)
  return formatMetric(activeMetric.value, total)
})

function seriesReadout(seriesKey: string): string {
  const values = seriesData(seriesKey)
  if (!values.length) return '--'
  return `${formatMetric(activeMetric.value, values[values.length - 1]!)}${activeMetric.value.unit}`
}

const linePath = (seriesKey: string): string =>
  buildPath(activeMetric.value, seriesData(seriesKey), props.seriesMap, false)

const areaPath = (seriesKey: string): string =>
  buildPath(activeMetric.value, seriesData(seriesKey), props.seriesMap, true)

function pickRange(range: string): void {
  activeKey.value = 'cpu'
  emit('update:range', range)
}
</script>

<template>
  <article class="metrics-card" :style="{ '--accent': activeMetric.color }">
    <div class="metrics-card__head">
      <span class="metrics-card__title">
        <i :class="activeMetric.icon" :style="{ color: activeMetric.color }" />实时监控
      </span>
      <div class="metrics-card__ranges">
        <button
          v-for="item in ranges"
          :key="item.key"
          type="button"
          class="metrics-card__range"
          :class="{ 'is-active': item.key === range }"
          @click="pickRange(item.key)"
        >
          {{ item.label }}
        </button>
      </div>
    </div>

    <div class="metrics-card__pills">
      <button
        v-for="item in METRICS"
        :key="item.key"
        type="button"
        class="metrics-card__pill"
        :class="{ 'is-active': item.key === activeKey }"
        :style="item.key === activeKey ? { '--pill-color': item.color } : undefined"
        @click="activeKey = item.key"
      >
        <i :class="item.icon" />{{ item.label }}
      </button>
    </div>

    <div class="metrics-card__readout">
      <div class="metrics-card__main">
        <strong>{{ currentValue }}</strong>
        <span>{{ activeMetric.unit }}</span>
      </div>
      <span class="metrics-card__live" :class="{ 'is-on': hasData }">
        <i class="bi bi-circle-fill" />{{ hasData ? 'LIVE' : '无数据' }}
      </span>
    </div>

    <div class="metrics-card__chart">
      <svg viewBox="0 0 600 200" preserveAspectRatio="none">
        <line v-for="n in 4" :key="n" class="metrics-card__grid" x1="0" :y1="n * 40" x2="600" :y2="n * 40" />
        <g v-for="item in activeMetric.series" :key="item.key">
          <path :d="areaPath(item.key)" :fill="item.color" fill-opacity="0.16" />
          <path class="metrics-card__line" :d="linePath(item.key)" :stroke="item.color" />
        </g>
      </svg>
      <div v-if="!hasData" class="metrics-card__empty">暂无数据</div>
    </div>

    <div class="metrics-card__axis">
      <span v-for="(tick, index) in axisTicks" :key="index">{{ tick }}</span>
    </div>

    <div class="metrics-card__legend">
      <div v-for="item in activeMetric.series" :key="item.key" class="metrics-card__legend-item">
        <span class="metrics-card__dot" :style="{ background: item.color }" />
        <span>{{ item.name }}</span>
        <em>{{ seriesReadout(item.key) }}</em>
      </div>
    </div>
  </article>
</template>

<style scoped lang="scss">
.metrics-card {
  padding: 16px 18px;
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.45);
  box-shadow: 0 4px 16px rgba(31, 38, 135, 0.12);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);

  &__head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  &__title {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: #4a3d4d;
    font-size: 13px;
    font-weight: 600;
  }

  &__ranges {
    display: flex;
    gap: 4px;
    padding: 2px;
    border-radius: 999px;
    background: rgba(164, 128, 171, 0.1);
  }

  &__range {
    padding: 3px 9px;
    border: 0;
    border-radius: 999px;
    background: transparent;
    color: #8a7a94;
    font: inherit;
    font-size: 11px;
    cursor: pointer;

    &.is-active {
      background: #fff;
      color: var(--lolosia-color-primary-dark-2, #7c74a8);
      box-shadow: 0 2px 6px rgba(31, 38, 135, 0.1);
    }
  }

  &__pills {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    margin-top: 10px;
  }

  &__pill {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 9px;
    border: 1px solid transparent;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.6);
    color: #8a7a94;
    font: inherit;
    font-size: 11px;
    cursor: pointer;

    &.is-active {
      border-color: var(--pill-color, #a480ab);
      color: var(--pill-color, #a480ab);
    }
  }

  &__readout {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 10px;
    margin-top: 10px;
  }

  &__main {
    display: flex;
    align-items: baseline;
    gap: 5px;

    strong {
      color: var(--accent, #4a3d4d);
      font-size: 28px;
      font-variant-numeric: tabular-nums;
    }

    span {
      color: #8a7a94;
      font-size: 11px;
    }
  }

  &__live {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    border-radius: 999px;
    background: rgba(138, 122, 148, 0.12);
    color: #8a7a94;
    font-size: 10px;
    letter-spacing: 0.5px;

    i {
      font-size: 6px;
    }

    &.is-on {
      background: rgba(76, 175, 130, 0.14);
      color: #3d9c72;
    }
  }

  &__chart {
    position: relative;
    height: 168px;
    margin-top: 6px;

    svg {
      width: 100%;
      height: 100%;
      overflow: visible;
    }
  }

  &__grid {
    stroke: rgba(164, 128, 171, 0.12);
    stroke-width: 1;
  }

  &__line {
    fill: none;
    stroke-width: 2;
    stroke-linecap: round;
  }

  &__empty {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #a99cae;
    font-size: 12px;
  }

  &__axis {
    display: flex;
    justify-content: space-between;
    color: #a99cae;
    font-size: 10px;
  }

  &__legend {
    display: flex;
    flex-wrap: wrap;
    gap: 14px;
    margin-top: 8px;
  }

  &__legend-item {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: #6f6274;
    font-size: 11px;

    em {
      color: #4a3d4d;
      font-style: normal;
      font-variant-numeric: tabular-nums;
    }
  }

  &__dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
  }
}
</style>
