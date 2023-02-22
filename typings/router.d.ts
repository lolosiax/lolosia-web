import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    /** 侧栏与页签标题 */
    title?: string
    /** Bootstrap Icons 类名，如 `bi bi-house` */
    icon?: string
    /** 不在侧栏显示 */
    hidden?: boolean
    /** 固定页签 */
    affix?: boolean
    /** 参与 keep-alive 缓存 */
    cachePage?: boolean
    /** 离开时移除缓存 */
    leaveRmCachePage?: boolean
    /** 高亮的侧栏菜单路径 */
    activeMenu?: string
    /** 过场动画容器复用键；同一模块内换子路径时保持容器不变 */
    viewKey?: string
    /** 允许访问的角色（`roleType`）；不写表示所有登录用户可访问 */
    roles?: string[]
    /** 不登录也能访问 */
    public?: boolean
  }
}

export {}
