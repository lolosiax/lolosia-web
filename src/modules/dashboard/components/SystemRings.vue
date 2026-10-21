<script setup lang="ts">
// 系统占用：CPU / 内存 / 存储三个环形表，CPU 环下方是逐线程点阵。
import { computed } from 'vue'
import type { RingView } from '../types'

defineOptions({ name: 'SystemRings' })

const props = defineProps<{
  rings: RingView[]
  available: boolean
  /** 逐核 CPU 占用率（0~100）；为空表示采集不到。 */
  cpuCores: number[]
}>()

const RING_C = 2 * Math.PI * 52

/** 不足 8 线程只排 1 行（单格放大到 1.33 倍），其余排 2 行。 */
const threadLayout = computed(() => {
  const count = props.cpuCores.length
  const rows = count < 8 ? 1 : 2
  const cols = Math.max(Math.ceil(count / rows), 1)
  const gap = 1.5
  const base = rows === 1 ? 8 : 6
  const cell = Math.max(Math.min(base, (104 - (cols - 1) * gap) / cols), 1.5)
  return { cols, cell, gap }
})

/** 线程占用 → 主题色透明度：空载接近透明，满载为纯主题色。 */
function threadColor(load: number): string {
  const ratio = Math.min(Math.max(load, 0), 100) / 100
  return `rgba(164, 128, 171, ${(0.07 + ratio * 0.93).toFixed(3)})`
}
</script>

<template>
  <article class="system-card">
    <div class="system-card__head">
      <span class="system-card__title"><i class="bi bi-cpu" />系统状态</span>
      <span class="system-card__dot" :class="{ 'is-live': available }" />
    </div>

    <div class="system-card__rings">
      <div v-for="ring in rings" :key="ring.key" class="system-ring">
        <svg class="system-ring__svg" viewBox="0 0 120 120">
          <circle class="system-ring__track" cx="60" cy="60" r="52" />
          <circle
            class="system-ring__fill"
            cx="60"
            cy="60"
            r="52"
            :stroke="ring.color"
            :stroke-dasharray="RING_C"
            :stroke-dashoffset="RING_C * (1 - ring.pct / 100)"
          />
        </svg>
        <div class="system-ring__center">
          <div class="system-ring__value" :style="{ color: ring.color }">{{ ring.pct.toFixed(0) }}</div>
          <div class="system-ring__label">{{ ring.label }}</div>
        </div>
        <div
          v-if="ring.key === 'cpu' && cpuCores.length"
          class="system-ring__threads"
          :style="{
            gridTemplateColumns: `repeat(${threadLayout.cols}, ${threadLayout.cell}px)`,
            gridAutoRows: `${threadLayout.cell}px`,
            gap: `${threadLayout.gap}px`
          }"
        >
          <span
            v-for="(load, index) in cpuCores"
            :key="index"
            class="system-ring__thread"
            :style="{ backgroundColor: threadColor(load) }"
            :title="`线程 ${index + 1} · ${load.toFixed(0)}%`"
          />
        </div>
        <div v-else class="system-ring__sub">
          {{ ring.key === 'cpu' ? '线程负载 --' : ring.sub }}
        </div>
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
    display: flex;
    justify-content: space-around;
    gap: 8px;
    flex-wrap: wrap;
  }
}

/* 类名别用 .ring：UnoCSS 会把 ring 解析成 1px 外描边 */
.system-ring {
  position: relative;
  width: 104px;
  text-align: center;

  &__svg {
    width: 104px;
    height: 104px;
    transform: rotate(-90deg);
  }

  &__track {
    fill: none;
    stroke: rgba(164, 128, 171, 0.14);
    stroke-width: 9;
  }

  &__fill {
    fill: none;
    stroke-width: 9;
    stroke-linecap: round;
    transition: stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1);
  }

  &__center {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  &__value {
    font-size: 22px;
    font-weight: 800;
    font-variant-numeric: tabular-nums;

    &::after {
      content: '%';
      font-size: 11px;
      font-weight: 600;
    }
  }

  &__label {
    color: #8a7a94;
    font-size: 11px;
  }

  &__sub {
    margin-top: 2px;
    color: #8a7a94;
    font-size: 10.5px;
    white-space: nowrap;
  }

  /* 逐线程点阵：两行（或不足 8 线程时一行），每格带灰色描边 */
  &__threads {
    display: grid;
    align-content: center;
    justify-content: center;
    min-height: 13px;
    margin-top: 2px;
  }

  &__thread {
    border: 1px solid rgba(138, 122, 148, 0.32);
    border-radius: 1px;
    transition: background-color 0.45s ease;
  }
}
</style>
