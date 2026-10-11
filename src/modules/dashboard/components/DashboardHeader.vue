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
  gap: 20px;
  padding: 18px 22px;
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.45);
  box-shadow: 0 6px 24px rgba(31, 38, 135, 0.12);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);

  &__line {
    display: flex;
    align-items: baseline;
    gap: 4px;
    margin: 0;
    color: #4a3d4d;
    font-size: 24px;

    strong {
      color: var(--lolosia-color-primary-dark-2, #7c74a8);
      font-weight: 700;
    }
  }

  &__sub {
    margin: 8px 0 0;
    color: #8a7a94;
    font-size: 13px;
  }

  &__right {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 20px;
  }

  &__clock {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 2px;

    strong {
      color: #4a3d4d;
      font-size: 26px;
      font-variant-numeric: tabular-nums;
      letter-spacing: 1px;
    }

    span {
      color: #8a7a94;
      font-size: 12px;
    }
  }

  &__pills {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  &__pill {
    display: grid;
    grid-template-columns: auto 1fr;
    grid-template-rows: auto auto;
    align-items: center;
    gap: 0 8px;
    min-width: 96px;
    padding: 8px 12px;
    border: 1px solid rgba(255, 255, 255, 0.7);
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.55);

    i {
      grid-row: 1 / span 2;
      color: var(--lolosia-color-primary, #a06bb0);
      font-size: 18px;
    }
  }

  &__value {
    color: #4a3d4d;
    font-size: 15px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }

  &__label {
    color: #8a7a94;
    font-size: 11px;
    font-style: normal;
  }
}
</style>
