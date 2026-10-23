<script setup lang="ts">
import { computed, toValue } from 'vue'
import type { LandingCard } from '../../composables/use-landing-cards'
import HalftoneCanvas from './HalftoneCanvas.vue'
import LandingCardContent from './LandingCardContent.vue'

defineOptions({ name: 'LandingCard' })

const props = defineProps<{ card: LandingCard; large?: boolean }>()
const emit = defineEmits<{
  open: [event: MouseEvent]
  hover: [image?: string]
}>()

const bgImage = computed(() => toValue(props.card.bgImage))
const hoverImage = computed(() => toValue(props.card.hoverImage) || bgImage.value)
</script>

<template>
  <div
    class="card-item"
    :class="{ 'card-item--large': large }"
    :style="{ '--card-rgb': card.themeRgb }"
    @click="emit('open', $event)"
    @mouseenter="emit('hover', hoverImage)"
    @mouseleave="emit('hover', undefined)"
  >
    <div class="card-border" :style="{ borderColor: card.borderColor }">
      <div class="card-content-box">
        <div
          class="card-bg"
          :class="card.bgClass"
          :style="{
            backgroundImage: bgImage ? `url(${bgImage})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }"
        />

        <HalftoneCanvas
          :dot-size="8"
          :transition-start="large ? 0.55 : 0.45"
          :transition-end="0.85"
          :dot-color="card.themeColor"
          easing="ease-out"
        />

        <LandingCardContent :card="card" :large="large" />

        <div class="card-shine" />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
$primary: #c296cd;
$primary-dark: #a480ab;
$card-radius: 16px;

.card-item {
  position: relative;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.45s cubic-bezier(0.23, 1, 0.32, 1);
  transform: translateY(0) scale(1);
  min-height: 0;
  flex: 1;

  &:hover {
    transform: translateY(-5px) scale(1.02);
    z-index: 5;

    .card-shine {
      opacity: 1;
    }
    .card-bg {
      transform: scale(1.06);
    }
  }

  &:active {
    transform: translateY(-2px) scale(0.98);
  }

  &--large {
    flex: none;
    height: 100%;
  }
}

.card-border {
  border-radius: $card-radius;
  overflow: hidden;
  height: 100%;
  width: 100%;
  border: 5px solid;
}

// Outer card-content-box (skew wrapper)
.card-content-box {
  height: 100%;
  width: 100%;
  transform: skewX(5deg);
  position: relative;
}

// ── Card Background (CSS art) ──
.card-bg {
  position: absolute;
  inset: -7%;
  z-index: 0;
  transition: transform 0.6s cubic-bezier(0.23, 1, 0.32, 1);
  overflow: hidden;

  &.bg-card-1 {
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.5) 0%, rgba(118, 75, 162, 0.35) 100%);
    &::after {
      content: '';
      position: absolute;
      inset: 0;
      background:
        repeating-linear-gradient(
          0deg,
          transparent,
          transparent 20px,
          rgba(255, 255, 255, 0.06) 20px,
          rgba(255, 255, 255, 0.06) 21px
        ),
        repeating-linear-gradient(
          90deg,
          transparent,
          transparent 20px,
          rgba(255, 255, 255, 0.06) 20px,
          rgba(255, 255, 255, 0.06) 21px
        );
    }
  }

  &.bg-card-2 {
    background: linear-gradient(135deg, rgba(240, 147, 251, 0.45) 0%, rgba(245, 87, 108, 0.3) 100%);
    &::after {
      content: '';
      position: absolute;
      inset: 0;
      background:
        radial-gradient(ellipse at 20% 70%, rgba(255, 255, 255, 0.12) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 30%, rgba(255, 255, 255, 0.08) 0%, transparent 40%);
    }
  }

  &.bg-card-3 {
    background: linear-gradient(135deg, rgba(79, 172, 254, 0.45) 0%, rgba(0, 242, 254, 0.25) 100%);
    &::after {
      content: '';
      position: absolute;
      inset: 0;
      background: repeating-conic-gradient(from 45deg, rgba(255, 255, 255, 0.04) 0deg 10deg, transparent 10deg 20deg);
    }
  }

  &.bg-card-4 {
    background: linear-gradient(135deg, rgba($primary, 0.55) 0%, rgba($primary-dark, 0.35) 100%);
    &::after {
      content: '';
      position: absolute;
      inset: 0;
      background:
        radial-gradient(circle at 30% 40%, rgba(255, 255, 255, 0.15) 0%, transparent 40%),
        radial-gradient(circle at 70% 60%, rgba(255, 255, 255, 0.1) 0%, transparent 30%);
    }
  }
}

:deep(.halftone-container) {
  position: absolute;
  inset: -7%;
}

// ── Card Shine ──
.card-shine {
  position: absolute;
  inset: 0;
  z-index: 4;
  opacity: 0;
  transition: opacity 0.5s ease;
  pointer-events: none;
  border-radius: $card-radius;
  background: linear-gradient(135deg, transparent 30%, rgba(255, 255, 255, 0.12) 50%, transparent 70%);
  box-shadow: inset 0 0 40px rgba(255, 255, 255, 0.05);
}

@media (max-width: 1024px) {
  .card-item {
    flex: none;
    height: 160px;

    &--large {
      height: 240px;
    }

    &:hover {
      transform: translateY(-3px) scale(1.01);
    }
  }

  .card-content-box {
    transform: none;
  }
}

@media (max-width: 768px) {
  .card-item {
    height: 132px;

    &--large {
      height: 196px;
    }
  }
}
</style>
