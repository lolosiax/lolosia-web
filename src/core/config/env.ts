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

/** 一句话构建信息，登录页与调试面板共用。 */
export function buildSummary(): string {
  const version = buildInfo.backVersion || buildInfo.frontVersion
  if (!buildInfo.buildTime) return `版本 ${version}-dev`
  const commit = buildInfo.commit ? `-${buildInfo.commit.slice(0, 8)}` : ''
  const branch = buildInfo.branch ? `构建 ${buildInfo.branch} 于` : '构建于'
  return `当前版本 ${version}${commit} ${branch} ${buildInfo.buildTime}`
}
