<script setup lang="ts">
// 更新历史：分页列表；SSE 新发布由 composable 插到头部。
import type { AnimeRelease, AnimeReleaseEvent } from '../api'
import { useAnimeHistory } from '../composables/use-anime-history'
import HistoryRow from './HistoryRow.vue'

defineOptions({ name: 'HistoryPanel' })

defineProps<{ canManage: boolean }>()

const emit = defineEmits<{
  (e: 'open', id: number): void
  (e: 'map', item: AnimeRelease): void
}>()

const { items, loading, page, total, pageSize, load, go, onRelease } = useAnimeHistory()

defineExpose({
  /** 页面收到 `anime.release` 时转发给当前页，实时插入并去重。 */
  onRelease: (event: AnimeReleaseEvent) => onRelease(event),
  refresh: () => void load()
})
</script>

<template>
  <div class="history">
    <ElEmpty v-if="!loading && !items.length" description="暂无发布记录" />
    <ul v-else v-loading="loading" class="history__list">
      <HistoryRow
        v-for="item in items"
        :key="item.id"
        :item="item"
        :can-manage="canManage"
        @open="id => emit('open', id)"
        @map="release => emit('map', release)"
      />
    </ul>
    <ElPagination
      v-if="total > pageSize"
      class="history__pager"
      :current-page="page"
      :page-size="pageSize"
      :total="total"
      layout="prev, pager, next, total"
      background
      @current-change="go"
    />
  </div>
</template>

<style scoped lang="scss">
.history {
  &__list {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  &__pager {
    position: sticky;
    bottom: 0;
    z-index: 2;
    justify-content: center;
    margin-top: 12px;
    padding: 8px 0;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.72);
    backdrop-filter: blur(10px);
  }
}
</style>
