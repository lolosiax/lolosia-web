<script setup lang="ts">
// 背景层：粒子画布 + 三团柔光，纯装饰。
import { ref } from 'vue'
import { useDashboardBackdrop } from '../composables/use-dashboard-backdrop'

defineOptions({ name: 'DashboardBackdrop' })

const canvasRef = ref<HTMLCanvasElement | null>(null)
useDashboardBackdrop(canvasRef)
</script>

<template>
  <div class="dash-bg" aria-hidden="true">
    <canvas ref="canvasRef" class="dash-bg__canvas" />
    <span class="dash-bg__blob dash-bg__blob--one" />
    <span class="dash-bg__blob dash-bg__blob--two" />
    <span class="dash-bg__blob dash-bg__blob--three" />
  </div>
</template>

<style scoped lang="scss">
.dash-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;

  &__canvas {
    width: 100%;
    height: 100%;
  }

  &__blob {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);

    &--one {
      top: -180px;
      right: -120px;
      width: 520px;
      height: 520px;
      background: radial-gradient(circle, rgba(210, 177, 219, 0.4), transparent 70%);
    }

    &--two {
      bottom: -120px;
      left: 6%;
      width: 380px;
      height: 380px;
      background: radial-gradient(circle, rgba(223, 205, 230, 0.35), transparent 70%);
    }

    &--three {
      top: 32%;
      left: 40%;
      width: 300px;
      height: 300px;
      background: radial-gradient(circle, rgba(111, 155, 216, 0.16), transparent 70%);
    }
  }
}
</style>
