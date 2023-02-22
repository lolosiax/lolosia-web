import { shallowRef } from 'vue'
import type { RouteRecordRaw } from 'vue-router'

/**
 * 侧栏菜单来源。
 *
 * 路由表由应用入口组装（core 不能反向依赖 modules），组装完成后调
 * {@link setMenuRoutes} 把「布局子路由」交给布局层渲染。
 */
const menuRoutes = shallowRef<RouteRecordRaw[]>([])

export function setMenuRoutes(routes: RouteRecordRaw[]): void {
  menuRoutes.value = routes
}

export function useMenuRoutes() {
  return menuRoutes
}
