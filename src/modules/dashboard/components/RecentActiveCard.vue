<script setup lang="ts">
// 近期活跃：最近被访问的文件列表。
import type { ActiveFileView } from '../types'

defineOptions({ name: 'RecentActiveCard' })

defineProps<{ items: ActiveFileView[] }>()
</script>

<template>
  <article class="recent-card">
    <div class="recent-card__head">
      <span class="recent-card__title"><i class="bi bi-activity" />近期活跃</span>
    </div>

    <ul class="recent-card__list">
      <li v-for="item in items" :key="item.path">
        <span class="recent-card__icon" :style="{ background: item.color }"><i :class="item.icon" /></span>
        <div class="recent-card__main">
          <span class="recent-card__name" :title="item.name">{{ item.name }}</span>
          <span class="recent-card__dir">{{ item.dir }}</span>
        </div>
        <span class="recent-card__time">{{ item.time }}</span>
      </li>
      <li v-if="!items.length" class="recent-card__empty">暂无数据</li>
    </ul>
  </article>
</template>

<style scoped lang="scss">
.recent-card {
  padding: 16px 18px;
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.45);
  box-shadow: 0 4px 16px rgba(31, 38, 135, 0.12);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);

  &__head {
    margin-bottom: 10px;
  }

  &__title {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: #4a3d4d;
    font-size: 13px;
    font-weight: 600;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 9px;
    margin: 0;
    padding: 0;
    list-style: none;

    li {
      display: flex;
      align-items: center;
      gap: 9px;
    }
  }

  &__icon {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    border-radius: 8px;
    color: #fff;
    font-size: 13px;
  }

  &__main {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
  }

  &__name {
    overflow: hidden;
    color: #4a3d4d;
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__dir {
    overflow: hidden;
    color: #a99cae;
    font-size: 10px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__time {
    flex: none;
    color: #a99cae;
    font-size: 10px;
  }

  &__empty {
    color: #a99cae;
    font-size: 12px;
  }
}
</style>
