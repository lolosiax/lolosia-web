<script setup lang="ts">
// 我的关注：列表、开关与取消关注；变更后通知页面刷新番组表的关注标记。
import { ElMessageBox } from 'element-plus'
import type { AnimeSubscription } from '../api'
import { useAnimeSubscriptions } from '../composables/use-anime-subscriptions'
import SubRow from './SubRow.vue'

defineOptions({ name: 'SubsPanel' })

const emit = defineEmits<{
  (e: 'open', id: number): void
  (e: 'changed'): void
}>()

const { items, loading, toggle, remove } = useAnimeSubscriptions()

async function onToggle(sub: AnimeSubscription, value: string | number | boolean): Promise<void> {
  await toggle(sub, value)
  emit('changed')
}

async function onRemove(sub: AnimeSubscription): Promise<void> {
  try {
    await ElMessageBox.confirm(`确定取消关注「${sub.seriesTitle || `番剧 #${sub.seriesId}`}」吗？`, '取消关注', {
      type: 'warning',
      confirmButtonText: '取消关注',
      cancelButtonText: '再想想'
    })
  } catch {
    return
  }
  await remove(sub)
  emit('changed')
}
</script>

<template>
  <div class="subs">
    <ElEmpty v-if="!loading && !items.length" description="还没有关注任何番剧，去番组表里点开一部关注吧" />
    <ul v-else v-loading="loading" class="subs__list">
      <SubRow
        v-for="sub in items"
        :key="sub.id"
        :sub="sub"
        @open="id => emit('open', id)"
        @toggle="(value: string | number | boolean) => onToggle(sub, value)"
        @remove="onRemove(sub)"
      />
    </ul>
  </div>
</template>

<style scoped lang="scss">
.subs {
  &__list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 12px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
}
</style>
