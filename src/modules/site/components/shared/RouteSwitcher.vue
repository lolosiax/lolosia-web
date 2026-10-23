<script setup lang="ts">
import { RouterLink } from 'vue-router'

defineOptions({ name: 'RouteSwitcher' })
</script>

<template>
  <nav class="route-switcher">
    <RouterLink class="route-switcher__link" to="/">基础页</RouterLink>
    <RouterLink class="route-switcher__link" to="/lab">GPU 测试页</RouterLink>
  </nav>
</template>

<style scoped lang="scss">
.route-switcher {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 10;
  display: flex;
  gap: 8px;
}

.route-switcher__link {
  padding: 6px 14px;
  border-radius: 999px;
  border: 1px solid #d9c6e2;
  background: #fff;
  color: #6b5478;
  font-size: 12px;
  line-height: 1;
  text-decoration: none;
  transition: background-color 0.15s ease;

  &:hover {
    background: #f4ebf8;
  }

  &.router-link-exact-active {
    background: #c296cd;
    border-color: #c296cd;
    color: #fff;
  }
}
</style>
