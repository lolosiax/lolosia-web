import type { RouteRecordRaw } from 'vue-router'

/**
 * 番组表：普通用户也能看番组表并管理自己的关注；
 * 目录维护 / 手动映射等运维入口在页面内按角色再收一层。
 */
export function animeRoutes(): RouteRecordRaw[] {
  return [
    {
      path: 'anime',
      name: 'Anime',
      component: () => import('./pages/AnimePage.vue'),
      meta: {
        title: '番组表',
        icon: 'calendar2-week',
        viewKey: '/anime',
        roles: ['owner', 'admin', 'user']
      }
    }
  ]
}
