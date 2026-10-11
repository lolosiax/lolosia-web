<script setup lang="ts">
// 仪表盘：只做编排，数据来自四个 composable，展示块都在 components 里。
import { computed } from 'vue'
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

const { rings, pills, systemAvailable } = useDashboardStatus()
const { recommended, watching, hotTags, ipRows, originRows, activeFiles, recentFiles } = useDashboardOverview()
const { activeRange, seriesMap, setRange } = useDashboardMetrics()
</script>

<template>
  <AppPage>
    <div class="dashboard">
      <DashboardBackdrop />

      <DashboardHeader class="dashboard__head" :greeting="greeting" :name="name" :pills="pills" />

      <section class="dashboard__hero">
        <div class="dashboard__col">
          <SystemRings :rings="rings" :available="systemAvailable" />
          <MetricsCard :ranges="RANGES" :range="activeRange" :series-map="seriesMap" @update:range="setRange" />
        </div>
        <div class="dashboard__col">
          <RecommendWall :items="recommended" />
          <HotTags :tags="hotTags" />
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
  gap: 12px;
  height: 100%;
  min-height: 0;
  padding: 6px 8px 28px;
  overflow-x: hidden;
  overflow-y: auto;

  &__head,
  &__hero,
  &__rest {
    position: relative;
    z-index: 1;
  }

  &__hero {
    display: grid;
    grid-template-columns: minmax(0, 5fr) minmax(0, 4fr);
    gap: 12px;
  }

  &__col {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-width: 0;
  }

  &__rest {
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    gap: 12px;
  }

  &__cell-4 {
    grid-column: span 4;
  }

  &__cell-6 {
    grid-column: span 6;
  }
}

@media (max-width: 1100px) {
  .dashboard {
    &__hero {
      grid-template-columns: minmax(0, 1fr);
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
