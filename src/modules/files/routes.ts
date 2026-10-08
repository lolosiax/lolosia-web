import type { RouteRecordRaw } from 'vue-router'

/**
 * 在线文件管理器：URL 直接带文件夹路径（`/files/<文件夹路径>`）。
 *
 * 只给拥有者与管理员看：普通用户与访客既看不到菜单，访问也会落到 401。
 * `viewKey` 让任意深度的目录复用同一个页面实例，`activeMenu` 指回根路径以保证侧栏高亮。
 */
export function filesRoutes(): RouteRecordRaw[] {
  return [
    {
      path: 'files',
      name: 'Files',
      component: () => import('./pages/FilesPage.vue'),
      meta: {
        title: '文件管理',
        icon: 'folder2-open',
        viewKey: '/files',
        roles: ['owner', 'admin']
      }
    },
    {
      path: 'files/:pathMatch(.*)*',
      name: 'FilesDeep',
      component: () => import('./pages/FilesPage.vue'),
      meta: {
        title: '文件管理',
        icon: 'folder2-open',
        hidden: true,
        viewKey: '/files',
        activeMenu: '/files',
        roles: ['owner', 'admin']
      }
    }
  ]
}
