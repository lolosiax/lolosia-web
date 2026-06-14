<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'

export type DotShape = 'circle' | 'square' | 'diamond' | 'cross' | 'ring'
export type Easing = 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out'

interface Props {
  /** 基础点半径（逻辑像素） */
  dotSize?: number
  /** 相邻点间距（逻辑像素） */
  spacing?: number
  /** 渐变方向角度（度），0=向右，90=向下，270=向上 */
  direction?: number
  /** 渐变起始位置 (0-1)，沿 direction 方向 */
  transitionStart?: number
  /** 渐变结束位置 (0-1)，沿 direction 方向 */
  transitionEnd?: number
  /** 点的颜色 */
  dotColor?: string
  /** 点的形状预设 */
  dotShape?: DotShape
  /** 渐变缓动函数，同 CSS easing */
  easing?: Easing
}

const props = withDefaults(defineProps<Props>(), {
  dotSize: 2,
  spacing: 14,
  direction: 90,
  transitionStart: 0.35,
  transitionEnd: 1.0,
  dotColor: 'rgba(255, 255, 255, 0.65)',
  dotShape: 'circle',
  easing: 'linear'
})

const canvasRef = ref<HTMLCanvasElement | null>(null)
let resizeObserver: ResizeObserver | null = null

// ── 离屏 Canvas（复用，避免每帧分配）──
let offscreen: HTMLCanvasElement | null = null
let offscreenW = 0
let offscreenH = 0

// ── 颜色解析：分离 RGB 和 baseAlpha ──
let solidColor = '#ffffff'
let baseAlpha = 1

function parseColor(cssColor: string) {
  // 利用 Canvas 2D 自动解析任意 CSS 颜色
  const temp = document.createElement('canvas').getContext('2d')!
  temp.fillStyle = cssColor
  temp.fillRect(0, 0, 1, 1)
  const [r, g, b, a] = temp.getImageData(0, 0, 1, 1).data
  solidColor = `rgb(${r},${g},${b})`
  baseAlpha = a / 255
}

// ── 缓动函数，同 CSS easing ──
function applyEasing(t: number): number {
  switch (props.easing) {
    case 'linear':
      return t
    case 'ease-in':
      return 1 - Math.cos((t * Math.PI) / 2)
    case 'ease-out':
      return Math.sin((t * Math.PI) / 2)
    case 'ease-in-out':
      return -(Math.cos(Math.PI * t) - 1) / 2
    case 'ease':
      return -(Math.cos(Math.PI * t) - 1) / 2
    default:
      return t
  }
}

// ── 菱形交错排列参数 ──
// 水平间距 = spacing，垂直行距 = spacing * sqrt(3)/2，奇数行偏移 spacing/2
const ROW_HEIGHT_RATIO = Math.sqrt(3) / 2
const ROW_OFFSET_RATIO = 0.5

function draw() {
  const canvas = canvasRef.value
  if (!canvas) return
  const parent = canvas.parentElement
  if (!parent) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const dpr = window.devicePixelRatio || 1
  const w = parent.clientWidth
  const h = parent.clientHeight

  if (w <= 0 || h <= 0) return

  canvas.width = w * dpr
  canvas.height = h * dpr
  canvas.style.width = `${w}px`
  canvas.style.height = `${h}px`
  ctx.scale(dpr, dpr)

  parseColor(props.dotColor)

  // ── 方向向量 ──
  const rad = (props.direction * Math.PI) / 180
  const dx = Math.cos(rad)
  const dy = Math.sin(rad)

  // ── 计算四个角在方向上的投影范围 ──
  const corners: [number, number][] = [
    [0, 0],
    [w, 0],
    [0, h],
    [w, h]
  ]
  let minProj = Number.POSITIVE_INFINITY
  let maxProj = Number.NEGATIVE_INFINITY
  for (const [cx, cy] of corners) {
    const proj = cx * dx + cy * dy
    if (proj < minProj) minProj = proj
    if (proj > maxProj) maxProj = proj
  }
  const range = maxProj - minProj
  if (range <= 0) return

  // ── 离屏 Canvas：纯尺寸编码，无 alpha ──
  if (!offscreen || offscreenW !== w || offscreenH !== h) {
    offscreen = document.createElement('canvas')
    offscreen.width = w * dpr
    offscreen.height = h * dpr
    offscreenW = w
    offscreenH = h
  }
  const octx = offscreen.getContext('2d')!
  octx.setTransform(dpr, 0, 0, dpr, 0, 0)

  const sp = props.spacing
  const rowH = sp * ROW_HEIGHT_RATIO // 垂直行距
  const rowOff = sp * ROW_OFFSET_RATIO // 奇数行水平偏移

  // 扩展绘制区域，防止边缘缺失
  const margin = sp * 3

  for (let row = -margin / rowH; row < (h + margin) / rowH; row++) {
    const y = row * rowH
    const isOdd = (Math.round(row) & 1) === 1
    const xStart = -margin + (isOdd ? rowOff : 0)

    for (let x = xStart; x < w + margin; x += sp) {
      // 投影值 → [0, 1]
      const proj = x * dx + y * dy
      const t = (proj - minProj) / range

      // 渐变值：纯尺寸编码，不使用 globalAlpha
      let fade: number
      if (t <= props.transitionStart) {
        fade = 0
      } else if (t >= props.transitionEnd) {
        fade = 1
      } else {
        fade = (t - props.transitionStart) / (props.transitionEnd - props.transitionStart)
      }
      fade = applyEasing(fade)

      if (fade <= 0) continue

      // 点的半径从 0 到 dotSize 随 fade 线性增长
      // 交叠时因为颜色纯色无 alpha，不会产生亮度溢出
      const r = props.dotSize * (0.1 + 0.9 * fade)

      octx.fillStyle = solidColor
      octx.strokeStyle = solidColor

      switch (props.dotShape) {
        case 'circle':
          octx.beginPath()
          octx.arc(x, y, r, 0, Math.PI * 2)
          octx.fill()
          break

        case 'square':
          octx.fillRect(x - r, y - r, r * 2, r * 2)
          break

        case 'diamond': {
          octx.beginPath()
          octx.moveTo(x, y - r)
          octx.lineTo(x + r, y)
          octx.lineTo(x, y + r)
          octx.lineTo(x - r, y)
          octx.closePath()
          octx.fill()
          break
        }

        case 'cross': {
          const half = r * 0.4
          const arm = r * 1.2
          octx.fillRect(x - half, y - arm, half * 2, arm * 2)
          octx.fillRect(x - arm, y - half, arm * 2, half * 2)
          break
        }

        case 'ring': {
          octx.beginPath()
          octx.arc(x, y, r, 0, Math.PI * 2)
          octx.lineWidth = r * 0.35
          octx.stroke()
          break
        }
      }
    }
  }

  // ── 以 baseAlpha 整体复合到主 Canvas ──
  ctx.clearRect(0, 0, w, h)
  ctx.globalAlpha = baseAlpha
  ctx.drawImage(offscreen, 0, 0)
  ctx.globalAlpha = 1
}

// ── 生命周期 ──
onMounted(() => {
  const parent = canvasRef.value?.parentElement
  if (parent) {
    resizeObserver = new ResizeObserver(() => draw())
    resizeObserver.observe(parent)
  }
  draw()
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  offscreen = null
})

// ── 响应式重绘 ──
watch(
  () => [
    props.dotSize,
    props.spacing,
    props.direction,
    props.transitionStart,
    props.transitionEnd,
    props.dotColor,
    props.dotShape,
    props.easing
  ],
  () => draw()
)
</script>

<template>
  <div class="halftone-container">
    <canvas ref="canvasRef" class="halftone-canvas" />
  </div>
</template>

<style scoped>
.halftone-container {
  overflow: hidden;
  pointer-events: none;
}

.halftone-canvas {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
