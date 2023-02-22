import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { apiBaseUrl } from '@/core/lib/http'
import type { UserInfo, UserRole } from '@/core/api/user'

/** 契约固定的持久化 key。 */
const TOKEN_KEY = 'token'
const KEEP_SESSION_KEY = 'keepSession'

function readToken(): string {
  return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY) ?? ''
}

function readKeepSession(): boolean {
  const value = sessionStorage.getItem(KEEP_SESSION_KEY)
  return value === null ? true : value === 'true'
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref(readToken())
  const keepSession = ref(readKeepSession())
  const userInfo = ref<UserInfo | null>(null)
  const role = ref<UserRole | null>(null)
  /** 用户信息是否已在本会话内加载过 */
  const loaded = ref(false)

  const roleType = computed(() => role.value?.roleType ?? role.value?.type ?? '')
  const displayName = computed(() => userInfo.value?.realName || userInfo.value?.userName || '平台用户')
  const isAdmin = computed(() => roleType.value.includes('admin'))
  const isOwner = computed(() => roleType.value === 'owner')
  /** 头像版本号：重新上传后自增，用来绕过浏览器缓存。 */
  const avatarVersion = ref(0)
  /** 头像走 `<img src>`，路径契约见后端 `/user/avatar/get/{id}`。 */
  const avatarUrl = computed(() => {
    const id = userInfo.value?.id
    if (!id) return ''
    return `${apiBaseUrl}user/avatar/get/${id}?v=${avatarVersion.value}`
  })

  function setToken(value: string, persist = keepSession.value): void {
    token.value = value
    keepSession.value = persist
    sessionStorage.setItem(KEEP_SESSION_KEY, String(persist))
    const target = persist ? localStorage : sessionStorage
    const other = persist ? sessionStorage : localStorage
    other.removeItem(TOKEN_KEY)
    if (value) target.setItem(TOKEN_KEY, value)
    else {
      localStorage.removeItem(TOKEN_KEY)
      sessionStorage.removeItem(TOKEN_KEY)
    }
  }

  function setUserInfo(info: UserInfo, userRole: UserRole): void {
    userInfo.value = info
    role.value = userRole
    loaded.value = true
  }

  /** 个人中心改完资料后只刷新用户信息，角色不动。 */
  function patchUserInfo(info: UserInfo): void {
    userInfo.value = info
  }

  function refreshAvatar(): void {
    avatarVersion.value += 1
  }

  function reset(): void {
    token.value = ''
    userInfo.value = null
    role.value = null
    loaded.value = false
    localStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(TOKEN_KEY)
  }

  return {
    token,
    keepSession,
    userInfo,
    role,
    loaded,
    roleType,
    displayName,
    isAdmin,
    isOwner,
    avatarUrl,
    avatarVersion,
    setToken,
    setUserInfo,
    patchUserInfo,
    refreshAvatar,
    reset
  }
})
