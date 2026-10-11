import { onBeforeUnmount, onMounted } from 'vue'
import type { Ref } from 'vue'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  r: number
}

/** 背景粒子：低密度圆点 + 近邻连线，`prefers-reduced-motion` 时只画静态底。 */
export function useDashboardBackdrop(canvasRef: Ref<HTMLCanvasElement | null>) {
  let frame = 0
  let observer: ResizeObserver | null = null
  let particles: Particle[] = []

  onMounted(() => {
    const canvas = canvasRef.value
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const dpr = window.devicePixelRatio || 1
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const resize = (): void => {
      const width = canvas.clientWidth
      const height = canvas.clientHeight
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      particles = Array.from({ length: 48 }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.28,
        r: 0.6 + Math.random() * 2.2
      }))
    }

    const draw = (): void => {
      const width = canvas.clientWidth
      const height = canvas.clientHeight
      ctx.clearRect(0, 0, width, height)
      const gradient = ctx.createRadialGradient(width * 0.28, height * 0.18, 0, width * 0.5, height * 0.4, width * 0.95)
      gradient.addColorStop(0, 'rgba(235, 220, 245, 0.55)')
      gradient.addColorStop(0.45, 'rgba(246, 236, 251, 0.35)')
      gradient.addColorStop(1, 'rgba(255, 250, 255, 0)')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, width, height)

      for (const particle of particles) {
        if (!reduced) {
          particle.x += particle.vx
          particle.y += particle.vy
          if (particle.x < 0 || particle.x > width) particle.vx *= -1
          if (particle.y < 0 || particle.y > height) particle.vy *= -1
        }
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(194, 150, 205, 0.45)'
        ctx.fill()
      }

      for (let i = 0; i < particles.length; i += 1) {
        for (let j = i + 1; j < particles.length; j += 1) {
          const a = particles[i]!
          const b = particles[j]!
          const distance = Math.hypot(a.x - b.x, a.y - b.y)
          if (distance >= 100) continue
          ctx.beginPath()
          ctx.moveTo(a.x, a.y)
          ctx.lineTo(b.x, b.y)
          ctx.strokeStyle = `rgba(194, 150, 205, ${0.08 * (1 - distance / 100)})`
          ctx.lineWidth = 1
          ctx.stroke()
        }
      }

      if (!reduced) frame = requestAnimationFrame(draw)
    }

    resize()
    draw()
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(resize)
      observer.observe(canvas)
    }
  })

  onBeforeUnmount(() => {
    if (frame) cancelAnimationFrame(frame)
    observer?.disconnect()
  })
}
