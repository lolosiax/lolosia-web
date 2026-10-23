<script setup lang="ts">
import { computed } from 'vue'
import RouteSwitcher from '../components/shared/RouteSwitcher.vue'
import { useLandingCards } from '../composables/use-landing-cards'
import type { LandingCard } from '../composables/use-landing-cards'

defineOptions({ name: 'LandingLitePage' })

const { leftCards, largeCard, open } = useLandingCards()

const entries = computed<LandingCard[]>(() =>
  largeCard.value ? [...leftCards.value, largeCard.value] : leftCards.value
)
</script>

<template>
  <div class="lite">
    <RouteSwitcher />

    <header class="lite__head">
      <p class="lite__badge">NAVIGATION</p>
      <h1 class="lite__title">
        欢迎你
        <span>来自现实的旅人</span>
      </h1>
      <p class="lite__subtitle">你想要去往何方？</p>
    </header>

    <main class="lite__list">
      <button
        v-for="card in entries"
        :key="card.id"
        type="button"
        class="entry"
        :class="{ 'entry--main': card.id === largeCard?.id }"
        @click="open(card, $event)"
      >
        <span class="entry__icon">{{ card.icon }}</span>
        <span class="entry__body">
          <span class="entry__title">{{ card.title }}</span>
          <span class="entry__desc">{{ card.description }}</span>
        </span>
        <span class="entry__arrow">→</span>
      </button>
    </main>

    <footer class="lite__copy">© 2026 Lolosia. All rights reserved.</footer>
  </div>
</template>

<style scoped lang="scss">
.lite {
  min-height: 100vh;
  min-height: 100dvh;
  padding: 64px 24px 40px;
  background: linear-gradient(160deg, #fbf6fe 0%, #f3e9f8 100%);
  color: #2d1b3a;
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

.lite__head {
  max-width: 640px;
  margin: 0 auto 32px;
}

.lite__badge {
  display: inline-block;
  margin: 0 0 16px;
  padding: 4px 12px;
  border: 1px solid #ddc9e6;
  border-radius: 999px;
  color: #9b7fa8;
  font-size: 10px;
  letter-spacing: 3px;
}

.lite__title {
  margin: 0 0 10px;
  font-size: 40px;
  font-weight: 800;
  line-height: 1.2;

  span {
    display: block;
    color: #a480ab;
  }
}

.lite__subtitle {
  margin: 0;
  color: #8a7a94;
  font-size: 14px;
}

.lite__list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 640px;
  margin: 0 auto;
}

.entry {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 16px 18px;
  border: 1px solid #e6d8ed;
  border-radius: 14px;
  background: #fff;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.15s ease;
  appearance: none;

  &:hover {
    background: #f7eefb;
  }

  &--main {
    border-color: #dcc0e6;
    background: #f6edfa;
  }
}

.entry__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: #f0e3f6;
  color: #a480ab;
  font-size: 18px;
  flex-shrink: 0;
}

.entry__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.entry__title {
  font-size: 15px;
  font-weight: 600;
}

.entry__desc {
  color: #8a7a94;
  font-size: 12px;
}

.entry__arrow {
  color: #b79ac4;
  font-size: 14px;
}

.lite__copy {
  max-width: 640px;
  margin: 32px auto 0;
  color: #b4a3bd;
  font-size: 11px;
  letter-spacing: 0.5px;
}
</style>
