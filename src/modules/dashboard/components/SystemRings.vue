<script setup lang="ts">
// 系统占用：CPU / 内存 / 存储三个环形表。
import type { RingView } from '../types'

defineOptions({ name: 'SystemRings' })

defineProps<{
  rings: RingView[]
  available: boolean
}>()

const RING_C = 2 * Math.PI * 52
</script>

<template>
  <article class="system-card">
    <div class="system-card__head">
      <span class="system-card__title"><i class="bi bi-cpu" />系统状态</span>
      <span class="system-card__dot" :class="{ 'is-live': available }" />
    </div>

    <div class="system-card__rings">
      <div v-for="ring in rings" :key="ring.key" class="ring">
        <svg class="ring__svg" viewBox="0 0 120 120">
          <circle class="ring__track" cx="60" cy="60" r="52" />
          <circle
            class="ring__fill"
            cx="60"
            cy="60"
            r="52"
            :stroke="ring.color"
            :stroke-dasharray="RING_C"
            :stroke-dashoffset="RING_C * (1 - ring.pct / 100)"
          />
        </svg>
        <div class="ring__center">
          <div class="ring__value" :style="{ color: ring.color }">{{ ring.pct.toFixed(0) }}%</div>
          <div class="ring__label">{{ ring.label }}</div>
        </div>
        <div class="ring__sub">{{ ring.sub }}</div>
      </div>
    </div>
  </article>
</template>

<style scoped lang="scss">
.system-card {
  padding: 16px 18px;
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.45);
  box-shadow: 0 4px 16px rgba(31, 38, 135, 0.12);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 12px;
  }

  &__title {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: #4a3d4d;
    font-size: 13px;
    font-weight: 600;
  }

  &__dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: rgba(138, 122, 148, 0.4);

    &.is-live {
      background: #4caf82;
      box-shadow: 0 0 0 4px rgba(76, 175, 130, 0.18);
    }
  }

  &__rings {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
  }
}

.ring {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;

  &__svg {
    width: 100%;
    max-width: 110px;
    transform: rotate(-90deg);
  }

  &__track {
    fill: none;
    stroke: rgba(164, 128, 171, 0.12);
    stroke-width: 8;
  }

  &__fill {
    fill: none;
    stroke-width: 8;
    stroke-linecap: round;
    transition: stroke-dashoffset 0.6s ease;
  }

  &__center {
    position: absolute;
    top: 44px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }

  &__value {
    font-size: 18px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  &__label {
    color: #8a7a94;
    font-size: 11px;
  }

  &__sub {
    color: #8a7a94;
    font-size: 11px;
    text-align: center;
  }
}
</style>
