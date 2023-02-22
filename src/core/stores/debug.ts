import { defineStore } from 'pinia'
import { ref } from 'vue'
import { isProd } from '@/core/config/env'

/** 调试开关；生产环境默认关闭图标，但面板里仍可手动打开。 */
export const useDebugStore = defineStore(
  'debug',
  () => {
    const enable = ref(!isProd)
    const showLayoutGrid = ref(false)
    const displayError = ref(false)
    const displayAllError = ref(false)

    function toggleLayoutGrid(): void {
      showLayoutGrid.value = !showLayoutGrid.value
    }

    return { enable, showLayoutGrid, displayError, displayAllError, toggleLayoutGrid }
  },
  {
    persist: {
      key: 'debug',
      storage: localStorage,
      pick: ['enable', 'showLayoutGrid', 'displayError', 'displayAllError']
    }
  }
)
