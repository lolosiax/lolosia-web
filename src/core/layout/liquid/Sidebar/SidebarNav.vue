<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { menuRoutesOf } from '@/core/router/access'
import { useMenuRoutes } from '@/core/router/menu'
import { useAuthStore } from '@/core/stores/auth'
import AvatarFrame from '../../shared/AvatarFrame.vue'
import Debugger from '../../shared/Debugger.vue'
import SidebarItem from './SidebarItem.vue'

defineOptions({ name: 'SidebarNav' })

const route = useRoute()
const auth = useAuthStore()
const menu = useMenuRoutes()

const routes = computed(() => menuRoutesOf(menu.value, auth.roleType))
const activeMenu = computed(() => (route.meta.activeMenu as string | undefined) ?? route.path)
</script>

<template>
  <aside class="sidebar">
    <ElScrollbar class="sidebar__menu">
      <ElMenu
        class="sidebar__menu-list"
        collapse
        :collapse-transition="false"
        :default-active="activeMenu"
        mode="vertical"
        popper-class="sidebar-popup"
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
  grid-template-rows: 1fr auto;
  width: 88.4px;
  height: 100%;
  padding: 0;
  text-align: center;
  background: rgba(255, 255, 255, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 0 16px 16px 0;
  box-shadow: 0 4px 16px rgba(31, 38, 135, 0.37);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);

  &__menu {
    overflow: hidden;
  }

  &__menu-list {
    width: 100%;
    border-right: none;
    background: transparent;
  }

  &__footer {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1em;
    margin-bottom: 1em;
  }
}

/** 菜单项尺寸沿用原项目 liquid 侧栏的设置。 */
:deep(.el-menu-item),
:deep(.el-sub-menu__title) {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: auto;
  margin: 0.5em;
  padding: 0.5em 1em !important;
  border-radius: 10px;
  line-height: 56px;
  color: #000;
  transition: all 0.3s ease;

  .menu-icon {
    display: block;
    width: auto;
    height: auto;
    aspect-ratio: 1 / 1;
    padding: 0.2em;
    margin: 0.2em 0;
    font-size: 1.8em;
    text-align: center;
    background-color: #fff;
    border: 1px solid lightgray;
    border-radius: 7px;
    color: #4b4b4b;
  }

  &:hover {
    background-color: var(--el-color-primary-light-5);
  }

  &.is-active {
    color: #fff;
    background-color: var(--lolosia-color-primary);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    box-shadow: 0 4px 8px 0 rgba(31, 38, 135, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.18);

    .menu-icon {
      color: var(--lolosia-color-primary-dark-2);
    }
  }
}

/** Element Plus 折叠时会隐藏子菜单标题，这里恢复图标下方的文字。 */
:deep(.el-menu--collapse > .el-sub-menu > .el-sub-menu__title > span.sidebar-item__title) {
  display: inline-block;
  width: auto;
  height: auto;
  overflow: visible;
  visibility: visible;
  white-space: nowrap;
  font-size: 0.8em;
  line-height: 1;
}

/** 弹层会被 teleport 到 body，scoped 样式命中不了，只能用全局选择器。 */
:global(.sidebar-popup.el-popper) {
  padding: 8px !important;
  border: 1px solid rgba(255, 255, 255, 0.45) !important;
  border-radius: 12px !important;
  background: rgba(255, 255, 255, 0.55) !important;
  box-shadow: 0 8px 24px rgba(31, 38, 135, 0.18) !important;
  backdrop-filter: blur(16px) saturate(1.4);
  -webkit-backdrop-filter: blur(16px) saturate(1.4);
}

:global(.sidebar-popup.el-menu--popup-container) {
  padding: 0 !important;
  border: none !important;
  background: transparent !important;
  box-shadow: none !important;
}

:global(.sidebar-popup .el-menu--popup) {
  display: grid;
  grid-template-columns: repeat(2, minmax(84px, 1fr));
  gap: 4px;
  min-width: 0;
  padding: 0;
  border: none !important;
  border-radius: 0 !important;
  background: transparent;
  box-shadow: none !important;
}

:global(.sidebar-popup .el-menu--popup .el-menu-item) {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: auto;
  margin: 0;
  padding: 6px 4px !important;
  border-radius: 10px;
  line-height: 1.2;
  color: var(--el-text-color-primary);
}

:global(.sidebar-popup .sidebar-item__link) {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  color: inherit;
}

:global(.sidebar-popup .sidebar-item__title) {
  font-size: 0.75em;
  white-space: nowrap;
}

:global(.sidebar-popup .menu-icon) {
  display: block;
  aspect-ratio: 1 / 1;
  padding: 0.15em;
  margin: 0 0 0.15em;
  font-size: 1.5em;
  text-align: center;
  background-color: #fff;
  border: 1px solid lightgray;
  border-radius: 7px;
  color: #4b4b4b;
}

:global(.sidebar-popup .el-menu-item:hover) {
  background-color: var(--el-color-primary-light-5);
}

:global(.sidebar-popup .el-menu-item.is-active) {
  color: #fff;
  background-color: var(--lolosia-color-primary);
}

:global(.sidebar-popup .el-menu-item.is-active .menu-icon) {
  color: var(--lolosia-color-primary-dark-2);
}
</style>
