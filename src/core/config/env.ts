/** 构建元信息：本地开发时大多为空，由 Gradle 的 viteJar 注入真实值。 */
export const buildInfo = {
  /** 前端自身版本（package.json） */
  frontVersion: import.meta.env.PROJECT_VERSION ?? '0.0.0',
  /** 后端版本 */
  backVersion: import.meta.env.VITE_PROJECT_VERSION ?? '',
  buildTime: import.meta.env.VITE_BUILD_TIMESTAMP ?? '',
  commit: import.meta.env.VITE_GIT_COMMIT ?? '',
  branch: import.meta.env.VITE_BUILD_DISPLAY_NAME ?? ''
} as const

export const isProd = import.meta.env.VITE_APP_ENV === 'prod'

/** 高德地图凭据（足迹地图）；未配置时由调用方决定降级方式。 */
export const amap = {
  key: import.meta.env.VITE_AMAP_KEY ?? '',
  securityCode: import.meta.env.VITE_AMAP_SECURITY_CODE ?? ''
} as const

/**
 * 一句话构建信息，登录页与落地页页脚共用。
 * 只把真实存在的字段拼进去，避免出现「构建 于」这类残缺或语序别扭的文案；
 * commit 是构建信息而不是版本号的一部分，所以用分隔符而不是 `-` 拼接。
 */
export function buildSummary(): string {
  const version = buildInfo.backVersion || buildInfo.frontVersion
  const parts = [`版本 ${version}`]
  if (buildInfo.commit) parts.push(`哈希 ${buildInfo.commit.slice(0, 8)}`)
  if (buildInfo.branch) parts.push(`分支 ${buildInfo.branch}`)
  parts.push(buildInfo.buildTime ? `构建于 ${buildInfo.buildTime}` : '本地开发')
  return parts.join(' · ')
}
