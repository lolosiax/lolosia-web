<script setup lang="ts">
import type { MqttClient } from 'mqtt'
import mqtt from 'mqtt'
import { delay } from '@/utils/common-util'
import type { Ref } from 'vue'
import { useMqttStore } from '@/store/mqtt'
import type { DataLib, DataLibContent } from '@/views/mqtt/dataLib'
import dataLib0 from '@/views/mqtt/dataLib'
import { ElMessage } from 'element-plus'
import { add } from 'xe-utils'

let mqttClient: MqttClient | null = $ref(null)
const jobCancel: Ref<(() => void) | null> = ref() as any

const mqttStore = useMqttStore()
const topic = $toRef(mqttStore, 'topic')
const url = $toRef(mqttStore, 'url')
const username = $toRef(mqttStore, 'username')
const password = $toRef(mqttStore, 'password')
const clientId = $toRef(mqttStore, 'clientId')
const forceRawTime = $toRef(mqttStore, 'forceRawTime')
const normalizedTime = $toRef(mqttStore, 'normalizedTime')
const coolDownTime = $toRef(mqttStore, 'coolDownTime')
const loopPlayback = $toRef(mqttStore, 'loopPlayback')

let loading = $ref(false)
const dataLib = reactive(dataLib0)
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
  startSecMark: 0,
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
  coolDownTime: 0,
  range: {
    start: 0,
    end: 0
  },
  cars: [] as CarPos[]
})
const active = $ref('CLC_track')

function addData() {
  const input = document.createElement('input')
  input.accept = 'application/json'
  input.type = 'file'
  input.onchange = () => {
    if (input.files?.[0]) {
      const file = input.files[0]
      dataLib[file.name.replace('.json', '')] = {
        title: '',
        async data() {
          const text = await file.text()
          return JSON.parse(text)
        }
      } as DataLib
    }
  }
  input.click()
}

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
    // 判断取消循环播放
    if (!loopPlayback) {
      if (publish.index == list.length - 1) {
        jobCancel.value?.()
        return
      }
    }
    // 判断定时器被关闭
    if (exit) {
      clearInterval(interval)
      publish.cars = []
      return
    }

    // 判断启用冷却时间
    if (coolDownTime > 0) {
      // 判断处于冷却状态
      if (publish.coolDownTime > 0) {
        publish.coolDownTime -= 100
        // 操作后小于0时重置发布时间
        if (publish.coolDownTime <= 0) {
          publish.index = 0
        }
        return
      }
      // 判断进入冷却状态
      if (publish.index == list.length - 1) {
        publish.coolDownTime = coolDownTime
        return
      }
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

      if (publish.startTimestamp === 0) {
        publish.startTimestamp = publish.lastRawTimestamp
        publish.startSecMark = item[0].content[0].secMark
      }

      if (!publish.rawTime || normalizedTime) {
        // 由于时间发生变化，对所有车辆进行复制，避免污染原始数据
        item = JSON.parse(JSON.stringify(item))
        list = item[0].content
      }

      // 时间归一化，将所有车辆的时间对其索引 * 100 ms
      if (normalizedTime) {
        for (const it of list) {
          it.timeStamp = publish.startTimestamp + publish.index * 100
          it.secMark = (publish.startSecMark + publish.index * 100) % 60000
        }
      }

      // 处理暂停等操作对时间的影响
      if (!publish.rawTime) {
        if (publish.timeTicking < 0) publish.timeOffset += 200
        else if (publish.pause) publish.timeOffset += 100
        const offset = publish.timeOffset
        publish.lastTimestamp = publish.lastRawTimestamp + publish.timeOffset
        for (const it of list) {
          it.timeStamp = it.timeStamp + offset
          it.secMark = (it.secMark + offset) % 60000
        }
      } else {
        publish.lastTimestamp = publish.lastRawTimestamp
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
/** 尝试关闭原始时间模式，这在强制使用原始时间模式开关打开时不生效 */
function triggerDisableRawTime() {
  if (forceRawTime) return
  publish.rawTime = false
}

function pause() {
  publish.pause = true
  triggerDisableRawTime()
}

function reverse() {
  publish.timeTicking = -1
  triggerDisableRawTime()
}

function move(tick: number) {
  triggerDisableRawTime()
  publish.index += tick
  publish.timeOffset -= tick * 100
}

watch(
  () => mqttStore.forceRawTime,
  (it) => {
    if (it) {
      publish.rawTime = true
      publish.timeOffset = 0
    } else if (publish.pause) {
      publish.rawTime = false
    }
  }
)
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
        <div flex justify-center m2>
          <el-button w="150px" type="primary" @click="addData">添加</el-button>
        </div>
      </div>
    </el-aside>
    <el-main>
      <el-form label-width="auto" class="config-form">
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
        <el-form-item label="控制柄">
          <div flex-grow>
            <el-row>
              <el-button v-if="!publish.status" type="primary" @click="connect">连接</el-button>
              <el-button v-else type="danger" @click="disconnect">断开</el-button>
              <el-button v-if="!jobCancel" type="primary" :disabled="!publish.status" @click="doPublish">
                发送
              </el-button>
              <template v-else>
                <el-button type="danger" :disabled="!publish.status" @click="() => jobCancel?.()">停止</el-button>
              </template>
              <el-button v-if="!publish.pause" :disabled="!jobCancel" type="warning" @click="pause">暂停</el-button>
              <el-button v-else :disabled="!jobCancel" type="success" @click="publish.pause = false">继续</el-button>
              <el-button-group>
                <el-button v-if="forceRawTime" type="primary" @click="forceRawTime = false">原始时间模式:开</el-button>
                <el-button v-else type="info" @click="forceRawTime = true">原始时间模式:关</el-button>
                <el-button v-if="normalizedTime" type="primary" @click="normalizedTime = false">
                  时间归一化:开
                </el-button>
                <el-button v-else type="info" @click="normalizedTime = true">时间归一化:关</el-button>
                <el-button v-if="loopPlayback" type="primary" @click="loopPlayback = false">自动重播:开</el-button>
                <el-button v-else ml="12px" type="info" @click="loopPlayback = true">自动重播:关</el-button>
              </el-button-group>
              <div v-if="loopPlayback" flex-grow relative ml="5" style="top: 8px">
                <div absolute style="top: -15px">
                  <template v-if="coolDownTime === 0">冷却时间：关闭</template>
                  <template v-else>冷却时间：{{ coolDownTime }} ms</template>
                </div>
                <el-slider v-model="coolDownTime" :min="0" :max="10000" :step="100" />
              </div>
            </el-row>
            <el-row class="publish-controller-bar" :class="{ disabled: !jobCancel }">
              <el-button type="info" @mousedown="reverse" @mouseup="publish.timeTicking = 1">倒带</el-button>
              <el-button-group type="info">
                <el-button @click="move(-100)">后退10秒</el-button>
                <el-button @click="move(-10)">后退1秒</el-button>
                <el-button @click="move(-1)">后退1帧</el-button>
                <el-button @click="move(1)">前进1帧</el-button>
                <el-button @click="move(10)">前进1秒</el-button>
                <el-button @click="move(100)">前进10秒</el-button>
              </el-button-group>
            </el-row>
          </div>
        </el-form-item>
        <el-form-item label="提示">
          <div style="font-size: 1.2em">
            <div v-if="!forceRawTime" text-red>
              原始时间模式已关闭，这可能导致需要绝对时间的功能出现异常，例如红绿灯与车流可能不再同步
            </div>
            <div v-else text-red>原始时间模式已开启，这可能导致修改进度时画面出现闪烁，暂停时画面不显示车辆的问题</div>
            <div v-if="normalizedTime">
              时间归一化已开启，可以修复原始数据可能存在的时间戳不一致问题，减少V2X系统内时间跳跃问题发生的概率。
            </div>
          </div>
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
              <template v-if="!publish.rawTime">已禁用</template>
              <template v-else-if="normalizedTime">归一化</template>
              <template v-else>正常</template>
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
          <div flex-grow pl="5">
            <template v-if="publish.coolDownTime <= 0">
              <div text-lg>发送进度：{{ publish.percentage }}%</div>
              <el-progress w-full :stroke-width="20" :percentage="publish.percentage" :show-text="false" />
            </template>
            <template v-else>
              <div text-lg>冷却中……{{ publish.coolDownTime / 1000 }}s</div>
              <el-progress
                w-full
                :stroke-width="20"
                :percentage="(publish.coolDownTime / coolDownTime) * 100"
                :show-text="false"
                status="exception"
              />
            </template>
            <template v-if="publish.performance < 1">
              <div mt="2" text-lg>性能损耗：{{ publish.performance.toFixed(2) }} ms</div>
              <el-progress w-full :stroke-width="20" :percentage="publish.performance * 100" :show-text="false" />
            </template>
            <template v-else-if="publish.performance < 10">
              <div mt="2" text-lg>性能损耗：{{ publish.performance.toFixed(1) }} ms</div>
              <el-progress
                w-full
                status="warning"
                :stroke-width="20"
                :percentage="publish.performance * 10"
                :show-text="false"
              />
            </template>
            <template v-else>
              <div mt="2" text-lg>性能损耗：{{ publish.performance.toFixed(0) }} ms</div>
              <el-progress
                w-full
                status="exception"
                :stroke-width="20"
                :percentage="publish.performance"
                :show-text="false"
              />
            </template>
          </div>
        </el-form-item>
      </el-form>
      <div v-if="jobCancel" class="preview">
        <div p2>车辆状态预览</div>
        <div
          v-for="car in publish.cars"
          :key="car.name"
          class="preview-item"
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

  .config-form {
    .publish-controller-bar {
      margin-top: 16px;
      &.disabled {
        > * {
          pointer-events: none;
        }
        opacity: 0.5;
        cursor: not-allowed;
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
