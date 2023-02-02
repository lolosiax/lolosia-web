<script setup lang="ts">
import logo from '@/core/icons/common/sidebar-logo.svg?url'
import { settings } from '@/core/config/settings'

defineOptions({ name: 'App' })
</script>

<template>
  <main class="app-shell">
    <img class="app-shell__logo" :src="logo" alt="" />
    <h1 class="app-shell__title">{{ settings.title }}</h1>
    <ElButton type="primary" class="app-shell__action">脚手架就绪</ElButton>
  </main>
</template>

<style scoped lang="scss">
.app-shell {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  gap: 16px;
  background: #faf8fb;

  &__logo {
    width: 120px;
    height: 120px;
  }

  &__title {
    margin: 0;
    font-size: 24px;
    font-weight: 600;
    color: #4a3d4d;
  }
}
</style>
