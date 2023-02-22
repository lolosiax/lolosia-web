import { post } from '@/core/lib/http'

/** `@Permission` 扫描出的权限节点。 */
export interface PermissionCatalogEntry {
  node: string
  title?: string | null
  controller?: string | null
  function?: string | null
}

export interface PermissionRules {
  rules: string[]
}

export interface MyPermission {
  rules: string[]
  /** 拥有者组：不受规则限制 */
  owner: boolean
}

export function rolePermissionList(roleId: number): Promise<PermissionRules> {
  return post<PermissionRules>('role/permission/list', { roleId })
}

/** 全量替换：提交的列表就是该组的最终规则。 */
export function rolePermissionSave(roleId: number, rules: string[]): Promise<void> {
  return post<void>('role/permission/save', { roleId, rules })
}

export function userPermissionList(userId: string): Promise<PermissionRules> {
  return post<PermissionRules>('user/permission/list', { userId })
}

export function userPermissionSave(userId: string, rules: string[]): Promise<void> {
  return post<void>('user/permission/save', { userId, rules })
}

export function myPermission(): Promise<MyPermission> {
  return post<MyPermission>('permission/my')
}

export function permissionCatalog(): Promise<PermissionCatalogEntry[]> {
  return post<PermissionCatalogEntry[]>('permission/catalog')
}
