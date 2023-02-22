import NProgress from 'nprogress'
import type { RouteLocationNormalized, Router } from 'vue-router'
import 'nprogress/nprogress.css'
import { getMyInfo, getMyRole } from '@/core/api/user'
import { settings } from '@/core/config/settings'
import { applyTransitionOrigin } from '@/core/lib/transition'
import { useAuthStore } from '@/core/stores/auth'
import { canAccessRoute } from './access'

/** 未登录也能进的页面。 */
const PUBLIC_PATHS = new Set(['/login', '/401', '/404', '/500'])

NProgress.configure({ showSpinner: false })

function updateTitle(to: RouteLocationNormalized): void {
  const title = (to.meta.title as string | undefined) ?? settings.title
  document.title = title === settings.title ? settings.title : `${title} - ${settings.title}`
}

/**
 * 路由守卫：标题、进度条、登录态、用户信息、角色可见性。
 *
 * 失败一律落到 500；没有登录态时带 `redirect` 回登录页。
 */
export function installGuards(router: Router): void {
  router.beforeEach(async to => {
    applyTransitionOrigin()
    NProgress.start()
    updateTitle(to)

    if (to.path === '/500' || to.path === '/login') return true
    if (to.meta.public) return true

    const auth = useAuthStore()

    if (!auth.token) {
      if (!settings.isNeedLogin || PUBLIC_PATHS.has(to.path)) return true
      return { path: '/login', query: { redirect: to.fullPath } }
    }

    if (!auth.loaded) {
      try {
        const [info, role] = await Promise.all([getMyInfo(), getMyRole()])
        auth.setUserInfo(info, role)
      } catch (error) {
        console.error('[router] 读取用户信息失败', error)
        NProgress.done()
        return { path: '/500', query: { redirect: to.path } }
      }
      return { ...to, replace: true }
    }

    return canAccessRoute(to, auth.roleType) ? true : '/401'
  })

  router.afterEach(() => {
    NProgress.done()
  })

  router.onError(() => {
    NProgress.done()
  })
}
