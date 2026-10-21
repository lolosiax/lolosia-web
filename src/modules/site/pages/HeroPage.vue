<script setup lang="ts">
// 洛洛希雅个人主页：四屏横向切换，滚动 / 方向键 / 右侧圆点均可翻页。
import { ref } from 'vue'
import { HERO_SECTIONS } from '../lib'
import { useHeroSections } from '../composables/use-hero-sections'
import AboutSection from '../components/hero/AboutSection.vue'
import GameScenesSection from '../components/hero/GameScenesSection.vue'
import HeroBackdrop from '../components/hero/HeroBackdrop.vue'
import HeroNavbar from '../components/hero/HeroNavbar.vue'
import HeroSection from '../components/hero/HeroSection.vue'
import PhotoWallSection from '../components/hero/PhotoWallSection.vue'
import SectionPager from '../components/hero/SectionPager.vue'

defineOptions({ name: 'HeroPage' })

const track = ref<HTMLElement | null>(null)
const { active, isMobile, go } = useHeroSections(track)
</script>

<template>
  <div class="hero" :class="{ 'is-mobile': isMobile }">
    <HeroBackdrop />
    <HeroNavbar :sections="HERO_SECTIONS" :active="active" @go="go" />

    <div ref="track" class="hero__track">
      <HeroSection class="hero__panel" />
      <AboutSection class="hero__panel" />
      <PhotoWallSection class="hero__panel" />
      <GameScenesSection class="hero__panel" />
    </div>

    <SectionPager v-if="!isMobile" :sections="HERO_SECTIONS" :active="active" @go="go" />
  </div>
</template>

<style scoped lang="scss">
.hero {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  color: #2d1b3a;

  &__track {
    position: absolute;
    inset: 0;
    z-index: 1;
    display: flex;
    width: 400vw;
    height: 100vh;
    will-change: transform;
  }

  &__panel {
    flex: 0 0 100vw;
    width: 100vw;
    height: 100vh;
  }

  /* 手机端改为原生纵向滚动，不再做整屏横向位移 */
  &.is-mobile {
    width: 100%;
    height: auto;
    min-height: 100vh;
    min-height: 100dvh;
    overflow: visible;

    .hero__track {
      position: static;
      flex-direction: column;
      width: 100%;
      height: auto;
      will-change: auto;
    }

    .hero__panel {
      flex: none;
      width: 100%;
      height: auto;
      min-height: 100vh;
      min-height: 100dvh;
    }
  }
}
</style>
