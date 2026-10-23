import type { SceneCard, SceneHandle, SceneOptions } from './scene'

/** 最后的兜底：静态 Canvas2D，画一次不再重绘，CPU/GPU 开销接近 0。 */
export function createCanvas2dScene(canvas: HTMLCanvasElement, options: SceneOptions): SceneHandle {
  const raw = canvas.getContext('2d')
  if (!raw) throw new Error('Canvas2D 不可用')
  // 显式标注类型，避免嵌套函数内丢失窄化
  const context: CanvasRenderingContext2D = raw

  let dpr = 1
  let width = 0
  let height = 0
  let cards: SceneCard[] = options.cards

  function paintBackground(): void {
    const gradient = context.createRadialGradient(
      width * 0.32,
      height * 0.22,
      0,
      width * 0.5,
      height * 0.4,
      Math.max(width, height) * 0.9
    )
    gradient.addColorStop(0, '#f0e3f6')
    gradient.addColorStop(0.5, '#f8f1fc')
    gradient.addColorStop(1, '#fbf7fe')
    context.fillStyle = gradient
    context.fillRect(0, 0, width, height)
  }

  function paintCard(card: SceneCard, color: [number, number, number]): void {
    const theme = `rgb(${Math.round(color[0] * 255)} ${Math.round(color[1] * 255)} ${Math.round(color[2] * 255)})`
    const gradient = context.createLinearGradient(card.x, card.y, card.x + card.w, card.y + card.h)
    gradient.addColorStop(0, theme)
    gradient.addColorStop(1, 'rgba(250, 245, 252, 0.35)')
    context.fillStyle = gradient
    context.fillRect(card.x, card.y, card.w, card.h)

    context.save()
    context.beginPath()
    context.rect(card.x, card.y, card.w, card.h)
    context.clip()
    context.fillStyle = 'rgba(255, 255, 255, 0.55)'

    const spacing = 14
    const rowHeight = spacing * 0.866
    for (let y = card.y; y < card.y + card.h; y += rowHeight) {
      const t = (y - card.y) / card.h
      if (t < 0.35) continue
      const radius = 4.2 * (0.15 + 0.85 * Math.min(1, (t - 0.35) / 0.57))
      const offset = (Math.round((y - card.y) / rowHeight) % 2) * spacing * 0.5
      for (let x = card.x - offset; x < card.x + card.w; x += spacing) {
        context.beginPath()
        context.arc(x, y, radius, 0, Math.PI * 2)
        context.fill()
      }
    }
    context.restore()
  }

  function paint(): void {
    context.setTransform(dpr, 0, 0, dpr, 0, 0)
    context.clearRect(0, 0, width, height)
    paintBackground()
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i]
      if (!card) continue
      paintCard(card, options.colors[i] ?? [0.76, 0.59, 0.8])
    }
  }

  return {
    backend: 'canvas2d',
    setCards(next: SceneCard[]) {
      cards = next
      paint()
    },
    setPointer() {
      // 静态兜底不响应指针
    },
    resize(nextWidth: number, nextHeight: number, nextDpr: number) {
      width = nextWidth
      height = nextHeight
      dpr = nextDpr
      canvas.width = Math.max(1, Math.round(width * dpr))
      canvas.height = Math.max(1, Math.round(height * dpr))
      paint()
    },
    dispose() {
      // 静态画面无需清理
    }
  }
}
