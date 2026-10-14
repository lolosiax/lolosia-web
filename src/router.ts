import type { RouteRecordRaw } from 'vue-router'
import { catchAllRoute, createAppRouter, errorRoutes, layoutRoute } from '@/core/router'
import { registerRouteComponents } from '@/core/router/component-registry'
import { animeRoutes } from '@/modules/anime/routes'
import { dashboardRoutes } from '@/modules/dashboard/routes'
import { filesRoutes } from '@/modules/files/routes'
import { footprintRoutes } from '@/modules/footprint/routes'
import { profileRoute, systemRoutes } from '@/modules/system/routes'

/**
 * 应用路由组合根。
 *
 * core 只提供「建路由 / 守卫 / 布局壳」的机制，具体页面由这里拼进来，
 * 保证依赖方向始终是 modules → core。
 */

/** 后端菜单如果下发 component 字符串，按这张表解析；未登记会直接报错。 */
registerRouteComponents({
  'dashboard/index': () => import('@/modules/dashboard/pages/DashboardPage.vue'),
  'files/index': () => import('@/modules/files/pages/FilesPage.vue'),
  'footprint/index': () => import('@/modules/footprint/pages/FootprintPage.vue'),
  'anime/index': () => import('@/modules/anime/pages/AnimePage.vue'),
  'system/user': () => import('@/modules/system/pages/UserPage.vue'),
  'system/role': () => import('@/modules/system/pages/RolePage.vue'),
  'system/menu': () => import('@/modules/system/pages/MenuPage.vue'),
  'system/profile': () => import('@/modules/system/pages/ProfilePage.vue')
})

/** 布局内的一级菜单（侧栏直接渲染这一层）。 */
export const menuRoutes: RouteRecordRaw[] = [
  ...dashboardRoutes(),
  ...systemRoutes(),
  ...filesRoutes(),
  ...footprintRoutes(),
  ...animeRoutes(),
  profileRoute()
]

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/modules/auth/pages/LoginPage.vue'),
    meta: { hidden: true, public: true }
  },
  ...errorRoutes(),
  layoutRoute(menuRoutes, '/dashboard'),
  catchAllRoute()
]

const router = createAppRouter(routes)

export default router
