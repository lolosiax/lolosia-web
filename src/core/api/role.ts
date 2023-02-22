import { post } from '@/core/lib/http'

/** `sys_role` 一行（一个权限组）。 */
export interface RoleRow {
  id: number
  roleName?: string | null
  type?: string | null
  parentId?: number | null
  createdAt?: string | null
  updatedAt?: string | null
  /** 已弃用的菜单字段，后端固定回空数组 */
  menuId?: number[]
  menuTitle?: string[]
}

export interface RolePage {
  rows: RoleRow[]
  total: number
}

export interface RolePageQuery {
  pageNo?: number
  pageSize?: number
  roleName?: string | null
}

export interface RoleCreatePayload {
  roleName?: string | null
  type?: string | null
  parentId?: number | null
}

export interface RoleUpdatePayload extends RoleCreatePayload {
  id: number
}

/** 全部组（下拉/单选组用）。 */
export function roleList(): Promise<RoleRow[]> {
  return post<RoleRow[]>('role/list')
}

export function rolePage(query: RolePageQuery): Promise<RolePage> {
  return post<RolePage>('role/queryRoleByPage', query)
}

export function createRole(payload: RoleCreatePayload): Promise<RoleRow> {
  return post<RoleRow>('role/create', payload)
}

export function updateRole(payload: RoleUpdatePayload): Promise<void> {
  return post<void>('role/update', payload)
}

export function destroyRole(id: number): Promise<void> {
  return post<void>('role/destroy', { id })
}
