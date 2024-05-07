import { defineStore } from 'pinia'

export const useMqttStore = defineStore('mqtt', {
  state() {
    return {
      topic: 'V2X/RSU/R328328/RSM/UP/DAWNLINE',
      url: 'mqtt://localhost:15675/mqtt',
      username: 'root',
      password: '123456',
      clientId: 'R328328'
    }
  },
  persist: {
    storage: localStorage,
    paths: undefined
  }
})