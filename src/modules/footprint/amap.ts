import { amap } from '@/core/config/env'

/**
 * 高德地图 JS API 2.0 的动态加载器：只在首次进入足迹页时注入脚本，全局共用一次。
 *
 * Web 端 key 按设计随前端下发，通过 `VITE_AMAP_KEY` / `VITE_AMAP_SECURITY_CODE` 配置；
 * 未配置时直接给出可读错误，让页面降级成提示而不是白屏。
 */

/** 全局 `AMap` 命名空间（不给整个 SDK 写 d.ts）。 */
export type AmapNamespace = any
export type AmapMap = any
export type AmapOverlay = any

let loading: Promise<AmapNamespace> | null = null

export function loadAmap(): Promise<AmapNamespace> {
  const existing = (window as { AMap?: AmapNamespace }).AMap
  if (existing) return Promise.resolve(existing)
  if (loading) return loading

  if (!amap.key) {
    return Promise.reject(new Error('未配置高德地图 key：请在 .env 里填写 VITE_AMAP_KEY'))
  }

  loading = new Promise<AmapNamespace>((resolve, reject) => {
    ;(window as { _AMapSecurityConfig?: unknown })._AMapSecurityConfig = {
      securityJsCode: amap.securityCode
    }
    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.async = true
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${encodeURIComponent(amap.key)}`
    script.onload = () => {
      const namespace = (window as { AMap?: AmapNamespace }).AMap
      if (namespace) resolve(namespace)
      else reject(new Error('高德地图脚本已加载，但 AMap 命名空间未就绪'))
    }
    script.onerror = () => {
      loading = null
      reject(new Error('高德地图脚本加载失败，请检查网络或 key 配置'))
    }
    document.head.appendChild(script)
  })
  return loading
}
