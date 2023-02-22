<script setup lang="ts">
import { useResponsiveSidebar } from '@/core/composables/use-resize'
import AppMain from './AppMain.vue'
import AppNavBar from './AppNavBar.vue'
import SidebarNav from './Sidebar/SidebarNav.vue'

defineOptions({ name: 'LiquidLayout' })

useResponsiveSidebar()
</script>

<template>
  <div class="liquid-layout">
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

  &__body {
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
    padding: 8px 8px 8px 4px;
  }
}
</style>
