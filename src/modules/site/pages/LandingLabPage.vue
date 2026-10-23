<script setup lang="ts">
import { computed, ref } from 'vue'
import RouteSwitcher from '../components/shared/RouteSwitcher.vue'
import { useGpuScene } from '../composables/use-gpu-scene'
import { useLandingCards } from '../composables/use-landing-cards'

defineOptions({ name: 'LandingLabPage' })

const { leftCards, largeCard, open } = useLandingCards()

const stage = ref<HTMLElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)

const cards = computed(() => (largeCard.value ? [...leftCards.value, largeCard.value] : leftCards.value))

const { backend, error } = useGpuScene({
  canvas,
  cardElements: () => Array.from(stage.value?.querySelectorAll<HTMLElement>('.lab-card') ?? []),
  cardColors: () => cards.value.map(card => card.themeRgb)
})

function openLarge(event: MouseEvent): void {
  if (largeCard.value) open(largeCard.value, event)
}
</script>

<template>
  <div ref="stage" class="lab">
    <canvas ref="canvas" class="lab__canvas" />

    <header class="lab__head">
      <p class="lab__badge">GPU SCENE</p>
      <h1 class="lab__title">
        欢迎你
        <span>来自现实的旅人</span>
      </h1>
      <p class="lab__subtitle">WebGPU 渲染，不支持时自动回退 WebGL2 / Canvas2D</p>
    </header>

    <div class="lab__grid">
      <button v-for="card in leftCards" :key="card.id" type="button" class="lab-card" @click="open(card, $event)">
        <span class="lab-card__title">{{ card.title }}</span>
        <span class="lab-card__sub">{{ card.subtitle }}</span>
      </button>

      <button type="button" class="lab-card lab-card--large" @click="openLarge($event)">
        <span class="lab-card__title">{{ largeCard?.title }} {{ largeCard?.subtitle }}</span>
        <span class="lab-card__desc">{{ largeCard?.description }}</span>
      </button>
    </div>

    <RouteSwitcher />

    <p class="lab__status">渲染后端：{{ backend ?? '初始化中…' }}</p>
    <p v-if="error" class="lab__error">{{ error }}</p>
  </div>
</template>

<style scoped lang="scss">
.lab {
  position: relative;
  min-height: 100vh;
  min-height: 100dvh;
  overflow: hidden;
  background: #fbf7fe;
  color: #2d1b3a;
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

.lab__canvas {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
}

.lab__head {
  position: relative;
  z-index: 1;
  max-width: 380px;
  margin: 96px 0 0 6vw;
}

.lab__badge {
  display: inline-block;
  margin: 0 0 16px;
  padding: 4px 12px;
  border: 1px solid rgb(255 255 255 / 55%);
  border-radius: 999px;
  background: rgb(255 255 255 / 45%);
  color: #8a6f97;
  font-size: 10px;
  letter-spacing: 3px;
}

.lab__title {
  margin: 0 0 10px;
  font-size: 44px;
  font-weight: 800;
  line-height: 1.15;

  span {
    display: block;
    color: #8a5f9a;
  }
}

.lab__subtitle {
  margin: 0;
  color: #7d6a88;
  font-size: 13px;
}

.lab__grid {
  position: absolute;
  top: 50%;
  right: 7vw;
  z-index: 1;
  display: grid;
  grid-template-columns: 1fr 1.15fr;
  grid-template-rows: repeat(3, 1fr);
  gap: 16px;
  width: 620px;
  height: 560px;
  transform: translateY(-50%);
}

.lab-card {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 2px;
  padding: 18px 20px;
  border: none;
  border-radius: 16px;
  background: transparent;
  color: #fff;
  font: inherit;
  text-align: left;
  cursor: pointer;
  outline: 2px solid transparent;
  transition: outline-color 0.15s ease;

  &:hover {
    outline-color: rgb(255 255 255 / 55%);
  }

  &:nth-child(1) {
    grid-row: 1;
  }

  &:nth-child(2) {
    grid-row: 2;
  }

  &:nth-child(3) {
    grid-row: 3;
  }
}

.lab-card--large {
  grid-column: 2;
  grid-row: 1 / 4;
}

.lab-card__title {
  font-size: 15px;
  font-weight: 700;
  text-shadow: 0 1px 6px rgb(0 0 0 / 35%);
}

.lab-card__sub {
  color: rgb(255 255 255 / 70%);
  font-size: 9px;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  text-shadow: 0 1px 4px rgb(0 0 0 / 30%);
}

.lab-card__desc {
  color: rgb(255 255 255 / 65%);
  font-size: 11px;
  text-shadow: 0 1px 4px rgb(0 0 0 / 30%);
}

.lab__status {
  position: absolute;
  bottom: 18px;
  left: 6vw;
  margin: 0;
  z-index: 1;
  color: #8d7a97;
  font-size: 11px;
  letter-spacing: 0.5px;
}

.lab__error {
  position: absolute;
  bottom: 36px;
  left: 6vw;
  margin: 0;
  z-index: 1;
  color: #b4576b;
  font-size: 11px;
}

@media (max-width: 1100px) {
  .lab {
    padding-bottom: 120px;
  }

  .lab__head {
    margin: 64px 20px 0;
  }

  .lab__grid {
    position: static;
    grid-template-columns: 1fr;
    grid-template-rows: none;
    width: auto;
    height: auto;
    margin: 24px 20px 0;
    transform: none;
  }

  .lab-card {
    height: 132px;
  }

  .lab-card:nth-child(n) {
    grid-row: auto;
  }

  .lab-card--large {
    grid-column: 1;
    grid-row: auto;
    height: 180px;
  }

  .lab__status,
  .lab__error {
    position: static;
    margin: 24px 20px 0;
  }
}
</style>
