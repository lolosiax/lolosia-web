import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw, Router } from 'vue-router'
import { settings } from '@/core/config/settings'
import { resolveLayout } from '@/core/layout'
import type { LayoutName } from '@/core/layout'
import { installGuards } from './guards'

/** 错误页（布局外，独立占满整页）。 */
export function errorRoutes(): RouteRecordRaw[] {
  return [
    {
      path: '/401',
      name: 'Unauthorized',
      component: () => import('@/core/pages/error/UnauthorizedPage.vue'),
      meta: { hidden: true, public: true }
    },
    {
      path: '/404',
      name: 'NotFound',
      component: () => import('@/core/pages/error/NotFoundPage.vue'),
      meta: { hidden: true, public: true }
    },
    {
      path: '/500',
      name: 'ServerError',
      component: () => import('@/core/pages/error/ServerErrorPage.vue'),
      meta: { hidden: true, public: true }
    }
  ]
}

/** 布局壳的路由参数；`layout` 由 {@link resolveLayout} 解析成具体布局。 */
export interface LayoutRouteOptions {
  layout?: LayoutName
  path?: string
  name?: string
  redirect?: string
}

/** 布局壳：`children` 由应用入口塞进来（core 不依赖 modules）。 */
export function layoutRoute(children: RouteRecordRaw[], options: LayoutRouteOptions = {}): RouteRecordRaw {
  const { layout = 'liquid', path = '/', name = 'Layout', redirect } = options

  return {
    path,
    name,
    component: resolveLayout(layout),
    redirect,
    children
  }
}

/** 兜底路由必须最后加。 */
export function catchAllRoute(): RouteRecordRaw {
  return { path: '/:pathMatch(.*)*', name: 'CatchAll', redirect: '/404', meta: { hidden: true } }
}

export function createAppRouter(routes: RouteRecordRaw[]): Router {
  const router = createRouter({
    history: createWebHistory(settings.viteBasePath),
    scrollBehavior: () => ({ top: 0 }),
    routes
  })
  installGuards(router)
  return router
}
