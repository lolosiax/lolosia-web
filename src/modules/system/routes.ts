import type { RouteRecordRaw } from 'vue-router'

/** 系统管理：容器 + 三个子页面（父级只负责渲染子路由）。 */
export function systemRoutes(): RouteRecordRaw[] {
  return [
    {
      path: 'system',
      name: 'System',
      component: () => import('./SystemLayout.vue'),
      redirect: '/system/user',
      meta: { title: '系统管理', icon: 'gear-fill', roles: ['admin'] },
      children: [
        {
          path: 'user',
          name: 'SystemUser',
          component: () => import('./pages/UserPage.vue'),
          meta: { title: '用户管理', icon: 'people-fill', roles: ['admin'] }
        },
        {
          path: 'role',
          name: 'SystemRole',
          component: () => import('./pages/RolePage.vue'),
          meta: { title: '角色权限', icon: 'shield-lock-fill', roles: ['admin'] }
        },
        {
          path: 'menu',
          name: 'SystemMenu',
          component: () => import('./pages/MenuPage.vue'),
          meta: { title: '菜单与路由', icon: 'signpost-split-fill', roles: ['admin'] }
        }
      ]
    }
  ]
}

/** 个人中心：从右上角头像进入，不占侧栏。 */
export function profileRoute(): RouteRecordRaw {
  return {
    path: 'profile',
    name: 'Profile',
    component: () => import('./pages/ProfilePage.vue'),
    meta: { title: '个人中心', icon: 'person-vcard-fill', hidden: true, cachePage: true }
  }
}
