<script setup lang="ts">
import { FEATURES } from '../../lib'
import AboutText from './AboutText.vue'
import FeatureList from './FeatureList.vue'
import ThemeColors from './ThemeColors.vue'

defineOptions({ name: 'AboutSection' })
</script>

<template>
  <section class="about">
    <div class="about__container">
      <h2 class="about__title">关于洛洛希雅</h2>
      <p class="about__subtitle">温柔、可靠，也有点小迷糊的治愈系大姐姐</p>

      <div class="about__grid">
        <div class="about__main"><AboutText /></div>
        <div class="about__side">
          <FeatureList title="外貌特征" :items="FEATURES" />
          <ThemeColors />
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.about {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100vw;
  height: 100vh;
  padding: 90px 6vw 60px;
  overflow: hidden;

  &__container {
    width: 100%;
    max-width: 1180px;
  }

  &__title {
    margin: 0 0 6px;
    color: #3d2f42;
    font-size: 30px;
    font-weight: 800;
  }

  &__subtitle {
    margin: 0 0 26px;
    color: #8a7a94;
    font-size: 13px;
  }

  &__grid {
    display: grid;
    grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
    gap: 22px;
    align-items: start;
  }

  &__main {
    padding: 26px 28px;
    border: 1px solid rgba(255, 255, 255, 0.75);
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.55);
    box-shadow: 0 12px 30px rgba(164, 128, 171, 0.14);
    backdrop-filter: blur(10px);
  }

  &__side {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
}

@media (max-width: 960px) {
  .about {
    align-items: flex-start;
    padding: 84px 24px 40px;
    overflow-y: auto;

    &__grid {
      grid-template-columns: minmax(0, 1fr);
    }

    &__title {
      font-size: 24px;
    }
  }
}
</style>
