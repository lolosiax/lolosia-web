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
type CarPos = {
  name: string
  x: number
  y: number
}
const publish = reactive({
  status: false,
  index: 0,
  count: 1,
  startTime: 0,
  startTimestamp: 0,
  lastTime: 0,
  lastTimestamp: 0,
  lastRawTimestamp: 0,
  timeOffset: 0,
  timeTicking: 1,
  performance: 0,
  onlineCars: 0,
  percentage: 0,
  pause: false,
  rawTime: true,
  range: {
    start: 0,
    end: 0
  },
  cars: [] as CarPos[]
})
const active = $ref('CLC_track')

function connect() {
  mqttClient = mqtt.connect(url, {
    username,
    password,
    clientId
  })
  mqttClient.on('connect', (it) => {
    publish.status = true
  })

  mqttClient.on('error', (it) => {
    publish.status = false
    console.error(it)
  })
}

async function disconnect() {
  jobCancel.value?.()
  await mqttClient?.endAsync()
  mqttClient = null
  publish.status = false
}

onUnmounted(() => {
  disconnect()
})

async function doPublish() {
  let jsonModule: DataLibContent
  try {
    loading = true
    jsonModule = await (dataLib[active] as DataLib).data()
    loading = false
    // @ts-ignore
  } catch (e: Error) {
    loading = false
    console.error(e)
    ElMessage.error(`加载失败:${e.message}`)
    return
  }
  const list = jsonModule
  publish.index = 0
  function next() {
    if (!publish.pause || (publish.pause && publish.timeTicking < 0)) {
      publish.index += publish.timeTicking
    }
    if (publish.index >= list.length) publish.index = 0
    else if (publish.index < 0) publish.index = list.length - 1
    return list[publish.index]
  }

  let exit = false
  jobCancel.value = () => {
    exit = true
    jobCancel.value = null
    publish.startTimestamp = 0
  }
  publish.startTime = Date.now()
  publish.count = list.length
  publish.pause = false
  publish.rawTime = true
  // 发送数据的定时器
  const interval = setInterval(() => {
    if (exit) {
      clearInterval(interval)
      publish.cars = []
      return
    }
    // if (publishing.pause) return
    publish.lastTime = Date.now()
    const perStartTime = performance.now()

    let item = next()
    // 判断下有没有内容，防止空指针
    if (item[0]?.content?.[0]) {
      let list = item[0].content
      // 设置时间
      publish.lastRawTimestamp = item[0].content[0].timeStamp
      // 处理暂停等操作对时间的影响
      if (!publish.rawTime) {
        if (publish.timeTicking < 0) publish.timeOffset += 200
        else if (publish.pause) publish.timeOffset += 100
        const offset = publish.timeOffset
        publish.lastTimestamp = publish.lastRawTimestamp + publish.timeOffset
        // 由于时间发生变化，对所有车辆的时间进行替换
        item = JSON.parse(JSON.stringify(item))
        list = item[0].content
        for (const it of list) it.timeStamp = it.timeStamp + offset
      } else {
        publish.lastTimestamp = publish.lastRawTimestamp
      }
      if (publish.startTimestamp === 0) {
        publish.startTimestamp = publish.lastTimestamp
      }
      publish.cars = list.map((it) => ({
        name: it.global_track_id,
        x: it.x / 1.6,
        y: it.y / 0.9
      }))
    }
    publish.onlineCars = item[0]?.content?.length ?? 0
    publish.percentage = Number(((publish.index / (publish.count | 1)) * 100).toFixed(2))

    const json = JSON.stringify(item)
    mqttClient!.publish(topic, json, {})

    publish.performance = performance.now() - perStartTime
  }, 100)
}

function pause() {
  publish.pause = true
  publish.rawTime = false
}

function reverse() {
  publish.timeTicking = -1
  publish.rawTime = false
}

function move(tick: number) {
  publish.rawTime = false
  publish.index += tick
  publish.timeOffset -= tick * 100
}
</script>

<template>
  <el-container v-loading="loading">
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
        <el-form-item v-if="jobCancel" label="状态">
          <el-descriptions border direction="vertical" :column="4">
            <el-descriptions-item label="进度">{{ publish.index }} / {{ publish.count }}</el-descriptions-item>
            <el-descriptions-item label="运行时间">
              {{ (publish.lastTime - publish.startTime) / 1000 }} 秒
            </el-descriptions-item>
            <el-descriptions-item label="数据运行时间">
              {{ (publish.lastRawTimestamp - publish.startTimestamp) / 1000 }} 秒
            </el-descriptions-item>
            <el-descriptions-item label="原始时间">
              <template v-if="publish.rawTime">正常</template>
              <template v-else>已禁用</template>
            </el-descriptions-item>
            <el-descriptions-item label="数据起始时间戳">
              {{ publish.startTimestamp }}
            </el-descriptions-item>
            <el-descriptions-item label="数据当前时间戳">
              {{ publish.lastTimestamp }}
            </el-descriptions-item>
            <el-descriptions-item label="数据原始时间戳">
              {{ publish.lastRawTimestamp }}
            </el-descriptions-item>
            <el-descriptions-item label="活跃车辆">
              {{ publish.onlineCars }}
            </el-descriptions-item>
          </el-descriptions>
          <div flex-grow>
            <div text-lg>发送进度：{{ publish.percentage }}%</div>
            <el-progress w-full :stroke-width="20" :percentage="publish.percentage">
              <template #default>&nbsp;</template>
            </el-progress>
            <template v-if="publish.performance < 1">
              <div mt="2" text-lg>性能损耗：{{ publish.performance.toFixed(2) }} ms</div>
              <el-progress w-full :stroke-width="20" :percentage="publish.performance * 100">
                <template #default>&nbsp;</template>
              </el-progress>
            </template>
            <template v-else-if="publish.performance < 10">
              <div mt="2" text-lg>性能损耗：{{ publish.performance.toFixed(1) }} ms</div>
              <el-progress w-full status="warning" :stroke-width="20" :percentage="publish.performance * 10">
                <template #default>&nbsp;</template>
              </el-progress>
            </template>
            <template v-else>
              <div mt="2" text-lg>性能损耗：{{ publish.performance.toFixed(0) }} ms</div>
              <el-progress w-full status="exception" :stroke-width="20" :percentage="publish.performance">
                <template #default>&nbsp;</template>
              </el-progress>
            </template>
          </div>
        </el-form-item>
        <el-form-item>
          <el-button v-if="!publish.status" type="primary" @click="connect">连接</el-button>
          <el-button v-else type="danger" @click="disconnect">断开</el-button>
          <el-button v-if="!jobCancel" type="primary" :disabled="!publish.status" @click="doPublish">发送</el-button>
          <template v-else>
            <el-button type="danger" :disabled="!publish.status" @click="() => jobCancel?.()">停止</el-button>
            <el-button v-if="!publish.pause" type="warning" @click="pause">暂停</el-button>
            <el-button v-else type="success" @click="publish.pause = false">继续</el-button>
            <el-button type="danger" @mousedown="reverse" @mouseup="publish.timeTicking = 1">倒带</el-button>
            <el-button-group type="info">
              <el-button @click="move(-100)">后退10秒</el-button>
              <el-button @click="move(-10)">后退1秒</el-button>
              <el-button @click="move(-1)">后退1帧</el-button>
              <el-button @click="move(1)">前进1帧</el-button>
              <el-button @click="move(10)">前进1秒</el-button>
              <el-button @click="move(100)">前进10秒</el-button>
            </el-button-group>
          </template>
        </el-form-item>
      </el-form>
      <div v-if="jobCancel" class="preview">
        <div p2>车辆状态预览</div>
        <div
          class="preview-item"
          v-for="car in publish.cars"
          :key="car.name"
          :style="{ left: car.x + '%', top: car.y + '%' }"
        >
          <span>{{ car.name }}</span>
        </div>
      </div>
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

      &:nth-child(2n) {
        background-color: #88888822;
      }

      &:hover {
        background-color: var(--el-color-primary-light-7);
      }

      &[data-active='true'] {
        background-color: var(--el-color-primary);
        color: white;
        border-radius: 5px;
        font-weight: 800;
      }
    }
  }
  .preview {
    border: 1px solid black;
    overflow: hidden;
    height: 40vh;
    position: relative;
    .preview-item {
      position: absolute;
      display: flex;
      justify-content: center;
      align-items: center;
      width: 0;
      height: 0;
      transition-property: left, top;
      transition-duration: 0.3s;
      span {
        display: block;
        border-radius: 4px;
        //noinspection CssInvalidPropertyValue
        text-wrap: nowarp;
        color: white;
        background-color: black;
        padding: 5px;
      }
    }
  }
}
</style>
