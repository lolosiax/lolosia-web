import type { RouteRecordRaw } from 'vue-router'

/**
 * 站点入口：`/` 是 GPU 渲染测试页（默认落地），`/basic` 是低负载的基础导航页，
 * `/landing` 保留完整动效入口，`/lolosia` 是全屏个人主页。
 * 它们都跳过侧栏与顶栏（`meta.bare`），但 `/lolosia` 仍保留侧栏菜单入口。
 */
export function siteRoutes(): RouteRecordRaw[] {
  return [
    {
      path: '',
      name: 'Landing',
      component: () => import('./pages/LandingLabPage.vue'),
      meta: { title: '入口', hidden: true, public: true, bare: true }
    },
    {
      path: 'basic',
      name: 'LandingBasic',
      component: () => import('./pages/LandingLitePage.vue'),
      meta: { title: '入口（基础）', hidden: true, public: true, bare: true }
    },
    {
      path: 'landing',
      name: 'LandingFull',
      component: () => import('./pages/LandingPage.vue'),
      meta: { title: '入口（完整）', hidden: true, public: true, bare: true }
    },
    {
      path: 'lolosia',
      name: 'Hero',
      component: () => import('./pages/HeroPage.vue'),
      meta: { title: '主页', icon: 'house-door', public: true, bare: true }
    }
  ]
}
