import { post } from '@/core/lib/http'

/** 后端菜单配置（键 = 菜单标识，值 = 是否显示）。 */
export type MenuConfig = Record<string, boolean>

export function getMenuConfig(): Promise<MenuConfig> {
  return post<MenuConfig>('menu/config')
}
