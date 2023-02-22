import type { RouteRecordRaw } from 'vue-router'

export function dashboardRoutes(): RouteRecordRaw[] {
  return [
    {
      path: 'dashboard',
      name: 'Dashboard',
      component: () => import('./pages/DashboardPage.vue'),
      meta: { title: '仪表板', icon: 'speedometer2', affix: true, cachePage: true }
    }
  ]
}
