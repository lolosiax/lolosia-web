<script setup lang="ts">
import { computed, ref, toValue } from 'vue'
import type { CSSProperties } from 'vue'
import Debugger from '@/core/layout/shared/Debugger.vue'
import { buildSummary } from '@/core/config/env'
import { useDebugStore } from '@/core/stores/debug'
import RouteSwitcher from '../components/shared/RouteSwitcher.vue'
import SceneControlHud from '../components/shared/SceneControlHud.vue'
import SceneDebugPanel from '../components/shared/SceneDebugPanel.vue'
import SceneModeWheel from '../components/shared/SceneModeWheel.vue'
import { useLandingCards } from '../composables/use-landing-cards'
import type { LandingCard } from '../composables/use-landing-cards'
import { useModeWheel } from '../composables/use-mode-wheel'
import type { QuickMode } from '../composables/use-mode-wheel'
import { usePetalScene } from '../composables/use-petal-scene'

defineOptions({ name: 'LandingLabPage' })

const canvas = ref<HTMLCanvasElement | null>(null)
/** 页面切换与场景调试面板默认隐藏，由调试开关「显示落地页调试器」放出。 */
const debug = useDebugStore()
const { leftCards, largeCard, open } = useLandingCards()
const { error, characterMode, cameraMode, flyMode, active, setCharacterMode, setCameraMode, setFlyMode } =
  usePetalScene(canvas)

/** 模式窗只切相机；角色保持当前选择（自动漫步 / 动画剪辑）不变。 */
function applyQuickMode(mode: QuickMode): void {
  if (mode === 'play') {
    setCameraMode('default')
    return
  }
  setFlyMode(mode === 'mc' ? 'mc' : 'maya')
  setCameraMode('fly')
}

/** 模式窗只对应相机：飞行时按飞行手感，其余都算播放（默认相机）。 */
const currentQuickMode = computed<QuickMode>(() => (cameraMode.value === 'fly' ? flyMode.value : 'play'))

const { open: wheelOpen, highlight: wheelHighlight } = useModeWheel(applyQuickMode, () => currentQuickMode.value)

const cards = computed(() => (largeCard.value ? [...leftCards.value, largeCard.value] : leftCards.value))

/** 版本号与构建信息，和登录页页脚同一份文案。 */
const buildText = computed(() => buildSummary())

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
  <div class="lab" :class="{ 'is-flying': cameraMode === 'fly', 'is-operating': active }">
    <canvas ref="canvas" class="lab__canvas" />

    <header class="lab__head">
      <p class="lab__badge"><span class="lab__badge-dot" />NAVIGATION</p>
      <h1 class="lab__title">
        <span class="lab__title-line" data-text="欢迎你">欢迎你</span>
        <span class="lab__title-line lab__title-line--accent" data-text="来自现实的旅人">来自现实的旅人</span>
      </h1>
      <p class="lab__subtitle">你想要去往何方？</p>
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

    <RouteSwitcher v-if="debug.showLandingDebug" />

    <SceneControlHud :camera-mode="cameraMode" :fly-mode="flyMode" :active="active" />
    <SceneModeWheel :open="wheelOpen" :highlight="wheelHighlight" />

    <SceneDebugPanel
      v-if="debug.showLandingDebug"
      :character-mode="characterMode"
      :camera-mode="cameraMode"
      :fly-mode="flyMode"
      @character="setCharacterMode"
      @camera="setCameraMode"
      @fly="setFlyMode"
    />

    <!-- 只保留 Ctrl+Alt+0 打开的调试弹窗，不在页面上留图标。 -->
    <Debugger :show-trigger="false" />

    <footer class="lab__footer">
      <p class="lab__copyright">© 2026 Lolosia. All rights reserved.</p>
      <p class="lab__build">{{ buildText }}</p>
    </footer>
    <p v-if="error" class="lab__error">{{ error }}</p>

    <div class="lab__fog" aria-hidden="true" />
  </div>
</template>

<style scoped lang="scss">
$ink: #33203f;
$muted: #7d6a88;
/* 欢迎语沿用完整动效页（LandingIntro）的配色与描边层次。 */
$welcome-primary: #c296cd;
$welcome-primary-dark: #a480ab;
$welcome-ink: #2d1b3a;
$welcome-muted: #8a7a94;

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

  /* 飞行时让页面空白处可以拖动转向，同时避免拖拽选中文字 */
  &.is-flying {
    cursor: crosshair;
    user-select: none;

    .lab__footer,
    .lab__error {
      opacity: 0;
    }
  }

  /* 指针锁定 / Maya 操作态：两侧面板让位给场景与按键提示 */
  &.is-operating {
    .lab__head {
      opacity: 0;
      transform: translateX(-56px);
    }

    .lab__cards {
      opacity: 0;
      pointer-events: none;
      transform: translateX(56px);
    }

    :deep(.route-switcher),
    :deep(.scene-debug) {
      opacity: 0;
      pointer-events: none;
    }
  }

  :deep(.route-switcher),
  :deep(.scene-debug) {
    transition: opacity 0.45s ease;
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
  /* 460px 是文字区宽度：左内边距用 vw，所以要把这份 padding 加回上限，
     否则「来自现实的旅人」在宽屏上会被挤到换行。 */
  max-width: calc(460px + 6vw);
  padding: 15vh 0 0 6vw;
  pointer-events: none;
  transition:
    opacity 0.45s ease,
    transform 0.45s ease;
}

.lab__badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 24px;
  padding: 6px 16px;
  border: 1px solid rgb(194 150 205 / 25%);
  border-radius: 20px;
  background: rgb(255 255 255 / 50%);
  color: $welcome-primary-dark;
  font-size: 10px;
  letter-spacing: 4px;
  text-transform: uppercase;
  backdrop-filter: blur(8px);
}

.lab__badge-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: $welcome-primary;
}

.lab__title {
  margin: 0 0 14px;
  font-size: clamp(30px, 4.2vw, 52px);
  font-weight: 800;
  line-height: 1.1;
  isolation: isolate;
}

.lab__title-line {
  position: relative;
  display: block;
  color: $welcome-ink;

  &::before {
    content: attr(data-text);
    position: absolute;
    z-index: -1;
    -webkit-text-stroke: 3px #fff;
    -webkit-text-fill-color: transparent;
  }
}

.lab__title-line--accent {
  padding-bottom: 5px;
  background: linear-gradient(135deg, $welcome-primary 0%, #dbb4e2 50%, $welcome-primary-dark 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  /* 这块比完整动效页窄，同字号才放得下「来自现实的旅人」一行。 */
  font-size: 1em;

  &::after {
    content: '';
    position: absolute;
    bottom: 4px;
    left: 0;
    width: 100%;
    height: 4px;
    border-radius: 2px;
    background: linear-gradient(90deg, $welcome-primary, transparent);
    opacity: 0.35;
  }
}

.lab__subtitle {
  margin: 0;
  color: $welcome-muted;
  font-size: 15px;
  font-weight: 400;
  letter-spacing: 0.3px;
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
  transition:
    opacity 0.45s ease,
    transform 0.45s ease;
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

.lab__footer {
  position: absolute;
  bottom: 22px;
  left: 6vw;
  z-index: 2;
  margin: 0;
  color: $muted;
  font-size: 11px;
  letter-spacing: 0.06em;
  line-height: 1.75;
  transition: opacity 0.3s ease;

  p {
    margin: 0;
  }
}

/* 构建信息比版权行淡一档，两行仍归在同一块里。 */
.lab__build {
  color: rgb(125 106 136 / 75%);
  letter-spacing: 0.04em;
}

.lab__error {
  position: absolute;
  bottom: 68px;
  left: 6vw;
  z-index: 2;
  margin: 0;
  color: #b4576b;
  font-size: 11px;
  transition: opacity 0.3s ease;
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

  .lab__footer,
  .lab__error {
    position: static;
    margin: 24px 20px 0;
  }
}
</style>
