import type { ElementSize } from './types.ts'

interface Settings {
  /** 站点标题，用于首屏占位与 document.title 的兜底 */
  title: string
  /** 部署子路径，必须与后端 viteJar 的 contextPath 一致 */
  viteBasePath: string
  /** Element Plus 默认尺寸 */
  defaultSize: ElementSize
  /** 是否要求登录；为 false 时使用临时 token */
  isNeedLogin: boolean
}

export const settings: Settings = {
  title: '洛洛希雅的午后梦乡',
  viteBasePath: '/home/',
  defaultSize: 'small',
  isNeedLogin: true
}
