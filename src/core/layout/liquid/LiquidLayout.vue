<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import AppMain from '../shared/AppMain.vue'
import AppNavBar from '../shared/AppNavBar.vue'
import SidebarNav from './Sidebar/SidebarNav.vue'

defineOptions({ name: 'LiquidLayout' })

const route = useRoute()
/** 入口页 / 全屏展示页跳过侧栏与顶栏。 */
const bare = computed(() => Boolean(route.meta.bare))
</script>

<template>
  <div v-if="bare" class="liquid-layout liquid-layout--bare">
    <RouterView />
  </div>
  <div v-else class="liquid-layout">
    <SidebarNav />
    <div class="liquid-layout__body">
      <AppNavBar />
      <AppMain />
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
    background: #faf5ff;
  }

  &__body {
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
  }
}
</style>
