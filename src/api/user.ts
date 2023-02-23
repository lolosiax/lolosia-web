//获取用户信息
import { post } from '@/utils/request'
export interface IUser {
  id: string
  userName: string
  password: string
  phone: string
  isUse: boolean
  legacyId: number
  database: string
  Authorization: string
}

export interface IUserRole {
  id: number
  userId: string
  roleId: number
  roleName: string
  roleType: string
}

export async function getMyInfo(): Promise<IUser> {
  return post('/user/myInfo')
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
