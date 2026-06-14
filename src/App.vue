<template>
  <el-config-provider :locale="lang['zh']" namespace="el" :size="size">
    <router-view v-slot="{ Component, route: r }">
      <transition name="circle-reveal">
        <div :key="r.path" class="transition-page">
          <component :is="Component" />
        </div>
      </transition>
    </router-view>
  </el-config-provider>
</template>
<script setup lang="ts">
import { onBeforeMount, onMounted } from 'vue'
//element-plus lang
import zh from 'element-plus/es/locale/lang/zh-cn'
import { storeToRefs } from 'pinia/dist/pinia'
import { useRoute } from 'vue-router'
import { useBasicStore } from '@/store/basic'
import { useConfigStore } from '@/store/config'

//reshow default setting
import { toggleHtmlClass } from '@/theme/utils'
import { initSSEConnect } from '@/utils/bus'
import { setTransitionOrigin } from '@/utils/transition'
const lang = { zh }

const { settings } = storeToRefs(useBasicStore())
const { size, language } = storeToRefs(useConfigStore())
onBeforeMount(() => {
  //set tmp token when setting isNeedLogin false
  if (!settings.value.isNeedLogin) useBasicStore().setToken(settings.value.tmpToken)
})
const route = useRoute()
onMounted(() => {
  const { setTheme, theme, setSize, size, setLanguage, language } = useConfigStore()
  setTheme(theme)
  setLanguage(language, route.meta?.title)
  setSize(size)
  toggleHtmlClass(theme)
  initSSEConnect()

  initRouterHock()
})

function initRouterHock() {
  watch(route, () => {
    setTimeout(() => {
      const leave: HTMLDivElement | null = document.querySelector('.circle-reveal-leave-active')
      if (!leave) return

      leave.innerHTML = ''
      setTransitionOrigin(innerWidth / 2, innerHeight / 2)
    }, 500)
  })
}
</script>
<style lang="scss">
// 圆形展开路由过渡动画
// 原理：旧页面在顶层（z-index:10），从鼠标点击处开一个圆洞（clip-path: 0），
//      圆洞向外扩大（clip-path: 150%），旧页面被"挖空"消失，
//      露出底层（z-index:9）完整的新页面。
//      这样所有内容（不论 z-index 多高）都被 clip-path 裁掉，不会越界。

// wrapper 始终固定全屏+白底，避免过渡类移除时闪烁
.transition-page {
}

// 旧页面 —— 留在底层，用动画撑住存在时间
.circle-reveal-leave-active {
  position: fixed;
  z-index: -1;
  animation: none 5s;
  inset: 0;
}

// 新页面 —— 在顶层圆形展开
.circle-reveal-enter-active {
  animation: circle-reveal 5s cubic-bezier(0.23, 3, 0.32, 1) both;
  background-color: white;
}

@keyframes none {
  from {
  }
  to {
  }
}

@keyframes circle-reveal {
  from {
    clip-path: circle(0 at var(--transition-origin-x, 50vw) var(--transition-origin-y, 50vh));
  }
  to {
    clip-path: circle(150% at var(--transition-origin-x, 50vw) var(--transition-origin-y, 50vh));
  }
}

//修改进度条样式
#nprogress .bar {
  background: var(--pregress-bar-color) !important;
}
</style>
