<script setup lang="ts">
// 番剧详情头部的事实标签：季度 / 放送时段 / 状态 / 评分。
import { computed } from 'vue'
import type { AnimeSeries } from '../api'
import { weekdayText } from '../lib'

defineOptions({ name: 'SeriesFacts' })

const props = defineProps<{ series: AnimeSeries }>()

const air = computed(() => {
  const day = weekdayText(props.series.airWeekday)
  return props.series.airTime ? `${day} ${props.series.airTime}` : day
})
</script>

<template>
  <div class="facts">
    <el-tag v-if="series.season" size="small" effect="light">{{ series.season }}</el-tag>
    <el-tag v-if="series.airWeekday" size="small" type="info" effect="plain">{{ air }}</el-tag>
    <el-tag v-if="series.status === 'finished'" size="small" type="warning" effect="plain">已完结</el-tag>
    <span v-if="series.rating" class="facts__rating"><i class="bi bi-star-fill" />{{ series.rating.toFixed(1) }}</span>
  </div>
</template>

<style scoped lang="scss">
.facts {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;

  &__rating {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    color: #d9a03c;
    font-size: 12px;
    font-weight: 700;

    i {
      font-size: 11px;
    }
  }
}
</style>
