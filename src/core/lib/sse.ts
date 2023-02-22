import { useAuthStore } from '@/core/stores/auth'
import { apiBaseUrl, request, type ApiEnvelope } from './http'

/** 服务端推送的事件名。 */
export type SseEventName = 'anime.release' | (string & {})

export type SseHandler = (payload: unknown) => void

interface SseConnection {
  id: string
  source: EventSource
}

const handlers = new Map<SseEventName, Set<SseHandler>>()

let connection: SseConnection | null = null
let running = false
/** 每个已订阅事件只需要挂一次监听；重连时要全部重挂。 */
const attached = new Set<SseEventName>()

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}

/**
 * 走 `x-upgrade: event-source` 协议：先 POST 换一个 id，再用 `?eventSourceId=` 开原生 EventSource。
 */
async function openEventSource(id: string): Promise<EventSource> {
  const path = 'sse'
  const source = new EventSource(`${apiBaseUrl}${path}?eventSourceId=${encodeURIComponent(id)}`)
  await new Promise<void>((resolve, reject) => {
    source.onopen = () => resolve()
    source.onerror = event => reject(event)
  })
  source.onopen = null
  source.onerror = null
  return source
}

function dispatch(name: SseEventName, event: MessageEvent<string>): void {
  const listeners = handlers.get(name)
  if (!listeners?.size) return
  let payload: unknown
  try {
    payload = JSON.parse(event.data) as unknown
  } catch {
    payload = event.data
  }
  for (const handler of listeners) handler(payload)
}

function attach(name: SseEventName): void {
  if (attached.has(name) || !connection) return
  connection.source.addEventListener(name, (event: MessageEvent<string>) => dispatch(name, event))
  attached.add(name)
}

/** 订阅一个服务端事件；返回取消订阅函数。 */
export function onSseEvent(name: SseEventName, handler: SseHandler): () => void {
  let set = handlers.get(name)
  if (!set) {
    set = new Set()
    handlers.set(name, set)
  }
  set.add(handler)
  attach(name)
  return () => {
    set?.delete(handler)
  }
}

/** 一次性连接；token 存在时把连接登记到后端会话。 */
async function connect(): Promise<SseConnection> {
  const id = await request<ApiEnvelope<string>>({
    url: 'sse',
    method: 'post',
    headers: { 'x-upgrade': 'event-source' },
    data: {}
  }).then(body => body.data)

  const source = await openEventSource(id)
  const auth = useAuthStore()
  if (auth.token) {
    try {
      await request({ url: 'sse/registry', method: 'post', data: { sseId: id } })
    } catch {
      source.close()
      throw new Error('SSE 登记失败')
    }
  }
  return { id, source }
}

function waitForClose(source: EventSource): Promise<void> {
  return new Promise(resolve => {
    source.addEventListener('close', () => resolve())
    source.addEventListener('error', event => {
      console.warn('[sse] 连接异常', event)
    })
  })
}

/** 启动（或复用）后台连接循环；断线 5 秒后重连。 */
export async function startSse(): Promise<void> {
  if (running) return
  running = true

  while (running) {
    let current: SseConnection | null = null
    try {
      current = await connect()
      connection = current
      attached.clear()
      for (const name of handlers.keys()) attach(name)
      await waitForClose(current.source)
    } catch (error) {
      console.warn('[sse] 连接失败', error)
    } finally {
      current?.source.close()
      connection = null
      attached.clear()
    }
    if (!running) break
    await sleep(5000)
  }
}

export function stopSse(): void {
  running = false
  connection?.source.close()
  connection = null
}
