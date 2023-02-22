import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * keep-alive 白名单。
 *
 * - `cachedViews`：二级页面（布局直接子路由）的组件名；
 * - `cachedViewsDeep`：三级页面（带二级容器）的组件名。
 */
export const useRouteCacheStore = defineStore('route-cache', () => {
  const cachedViews = ref<string[]>([])
  const cachedViewsDeep = ref<string[]>([])

  function add(view: string): void {
    if (!cachedViews.value.includes(view)) cachedViews.value.push(view)
  }

  function remove(view: string): void {
    const index = cachedViews.value.indexOf(view)
    if (index > -1) cachedViews.value.splice(index, 1)
  }

  function addDeep(view: string): void {
    if (!cachedViewsDeep.value.includes(view)) cachedViewsDeep.value.push(view)
  }

  function removeDeep(view: string): void {
    const index = cachedViewsDeep.value.indexOf(view)
    if (index > -1) cachedViewsDeep.value.splice(index, 1)
  }

  function clear(): void {
    cachedViews.value = []
    cachedViewsDeep.value = []
  }

  return { cachedViews, cachedViewsDeep, add, remove, addDeep, removeDeep, clear }
})
