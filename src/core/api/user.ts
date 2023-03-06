import { post, request } from '@/core/lib/http'

/** `sys_user` 的安全视图（后端不回传 password）。 */
export interface UserInfo {
  id: string
  userName: string
  realName?: string | null
  phone?: string | null
  email?: string | null
  avatar?: string | null
  /** 1 = 启用，0 = 停用 */
  isUse?: number | null
  createdAt?: string | null
  updatedAt?: string | null
  roleId?: number
}

/** 当前用户所属组（`/user/myRole`）。 */
export interface UserRole {
  id?: number
  userId: string
  roleId: number
  roleName?: string | null
  /** 与 roleType 同值 */
  type?: string | null
  roleType?: string | null
  /** 生效的权限规则串，`+a.b.*` / `-a.b.c` / `*` */
  rules?: string[] | null
}

export interface LoginResult extends UserInfo {
  /** 会话 token，后端字段名就是大写开头 */
  Authorization: string
  /** 库里没有密码且本次也没传密码（首次登录） */
  firstLogin?: boolean
}

export interface CaptchaResult {
  /** base64 PNG，不含 data URI 前缀 */
  image: string
  /** 服务端随机 token，校验时原样回传 */
  id: string
}

export interface RegisterPayload {
  userName: string
  password: string
  email?: string | null
  phone?: string | null
  /** 邮箱验证码；本轮后端忽略 */
  code?: string | null
}

export interface MessageResult {
  message: string
}

/** 列表行：用户字段 + 所属组（`view_user_role` 合并视图）。 */
export interface UserListRow extends UserInfo {
  userId: string
  roleName?: string | null
  type?: string | null
  roleType?: string | null
}

export interface UserPage {
  data: UserListRow[]
  total: number
}

export interface UserPageQuery {
  pageNo?: number
  pageSize?: number
  keys?: string | null
}

export interface UserPayload {
  userName?: string | null
  password?: string | null
  realName?: string | null
  phone?: string | null
  email?: string | null
  isUse?: number | null
}

export interface UserCreatePayload extends UserPayload {
  roleId: number
}

export interface UserUpdatePayload extends UserPayload {
  id: string
  /** 不传 = 不改所属组 */
  roleId?: number
}

export interface UpdatePasswordPayload {
  /** 缺省表示改自己的密码 */
  id?: string
  origin: string
  target: string
}

export function login(userName: string, password?: string): Promise<LoginResult> {
  return post<LoginResult>('login', { userName, password })
}

export function logout(): Promise<MessageResult> {
  return post<MessageResult>('logout')
}

export function captcha(): Promise<CaptchaResult> {
  return post<CaptchaResult>('captcha')
}

/** 只校验图形验证码；`userName` / `email` 本轮后端不判断。 */
export function verify(id: string, code: string, userName?: string, email?: string): Promise<MessageResult> {
  return post<MessageResult>('verify', { id, code, userName, email })
}

export function register(payload: RegisterPayload): Promise<UserListRow> {
  return post<UserListRow>('register', payload)
}

export function getMyInfo(): Promise<UserInfo> {
  return post<UserInfo>('user/myInfo')
}

export function getMyRole(): Promise<UserRole> {
  return post<UserRole>('user/myRole')
}

export function updatePassword(payload: UpdatePasswordPayload): Promise<void> {
  return post<void>('user/updatePassword', payload)
}

export function userList(query: UserPageQuery): Promise<UserPage> {
  return post<UserPage>('user/list', query)
}

export function userSearching(keys: string): Promise<UserListRow[]> {
  return post<UserListRow[]>('user/searching', { keys })
}

export function getUser(idList: string[]): Promise<UserListRow[]> {
  return post<UserListRow[]>('user/get', { idList })
}

export function createUser(payload: UserCreatePayload): Promise<{ id: string }> {
  return post<{ id: string }>('user/create', payload)
}

export function updateUser(payload: UserUpdatePayload): Promise<void> {
  return post<void>('user/edit', payload)
}

export function deleteUsers(ids: string[]): Promise<void> {
  return post<void>('user/delete', { ids })
}

/** 上传头像（FormData 字段名固定 `file`）。 */
export function setAvatar(id: string, avatar: Blob): Promise<void> {
  const form = new FormData()
  form.append('file', avatar, avatar instanceof File ? avatar.name : `${id}.jpg`)
  return request<void>({ url: 'user/avatar', method: 'put', params: { id }, data: form })
}

/** 读头像（Blob）。头像直链见 auth store 的 `avatarUrl`。 */
export function getAvatar(id: string): Promise<Blob> {
  return request<Blob>({ url: 'user/avatar', method: 'get', params: { id }, responseType: 'blob' })
}
