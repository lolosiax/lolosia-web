<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import logo from '@/core/icons/common/sidebar-logo.svg?url'
import { settings } from '@/core/config/settings'
import { menuRoutesOf } from '@/core/router/access'
import { useMenuRoutes } from '@/core/router/menu'
import { useAuthStore } from '@/core/stores/auth'
import { useLayoutStore } from '@/core/stores/layout'
import AvatarFrame from '../AvatarFrame.vue'
import Debugger from '../Debugger.vue'
import MenuIcon from '@/core/ui/MenuIcon.vue'
import SidebarItem from './SidebarItem.vue'

defineOptions({ name: 'SidebarNav' })

const route = useRoute()
const auth = useAuthStore()
const layout = useLayoutStore()
const menu = useMenuRoutes()

const routes = computed(() => menuRoutesOf(menu.value, auth.roleType))
const activeMenu = computed(() => (route.meta.activeMenu as string | undefined) ?? route.path)
</script>

<template>
  <aside class="sidebar" :class="{ 'sidebar--collapsed': !layout.sidebarOpened }">
    <div class="sidebar__brand">
      <RouterLink to="/" class="sidebar__brand-link">
        <img class="sidebar__logo" :src="logo" alt="" />
        <span v-if="layout.sidebarOpened" class="sidebar__title">{{ settings.title }}</span>
      </RouterLink>
      <ElButton class="sidebar__toggle" text circle size="small" @click="layout.toggleSidebar()">
        <MenuIcon :icon="layout.sidebarOpened ? 'chevron-left' : 'chevron-right'" />
      </ElButton>
    </div>

    <ElScrollbar class="sidebar__menu">
      <ElMenu
        class="sidebar__menu-list"
        :collapse="!layout.sidebarOpened"
        :default-active="activeMenu"
        :collapse-transition="false"
        mode="vertical"
      >
        <SidebarItem
          v-for="item in routes"
          :key="String(item.name ?? item.path)"
          :item="item"
          base-path=""
        />
      </ElMenu>
    </ElScrollbar>

    <div class="sidebar__footer">
      <Debugger />
      <AvatarFrame />
    </div>
  </aside>
</template>

<style scoped lang="scss">
.sidebar {
  display: grid;
  grid-template-rows: auto 1fr auto;
  height: 100%;
  min-width: 64px;
  padding: 8px 0 12px;
  background: rgba(255, 255, 255, 0.75);
  border-right: 1px solid rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);

  &__brand {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 4px;
    padding: 4px 8px 12px;
  }

  &__brand-link {
    display: flex;
    align-items: center;
    gap: 8px;
    overflow: hidden;
    color: var(--lolosia-color-primary-dark-2);
  }

  &__logo {
    width: 30px;
    height: 30px;
    flex: 0 0 auto;
  }

  &__title {
    font-size: 13px;
    font-weight: 600;
    white-space: nowrap;
  }

  &--collapsed {
    .sidebar__brand {
      flex-direction: column;
    }
  }

  &__menu {
    overflow: hidden;
  }

  &__menu-list {
    border-right: none;
    background: transparent;
  }

  &__footer {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding-top: 8px;
  }
}

:deep(.el-menu-item),
:deep(.el-sub-menu__title) {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  height: auto;
  margin: 4px;
  padding: 8px 4px;
  border-radius: 10px;
  line-height: 1.2;
  transition: background-color 0.25s ease, color 0.25s ease;

  .menu-icon {
    font-size: 1.5em;
    padding: 4px;
    background: #fff;
    border: 1px solid #dcdcdc;
    border-radius: 8px;
    color: #4b4b4b;
  }

  &:hover {
    background-color: var(--el-color-primary-light-9);
  }

  &.is-active {
    color: #fff;
    background-color: var(--lolosia-color-primary);
    box-shadow: 0 4px 8px 0 rgba(31, 38, 135, 0.3);

    .menu-icon {
      color: var(--lolosia-color-primary-dark-2);
    }
  }
}
</style>
