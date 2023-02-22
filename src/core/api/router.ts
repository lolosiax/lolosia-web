import { post } from '@/core/lib/http'

/** 后端下发的菜单导航结构。 */
export interface NavigateItem {
  path: string
  name?: string
  component?: string
  redirect?: string
  meta?: {
    title?: string
    icon?: string
    hidden?: boolean
    cachePage?: boolean
    activeMenu?: string
  }
  children?: NavigateItem[]
}

export function getRouterList(roleId: number): Promise<NavigateItem[]> {
  return post<NavigateItem[]>('menu/navigate', { roleId })
}
