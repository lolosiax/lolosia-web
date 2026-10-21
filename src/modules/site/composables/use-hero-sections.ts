import { onBeforeUnmount, onMounted, ref } from 'vue'
import type { Ref } from 'vue'
import gsap from 'gsap'
import { HERO_SECTIONS } from '../lib'

const WHEEL_LOCK_MS = 650

/**
 * 全屏分页：滚轮 / 方向键 / 圆点切换，横向滑动交给 GSAP。
 * 页面挂载期间锁住 body 滚动，卸载时还原。
 */
export function useHeroSections(track: Ref<HTMLElement | null>) {
  const active = ref(0)
  const total = HERO_SECTIONS.length
  let previousOverflow = ''
  let lastWheel = 0

  function offsetOf(index: number): number {
    return -index * window.innerWidth
  }

  function go(index: number): void {
    const next = Math.min(total - 1, Math.max(0, index))
    active.value = next
    if (track.value) gsap.to(track.value, { x: offsetOf(next), duration: 0.75, ease: 'power3.inOut' })
  }

  function next(): void {
    go(active.value + 1)
  }

  function previous(): void {
    go(active.value - 1)
  }

  function onWheel(event: WheelEvent): void {
    const now = Date.now()
    if (now - lastWheel < WHEEL_LOCK_MS || Math.abs(event.deltaY) < 12) return
    lastWheel = now
    if (event.deltaY > 0) next()
    else previous()
  }

  function onKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown' || event.key === 'PageDown') next()
    if (event.key === 'ArrowUp' || event.key === 'PageUp') previous()
  }

  function onResize(): void {
    if (track.value) gsap.set(track.value, { x: offsetOf(active.value) })
  }

  onMounted(() => {
    previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('keydown', onKeydown)
    window.addEventListener('resize', onResize)
    onResize()
  })

  onBeforeUnmount(() => {
    document.body.style.overflow = previousOverflow
    window.removeEventListener('wheel', onWheel)
    window.removeEventListener('keydown', onKeydown)
    window.removeEventListener('resize', onResize)
  })

  return { active, total, go, next, previous }
}
