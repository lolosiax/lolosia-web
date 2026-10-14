<script setup lang="ts">
// 番组表：只做编排；目录 / 搜索、关注、历史与运维动作分别在 composable 里。
//
// 数据来源两条：Bangumi 目录给「这一季有哪些番、周几播」，
// 发布站 RSS 给「谁在什么时候发了一集」；命中关注时后端经 SSE 推 `anime.release`。
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import AppPage from '@/core/ui/AppPage.vue'
import { onSseEvent } from '@/core/lib/sse'
import { useAuthStore } from '@/core/stores/auth'
import type { AnimeRelease, AnimeReleaseEvent } from '../api'
import { canManageAnime } from '../lib'
import { useAnimeAdmin } from '../composables/use-anime-admin'
import { useAnimeNotify } from '../composables/use-anime-notify'
import { useAnimeTimetable } from '../composables/use-anime-timetable'
import AnimeToolbar from '../components/AnimeToolbar.vue'
import HistoryPanel from '../components/HistoryPanel.vue'
import MapReleaseDialog from '../components/MapReleaseDialog.vue'
import SeriesDetailDrawer from '../components/SeriesDetailDrawer.vue'
import SubsPanel from '../components/SubsPanel.vue'
import TimetablePanel from '../components/TimetablePanel.vue'

defineOptions({ name: 'Anime' })

const TABS = [
  { key: 'timetable', label: '番组表' },
  { key: 'subs', label: '我的关注' },
  { key: 'history', label: '更新历史' }
] as const

type TabKey = (typeof TABS)[number]['key']

const auth = useAuthStore()
const canManage = computed(() => canManageAnime(auth.roleType))
const tab = ref<TabKey>('timetable')

const { loading, season, keyword, searching, searchMode, searchResults, seasons, columns, total, load, search, clearSearch } =
  useAnimeTimetable()
const { supported: notifySupported, granted: notifyGranted, request: requestNotify } = useAnimeNotify()

const historyRef = ref<{ onRelease: (event: AnimeReleaseEvent) => void; refresh: () => void } | null>(null)
const drawerRef = ref<{ onRelease: () => void } | null>(null)
const { syncing, polling, rematching, sync, poll, rematch } = useAnimeAdmin(() => {
  void load()
  historyRef.value?.refresh()
})

const drawerOpen = ref(false)
const drawerId = ref<number | null>(null)
const mapOpen = ref(false)
const mapTarget = ref<AnimeRelease | null>(null)

const searchView = computed(() => ({
  mode: searchMode.value,
  keyword: keyword.value,
  searching: searching.value,
  results: searchResults.value
}))

function openSeries(id: number): void {
  drawerId.value = id
  drawerOpen.value = true
}

function openMap(release: AnimeRelease): void {
  mapTarget.value = release
  mapOpen.value = true
}

/** 搜索入口在顶部工具栏，命中后切回番组表页签。 */
async function onSearch(): Promise<void> {
  tab.value = 'timetable'
  await search()
}

function onSubChanged(): void {
  void load()
}

function onMapped(): void {
  historyRef.value?.refresh()
  void load()
}

const offRelease = onSseEvent('anime.release', payload => {
  historyRef.value?.onRelease(payload as AnimeReleaseEvent)
  drawerRef.value?.onRelease()
})

onMounted(() => void load())
onBeforeUnmount(offRelease)
</script>

<template>
  <AppPage>
    <div class="anime">
      <header class="anime__head">
        <h2 class="anime__title"><i class="bi bi-calendar2-week" />番组表</h2>
        <p class="anime__sub">订阅 MioBT 系发布站的番组更新，命中关注会实时提醒</p>
        <AnimeToolbar
          class="anime__toolbar"
          :keyword="keyword"
          :can-manage="canManage"
          :notify-supported="notifySupported"
          :notify-granted="notifyGranted"
          :syncing="syncing"
          :polling="polling"
          :rematching="rematching"
          :loading="loading"
          @update:keyword="keyword = $event"
          @search="onSearch"
          @notify="requestNotify"
          @sync="sync"
          @poll="poll"
          @rematch="rematch"
          @refresh="load"
        />
      </header>

      <nav class="anime__tabs">
        <button
          v-for="item in TABS"
          :key="item.key"
          type="button"
          class="anime__tab"
          :class="{ 'is-active': tab === item.key }"
          @click="tab = item.key"
        >
          {{ item.label }}
        </button>
      </nav>

      <TimetablePanel
        v-if="tab === 'timetable'"
        :columns="columns"
        :seasons="seasons"
        :season="season"
        :total="total"
        :loading="loading"
        :search="searchView"
        @update:season="season = $event"
        @select="openSeries"
        @clear-search="clearSearch"
      />
      <SubsPanel v-else-if="tab === 'subs'" @open="openSeries" @changed="onSubChanged" />
      <HistoryPanel v-else ref="historyRef" :can-manage="canManage" @open="openSeries" @map="openMap" />

      <SeriesDetailDrawer ref="drawerRef" v-model="drawerOpen" :series-id="drawerId" @changed="onSubChanged" />
      <MapReleaseDialog v-model="mapOpen" :release="mapTarget" @mapped="onMapped" />
    </div>
  </AppPage>
</template>

<style scoped lang="scss">
.anime {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  min-height: 0;
  padding: 6px 12px 28px;
  overflow-x: hidden;
  overflow-y: auto;

  &__head {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 4px 16px;
    align-items: center;
    padding: 14px 18px;
    border: 1px solid rgba(255, 255, 255, 0.75);
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.55);
    box-shadow: 0 8px 26px rgba(164, 128, 171, 0.16);
    backdrop-filter: blur(14px);
  }

  &__title {
    display: flex;
    grid-row: 1;
    gap: 8px;
    align-items: center;
    margin: 0;
    color: #3d2f42;
    font-size: 22px;
    font-weight: 800;

    i {
      color: #c296cd;
    }
  }

  &__sub {
    grid-row: 2;
    margin: 0;
    color: #8d7f92;
    font-size: 12.5px;
  }

  &__toolbar {
    grid-row: 1 / span 2;
    grid-column: 2;
  }

  &__tabs {
    display: flex;
    gap: 6px;
    padding: 4px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.45);
  }

  &__tab {
    padding: 6px 16px;
    border: none;
    border-radius: 9px;
    color: #8d7f92;
    font-size: 13px;
    font-weight: 600;
    background: transparent;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      color: #3d2f42;
    }

    &.is-active {
      color: #fff;
      background: linear-gradient(135deg, #c296cd, #a480ab);
      box-shadow: 0 4px 12px rgba(164, 128, 171, 0.35);
    }
  }
}

@media (max-width: 900px) {
  .anime__head {
    grid-template-columns: minmax(0, 1fr);
  }

  .anime__toolbar {
    grid-row: 3;
    grid-column: 1;
    justify-content: flex-start;
  }
}
</style>
