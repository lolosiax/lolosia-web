import request, { post } from '@/utils/request'

export function getList(data) {
  return post('/api/role/queryRoleByPage', data)
}

export function doAdd(data) {
  return post('/api/role/create', data)
}
export function doUpdate(data) {
  return post('/api/role/update', data)
}

export function doDelete(data) {
  return post('/api/role/destroy', data)
}
/**
 * 获取角色列表
 * @return {Promise<AxiosResponse<{id: number, type:string, roleName: string}[]>>}
 */
export function getRoleList() {
  return post('/api/role/list')
}

/**
 * 根据用户ID获取角色ID
 */
export function getRoleByUserId(userId) {
  return post('/api/userRole/getByUserId', { userId })
}
