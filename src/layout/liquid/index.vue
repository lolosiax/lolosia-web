<script setup lang="ts">
import AppMain from '@/layout/default/app-main/index.vue'
import SideBar from '@/layout/liquid/sidebar/index.vue'
</script>

<template>
  <div class="liquid-layout-wrapper">
    <SideBar />
    <AppMain class="app-main" />
  </div>
</template>

<!--suppress CssOverwrittenProperties -->
<style scoped lang="scss">
.liquid-layout-wrapper {
  height: 100vh;
  height: 100dvh;
  width: 100%;
  overflow: hidden;
  display: grid;
  grid-template-columns: auto 1fr;
  // background: url('@/views/login/img.png');
  background: linear-gradient(to bottom, #d8abe2 0%, #fbf2ff 50%);

  .side-bar {
    z-index: 1;
  }

  .app-main {
    background-color: unset;
  }
}
</style>
