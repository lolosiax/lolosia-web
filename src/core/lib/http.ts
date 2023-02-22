import axios, { type AxiosError, type AxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/core/stores/auth'
import { useDebugStore } from '@/core/stores/debug'

/** 后端统一信封。 */
export interface ApiEnvelope<T> {
  code: number
  msg?: string
  data: T
}

export interface ApiError extends Error {
  code?: number
  status?: number
}

/** 后端认的成功码。 */
const SUCCESS_CODES = new Set([0, 200, 20000])
/** 需要清会话的状态码。 */
const UNAUTHORIZED_CODES = new Set([401, 403])

const service = axios.create({ timeout: 15000 })

let unauthorizedHandler: (() => void) | null = null

/** 会话失效时的跳转动作由应用入口注入，避免 lib 依赖 router。 */
export function setUnauthorizedHandler(handler: () => void): void {
  unauthorizedHandler = handler
}

/**
 * 后端根地址。
 *
 * 优先级：`window.NGINX_BASE_URL`（反向代理注入） > 环境变量 mode > 当前页面 origin。
 */
export function getRoot(): string {
  if (window.NGINX_BASE_URL) return window.NGINX_BASE_URL

  const mode = import.meta.env.VITE_APP_BASE_MODE
  if (mode === 'port') {
    const port = import.meta.env.VITE_APP_BASE_PORT || location.port
    return `${location.protocol}//${location.hostname}:${port}`
  }
  if (mode === 'url') {
    return import.meta.env.VITE_APP_BASE_URL || `${location.protocol}//${location.host}`
  }
  return `${location.protocol}//${location.host}`
}

export const apiBaseUrl = `${getRoot()}/api/`

function createApiError(message: string, extra: { code?: number; status?: number } = {}): ApiError {
  const error = new Error(message) as ApiError
  if (extra.code !== undefined) error.code = extra.code
  if (extra.status !== undefined) error.status = extra.status
  return error
}

function handleUnauthorized(): void {
  useAuthStore().reset()
  unauthorizedHandler?.()
}

function notifyError(message: string): void {
  const debug = useDebugStore()
  if (!debug.displayError) return
  if (message === '未知异常' && !debug.displayAllError) return
  ElMessage.error({ message, duration: 2000 })
}

service.interceptors.request.use(config => {
  const token = useAuthStore().token
  if (token) config.headers.set('Authorization', `Bearer ${token}`)
  return config
})

service.interceptors.response.use(
  response => {
    const contentType = String(response.headers['content-type'] ?? '')
    if (!contentType.includes('json')) return response

    const body = response.data as ApiEnvelope<unknown> | null
    if (!body || typeof body !== 'object' || !('code' in body)) return response

    const code = Number(body.code)
    if (SUCCESS_CODES.has(code)) return response
    if (UNAUTHORIZED_CODES.has(code)) handleUnauthorized()
    return Promise.reject(createApiError(body.msg ?? '未知异常', { code }))
  },
  (error: AxiosError<ApiEnvelope<unknown>>) => {
    const response = error.response
    if (response?.status === 401) {
      handleUnauthorized()
      return Promise.reject(error)
    }

    const message = response?.data?.msg ?? '未知异常'
    error.message = message
    notifyError(message)
    return Promise.reject(Object.assign(error, { status: response?.status }))
  }
)

/**
 * 发一个请求，返回**响应体本身**（可能是信封，也可能是 Blob）。
 * 需要信封里的 `data` 时用 {@link post} / {@link get}。
 */
export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await service.request<T>({
    baseURL: apiBaseUrl,
    timeout: 15000,
    ...config
  })
  return response.data
}

/** POST 并在成功时解出信封里的 `data`。 */
export async function post<T>(url: string, data?: unknown): Promise<T> {
  const body = await request<ApiEnvelope<T>>({ url, method: 'post', data: data ?? {} })
  return body.data
}

/** GET 参数仍然拼在 query 上（后端 GET 接的是 `@Query`）。 */
export async function get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const body = await request<ApiEnvelope<T>>({ url, method: 'get', params })
  return body.data
}

export { service }
