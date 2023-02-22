import type { VNode } from 'vue'
import { useLayoutStore, type NavbarAlign, type NavbarRenderer } from '@/core/stores/layout'

/**
 * 把一个渲染函数登记到布局外的全局面板。
 *
 * 组件只负责登记/注销，DOM 由布局里的 `AppNavBar` 渲染。
 * 同一个 id 重复登记会覆盖上一次的结果。
 */
export function useNavbarSlot(id: string) {
  const layout = useLayoutStore()

  function register(align: NavbarAlign, render: NavbarRenderer): void {
    layout.registerNavbar(id, align, render)
  }

  function unregister(): void {
    layout.unregisterNavbar(id)
  }

  return { register, unregister }
}

/** 把「一组渲染函数」拼成 VNode 列表，异常渲染器直接跳过。 */
export function collectNavbarNodes(renderers: NavbarRenderer[]): VNode[] {
  const nodes: VNode[] = []
  for (const render of renderers) {
    try {
      nodes.push(...render())
    } catch (error) {
      console.error('[navbar] 渲染失败', error)
    }
  }
  return nodes
}
