<script setup lang="ts">
// 排行榜卡片：IP 与 Origin 共用，行内可带副标题与自定义条色。
import { computed } from 'vue'
import type { RankRow } from '../types'

defineOptions({ name: 'RankCard' })

const props = defineProps<{
  title: string
  icon: string
  rows: RankRow[]
}>()

const maxHits = computed(() => Math.max(1, ...props.rows.map(row => row.hits)))

function widthOf(row: RankRow): string {
  return `${(row.hits / maxHits.value) * 100}%`
}
</script>

<template>
  <article class="rank-card">
    <div class="rank-card__head">
      <span class="rank-card__title"><i :class="icon" />{{ title }}</span>
    </div>

    <ul class="rank-card__list">
      <li v-for="(row, index) in rows" :key="row.key">
        <span class="rank-card__no" :class="`is-top${index + 1}`">{{ index + 1 }}</span>
        <div class="rank-card__main">
          <span class="rank-card__name">{{ row.name }}</span>
          <span v-if="row.sub" class="rank-card__sub">{{ row.sub }}</span>
        </div>
        <div class="rank-card__bar">
          <i :style="{ width: widthOf(row), background: row.color }" />
        </div>
        <span class="rank-card__count">{{ row.hits }}</span>
      </li>
      <li v-if="!rows.length" class="rank-card__empty">暂无数据</li>
    </ul>
  </article>
</template>

<style scoped lang="scss">
.rank-card {
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
    margin: 0;
    padding: 0;
    list-style: none;
  }

  &__no {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border-radius: 6px;
    background: rgba(164, 128, 171, 0.1);
    color: #8a7a94;
    font-size: 10px;
    font-weight: 700;

    &.is-top1 {
      background: rgba(164, 128, 171, 0.28);
      color: #7c4b8b;
    }

    &.is-top2,
    &.is-top3 {
      background: rgba(164, 128, 171, 0.18);
      color: #8c5d99;
    }
  }

  &__main {
    display: flex;
    flex: 1 1 120px;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
    min-width: 0;
  }

  &__name {
    overflow: hidden;
    color: #4a3d4d;
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__sub {
    color: #a99cae;
    font-size: 10px;
  }

  &__bar {
    flex: 1 1 60px;
    height: 5px;
    overflow: hidden;
    border-radius: 999px;
    background: rgba(164, 128, 171, 0.1);

    i {
      display: block;
      height: 100%;
      border-radius: inherit;
      background: #a480ab;
      transition: width 0.4s ease;
    }
  }

  &__count {
    flex: none;
    color: #8a7a94;
    font-size: 11px;
    font-variant-numeric: tabular-nums;
  }

  &__empty {
    color: #a99cae;
    font-size: 12px;
  }

  li {
    display: flex;
    align-items: center;
    gap: 8px;
  }
}
</style>
