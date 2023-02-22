import type { RouteRecordRaw } from 'vue-router'

type RouteLoader = () => Promise<unknown>

/**
 * 后端菜单里的 `component` 字符串 → 显式 import 的映射。
 *
 * 不再用 `import.meta.glob` 扫目录：新增页面必须在这里登记，拼错时 dev 直接报错。
 * 实际登记发生在应用入口（core 不依赖 modules）。
 */
const routeComponents: Record<string, RouteLoader> = {}

export function registerRouteComponents(map: Record<string, RouteLoader>): void {
  Object.assign(routeComponents, map)
}

export function resolveRouteComponent(key: string): RouteLoader {
  const loader = routeComponents[key]
  if (!loader) throw new Error(`未注册的路由组件: ${key}`)
  return loader
}

/** 后端菜单结构（`/api/menu/navigate` 的形状）。 */
export interface BackendMenu {
  path: string
  name?: string
  component?: string
  redirect?: string
  meta?: RouteRecordRaw['meta']
  children?: BackendMenu[]
}

/** 把后端菜单转成路由记录；`component` 缺省表示容器节点。 */
export function toRouteRecords(menus: BackendMenu[]): RouteRecordRaw[] {
  return menus.map(menu => {
    const record = {
      path: menu.path,
      name: menu.name,
      redirect: menu.redirect,
      meta: menu.meta
    } as RouteRecordRaw
    if (menu.component) record.component = resolveRouteComponent(menu.component)
    if (menu.children?.length) record.children = toRouteRecords(menu.children)
    return record
  })
}
