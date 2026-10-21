<script setup lang="ts">
import { ref } from 'vue'
import { usePortalBackground } from '../../composables/use-portal-background'

defineOptions({ name: 'PortalBackground' })

const canvas = ref<HTMLCanvasElement | null>(null)
usePortalBackground(canvas)
</script>

<template>
  <canvas ref="canvas" class="portal-bg" />
  <span class="portal-blob portal-blob--one" />
  <span class="portal-blob portal-blob--two" />
</template>

<style scoped lang="scss">
.portal-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.portal-blob {
  position: absolute;
  z-index: 0;
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;

  &--one {
    top: -200px;
    right: -150px;
    width: 600px;
    height: 600px;
    background: radial-gradient(circle, rgba(210, 177, 219, 0.3), transparent 70%);
  }

  &--two {
    bottom: -100px;
    left: 10%;
    width: 400px;
    height: 400px;
    background: radial-gradient(circle, rgba(223, 205, 230, 0.25), transparent 70%);
  }
}

/* 移动端内容在入口页内部滚动，背景固定在视口，避免随内容一起滚走或撑大画布 */
@media (max-width: 820px) {
  .portal-bg,
  .portal-blob {
    position: fixed;
  }

  .portal-bg {
    height: 100vh;
    height: 100dvh;
  }
}
</style>
