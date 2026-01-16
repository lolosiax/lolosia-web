<template>
  <LiquidBox id="Sidebar" class="liquid-sidebar">
    <!--router menu-->
    <el-scrollbar>
      <el-menu
        class="el-menu-vertical"
        :collapse="!basicStore.sidebar.opened"
        :default-active="activeMenu"
        :collapse-transition="false"
        mode="vertical"
      >
        <sidebar-item v-for="r in routes" :key="r.path" :item="r" :base-path="basePath(r.path)" />
      </el-menu>
    </el-scrollbar>
    <div class="sidebar-footer">
      <Debugger />
      <AvatarFrame rounded placement="right-end" />
    </div>
  </LiquidBox>
</template>

<script setup lang="ts" name="SideBar">
import { computed } from 'vue'
import { storeToRefs } from 'pinia/dist/pinia'
import { onBeforeRouteLeave, useRoute } from 'vue-router'
import Logo from '@/layout/default/sidebar/Logo.vue'
import SidebarItem from '@/layout/liquid/sidebar/SidebarItem.vue'
import { useBasicStore } from '@/store/basic'

const basicStore = useBasicStore()
const route = useRoute()
const activeMenu = ref<any>(route.path)
import type { BootstrapIcons, RouteRawConfig, RouterTypes } from '~/basic'
import Debugger from '@/layout/default/app-main/component/Debugger.vue'
import AvatarFrame from '@/layout/default/app-main/component/AvatarFrame.vue'

const prop = withDefaults(
  defineProps<{
    parentRouter?: RouteRawConfig
    showBack?: boolean
  }>(),
  {
    parentRouter: undefined
  }
)

watch(
  () => route.path,
  (val) => {
    activeMenu.value = val
  }
)

const routes = computed(() => {
  const children = prop.parentRouter?.children ?? basicStore.allRoutes
  const list = prop.showBack
    ? [
        {
          path: '/',
          meta: {
            title: '返回',
            icon: 'arrow-left-square' as BootstrapIcons
          }
        }
      ]
    : []

  list.push(...(children as any))
  return list as RouterTypes
})

function basePath(path: string) {
  if (path.startsWith('/')) return `/${path}`
  else return `${prop.parentRouter?.path ?? ''}/${path}`
}
</script>
<style scoped lang="scss">
.liquid-sidebar {
  padding: 0;
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: 1fr auto;
  background: rgba(255, 255, 255, 0.75);
  --el-menu-text-color: var(--el-text-color);
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  text-align: center;

  //fix open the item style issue
  .el-menu-vertical {
    background-color: unset;
  }

  .sidebar-footer {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 1em;
    gap: 1em;

    .avatar-frame {
      margin-right: 0;
    }

    .debugger {
      --el-color-primary: var(--lolosia-color-primary);
      --el-color-primary-light-5: var(--lolosia-color-primary-light-5);
      --el-color-primary-dark-2: var(--lolosia-color-primary-dark-2);
    }
  }
}
</style>
