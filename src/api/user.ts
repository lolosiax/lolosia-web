//获取用户信息
import request, { baseUrl, post } from '@/utils/request'

export interface IUser {
  id: string
  userName: string
  password: string
  phone: string
  isUse: boolean
  legacyId: number
  database: string
  Authorization: string
  avatar: string
}

export interface IUserRole {
  id: number
  userId: string
  roleId: number
  roleName: string
  roleType: string
}

export async function getMyInfo(): Promise<IUser> {
  const rs = await post<IUser>('/user/myInfo')
  if (rs.avatar && !/^((https?|data):|\/\/)/.test(rs.avatar)) {
    rs.avatar = `${baseUrl}/api/user/avatar?id=${rs.id}`
  }
  return rs
}

export async function getMyRole(): Promise<IUserRole> {
  return post('/user/myRole')
}

//登录
export async function login(data): Promise<IUser> {
  return post('/login', data)
}

//退出登录
export async function logout(): Promise<void> {
  return post('/logout')
}

export async function getUser(idList): Promise<IUser[]> {
  return post('/user/get', { idList })
}

/**
 * 按照文本搜索前十条用户
 * @param keys
 * @return {Promise<any[]>}
 */
export function userSearching(keys) {
  return post('user/searching', { keys })
}

//修改密码
export function updatePassword(data: { id?; origin; target; session? }) {
  return post('/user/updatePassword', data)
}

//修改密码
export function setAvatar(id: string, avatar: Blob) {
  const form = new FormData()
  form.append('file', avatar, avatar instanceof File ? avatar.name : `${id}.jpg`)
  return request({
    url: `/user/avatar`,
    params: { id },
    method: 'put',
    data: form
  })
}

//修改密码
export function getAvatar(id: string): Promise<Blob> {
  return request({
    url: `/user/avatar?id=${id}`,
    responseType: 'blob',
    headers: {
      'Cache-Control': 'no-cache'
    }
  }) as any
}
