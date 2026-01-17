<script setup lang="ts">
// 虚拟偶像个人中心主页面
import { onMounted, ref } from 'vue'
import Navbar from './components/Navbar.vue'
import DynamicBackground from './components/DynamicBackground.vue'
import PageTransition from './components/PageTransition.vue'
import LiquidTransition from './components/LiquidTransition.vue'

// 导入所有sections
import HeroSection from './components/sections/HeroSection.vue'
import AboutSection from './components/sections/AboutSection.vue'
import PhotoWallSection from './components/sections/PhotoWallSection.vue'
import GameScenesSection from './components/sections/GameScenesSection.vue'
import CopyRight from '@/views/landing/components/CopyRight.vue'

// 管理当前section
const currentSection = ref(0)
const totalSections = 4
const transitionProgress = ref(0)

// 所有sections
const sections = [
  { id: 'hero', component: HeroSection },
  { id: 'about', component: AboutSection },
  { id: 'photo-wall', component: PhotoWallSection },
  { id: 'game-scenes', component: GameScenesSection }
]

// 初始化页面 - 禁用默认滚动，实现自定义滚动
onMounted(() => {
  // 禁用默认滚动
  document.body.style.overflow = 'hidden'

  // 监听滚动事件
  window.addEventListener('wheel', handleWheel)

  // 监听键盘事件
  window.addEventListener('keydown', handleKeydown)
})

// 处理滚轮事件
function handleWheel(event: WheelEvent) {
  // 根据滚轮方向切换section
  const delta = event.deltaY > 0 ? 1 : -1
  changeSection(currentSection.value + delta)
}

// 处理键盘事件
function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowDown') {
    changeSection(currentSection.value + 1)
  } else if (event.key === 'ArrowUp') {
    changeSection(currentSection.value - 1)
  }
}

// 切换section
function changeSection(newSection: number) {
  // 确保section在有效范围内
  if (newSection >= 0 && newSection < totalSections) {
    currentSection.value = newSection
  }
}

// 处理过渡结束事件
function handleTransitionEnd(section: number) {
  // 可以在这里添加过渡结束后的逻辑
  console.log('Transition ended for section:', section)
}
</script>

<template>
  <div class="landing-page">
    <!-- 动态背景 -->
    <DynamicBackground />

    <!-- 导航栏 -->
    <Navbar />

    <!-- 流体过渡效果 -->
    <LiquidTransition :progress="transitionProgress" />

    <!-- 页面过渡容器 -->
    <PageTransition
      :current-section="currentSection"
      :total-sections="totalSections"
      @transition-end="handleTransitionEnd"
    >
      <!-- 所有sections -->
      <div class="sections-container">
        <HeroSection class="section" />
        <AboutSection class="section" />
        <PhotoWallSection class="section" />
        <GameScenesSection class="section" />
      </div>
    </PageTransition>
  </div>
</template>

<style scoped lang="scss">
.landing-page {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.sections-container {
  display: flex;
  width: 400vw; /* 4个sections，每个100vw */
  height: 100vh;
  overflow: hidden;
}

.section {
  width: 100vw;
  height: 100vh;
  flex-shrink: 0;
  overflow: hidden;
}
</style>
