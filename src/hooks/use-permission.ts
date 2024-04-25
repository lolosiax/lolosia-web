import router, { asyncRoutes, constantRoutes } from '@/router'
import { useBasicStore } from '@/store/basic'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import type { RouteRecordName } from 'vue-router'
import { isArray } from 'xe-utils'
import type { RouterTypes } from '~/basic'

export function filterRouters<
  T extends {
    meta?: { roles?: string[] }
    children?: T[]
  }
>(menuList: T[], role: string) {
  const out = menuList.filter((it) => it.meta?.roles?.includes(role) ?? true)
  for (const t of out) {
    if (t.children) filterRouters(t.children, role)
  }
  menuList.length = 0
  menuList.push(...out)
}

//从数据库设置文本路由
export function setRouterFromDatabase(menuList) {
  const basicStore = useBasicStore()
  const accessRoutes: RouterTypes = menuList

  // @ts-ignore
  const views = import.meta.glob('../views/**/*.vue') as Record<string, () => Promise<Component>>

  function scanRouter(items: any[]) {
    for (const item of items) {
      if (item.component === 'Layout') item.component = () => import('@/layout/default/index.vue')
      else if (typeof item.component === 'string') {
        let url: string = item.component
        if (url.startsWith('@/')) {
          url = url.replace(/^@\//, '../')
        }
        item.component = async () => {
          let component
          try {
            component = await views[url]?.()
            if (!component) throw new Error(`找不到文件${url}`)
          } catch (e) {
            console.error(e)
            component = await import('../views/error-page/404.vue')
          }
          return component
        }
      }
      if (isArray(item.children)) scanRouter(item.children)
    }
  }

  scanRouter(accessRoutes)

  accessRoutes.forEach((route) => router.addRoute(route))
  asyncRoutes.forEach((item) => router.addRoute(item))
  basicStore.setFilterAsyncRoutes(accessRoutes)
}

//重置路由
export function resetRouter() {
  //移除之前存在的路由
  const routeNameSet: Set<RouteRecordName> = new Set()
  router.getRoutes().forEach((fItem) => {
    if (fItem.name) routeNameSet.add(fItem.name)
  })
  routeNameSet.forEach((setItem) => router.removeRoute(setItem))
  //新增constantRoutes
  constantRoutes.forEach((feItem) => router.addRoute(feItem))
}

//重置登录状态
export function resetState() {
  resetRouter()
  useBasicStore().resetState()
}

//刷新路由
export function freshRouter(data) {
  resetRouter()
  setRouterFromDatabase(data)
}

NProgress.configure({ showSpinner: false })
//开始进度条
export const progressStart = () => {
  NProgress.start()
}
//关闭进度条
export const progressClose = () => {
  NProgress.done()
}
