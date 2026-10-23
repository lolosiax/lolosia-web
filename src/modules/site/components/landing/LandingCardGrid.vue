<script setup lang="ts">
import type { LandingCard } from '../../composables/use-landing-cards'
import LandingCardView from './LandingCard.vue'

defineOptions({ name: 'LandingCardGrid' })

defineProps<{ cards: LandingCard[]; largeCard?: LandingCard }>()
const emit = defineEmits<{
  open: [card: LandingCard, event: MouseEvent]
  hover: [image?: string]
}>()
</script>

<template>
  <div class="right-panel">
    <div class="skew-container">
      <div class="card-grid">
        <!-- Left Column: 3 cards -->
        <div class="grid-col col-small">
          <LandingCardView
            v-for="card in cards"
            :key="card.id"
            :card="card"
            @open="emit('open', card, $event)"
            @hover="emit('hover', $event)"
          />
        </div>

        <!-- Right Column: 1 large card (洛洛希雅) -->
        <div class="grid-col col-large">
          <LandingCardView
            v-if="largeCard"
            :card="largeCard"
            large
            @open="emit('open', largeCard, $event)"
            @hover="emit('hover', $event)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.right-panel {
  position: absolute;
  right: 10%;
  top: 0;
  width: 700px;
  height: 100%;

  display: flex;
  align-items: center;
  justify-content: center;
  overflow: clip;
  overflow-clip-margin: 30px;

  @media screen and (max-width: 1600px) {
    right: 5%;
  }

  @media screen and (min-width: 2000px) {
    right: 15%;
  }
}

.skew-container {
  width: 100%;
  height: 620px;
  transform-origin: center center;
  position: relative;
}

.card-grid {
  display: grid;
  grid-template-columns: 1fr 1.15fr;
  gap: 16px;
  height: 100%;
  transform-origin: center center;
}

.grid-col {
  display: flex;
  flex-direction: column;
  gap: 16px;
  transform: skewX(-5deg);

  &.col-small {
    justify-content: space-between;
  }

  &.col-large {
    height: 100%;
  }
}

@media (max-width: 1024px) {
  .right-panel {
    position: static;
    top: auto;
    right: auto;
    width: 100%;
    height: auto;
    padding: 24px 32px 56px;
    overflow: visible;
    overflow-clip-margin: 0;
  }

  .skew-container {
    width: 100%;
    height: auto;
    transform: none;
  }

  .card-grid {
    grid-template-columns: 1fr;
    height: auto;
    transform: none;
  }

  .grid-col {
    height: auto;
    gap: 14px;
    justify-content: flex-start;
    transform: none;
  }
}

@media (max-width: 768px) {
  .right-panel {
    padding: 18px 20px 40px;
  }

  .card-grid {
    gap: 12px;
  }

  .grid-col {
    gap: 12px;
  }
}
</style>
