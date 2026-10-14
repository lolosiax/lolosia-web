<script setup lang="ts">
// 番组表的周分栏与搜索结果；只做展示，筛选与搜索状态都在页面 composable 里。
import { ElButton, ElEmpty } from 'element-plus'
import type { TimetableSearchView, WeekColumn } from '../lib'
import SeriesCard from './SeriesCard.vue'

defineOptions({ name: 'TimetablePanel' })

defineProps<{
  columns: WeekColumn[]
  seasons: string[]
  season: string
  total: number
  loading: boolean
  search: TimetableSearchView
}>()

const emit = defineEmits<{
  (e: 'update:season', value: string): void
  (e: 'select', id: number): void
  (e: 'clear-search'): void
}>()

function onSelect(id: number): void {
  emit('select', id)
}
</script>

<template>
  <div v-if="search.mode" class="tt-search">
    <div class="tt-search__bar">
      <span class="tt-search__title">搜索「{{ search.keyword }}」 · {{ search.results.length }} 部</span>
      <el-button link type="primary" @click="emit('clear-search')">返回番组表</el-button>
    </div>
    <ElEmpty v-if="!search.results.length" description="没有匹配的番剧" />
    <div v-else v-loading="search.searching" class="tt-search__grid">
      <SeriesCard v-for="item in search.results" :key="item.id" :series="item" @select="onSelect" />
    </div>
  </div>

  <div v-else class="tt">
    <div v-if="seasons.length" class="tt__seasons">
      <button type="button" class="tt__chip" :class="{ 'is-active': season === '' }" @click="emit('update:season', '')">全部</button>
      <button
        v-for="item in seasons"
        :key="item"
        type="button"
        class="tt__chip"
        :class="{ 'is-active': season === item }"
        @click="emit('update:season', item)"
      >
        {{ item }}
      </button>
    </div>

    <div v-loading="loading" class="tt__grid">
      <section v-for="column in columns" :key="column.weekday" class="tt__col">
        <div class="tt__col-head">
          <span class="tt__col-name">{{ column.label }}</span>
          <span class="tt__col-count">{{ column.items.length }}</span>
        </div>
        <div class="tt__col-body">
          <SeriesCard v-for="item in column.items" :key="item.id" :series="item" @select="onSelect" />
          <span v-if="!column.items.length" class="tt__empty">—</span>
        </div>
      </section>
    </div>

    <ElEmpty v-if="!loading && !total" description="番剧目录为空，管理员可点「同步目录」拉取" />
  </div>
</template>

<style scoped lang="scss">
.tt-search {
  &__bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  &__title {
    color: #3d2f42;
    font-size: 14px;
    font-weight: 700;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 12px;
  }
}

.tt {
  &__seasons {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 12px;
  }

  &__chip {
    padding: 4px 12px;
    border: 1px solid rgba(164, 128, 171, 0.25);
    border-radius: 999px;
    color: #8d7f92;
    font-size: 12px;
    background: rgba(255, 255, 255, 0.6);
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      border-color: rgba(164, 128, 171, 0.5);
      color: #3d2f42;
    }

    &.is-active {
      border-color: transparent;
      color: #fff;
      background: linear-gradient(135deg, #c296cd, #a480ab);
      box-shadow: 0 4px 12px rgba(164, 128, 171, 0.35);
    }
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(7, minmax(180px, 1fr));
    gap: 12px;
    padding-bottom: 6px;
    overflow-x: auto;
  }

  &__col {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
  }

  &__col-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 10px;
    border-radius: 10px;
    background: rgba(164, 128, 171, 0.12);
  }

  &__col-name {
    color: #8b6a92;
    font-size: 13px;
    font-weight: 700;
  }

  &__col-count {
    color: #8d7f92;
    font-size: 11px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  &__col-body {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-height: 60px;
  }

  &__empty {
    padding: 10px 0;
    color: rgba(141, 127, 146, 0.6);
    font-size: 12px;
    text-align: center;
  }
}

@media (max-width: 1024px) {
  .tt__grid {
    grid-template-columns: repeat(7, 200px);
  }
}
</style>
