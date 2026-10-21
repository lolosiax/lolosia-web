<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { useIsMobile } from '@/core/composables/use-is-mobile'
import AppMain from '../shared/AppMain.vue'
import AppNavBar from '../shared/AppNavBar.vue'
import SidebarNav from './Sidebar/SidebarNav.vue'
import MobileTabBar from './mobile/MobileTabBar.vue'
import MobileTopBar from './mobile/MobileTopBar.vue'

defineOptions({ name: 'LiquidLayout' })

const route = useRoute()
/** 入口页 / 全屏展示页跳过侧栏与顶栏。 */
const bare = computed(() => Boolean(route.meta.bare))
/** 手机上侧栏放不下：顶栏保留返回/标题/头像，导航下沉到底部路由栏。 */
const isMobile = useIsMobile()
</script>

<template>
  <div v-if="bare" class="liquid-layout liquid-layout--bare">
    <RouterView />
  </div>
  <div v-else class="liquid-layout" :class="{ 'liquid-layout--mobile': isMobile }">
    <SidebarNav v-if="!isMobile" />
    <div class="liquid-layout__body">
      <MobileTopBar v-if="isMobile" />
      <AppNavBar />
      <AppMain />
      <MobileTabBar v-if="isMobile" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.liquid-layout {
  display: grid;
  grid-template-columns: auto 1fr;
  height: 100vh;
  height: 100dvh;
  width: 100%;
  overflow: hidden;
  background: linear-gradient(to bottom, #d8abe2 0%, #fbf2ff 50%);

  &--bare {
    display: block;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    background: #faf5ff;
  }

  &--mobile {
    grid-template-columns: 1fr;

    :deep(.app-main) {
      padding: 10px 10px 12px;
    }
  }

  &__body {
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
  }
}
</style>
