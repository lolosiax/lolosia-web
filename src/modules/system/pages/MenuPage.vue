<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import { getMenuConfig } from '@/core/api/menu'
import type { MenuConfig } from '@/core/api/menu'
import { joinPath } from '@/core/lib/path'
import { useMenuRoutes } from '@/core/router/menu'
import AppPage from '@/core/ui/AppPage.vue'
import MenuIcon from '@/core/ui/MenuIcon.vue'

defineOptions({ name: 'SystemMenu' })

interface MenuRow {
  key: string
  title: string
  name: string
  path: string
  icon?: string
  hidden: boolean
  roles: string
  children?: MenuRow[]
}

const menu = useMenuRoutes()
const config = ref<MenuConfig>({})

/** 侧栏路由是静态表，这里转成表格行（保持层级）。 */
function toRows(routes: RouteRecordRaw[], basePath = ''): MenuRow[] {
  return routes.map(route => {
    const path = joinPath(basePath, route.path)
    const children = route.children?.length ? toRows(route.children, path) : undefined
    return {
      key: String(route.name ?? path),
      title: route.meta?.title ?? path,
      name: String(route.name ?? '—'),
      path,
      icon: route.meta?.icon,
      hidden: Boolean(route.meta?.hidden),
      roles: route.meta?.roles?.join(', ') ?? '全部',
      ...(children ? { children } : {})
    }
  })
}

const rows = computed(() => toRows(menu.value))
const configEntries = computed(() => Object.entries(config.value))

onMounted(async () => {
  config.value = await getMenuConfig()
})
</script>

<template>
  <AppPage>
    <div class="menu-page__hint">
      <span>后端没有菜单表，侧栏路由由前端静态表提供；这里只读展示，避免误以为可以增删。</span>
      <span v-for="[key, enabled] in configEntries" :key="key" class="menu-page__config">
        <ElTag :type="enabled ? 'success' : 'info'" effect="dark">菜单开关 {{ key }}：{{ enabled ? '显示' : '隐藏' }}</ElTag>
      </span>
    </div>

    <ElTable :data="rows" row-key="key" default-expand-all class="menu-page__table">
      <ElTableColumn prop="title" label="标题" min-width="120" />
      <ElTableColumn label="图标" width="80">
        <template #default="{ row }">
          <MenuIcon v-if="row.icon" :icon="row.icon" />
        </template>
      </ElTableColumn>
      <ElTableColumn prop="name" label="路由名" min-width="130" />
      <ElTableColumn prop="path" label="路径" min-width="160" />
      <ElTableColumn label="可见" width="90">
        <template #default="{ row }">
          <ElTag :type="row.hidden ? 'info' : 'success'" effect="dark">{{ row.hidden ? '隐藏' : '显示' }}</ElTag>
        </template>
      </ElTableColumn>
      <ElTableColumn prop="roles" label="允许角色" min-width="120" />
    </ElTable>
  </AppPage>
</template>

<style scoped lang="scss">
.menu-page {
  &__hint {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    font-size: 13px;
    color: #7a6a7e;
  }

  &__table {
    border-radius: 12px;
    overflow: hidden;
  }
}
</style>
