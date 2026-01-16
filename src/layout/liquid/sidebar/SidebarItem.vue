<template>
  <template v-if="!item.hidden">
    <template v-if="showSidebarItem(item.children, item)">
      <Link v-if="onlyOneChild.meta" :to="resolvePath(onlyOneChild.path)">
        <el-menu-item :index="resolvePath(onlyOneChild.path)" :class="{ 'submenu-title-noDropdown': !isNest }">
          <MenuIcon v-if="showIcon" :icon="onlyOneChild.meta?.icon || item.meta?.icon" />
          <template #title>
            <span class="item-title">
              {{ langTitle(onlyOneChild.meta?.title) }}
            </span>
          </template>
        </el-menu-item>
      </Link>
    </template>
    <el-sub-menu v-else :index="resolvePath(item.path)">
      <template v-if="item.meta" #title>
        <MenuIcon v-if="showIcon" :icon="item.meta?.icon" />
        <span>{{ langTitle(item.meta.title) }}</span>
      </template>
      <SidebarItem
        v-for="child in item.children"
        :key="child.path"
        :is-nest="true"
        :item="child"
        :base-path="resolvePath(child.path)"
      />
    </el-sub-menu>
  </template>
</template>

<script setup lang="ts">
import { resolve } from 'path-browserify'
import Link from '@/layout/default/sidebar/Link.vue'
import MenuIcon from '@/components/MenuIcon.vue'
import type { RouteRawConfig, RouterTypes } from '~/basic'
import { isExternal } from '@/hooks/use-layout'
import { langTitle } from '@/hooks/use-common'

const props = defineProps({
  //每一个router Item
  item: {
    type: Object,
    required: true
  },
  //用于判断是不是子Item,设置响应的样式
  isNest: {
    type: Boolean,
    default: false
  },
  //基础路径，用于拼接
  basePath: {
    type: String,
    default: ''
  }
})
const showIcon = inject('sidebar:showIcon', ref(true))
//显示sidebarItem 的情况
const onlyOneChild = ref()
const showSidebarItem = (children: RouterTypes = [], parent: RouteRawConfig) => {
  if (parent.expand === false) {
    onlyOneChild.value = { ...parent, path: '', noChildren: true }
    return true
  }
  const showingChildren = children.filter((item) => {
    return !item.hidden
  })
  if (showingChildren.length === 1 && !parent?.alwaysShow) {
    onlyOneChild.value = showingChildren[0]
    return true
  }
  if (showingChildren.length === 0) {
    onlyOneChild.value = { ...parent, path: '', noChildren: true }
    return true
  }
  return false
}
const resolvePath = (routePath) => {
  if (isExternal(routePath)) {
    return routePath
  }
  if (isExternal(props.basePath)) {
    return props.basePath
  }
  return resolve(props.basePath, routePath)
}
</script>

<style scoped lang="scss">
.el-menu-item {
  flex-direction: column;
  align-items: center;
  padding: 0.5em 1em !important;
  margin: 0.5em;
  height: unset;
  border-radius: 10px;
  transition: all 0.3s ease; /* 平滑过渡 */

  &:hover {
    background-color: var(--el-color-primary-light-5);
  }

  &.is-active {
    color: white;
    background-color: var(--lolosia-color-primary);
    backdrop-filter: blur(10px); /* 磨砂效果（核心） */
    -webkit-backdrop-filter: blur(10px); /* 兼容Safari */
    box-shadow: 0 4px 8px 0 rgba(31, 38, 135, 0.3); /* 扩散白色阴影 */
    border: 1px solid rgba(255, 255, 255, 0.18); /* 边框模拟玻璃反光 */
  }

  .menu-icon {
    display: block;
    position: unset;
    height: unset;
    width: unset;
    padding: 0.2em;
    margin: 0.2em 0;
    text-align: center;
    font-size: 1.8em;
    aspect-ratio: 1 / 1;
    background-color: white;
    border: 1px solid lightgray;
    border-radius: 7px;
    color: #4b4b4b;
  }

  .item-title {
    display: block;
    font-size: 0.8em;
  }
}
</style>
