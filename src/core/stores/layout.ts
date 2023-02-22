import { defineStore } from 'pinia'
import { computed, ref, shallowReactive } from 'vue'
import type { VNode } from 'vue'
import { settings } from '@/core/config/settings'
import type { ElementSize } from '@/core/config/types'

export type NavbarAlign = 'left' | 'center' | 'right'
export type NavbarRenderer = () => VNode[]

interface NavbarEntry {
  align: NavbarAlign
  render: NavbarRenderer
}

/**
 * 布局状态 + 全局面板（navbar）注册表。
 *
 * 面板内容以「渲染函数」形式登记，Map 本身不是响应式的，
 * 由 `navbarRevision` 递增来驱动依赖它的组件重算。
 */
export const useLayoutStore = defineStore(
  'layout',
  () => {
    const sidebarOpened = ref(true)
    const size = ref<ElementSize>(settings.defaultSize)

    const navbarEntries = shallowReactive(new Map<string, NavbarEntry>())
    const navbarRevision = ref(0)

    const hasNavbar = computed(() => {
      void navbarRevision.value
      return navbarEntries.size > 0
    })

    function registerNavbar(id: string, align: NavbarAlign, render: NavbarRenderer): void {
      navbarEntries.set(id, { align, render })
      navbarRevision.value += 1
    }

    function unregisterNavbar(id: string): void {
      if (navbarEntries.delete(id)) navbarRevision.value += 1
    }

    /** 取某个对齐区域的全部渲染函数（right 区域按后注册在前渲染）。 */
    function navbarRenderers(align: NavbarAlign): NavbarRenderer[] {
      void navbarRevision.value
      const list: NavbarRenderer[] = []
      for (const entry of navbarEntries.values()) {
        if (entry.align === align) list.push(entry.render)
      }
      return align === 'right' ? list.reverse() : list
    }

    function toggleSidebar(): void {
      sidebarOpened.value = !sidebarOpened.value
    }

    function setSidebarOpened(value: boolean): void {
      sidebarOpened.value = value
    }

    function setSize(value: ElementSize): void {
      size.value = value
    }

    return {
      sidebarOpened,
      size,
      hasNavbar,
      registerNavbar,
      unregisterNavbar,
      navbarRenderers,
      toggleSidebar,
      setSidebarOpened,
      setSize
    }
  },
  {
    persist: {
      key: 'layout',
      storage: localStorage,
      pick: ['sidebarOpened', 'size']
    }
  }
)
