import { ref } from 'vue'
import { ElMessage } from 'element-plus'

/** 桌面通知权限：只在浏览器支持且尚未授权时提供入口。 */
export function useAnimeNotify() {
  const supported = typeof Notification !== 'undefined'
  const granted = ref(supported && Notification.permission === 'granted')

  async function request(): Promise<void> {
    if (!supported) return
    const result = await Notification.requestPermission()
    granted.value = result === 'granted'
    if (result === 'granted') ElMessage.success('已开启桌面通知')
    else ElMessage.warning('未授权桌面通知')
  }

  return { supported, granted, request }
}
