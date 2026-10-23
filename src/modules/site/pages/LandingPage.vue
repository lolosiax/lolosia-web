<script setup lang="ts">
import { ref, watch } from 'vue'
import LandingBackdrop from '../components/landing/LandingBackdrop.vue'
import LandingCardGrid from '../components/landing/LandingCardGrid.vue'
import LandingIntro from '../components/landing/LandingIntro.vue'
import { useLandingCards } from '../composables/use-landing-cards'
import type { LandingCard } from '../composables/use-landing-cards'

defineOptions({ name: 'LandingPage' })

const { leftCards, largeCard, open } = useLandingCards()

const hoveringImage = ref<string>()
const hoveringImage0 = ref<string>()

// 渐隐期间继续用上一张图，避免背景突然消失
watch(hoveringImage, image => {
  if (image) hoveringImage0.value = image
})

function handleHover(image?: string): void {
  hoveringImage.value = image
}

function handleOpen(card: LandingCard, event: MouseEvent): void {
  open(card, event)
}
</script>

<template>
  <div class="portal-page">
    <LandingBackdrop />

    <div class="content-wrapper">
      <!-- Hover fullscreen background overlay -->
      <Transition name="hover-bg">
        <div v-if="hoveringImage" class="hover-bg-overlay" :style="{ backgroundImage: `url(${hoveringImage0})` }" />
      </Transition>

      <!-- ===== Left Panel ===== -->
      <LandingIntro :cards="leftCards" />

      <!-- ===== Right Panel: Slanted Parallelogram Grid ===== -->
      <LandingCardGrid :cards="leftCards" :large-card="largeCard" @open="handleOpen" @hover="handleHover" />

      <div class="copyright-bar">
        <span>© 2026 Lolosia. All rights reserved.</span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
$text-dark: #2d1b3a;
$text-muted: #8a7a94;
$bg-light: #faf5ff;

.portal-page {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  background: $bg-light;
  color: $text-dark;
}

.content-wrapper {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
}

// Hover fullscreen overlay
.hover-bg-overlay {
  position: absolute;
  inset: 0;
  z-index: 0;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  pointer-events: none;
}

// 版权行独立于左右面板，桌面端固定左下角，移动端自然排在页面末尾
.copyright-bar {
  position: absolute;
  bottom: 20px;
  left: 50px;
  z-index: 2;
  font-size: 11px;
  color: rgba($text-muted, 0.4);
  letter-spacing: 0.5px;
}

.hover-bg-enter-active,
.hover-bg-leave-active {
  transition: opacity 0.8s ease;
}

.hover-bg-enter-from,
.hover-bg-leave-to {
  opacity: 0;
}

@media (max-width: 1024px) {
  .portal-page {
    width: 100%;
    height: auto;
    min-height: 100vh;
    min-height: 100dvh;
    // 只裁剪装饰 blob，页面滚动交给文档本身，避免出现内层滚动条占宽
    overflow: hidden;
  }

  .content-wrapper {
    display: flex;
    flex-direction: column;
    height: auto;
    min-height: 100vh;
    min-height: 100dvh;
  }

  .copyright-bar {
    position: static;
    left: auto;
    bottom: auto;
    margin-top: auto;
    padding: 20px 32px 28px;
    text-align: center;
  }
}

@media (max-width: 768px) {
  .copyright-bar {
    padding: 12px 20px 22px;
    font-size: 10px;
  }

  .hover-bg-overlay {
    display: none;
  }
}
</style>
