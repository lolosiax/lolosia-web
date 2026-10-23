import { onMounted, onUnmounted, ref } from 'vue'
import type { Ref } from 'vue'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  alpha: number
}

/** 入口页背景：柔和渐变 + 漂浮粒子 + 鼠标附近的连线。 */
export function useLandingBackdrop(canvas: Ref<HTMLCanvasElement | null>): void {
  const mouseX = ref(0)
  const mouseY = ref(0)
  let animationId = 0

  function handleMouseMove(event: MouseEvent): void {
    mouseX.value = event.clientX
    mouseY.value = event.clientY
  }

  function init(): (() => void) | null {
    const target = canvas.value
    if (!target) return null
    // 显式标注类型，避免嵌套函数内丢失窄化
    const el: HTMLCanvasElement = target
    const rawContext = target.getContext('2d')
    if (!rawContext) return null
    const context: CanvasRenderingContext2D = rawContext

    let w = 0
    let h = 0
    function resize() {
      w = el.width = window.innerWidth
      h = el.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const particles: Particle[] = []
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.2,
        r: Math.random() * 2.5 + 0.5,
        alpha: Math.random() * 0.15 + 0.03
      })
    }

    function paintParticles() {
      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0) p.x = w
        if (p.x > w) p.x = 0
        if (p.y < 0) p.y = h
        if (p.y > h) p.y = 0

        context.beginPath()
        context.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        context.fillStyle = `rgba(194, 150, 205, ${p.alpha})`
        context.fill()
      }
    }

    function paintLinks() {
      const mx = mouseX.value
      const my = mouseY.value
      if (mx <= 0 || my <= 0) return

      for (let i = 0; i < particles.length; i++) {
        const from = particles[i]
        if (!from) continue

        for (let j = i + 1; j < particles.length; j++) {
          const to = particles[j]
          if (!to) continue

          const dx = from.x - to.x
          const dy = from.y - to.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist >= 100) continue

          const alpha = (1 - dist / 100) * 0.06
          context.beginPath()
          context.moveTo(from.x, from.y)
          context.lineTo(to.x, to.y)
          context.strokeStyle = `rgba(194, 150, 205, ${alpha})`
          context.lineWidth = 0.5
          context.stroke()
        }
      }
    }

    function paintBackground() {
      const grad = context.createRadialGradient(w * 0.3, h * 0.2, 0, w * 0.5, h * 0.4, w * 0.9)
      grad.addColorStop(0, 'rgba(235, 220, 245, 1)')
      grad.addColorStop(0.4, 'rgba(245, 235, 250, 1)')
      grad.addColorStop(0.8, 'rgba(250, 245, 252, 1)')
      grad.addColorStop(1, 'rgba(255, 250, 255, 1)')
      context.fillStyle = grad
      context.fillRect(0, 0, w, h)
    }

    function draw() {
      context.clearRect(0, 0, w, h)
      paintBackground()
      paintParticles()
      paintLinks()
      animationId = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', resize)
    }
  }

  let cleanup: (() => void) | null = null

  onMounted(() => {
    cleanup = init()
    window.addEventListener('mousemove', handleMouseMove)
  })

  onUnmounted(() => {
    cleanup?.()
    window.removeEventListener('mousemove', handleMouseMove)
  })
}
