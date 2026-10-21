<script setup lang="ts">
import { ref } from 'vue'
import { useHeroParticles } from '../../composables/use-hero-particles'

defineOptions({ name: 'HeroBackdrop' })

const canvas = ref<HTMLCanvasElement | null>(null)
useHeroParticles(canvas)
</script>

<template>
  <div class="hero-bg">
    <span class="hero-bg__blob hero-bg__blob--one" />
    <span class="hero-bg__blob hero-bg__blob--two" />
    <span class="hero-bg__blob hero-bg__blob--three" />
    <canvas ref="canvas" class="hero-bg__canvas" />
  </div>
</template>

<style scoped lang="scss">
.hero-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  background: linear-gradient(135deg, #f7eefb 0%, #efe0f5 45%, #f6eef9 100%);

  &__canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  &__blob {
    position: absolute;
    border-radius: 50%;
    filter: blur(70px);
    animation: hero-float 9s ease-in-out infinite;

    &--one {
      top: -80px;
      left: -60px;
      width: 420px;
      height: 420px;
      background: rgba(210, 177, 219, 0.45);
    }

    &--two {
      right: -120px;
      bottom: -100px;
      width: 520px;
      height: 520px;
      background: rgba(164, 128, 171, 0.28);
      animation-delay: 2s;
    }

    &--three {
      top: 30%;
      right: 22%;
      width: 260px;
      height: 260px;
      background: rgba(138, 169, 224, 0.25);
      animation-delay: 4s;
    }
  }
}

@keyframes hero-float {
  0%,
  100% {
    transform: translateY(0) scale(1);
  }

  50% {
    transform: translateY(-18px) scale(1.05);
  }
}
</style>
