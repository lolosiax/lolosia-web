import type { RouteLocationNormalized, RouteRecordRaw } from 'vue-router'

/** 拥有者组（`sys_role.type = owner`）不受 `meta.roles` 限制。 */
const OWNER = 'owner'

function roleAllowed(roles: string[] | undefined, roleType: string): boolean {
  if (!roles?.length) return true
  if (roleType === OWNER) return true
  return roles.includes(roleType)
}

/** 侧栏是否展示该项（`hidden` 只影响菜单，不影响可访问性）。 */
export function isMenuVisible(route: RouteRecordRaw, roleType: string): boolean {
  if (route.meta?.hidden) return false
  return roleAllowed(route.meta?.roles, roleType)
}

/** 过滤出当前角色可见的菜单树（返回新数组，不改动路由表）。 */
export function menuRoutesOf(routes: RouteRecordRaw[], roleType: string): RouteRecordRaw[] {
  return routes.filter(route => isMenuVisible(route, roleType)).map(
    route =>
      ({
        ...route,
        children: route.children?.length ? menuRoutesOf(route.children, roleType) : route.children
      }) as RouteRecordRaw
  )
}

/** 当前导航是否允许：沿 matched 链逐级检查 `meta.roles`。 */
export function canAccessRoute(to: RouteLocationNormalized, roleType: string): boolean {
  return to.matched.every(record => roleAllowed(record.meta?.roles, roleType))
}
