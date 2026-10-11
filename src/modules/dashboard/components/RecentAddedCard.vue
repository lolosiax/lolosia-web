<script setup lang="ts">
// 最近新增：按文件类型着色的小列表。
import type { RecentFileView } from '../types'

defineOptions({ name: 'RecentAddedCard' })

defineProps<{ items: RecentFileView[] }>()
</script>

<template>
  <article class="added-card">
    <div class="added-card__head">
      <span class="added-card__title"><i class="bi bi-clock-history" />最近新增</span>
    </div>

    <div class="added-card__list">
      <div v-for="item in items" :key="item.path" class="added-card__row">
        <span class="added-card__dot" :style="{ background: item.color }" />
        <span class="added-card__name" :title="item.name">{{ item.name }}</span>
        <span class="added-card__ext" :style="{ color: item.color }">{{ item.ext }}</span>
        <span class="added-card__time">{{ item.time }}</span>
      </div>
      <p v-if="!items.length" class="added-card__empty">暂无数据</p>
    </div>
  </article>
</template>

<style scoped lang="scss">
.added-card {
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
    gap: 8px;
  }

  &__row {
    display: flex;
    align-items: center;
    gap: 7px;
  }

  &__dot {
    flex: none;
    width: 6px;
    height: 6px;
    border-radius: 50%;
  }

  &__name {
    flex: 1 1 auto;
    overflow: hidden;
    color: #4a3d4d;
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__ext {
    flex: none;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.4px;
  }

  &__time {
    flex: none;
    color: #a99cae;
    font-size: 10px;
  }

  &__empty {
    margin: 0;
    color: #a99cae;
    font-size: 12px;
  }
}
</style>
