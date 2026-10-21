import type { RouteRecordRaw } from 'vue-router'

/**
 * 站点入口：`/` 是公开的导航入口页，`/lolosia` 是全屏个人主页。
 * 两者都跳过侧栏与顶栏（`meta.bare`），但 `/lolosia` 仍保留侧栏菜单入口。
 */
export function siteRoutes(): RouteRecordRaw[] {
  return [
    {
      path: '',
      name: 'Landing',
      component: () => import('./pages/LandingPage.vue'),
      meta: { title: '入口', hidden: true, public: true, bare: true }
    },
    {
      path: 'lolosia',
      name: 'Hero',
      component: () => import('./pages/HeroPage.vue'),
      meta: { title: '主页', icon: 'house-door', public: true, bare: true }
    }
  ]
}
