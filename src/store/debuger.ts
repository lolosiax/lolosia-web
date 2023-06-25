import { defineStore } from 'pinia'

export const useDebuggerStore = defineStore('debugger', {
  state() {
    return {
      ui: {
        showLayoutGrid: false
      }
    }
  },
  persist: {
    storage: localStorage,
    paths: undefined
  }
})
