import { onBeforeUnmount, onMounted } from 'vue'
import type { Ref } from 'vue'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  alpha: number
}

/** 入口页的柔和粒子背景：径向渐变 + 漂浮光点。 */
export function usePortalBackground(canvas: Ref<HTMLCanvasElement | null>) {
  let frame = 0
  let detachResize: (() => void) | null = null

  onMounted(() => {
    const element = canvas.value
    const ctx = element?.getContext('2d')
    if (!element || !ctx) return

    let width = 0
    let height = 0

    const resize = (): void => {
      width = element.width = window.innerWidth
      height = element.height = window.innerHeight
    }
    resize()

    const particles: Particle[] = Array.from({ length: 50 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.2,
      radius: Math.random() * 2.5 + 0.5,
      alpha: Math.random() * 0.15 + 0.03
    }))

    const draw = (): void => {
      const gradient = ctx.createRadialGradient(width * 0.3, height * 0.2, 0, width * 0.5, height * 0.4, width * 0.9)
      gradient.addColorStop(0, 'rgba(235, 220, 245, 1)')
      gradient.addColorStop(0.4, 'rgba(245, 235, 250, 1)')
      gradient.addColorStop(0.8, 'rgba(250, 245, 252, 1)')
      gradient.addColorStop(1, 'rgba(255, 250, 255, 1)')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, width, height)

      for (const particle of particles) {
        particle.x += particle.vx
        particle.y += particle.vy
        if (particle.x < 0) particle.x = width
        if (particle.x > width) particle.x = 0
        if (particle.y < 0) particle.y = height
        if (particle.y > height) particle.y = 0

        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(194, 150, 205, ${particle.alpha})`
        ctx.fill()
      }

      frame = requestAnimationFrame(draw)
    }

    draw()
    window.addEventListener('resize', resize)
    detachResize = () => window.removeEventListener('resize', resize)
  })

  onBeforeUnmount(() => {
    cancelAnimationFrame(frame)
    detachResize?.()
  })
}
