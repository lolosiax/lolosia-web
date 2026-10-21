<script setup lang="ts">
import { computed } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import MenuIcon from '@/core/ui/MenuIcon.vue'
import { joinPath } from '@/core/lib/path'
import NavLink from '../../shared/Link.vue'

defineOptions({ name: 'SidebarItem' })

const props = withDefaults(
  defineProps<{
    item: RouteRecordRaw
    basePath?: string
    isNest?: boolean
  }>(),
  { basePath: '', isNest: false }
)

const children = computed(() => (props.item.children ?? []).filter(child => !child.meta?.hidden))
/** 只有一个可见子项时直接把它提上来，避免多一层无意义的下拉。 */
const onlyChild = computed(() => (children.value.length === 1 ? children.value[0] : undefined))

const itemPath = computed(() => joinPath(props.basePath, props.item.path))
const targetPath = computed(() => (onlyChild.value ? joinPath(itemPath.value, onlyChild.value.path) : itemPath.value))
const title = computed(() => onlyChild.value?.meta?.title ?? props.item.meta?.title ?? props.item.path)
const icon = computed(() => onlyChild.value?.meta?.icon ?? props.item.meta?.icon)
</script>

<template>
  <ElMenuItem v-if="children.length === 0 || onlyChild" :index="targetPath">
    <NavLink v-if="icon" :to="targetPath" class="sidebar-item__link">
      <MenuIcon :icon="icon" />
      <span class="sidebar-item__title">{{ title }}</span>
    </NavLink>
    <template v-else>
      <MenuIcon icon="dot" />
      <span class="sidebar-item__title">{{ title }}</span>
    </template>
  </ElMenuItem>

  <ElSubMenu v-else :index="itemPath">
    <template #title>
      <MenuIcon v-if="icon" :icon="icon" />
      <span class="sidebar-item__title">{{ title }}</span>
    </template>
    <SidebarItem
      v-for="child in children"
      :key="String(child.name ?? child.path)"
      :item="child"
      :base-path="itemPath"
      is-nest
    />
  </ElSubMenu>
</template>

<style scoped lang="scss">
.sidebar-item__link {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: inherit;
}

.sidebar-item__title {
  font-size: 0.8em;
  line-height: 1;
}
</style>
