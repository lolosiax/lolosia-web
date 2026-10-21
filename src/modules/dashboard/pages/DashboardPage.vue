<script setup lang="ts">
// 仪表盘：只做编排，数据来自四个 composable，展示块都在 components 里。
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import AppPage from '@/core/ui/AppPage.vue'
import { useAuthStore } from '@/core/stores/auth'
import DashboardBackdrop from '../components/DashboardBackdrop.vue'
import DashboardHeader from '../components/DashboardHeader.vue'
import HotTags from '../components/HotTags.vue'
import MetricsCard from '../components/MetricsCard.vue'
import RankCard from '../components/RankCard.vue'
import RecentActiveCard from '../components/RecentActiveCard.vue'
import RecentAddedCard from '../components/RecentAddedCard.vue'
import RecommendWall from '../components/RecommendWall.vue'
import SystemRings from '../components/SystemRings.vue'
import WatchingWall from '../components/WatchingWall.vue'
import { useDashboardClock } from '../composables/use-dashboard-clock'
import { useDashboardMetrics } from '../composables/use-dashboard-metrics'
import { useDashboardOverview } from '../composables/use-dashboard-overview'
import { useDashboardStatus } from '../composables/use-dashboard-status'

defineOptions({ name: 'Dashboard' })

const RANGES = [
  { key: '30m', label: '30分钟' },
  { key: '1h', label: '1小时' },
  { key: '6h', label: '6小时' },
  { key: '24h', label: '24小时' }
]

const auth = useAuthStore()
const { greeting } = useDashboardClock()
const name = computed(() => auth.displayName || '朋友')

const { rings, pills, systemAvailable, cpuCores } = useDashboardStatus()
const { recommended, watching, hotTags, ipRows, originRows, activeFiles, recentFiles } = useDashboardOverview()
const { activeRange, seriesMap, setRange } = useDashboardMetrics()

/** 首屏高度按头部实际高度计算，和原项目 dashboard 的 --head-h 一致。 */
const headRef = ref<HTMLElement | null>(null)
const headH = ref(140)
let headObserver: ResizeObserver | null = null

onMounted(() => {
  if (!headRef.value) return
  headH.value = headRef.value.offsetHeight
  if (typeof ResizeObserver === 'undefined') return
  headObserver = new ResizeObserver(() => {
    headH.value = headRef.value?.offsetHeight ?? headH.value
  })
  headObserver.observe(headRef.value)
})

onBeforeUnmount(() => {
  headObserver?.disconnect()
  headObserver = null
})
</script>

<template>
  <AppPage>
    <div class="dashboard" :style="{ '--head-h': `${headH}px` }">
      <DashboardBackdrop />

      <div ref="headRef" class="dashboard__head">
        <DashboardHeader :greeting="greeting" :name="name" :pills="pills" />
      </div>

      <section class="dashboard__hero">
        <div class="dashboard__col">
          <SystemRings :rings="rings" :available="systemAvailable" :cpu-cores="cpuCores" />
          <MetricsCard
            class="dashboard__monitor"
            :ranges="RANGES"
            :range="activeRange"
            :series-map="seriesMap"
            @update:range="setRange"
          />
        </div>
        <div class="dashboard__col">
          <RecommendWall class="dashboard__recommend" :items="recommended" />
          <HotTags class="dashboard__tags" :tags="hotTags" />
        </div>
      </section>

      <section class="dashboard__rest">
        <RankCard class="dashboard__cell-4" title="访问 IP 排行" icon="bi bi-globe2" :rows="ipRows" />
        <RankCard class="dashboard__cell-4" title="Origin 排行" icon="bi bi-diagram-3" :rows="originRows" />
        <WatchingWall class="dashboard__cell-4" :items="watching" />
        <RecentActiveCard class="dashboard__cell-6" :items="activeFiles" />
        <RecentAddedCard class="dashboard__cell-6" :items="recentFiles" />
      </section>
    </div>
  </AppPage>
</template>

<style scoped lang="scss">
.dashboard {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 14px;
  height: 100%;
  min-height: 0;
  padding: 6px 8px 24px;
  overflow-x: hidden;
  overflow-y: auto;

  &__head,
  &__hero,
  &__rest {
    position: relative;
    flex: 0 0 auto;
    width: 100%;
    max-width: 1560px;
    margin-right: auto;
    margin-left: auto;
  }

  &__hero {
    display: grid;
    grid-template-columns: 4fr 8fr;
    gap: 14px;
    align-items: stretch;
    height: calc(100dvh - var(--head-h, 140px) - 40px);
    min-height: 380px;
  }

  &__col {
    display: flex;
    flex-direction: column;
    gap: 14px;
    min-width: 0;
    min-height: 0;
  }

  &__monitor {
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  &__recommend {
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  &__tags {
    flex: 0 0 auto;
    display: flex;
    flex-direction: column;
    min-height: 152px;
  }

  &__rest {
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    gap: 14px;
  }

  &__cell-4 {
    grid-column: span 4;
  }

  &__cell-6 {
    grid-column: span 6;
  }
}

/** 实时监控与照片墙撑满首屏剩余高度。 */
.dashboard__monitor :deep(.metrics-card__chart) {
  flex: 1 1 auto;
  height: auto !important;
  min-height: 110px;
  display: flex;
  flex-direction: column;
}

.dashboard__monitor :deep(.metrics-card__chart svg) {
  flex: 1 1 auto;
  height: auto !important;
  min-height: 110px;
}

.dashboard__recommend :deep(.recommend-card__wall) {
  flex: 1 1 auto;
  min-height: 0;
}

.dashboard__tags :deep(.hot-tags__cloud) {
  flex: 1 1 auto;
}

/** 卡片容器与标题对齐原项目 dashboard 的 glass 样式。 */
.dashboard :deep(article) {
  padding: 16px 18px;
  border: 1px solid rgba(255, 255, 255, 0.75);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.62);
  box-shadow: 0 8px 26px rgba(164, 128, 171, 0.16);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
}

.dashboard :deep(article [class$='__title']) {
  color: #2d1b3a;
  font-size: 15px;
  font-weight: 700;
  line-height: 1;
}

@media (max-width: 1400px) {
  .dashboard__hero {
    grid-template-columns: 1fr 1.7fr;
  }
}

@media (max-width: 1100px) {
  .dashboard {
    &__hero {
      grid-template-columns: minmax(0, 1fr);
      height: auto;
      min-height: 0;
    }

    &__cell-4,
    &__cell-6 {
      grid-column: span 6;
    }
  }
}

@media (max-width: 720px) {
  .dashboard {
    &__cell-4,
    &__cell-6 {
      grid-column: span 12;
    }
  }
}
</style>
