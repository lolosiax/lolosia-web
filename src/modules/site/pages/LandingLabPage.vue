<script setup lang="ts">
import { computed, ref, toValue } from 'vue'
import type { CSSProperties } from 'vue'
import RouteSwitcher from '../components/shared/RouteSwitcher.vue'
import { useLandingCards } from '../composables/use-landing-cards'
import type { LandingCard } from '../composables/use-landing-cards'
import { usePetalScene } from '../composables/use-petal-scene'

defineOptions({ name: 'LandingLabPage' })

const canvas = ref<HTMLCanvasElement | null>(null)
const { leftCards, largeCard, open } = useLandingCards()
const { status, error } = usePetalScene(canvas)

const cards = computed(() => (largeCard.value ? [...leftCards.value, largeCard.value] : leftCards.value))

const statusText = computed(() => {
  if (status.value === 'ready') return 'three.js · WebGL2 · 50 片实例化花瓣 · 锦鲤跃水 · 实时水面涟漪'
  if (status.value === 'unsupported') return '当前环境不支持 WebGL，已回退为静态背景'
  return '场景初始化中…'
})

function hasPhoto(card: LandingCard): boolean {
  return Boolean(toValue(card.bgImage))
}

function cardStyle(card: LandingCard): CSSProperties {
  const image = toValue(card.bgImage)
  return {
    '--tint': card.themeColor,
    backgroundImage: image ? `url(${image})` : undefined
  } as CSSProperties
}
</script>

<template>
  <div class="lab">
    <canvas ref="canvas" class="lab__canvas" />

    <header class="lab__head">
      <p class="lab__badge">SCENE 01</p>
      <h1 class="lab__title">
        <span>水面之上</span>
        花瓣正在落下
      </h1>
      <p class="lab__subtitle">雾化过渡 · 倾斜视口 · 实时涟漪 · 实例化花瓣</p>
    </header>

    <nav class="lab__cards" aria-label="站点导航">
      <button
        v-for="(card, index) in cards"
        :key="card.id"
        type="button"
        class="lab-card"
        :class="{ 'lab-card--photo': hasPhoto(card) }"
        :style="{ ...cardStyle(card), '--delay': `${index * -1.9}s` }"
        @click="open(card, $event)"
      >
        <span class="lab-card__shade" />
        <span class="lab-card__index">0{{ card.id }}</span>
        <span class="lab-card__title">{{ card.title }}</span>
        <span class="lab-card__sub">{{ card.subtitle }}</span>
      </button>
    </nav>

    <RouteSwitcher />

    <p class="lab__status">{{ statusText }}</p>
    <p v-if="error" class="lab__error">{{ error }}</p>

    <div class="lab__fog" aria-hidden="true" />
  </div>
</template>

<style scoped lang="scss">
$ink: #33203f;
$muted: #7d6a88;
$accent: #8a5f9a;

.lab {
  position: relative;
  min-height: 100vh;
  min-height: 100dvh;
  overflow-x: hidden;
  background: radial-gradient(120% 85% at 50% 0%, #fff7fb 0%, #f4ecfb 36%, #e8dff5 66%, #ddd2ee 100%);
  color: $ink;
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;

  &::after {
    content: '';
    position: fixed;
    inset: 0;
    z-index: 1;
    background: radial-gradient(120% 90% at 50% 40%, transparent 45%, rgb(74 46 96 / 18%) 100%);
    pointer-events: none;
  }
}

.lab__canvas {
  position: fixed;
  inset: 0;
  z-index: 0;
  display: block;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.lab__head {
  position: relative;
  z-index: 2;
  max-width: 460px;
  padding: 15vh 0 0 6vw;
  pointer-events: none;
}

.lab__badge {
  display: inline-block;
  margin: 0 0 18px;
  padding: 4px 12px;
  border: 1px solid rgb(255 255 255 / 60%);
  border-radius: 999px;
  background: rgb(255 255 255 / 40%);
  color: $muted;
  font-size: 10px;
  letter-spacing: 3px;
}

.lab__title {
  margin: 0 0 14px;
  font-size: clamp(30px, 4.2vw, 52px);
  font-weight: 800;
  letter-spacing: 0.05em;
  line-height: 1.24;

  span {
    display: block;
    margin-bottom: 6px;
    color: $accent;
    font-size: 0.44em;
    font-weight: 500;
    letter-spacing: 0.5em;
  }
}

.lab__subtitle {
  margin: 0;
  color: $muted;
  font-size: 12px;
  letter-spacing: 0.18em;
}

.lab__cards {
  position: absolute;
  top: 132px;
  right: 6vw;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 320px;
}

.lab-card {
  --tint: rgb(194 150 205 / 1);

  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 3px;
  min-height: 96px;
  padding: 16px 18px;
  overflow: hidden;
  border: 1px solid rgb(255 255 255 / 55%);
  border-radius: 16px;
  background-color: rgb(255 255 255 / 32%);
  background-position: center;
  background-size: cover;
  box-shadow: 0 18px 40px -26px rgb(58 35 82 / 55%);
  color: $ink;
  font: inherit;
  text-align: left;
  cursor: pointer;
  outline: 2px solid transparent;
  outline-offset: 2px;
  animation: lab-float 11s ease-in-out infinite alternate;
  animation-delay: var(--delay);
  transition: outline-color 0.2s ease;
  will-change: transform;

  &:hover {
    outline-color: rgb(255 255 255 / 80%);
  }

  &:nth-child(3) {
    min-height: 148px;
  }
}

.lab-card__shade {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, var(--tint), rgb(255 255 255 / 8%) 72%);
  opacity: 0.62;
  pointer-events: none;
}

.lab-card--photo {
  color: #fff;

  .lab-card__shade {
    background: linear-gradient(180deg, rgb(32 20 44 / 0%) 34%, rgb(32 20 44 / 66%) 100%);
    opacity: 1;
  }

  .lab-card__sub {
    color: rgb(255 255 255 / 72%);
  }
}

.lab-card__index,
.lab-card__title,
.lab-card__sub {
  position: relative;
  z-index: 1;
}

.lab-card__index {
  margin-bottom: auto;
  font-size: 10px;
  letter-spacing: 0.32em;
  opacity: 0.6;
}

.lab-card__title {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-shadow: 0 1px 8px rgb(30 16 44 / 22%);
}

.lab-card__sub {
  color: rgb(51 32 63 / 62%);
  font-size: 9px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.lab__status {
  position: absolute;
  bottom: 22px;
  left: 6vw;
  z-index: 2;
  margin: 0;
  color: $muted;
  font-size: 11px;
  letter-spacing: 0.1em;
}

.lab__error {
  position: absolute;
  bottom: 42px;
  left: 6vw;
  z-index: 2;
  margin: 0;
  color: #b4576b;
  font-size: 11px;
}

.lab__fog {
  position: fixed;
  inset: 0;
  z-index: 30;
  background: radial-gradient(circle at 50% 46%, #fffdfe 0%, #f7f0fc 52%, #efe6f8 100%);
  pointer-events: none;
  animation: lab-fog 2.2s ease-out forwards;
}

@keyframes lab-fog {
  0% {
    opacity: 1;
    transform: scale(1.04);
  }

  100% {
    visibility: hidden;
    opacity: 0;
    transform: scale(1);
  }
}

@keyframes lab-float {
  from {
    transform: translate3d(0, -6px, 0) rotate(-0.35deg);
  }

  to {
    transform: translate3d(0, 8px, 0) rotate(0.35deg);
  }
}

@media (max-width: 1100px) {
  .lab {
    padding-bottom: 96px;
  }

  .lab__head {
    max-width: none;
    padding: 96px 20px 0;
  }

  .lab__cards {
    position: static;
    width: auto;
    margin: 32px 20px 0;
  }

  .lab-card {
    min-height: 120px;
    animation: none;
  }

  .lab__status,
  .lab__error {
    position: static;
    margin: 24px 20px 0;
  }
}
</style>
