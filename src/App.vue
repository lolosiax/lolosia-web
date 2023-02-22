<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useRoute, RouterView } from 'vue-router'
import type { RouteLocationNormalizedLoaded } from 'vue-router'
import { ElNotification } from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { onSseEvent, startSse, stopSse } from '@/core/lib/sse'
import { useAuthStore } from '@/core/stores/auth'
import { useLayoutStore } from '@/core/stores/layout'

defineOptions({ name: 'App' })

interface AnimeReleasePayload {
  seriesTitle?: string
  groupName?: string
  title?: string
  episodeNo?: number
}

const layout = useLayoutStore()
const auth = useAuthStore()
const route = useRoute()

onMounted(() => {
  onSseEvent('anime.release', payload => notifyAnimeRelease(payload as AnimeReleasePayload))
})

// 没有会话时不去连 SSE；登录后自动接上，退出后断开
watch(
  () => auth.token,
  token => {
    if (token) void startSse()
    else stopSse()
  },
  { immediate: true }
)

/** 番组发布提醒：站内通知 + 已授权的桌面通知。 */
function notifyAnimeRelease(payload: AnimeReleasePayload): void {
  const episode = payload.episodeNo ? ` 第${payload.episodeNo}话` : ''
  ElNotification({
    title: `${payload.seriesTitle || '番组更新'}${episode}`,
    message: `[${payload.groupName ?? '未知字幕组'}] 有新资源：${payload.title ?? ''}`,
    type: 'success',
    position: 'top-right',
    duration: 6000,
    offset: 40
  })

  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    const notice = new Notification(`${payload.seriesTitle ?? '番组'}${episode} 更新`, {
      body: `[${payload.groupName ?? '未知字幕组'}] ${payload.title ?? ''}`
    })
    notice.onclick = () => {
      window.focus()
      notice.close()
    }
  }
}

/** 过场动画容器 key：`viewKey` 让同模块内的子路径复用容器。 */
function pageKeyOf(current: RouteLocationNormalizedLoaded): string {
  return current.meta.viewKey ?? current.path
}

/** 离场结束后清掉旧页面内容，避免它在动画期间继续响应布局变化。 */
watch(route, () => {
  window.setTimeout(() => {
    const leaving = document.querySelector('.circle-reveal-leave-active')
    if (leaving) leaving.innerHTML = ''
  }, 300)
})
</script>

<template>
  <ElConfigProvider :locale="zhCn" :size="layout.size">
    <RouterView v-slot="{ Component, route: current }">
      <Transition name="circle-reveal">
        <div :key="pageKeyOf(current)" class="transition-page">
          <component :is="Component" />
        </div>
      </Transition>
    </RouterView>
  </ElConfigProvider>
</template>
