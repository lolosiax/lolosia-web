import { createApp } from 'vue'
import 'uno.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import App from './App.vue'
import { settings } from '@/core/config/settings'

document.title = settings.title

const app = createApp(App)
app.mount('#app')
