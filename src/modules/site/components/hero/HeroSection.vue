<script setup lang="ts">
import { computed } from 'vue'
import { INTRO_TEXT, heroFacts } from '../../lib'
import { usePointerParallax } from '../../composables/use-pointer-parallax'
import FactRow from './FactRow.vue'

defineOptions({ name: 'HeroSection' })

const facts = computed(() => heroFacts())
const { offsetX, offsetY } = usePointerParallax()
</script>

<template>
  <section class="hero-panel">
    <div class="hero-panel__inner">
      <article
        class="hero-panel__card"
        :style="{ transform: `rotate(-4deg) translate(${offsetX * 0.3}px, ${offsetY * 0.3}px)` }"
      >
        <span class="hero-panel__badge">Lolosia · Virtual Idol</span>
        <h1 class="hero-panel__title">洛洛希雅</h1>
        <p class="hero-panel__lead">{{ INTRO_TEXT }}</p>
        <div class="hero-panel__facts">
          <FactRow v-for="fact in facts" :key="fact.label" :label="fact.label" :value="fact.value" />
        </div>
      </article>

      <div class="hero-panel__art" :style="{ transform: `translate(${offsetX * 0.6}px, ${offsetY * 0.6}px)` }">
        <span class="hero-panel__halo" />
        <span class="hero-panel__portrait"><i class="bi bi-flower1" /></span>
        <span class="hero-panel__spark hero-panel__spark--one" />
        <span class="hero-panel__spark hero-panel__spark--two" />
        <span class="hero-panel__spark hero-panel__spark--three" />
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.hero-panel {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100vw;
  height: 100vh;
  padding: 90px 6vw 60px;
  overflow: hidden;

  &__inner {
    display: grid;
    grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
    gap: 5vw;
    align-items: center;
    width: 100%;
    max-width: 1280px;
  }

  &__card {
    position: relative;
    z-index: 2;
    padding: 36px 32px;
    border: 1px solid rgba(255, 255, 255, 0.8);
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.72);
    box-shadow: 0 18px 40px rgba(164, 128, 171, 0.22);
    backdrop-filter: blur(14px);
    transition: transform 0.2s ease-out;
  }

  &__badge {
    display: inline-block;
    margin-bottom: 12px;
    color: #a480ab;
    font-size: 10px;
    letter-spacing: 3px;
    text-transform: uppercase;
  }

  &__title {
    margin: 0 0 4px;
    color: #a480ab;
    font-size: 46px;
    font-weight: 800;
    letter-spacing: 2px;
  }

  &__lead {
    margin: 0 0 24px;
    color: #6b5c70;
    font-size: 14px;
    line-height: 1.85;
    text-align: justify;
  }

  &__facts {
    display: flex;
    flex-direction: column;
    gap: 11px;
    padding-top: 18px;
    border-top: 1px solid rgba(164, 128, 171, 0.18);
  }

  &__art {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    height: min(560px, 68vh);
    transition: transform 0.15s ease-out;
  }

  &__halo {
    position: absolute;
    width: 78%;
    aspect-ratio: 1;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(210, 177, 219, 0.55), rgba(210, 177, 219, 0.05) 65%, transparent 72%);
    animation: hero-breathe 7s ease-in-out infinite;
  }

  &__portrait {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 46%;
    aspect-ratio: 3 / 4;
    border-radius: 28px;
    color: rgba(255, 255, 255, 0.85);
    font-size: 64px;
    background:
      radial-gradient(circle at 50% 22%, rgba(255, 255, 255, 0.55), transparent 42%),
      linear-gradient(160deg, rgba(210, 177, 219, 0.95), rgba(164, 128, 171, 0.78) 60%, rgba(139, 106, 146, 0.9));
    box-shadow: 0 24px 50px rgba(164, 128, 171, 0.35);
    animation: hero-float 6s ease-in-out infinite;
  }

  &__spark {
    position: absolute;
    border-radius: 50%;
    background: rgba(210, 177, 219, 0.24);
    animation: hero-float 8s ease-in-out infinite;

    &--one {
      top: 12%;
      left: 8%;
      width: 90px;
      height: 90px;
    }

    &--two {
      right: 10%;
      bottom: 18%;
      width: 64px;
      height: 64px;
      animation-delay: 2s;
    }

    &--three {
      top: 26%;
      right: 16%;
      width: 46px;
      height: 46px;
      animation-delay: 4s;
    }
  }
}

@keyframes hero-float {
  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-16px);
  }
}

@keyframes hero-breathe {
  0%,
  100% {
    opacity: 0.75;
    transform: scale(1);
  }

  50% {
    opacity: 1;
    transform: scale(1.04);
  }
}

@media (max-width: 960px) {
  .hero-panel {
    padding: 80px 24px 40px;
    overflow-y: auto;

    &__inner {
      grid-template-columns: minmax(0, 1fr);
      gap: 18px;
    }

    &__art {
      height: 240px;
    }

    &__portrait {
      width: 120px;
      font-size: 40px;
    }

    &__title {
      font-size: 34px;
    }
  }
}
</style>
