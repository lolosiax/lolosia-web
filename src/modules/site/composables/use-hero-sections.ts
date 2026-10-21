import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { Ref } from 'vue'
import gsap from 'gsap'
import { useIsMobile } from '@/core/composables/use-is-mobile'
import { HERO_SECTIONS } from '../lib'

const WHEEL_LOCK_MS = 650

/**
 * 全屏分页：桌面端滚轮 / 方向键 / 圆点横向切换，手机端改为原生纵向滚动。
 * 桌面端挂载期间锁住 body 滚动，卸载或切到移动端时还原。
 */
export function useHeroSections(track: Ref<HTMLElement | null>) {
  const active = ref(0)
  const total = HERO_SECTIONS.length
  const isMobile = useIsMobile()
  let previousOverflow = ''
  let lastWheel = 0

  function offsetOf(index: number): number {
    return -index * window.innerWidth
  }

  function go(index: number): void {
    const next = Math.min(total - 1, Math.max(0, index))
    active.value = next
    if (!track.value) return

    if (isMobile.value) {
      const panel = track.value.children[next] as HTMLElement | undefined
      panel?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    gsap.to(track.value, { x: offsetOf(next), duration: 0.75, ease: 'power3.inOut' })
  }

  function next(): void {
    go(active.value + 1)
  }

  function previous(): void {
    go(active.value - 1)
  }

  function onWheel(event: WheelEvent): void {
    if (isMobile.value) return
    const now = Date.now()
    if (now - lastWheel < WHEEL_LOCK_MS || Math.abs(event.deltaY) < 12) return
    lastWheel = now
    if (event.deltaY > 0) next()
    else previous()
  }

  function onKeydown(event: KeyboardEvent): void {
    if (isMobile.value) return
    if (event.key === 'ArrowDown' || event.key === 'PageDown') next()
    if (event.key === 'ArrowUp' || event.key === 'PageUp') previous()
  }

  function onResize(): void {
    if (!track.value) return
    gsap.set(track.value, { x: isMobile.value ? 0 : offsetOf(active.value) })
  }

  function syncScrollLock(mobile: boolean): void {
    document.body.style.overflow = mobile ? previousOverflow : 'hidden'
  }

  onMounted(() => {
    previousOverflow = document.body.style.overflow
    syncScrollLock(isMobile.value)
    window.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('keydown', onKeydown)
    window.addEventListener('resize', onResize)
    onResize()
  })

  watch(isMobile, mobile => {
    syncScrollLock(mobile)
    if (mobile) active.value = 0
    onResize()
  })

  onBeforeUnmount(() => {
    document.body.style.overflow = previousOverflow
    window.removeEventListener('wheel', onWheel)
    window.removeEventListener('keydown', onKeydown)
    window.removeEventListener('resize', onResize)
  })

  return { active, total, isMobile, go, next, previous }
}
