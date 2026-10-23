<script setup lang="ts">
import { ref } from 'vue'
import { useLandingBackdrop } from '../../composables/use-landing-backdrop'

defineOptions({ name: 'LandingBackdrop' })

const canvas = ref<HTMLCanvasElement | null>(null)
useLandingBackdrop(canvas)
</script>

<template>
  <canvas ref="canvas" class="bg-canvas" />
  <div class="blob blob-1" />
  <div class="blob blob-2" />
</template>

<style scoped lang="scss">
$primary-light: #d2b1db;
$primary-lighter: #dfcde6;

.bg-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
}

.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  z-index: 0;
  pointer-events: none;

  &-1 {
    width: 600px;
    height: 600px;
    top: -200px;
    right: -150px;
    background: radial-gradient(circle, rgba($primary-light, 0.3), transparent 70%);
  }

  &-2 {
    width: 400px;
    height: 400px;
    bottom: -100px;
    left: 10%;
    background: radial-gradient(circle, rgba($primary-lighter, 0.25), transparent 70%);
  }
}

@media (max-width: 1024px) {
  // 画布改为固定定位，随视口尺寸而不是整页高度
  .bg-canvas {
    position: fixed;
    height: 100vh;
    height: 100dvh;
  }
}
</style>
