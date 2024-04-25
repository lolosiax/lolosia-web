<script setup lang="ts">
import type { MqttClient } from 'mqtt'
import mqtt from 'mqtt'
import { delay } from '@/utils/common-util'
import type { Ref } from 'vue'

let mqttClient: MqttClient | null = $ref()
const jobCancel: Ref<(() => void) | null> = ref() as any

const topic = $ref('V2X/RSU/R328328/RSM/UP/DAWNLINE')
const url = $ref('mqtt://localhost:15675/mqtt')
const username = $ref('root')
const password = $ref('123456')
const clientId = $ref('R328328')
const file: File = $ref()
let status = $ref(false)

function connect() {
  mqttClient = mqtt.connect(url, {
    username,
    password,
    clientId
  })
  mqttClient.on('connect', (it) => {
    status = true
  })

  mqttClient.on('error', (it) => {
    status = false
    console.error(it)
  })
}

async function disconnect() {
  jobCancel.value?.()
  await mqttClient?.endAsync()
  mqttClient = null
  status = false
}

async function publish() {
  const text = await file.text()
  const list = JSON.parse(text) as any[]
  let i = 0
  const next = () => list[(i = i++ % list.length)]
  ;(async () => {
    let exit = false
    jobCancel.value = () => {
      exit = true
      jobCancel.value = null
    }
    while (!exit) {
      const item = next()
      const json = JSON.stringify(item)
      mqttClient!.publish(topic, json, {})

      await delay(100)
    }
  })().catch((e) => console.error(e))
}
</script>

<template>
  <el-container>
    <el-main style="max-width: 1024px; margin: 0 auto">
      <el-form label-width="auto">
        <el-form-item label="地址">
          <el-input v-model="url" />
        </el-form-item>
        <el-form-item label="TOPIC">
          <el-input v-model="topic" />
        </el-form-item>
        <el-form-item label="ClientID">
          <el-input v-model="clientId" />
        </el-form-item>
        <el-form-item label="用户名">
          <el-input v-model="username" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="password" />
        </el-form-item>
        <el-form-item label="文件">
          <input type="file" accept="application/json" @change="file = $event.target?.['files']?.[0]" />
        </el-form-item>
        <el-form-item label="过滤器">
          <el-table />
        </el-form-item>
        <el-form-item>
          <el-button v-if="!status" type="primary" @click="connect">连接</el-button>
          <el-button v-else type="danger" @click="disconnect">断开</el-button>
          <el-button v-if="!jobCancel" type="primary" :disabled="!status" @click="publish">发送</el-button>
          <el-button v-else type="danger" :disabled="!status" @click="() => jobCancel?.()">停止</el-button>
        </el-form-item>
      </el-form>
    </el-main>
  </el-container>
</template>

<style scoped lang="scss"></style>
