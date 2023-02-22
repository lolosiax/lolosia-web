import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import 'uno.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
// 模板组件由 resolver 按需带样式；这几个是脚本式调用的，得手动引入
import 'element-plus/es/components/message/style/css'
import 'element-plus/es/components/message-box/style/css'
import 'element-plus/es/components/notification/style/css'
import 'element-plus/es/components/loading/style/css'
import '@/core/theme/base-theme.scss'
import '@/core/styles/index.scss'
import App from './App.vue'
import router, { menuRoutes } from './router'
import { settings } from '@/core/config/settings'
import { setUnauthorizedHandler } from '@/core/lib/http'
import { setMenuRoutes } from '@/core/router/menu'

document.title = settings.title

const app = createApp(App)

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

app.use(pinia)
app.use(router)

// 组合根：把应用级数据/回调接到 core 提供的机制上
setMenuRoutes(menuRoutes)
setUnauthorizedHandler(() => {
  const redirect = router.currentRoute.value.fullPath
  void router.replace({ path: '/login', query: { redirect } })
})

app.mount('#app')
