<script setup lang="ts">
// 顶栏：问候 + 实时时钟 + 状态胶囊。
import { useDashboardClock } from '../composables/use-dashboard-clock'
import type { StatusPill } from '../types'

defineOptions({ name: 'DashboardHeader' })

defineProps<{
  greeting: string
  name: string
  pills: StatusPill[]
}>()

const { clockTime, clockDate } = useDashboardClock()
</script>

<template>
  <header class="dash-head">
    <div class="dash-head__greet">
      <p class="dash-head__line">
        <span>{{ greeting }}，</span>
        <strong>{{ name }}</strong>
      </p>
      <p class="dash-head__sub">欢迎回家，这里是你的空间总览</p>
    </div>

    <div class="dash-head__right">
      <div class="dash-head__clock">
        <strong>{{ clockTime }}</strong>
        <span>{{ clockDate }}</span>
      </div>
      <div class="dash-head__pills">
        <div v-for="pill in pills" :key="pill.label" class="dash-head__pill" :title="pill.title">
          <i :class="pill.icon" />
          <span class="dash-head__value">{{ pill.value }}</span>
          <em class="dash-head__label">{{ pill.label }}</em>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped lang="scss">
.dash-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 16px 22px;

  &__greet {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 8px;
  }

  &__line {
    display: flex;
    align-items: baseline;
    margin: 0;
    color: #4a3456;
    font-size: 41px;
    font-weight: 800;
    line-height: 1;

    strong {
      font-weight: 800;
      color: transparent;
      background: linear-gradient(115deg, #a480ab, #c296cd 26%, #8aa9e0 58%, #d98fb6);
      background-clip: text;
      -webkit-background-clip: text;
    }
  }

  &__sub {
    margin: 0;
    color: #8a7a94;
    font-size: 14px;
  }

  &__right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 12px;
  }

  &__clock {
    display: block;
    width: 190px;
    text-align: right;

    strong {
      display: block;
      color: transparent;
      font-size: 40px;
      font-weight: 800;
      line-height: 1;
      letter-spacing: 0;
      font-variant-numeric: tabular-nums;
      background: linear-gradient(120deg, #a480ab, #c296cd 52%, #8fb6e0);
      background-clip: text;
      -webkit-background-clip: text;
    }

    span {
      display: block;
      margin-top: 7px;
      color: #8a7a94;
      font-size: 12.5px;
    }
  }

  &__pills {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 10px;
  }

  &__pill {
    display: grid;
    grid-template-columns: auto 1fr;
    grid-template-rows: auto auto;
    align-items: center;
    gap: 0 8px;
    padding: 8px 14px;
    border: 1px solid rgba(255, 255, 255, 0.7);
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.55);

    i {
      grid-row: 1 / span 2;
      color: #c296cd;
      font-size: 16px;
    }
  }

  &__value {
    color: #2d1b3a;
    font-size: 14px;
    font-weight: 700;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }

  &__label {
    color: #8a7a94;
    font-size: 11px;
    font-style: normal;
    line-height: 1;
  }
}
</style>
