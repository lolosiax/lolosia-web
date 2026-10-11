import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { greetingOf } from '@/core/lib/format'

const pad = (value: number): string => String(value).padStart(2, '0')
const WEEK = ['日', '一', '二', '三', '四', '五', '六']

/** 顶栏时钟与问候语；每秒走一格，卸载时清掉定时器。 */
export function useDashboardClock() {
  const now = ref(new Date())
  let timer: ReturnType<typeof setInterval> | undefined

  const clockTime = computed(
    () => `${pad(now.value.getHours())}:${pad(now.value.getMinutes())}:${pad(now.value.getSeconds())}`
  )

  const clockDate = computed(() => {
    const date = now.value
    return `${date.getFullYear()} 年 ${date.getMonth() + 1} 月 ${date.getDate()} 日 · 星期${WEEK[date.getDay()]}`
  })

  const greeting = computed(() => `${greetingOf(now.value)}好`)

  onMounted(() => {
    timer = setInterval(() => (now.value = new Date()), 1000)
  })

  onBeforeUnmount(() => {
    if (timer) clearInterval(timer)
  })

  return { now, clockTime, clockDate, greeting }
}
