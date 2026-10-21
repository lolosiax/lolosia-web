import type { Component } from 'vue'

/**
 * 布局注册表。
 *
 * 系统允许多种布局共存：应用入口按名字选取，路由层只依赖这个注册表，
 * 不直接 import 某个具体布局。新增布局时在这里登记即可。
 */
export type LayoutName = 'liquid'

export type LayoutLoader = () => Promise<{ default: Component }>

export const layouts: Record<LayoutName, LayoutLoader> = {
  liquid: () => import('./liquid/LiquidLayout.vue')
}

export function resolveLayout(name: LayoutName): LayoutLoader {
  return layouts[name]
}
