<script setup lang="ts">
// 入口页：左侧欢迎语，右侧斜切卡片网格。
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { PORTAL_CARDS } from '../lib'
import type { PortalCard } from '../lib'
import PortalBackground from '../components/portal/PortalBackground.vue'
import PortalCardView from '../components/portal/PortalCard.vue'
import PortalIntro from '../components/portal/PortalIntro.vue'

defineOptions({ name: 'LandingPage' })

const router = useRouter()
const smallCards = computed(() => PORTAL_CARDS.filter(card => !card.large))
const largeCard = computed(() => PORTAL_CARDS.find(card => card.large))

function open(card: PortalCard): void {
  void router.push(card.path)
}
</script>

<template>
  <div class="portal">
    <PortalBackground />

    <section class="portal__intro">
      <PortalIntro :items="PORTAL_CARDS" />
    </section>

    <section class="portal__stage">
      <div class="portal__col">
        <PortalCardView v-for="card in smallCards" :key="card.id" :card="card" @open="open" />
      </div>
      <div class="portal__col portal__col--large">
        <PortalCardView v-if="largeCard" :card="largeCard" @open="open" />
      </div>
    </section>

    <footer class="portal__copy">© 2026 Lolosia. All rights reserved.</footer>
  </div>
</template>

<style scoped lang="scss">
.portal {
  position: relative;
  display: flex;
  align-items: center;
  gap: 40px;
  width: 100%;
  height: 100vh;
  height: 100dvh;
  padding: 0 6vw;
  overflow: hidden;
  color: #2d1b3a;
  background: #faf5ff;

  &__intro {
    position: relative;
    z-index: 1;
    flex: 0 0 38%;
    display: flex;
    justify-content: center;
  }

  &__stage {
    position: relative;
    z-index: 1;
    display: grid;
    flex: 1;
    grid-template-columns: 1fr 1.15fr;
    gap: 16px;
    height: min(620px, 76vh);
    transform: skewX(-5deg);
  }

  &__col {
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: 0;

    &--large {
      height: 100%;
    }
  }

  &__copy {
    position: absolute;
    bottom: 18px;
    left: 6vw;
    z-index: 1;
    color: rgba(138, 122, 148, 0.5);
    font-size: 11px;
    letter-spacing: 0.5px;
  }
}

@media (max-width: 1100px) {
  .portal {
    gap: 20px;
    padding: 0 4vw;

    &__intro {
      flex-basis: 44%;
    }

    &__stage {
      height: min(540px, 70vh);
    }
  }
}

@media (max-width: 820px) {
  .portal {
    flex-direction: column;
    gap: 24px;
    justify-content: flex-start;
    height: 100vh;
    height: 100dvh;
    padding: 32px 20px 40px;
    overflow-x: hidden;
    overflow-y: auto;

    &__intro {
      flex: none;
      width: 100%;
    }

    &__stage {
      flex: none;
      grid-template-columns: 1fr;
      width: 100%;
      height: auto;
      min-height: 0;
      gap: 12px;
      transform: none;
    }

    &__col {
      gap: 12px;

      &--large {
        height: auto;
      }
    }

    &__copy {
      position: static;
      margin-top: auto;
      padding-top: 8px;
      text-align: center;
    }
  }
}
</style>
