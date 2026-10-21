<script setup lang="ts">
// 移动端底部路由栏：最多 4 个入口，其余收进「更多」抽屉。
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { joinPath } from '@/core/lib/path'
import { menuRoutesOf } from '@/core/router/access'
import { useMenuRoutes } from '@/core/router/menu'
import { useAuthStore } from '@/core/stores/auth'
import MenuIcon from '@/core/ui/MenuIcon.vue'

defineOptions({ name: 'MobileTabBar' })

interface NavItem {
  path: string
  title: string
  icon?: string
}

const MAX_PRIMARY = 4

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const menu = useMenuRoutes()
const moreVisible = ref(false)

const routes = computed(() => menuRoutesOf(menu.value, auth.roleType))

/** 与侧栏保持一致：单子项提上来，多子项分组则摊平成独立入口。 */
function collect(items: RouteRecordRaw[], basePath: string, out: NavItem[]): void {
  for (const item of items) {
    const path = joinPath(basePath, item.path)
    const children = (item.children ?? []).filter(child => !child.meta?.hidden)

    if (children.length === 0) {
      out.push({ path, title: String(item.meta?.title ?? item.path), icon: item.meta?.icon as string | undefined })
      continue
    }

    if (children.length === 1 && item.meta?.alwaysShow !== true) {
      const child = children[0]
      if (!child) continue
      out.push({
        path: joinPath(path, child.path),
        title: String(child.meta?.title ?? item.meta?.title ?? child.path),
        icon: (child.meta?.icon ?? item.meta?.icon) as string | undefined
      })
      continue
    }

    collect(children, path, out)
  }
}

const items = computed(() => {
  const out: NavItem[] = []
  collect(routes.value, '', out)
  return out
})

const primaryItems = computed(() => items.value.slice(0, MAX_PRIMARY))
const overflowItems = computed(() => items.value.slice(MAX_PRIMARY))
const hasOverflow = computed(() => overflowItems.value.length > 0)

const activePath = computed(() => (route.meta.activeMenu as string | undefined) ?? route.path)

function isActive(item: NavItem): boolean {
  return activePath.value === item.path || activePath.value.startsWith(`${item.path}/`)
}

const overflowActive = computed(() => overflowItems.value.some(isActive))

function go(item: NavItem): void {
  moreVisible.value = false
  if (route.path !== item.path) void router.push(item.path)
}

watch(
  () => route.path,
  () => {
    moreVisible.value = false
  }
)
</script>

<template>
  <nav class="mobile-tabbar">
    <button
      v-for="item in primaryItems"
      :key="item.path"
      type="button"
      class="mobile-tabbar__item"
      :class="{ 'is-active': isActive(item) }"
      @click="go(item)"
    >
      <MenuIcon :icon="item.icon" class="mobile-tabbar__icon" />
      <span class="mobile-tabbar__label">{{ item.title }}</span>
    </button>

    <button
      v-if="hasOverflow"
      type="button"
      class="mobile-tabbar__item"
      :class="{ 'is-active': moreVisible || overflowActive }"
      @click="moreVisible = true"
    >
      <i class="bi bi-grid mobile-tabbar__icon" />
      <span class="mobile-tabbar__label">更多</span>
    </button>
  </nav>

  <ElDrawer
    v-model="moreVisible"
    direction="btt"
    size="62%"
    :with-header="false"
    append-to-body
    class="mobile-more-drawer"
  >
    <div class="mobile-more">
      <div class="mobile-more__handle" />
      <p class="mobile-more__title">全部功能</p>
      <ul class="mobile-more__list">
        <li
          v-for="item in items"
          :key="item.path"
          class="mobile-more__item"
          :class="{ 'is-active': isActive(item) }"
          @click="go(item)"
        >
          <MenuIcon :icon="item.icon" class="mobile-more__icon" />
          <span class="mobile-more__label">{{ item.title }}</span>
        </li>
      </ul>
    </div>
  </ElDrawer>
</template>

<style scoped lang="scss">
.mobile-tabbar {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: stretch;
  height: calc(56px + env(safe-area-inset-bottom));
  padding: 0 4px env(safe-area-inset-bottom);
  background: rgba(255, 255, 255, 0.9);
  border-top: 1px solid rgba(210, 177, 219, 0.35);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  flex: 0 0 auto;

  &__item {
    display: flex;
    flex: 1 1 0;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    min-width: 0;
    padding: 4px 2px;
    border: none;
    color: var(--el-text-color-regular);
    background: none;
    cursor: pointer;
    transition: color 0.2s ease;

    &:active {
      background: rgba(210, 177, 219, 0.18);
    }

    &.is-active {
      color: var(--lolosia-color-primary);

      .mobile-tabbar__label {
        font-weight: 600;
      }
    }
  }

  &__icon {
    width: 1em;
    height: 1em;
    font-size: 18px;
    line-height: 1;
  }

  &__label {
    max-width: 100%;
    overflow: hidden;
    font-size: 10px;
    line-height: 1.2;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
}

.mobile-more {
  display: flex;
  flex-direction: column;
  height: 100%;

  &__handle {
    width: 36px;
    height: 4px;
    margin: 0 auto 12px;
    border-radius: 2px;
    background: rgba(210, 177, 219, 0.6);
  }

  &__title {
    margin: 0 0 12px;
    color: var(--el-text-color-primary);
    font-size: 14px;
    font-weight: 600;
    text-align: center;
  }

  &__list {
    display: grid;
    flex: 1;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    grid-auto-rows: 82px;
    gap: 10px;
    align-content: start;
    min-height: 0;
    margin: 0;
    padding: 0;
    overflow-y: auto;
    list-style: none;
  }

  &__item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 14px 6px;
    border-radius: 12px;
    color: var(--el-text-color-regular);
    background: rgba(210, 177, 219, 0.14);
    cursor: pointer;

    &.is-active {
      color: #fff;
      background: var(--lolosia-color-primary);
    }
  }

  &__icon {
    width: 1em;
    height: 1em;
    font-size: 20px;
    line-height: 1;
  }

  &__label {
    max-width: 100%;
    overflow: hidden;
    font-size: 12px;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
}
</style>

<style lang="scss">
/* 抽屉 teleport 到 body，scoped 样式命中不到抽屉本体 */
.mobile-more-drawer {
  border-radius: 18px 18px 0 0;

  .el-drawer__body {
    padding: 14px 16px calc(16px + env(safe-area-inset-bottom));
  }
}
</style>
