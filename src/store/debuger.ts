import { defineStore } from "pinia";

export const useDebuggerStore = defineStore('debugger',{
  state(){
    return {
      showLayoutGrid: false
    }
  },
  persist:{
    storage: localStorage,
    paths: ['showLayoutGrid']
  },
  actions:{
    setShowLayoutGrid(value){
      this.showLayoutGrid = value
    }
  }
})
