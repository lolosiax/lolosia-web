<script setup lang="ts">
import type { MqttClient } from 'mqtt'
import mqtt from 'mqtt'
import { delay } from '@/utils/common-util'
import type { Ref } from 'vue'
import { useMqttStore } from '@/store/mqtt'
import type { DataLib, DataLibContent } from '@/views/mqtt/dataLib'
import dataLib from '@/views/mqtt/dataLib'
import { ElMessage } from 'element-plus'

let mqttClient: MqttClient | null = $ref(null)
const jobCancel: Ref<(() => void) | null> = ref() as any

const mqttStore = useMqttStore()
const topic = $toRef(mqttStore, 'topic')
const url = $toRef(mqttStore, 'url')
const username = $toRef(mqttStore, 'username')
const password = $toRef(mqttStore, 'password')
const clientId = $toRef(mqttStore, 'clientId')

let loading = $ref(false)
let status = $ref(false)
const active = $ref('CLC_track')

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
  let jsonModule: DataLibContent
  try {
    loading = true
    jsonModule = await (dataLib[active] as DataLib).data()
  } catch (e: Error) {
    loading = false
    console.error(e)
    ElMessage.error(`加载失败:${e.message}`)
    return
  }
  const list = jsonModule
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
    <el-aside width="500px">
      <div class="mqtt-title-frame">
        <router-link to="/" class="el-button el-button--primary el-button--small">返回</router-link>
        <span class="mqtt-title">适用于V2X系统的MQTT调试器</span>
      </div>
      <h2 class="item-separator">数据选择器</h2>

      <div class="data-list">
        <el-row
          v-for="[key, it] in Object.entries(dataLib)"
          :key="key"
          class="data-list-item"
          :data-active="key === active"
          @click="active = key"
        >
          <el-col :span="8">{{ key }}</el-col>
          <el-col :span="16">{{ it.title }}</el-col>
        </el-row>
      </div>
    </el-aside>
    <el-main>
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
        <el-form-item>
          <el-button v-if="!status" type="primary" @click="connect">连接</el-button>
          <el-button v-else type="danger" @click="disconnect">断开</el-button>
          <el-button v-if="!jobCancel" type="primary" :disabled="!status" @click="publish">发送</el-button>
          <el-button v-else type="danger" :disabled="!status" @click="() => jobCancel?.()">停止</el-button>
        </el-form-item>
      </el-form>
    </el-main>
    <el-aside />
  </el-container>
</template>

<style scoped lang="scss">
.el-container {
  height: 100%;
  width: 100%;
  overflow: auto;
  box-sizing: border-box;
  padding: 10px;
  .mqtt-title-frame {
    display: flex;
    align-items: center;

    .mqtt-title {
      flex-grow: 1;
      margin-left: 1em;
      //text-align: right;
      font-size: 1.5em;
      font-weight: 800;
    }
  }

  .item-separator {
    background-color: gray;
    color: white;
    padding: 0.3em 0.5em;
    margin-top: 0.5em;
  }

  .data-list {
    margin-top: 0.5em;
    .data-list-item {
      padding: 0.2em 0.5em;
      user-select: none;
      cursor: pointer;

      &:hover {
        background-color: var(--el-color-primary-light-7);
      }

      &[data-active='true'] {
        background-color: var(--el-color-primary);
        color: white;
        border-radius: 5px;
      }
    }
  }
}
</style>
