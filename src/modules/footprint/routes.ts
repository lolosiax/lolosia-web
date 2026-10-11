import type { RouteRecordRaw } from 'vue-router'

/**
 * 足迹地图：裸奔 GPS（行程轨迹），只给拥有者与管理员看。
 */
export function footprintRoutes(): RouteRecordRaw[] {
  return [
    {
      path: 'footprint',
      name: 'Footprint',
      component: () => import('./pages/FootprintPage.vue'),
      meta: {
        title: '足迹地图',
        icon: 'geo-alt',
        viewKey: '/footprint',
        roles: ['owner', 'admin']
      }
    }
  ]
}
