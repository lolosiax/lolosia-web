<script setup lang="ts">
// 页面过渡组件 - 管理section之间的过渡
import { onMounted, ref, watch } from 'vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// 注册GSAP插件
gsap.registerPlugin(ScrollTrigger)

// Props
const props = defineProps<{
  currentSection: number
  totalSections: number
}>()

// Emits
const emit = defineEmits<{
  (e: 'transition-end', section: number): void
}>()

// Refs
const sectionsRef = ref<HTMLElement[]>([])
const sectionsContainerRef = ref<HTMLElement | null>(null)
const transitionProgress = ref(0)

// 初始化页面过渡
function initPageTransition() {
  // 获取所有section元素
  if (sectionsContainerRef.value) {
    const sections = sectionsContainerRef.value.querySelectorAll('.section')
    sectionsRef.value = Array.from(sections) as HTMLElement[]
  }

  if (sectionsRef.value.length === 0) return

  // 初始化sections-container位置
  const sectionsContainer = document.querySelector('.sections-container')
  if (sectionsContainer) {
    gsap.set(sectionsContainer, {
      xPercent: -100 * props.currentSection
    })
  }
}

// 移动到指定section
function goToSection(sectionIndex: number) {
  const sectionsContainer = document.querySelector('.sections-container')
  if (sectionsContainer) {
    gsap.to(sectionsContainer, {
      xPercent: -100 * sectionIndex,
      duration: 0.8,
      ease: 'power2.inOut'
    })
  }
}

// 触发section进入动画
function triggerSectionEnter(sectionIndex: number) {
  const section = sectionsRef.value[sectionIndex]
  if (!section) return

  // 为section内的元素添加进入动画
  gsap.fromTo(
    section.querySelectorAll('.animate-on-enter'),
    {
      opacity: 0,
      y: 50,
      scale: 0.95
    },
    {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.8,
      ease: 'power2.out',
      stagger: 0.1,
      delay: 0.2
    }
  )

  // 触发过渡结束事件
  emit('transition-end', sectionIndex)
}

// 监听当前section变化
watch(
  () => props.currentSection,
  (newSection, oldSection) => {
    if (newSection !== oldSection) {
      // 先触发目标页面的进入动画
      triggerSectionEnter(newSection)
      
      // 同时移动sections-container到对应位置
      const sectionsContainer = document.querySelector('.sections-container')
      if (sectionsContainer) {
        gsap.to(sectionsContainer, {
          xPercent: (-100 * newSection) / props.totalSections,
          duration: 0.8,
          ease: 'power2.inOut'
        })
      }
    }
  }
)

// 生命周期钩子
onMounted(() => {
  // 初始化页面过渡
  initPageTransition()

  // 触发初始section进入动画
  triggerSectionEnter(props.currentSection)
})

// 暴露方法给父组件
defineExpose({
  transitionProgress,
  sectionsRef,
  triggerSectionEnter
})
</script>

<template>
  <div class="page-transition">
    <!-- 插槽：放置所有sections -->
    <div ref="sectionsContainerRef">
      <slot />
    </div>

    <!-- 过渡指示器 -->
    <div class="transition-indicator">
      <div v-for="i in totalSections" :key="i" class="indicator-dot" :class="{ active: currentSection === i - 1 }" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.page-transition {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;

  /* 指示点样式 */
  .transition-indicator {
    position: fixed;
    right: 50px;
    top: 50%;
    transform: translateY(-50%);
    z-index: 100;
    display: flex;
    flex-direction: column;
    gap: 20px;

    .indicator-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: rgba(210, 177, 219, 0.5);
      cursor: pointer;
      transition: all 0.3s ease;

      &.active {
        background: var(--lolosia-color-primary);
        transform: scale(1.5);
        box-shadow: 0 0 10px rgba(210, 177, 219, 0.8);
      }

      &:hover {
        background: var(--lolosia-color-primary-light-3);
        transform: scale(1.2);
      }
    }
  }
}
</style>
