<script setup lang="ts">
// 动态背景组件 - 3D倾斜Grid照片墙效果
import { ref, onMounted, onUnmounted } from 'vue'

const canvasRef = $ref() as HTMLCanvasElement
let animationId: number

// 简单的Canvas动画模拟3D Grid效果
function initCanvas() {
  const canvas = canvasRef
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // 设置Canvas尺寸
  function resizeCanvas() {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
  }

  resizeCanvas()
  window.addEventListener('resize', resizeCanvas)

  // Grid配置
  const gridSize = 40
  const cols = Math.ceil(canvas.width / gridSize)
  const rows = Math.ceil(canvas.height / gridSize)

  // 动画变量
  let time = 0

  // 渲染函数
  const render = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // 渐变背景
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
    gradient.addColorStop(0, 'rgba(210, 177, 219, 0.05)')
    gradient.addColorStop(1, 'rgba(223, 205, 230, 0.1)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // 绘制Grid
    ctx.strokeStyle = 'rgba(210, 177, 219, 0.3)'
    ctx.lineWidth = 1

    // 垂直网格线
    for (let i = 0; i <= cols; i++) {
      const x = i * gridSize
      const offset = Math.sin(time * 0.001 + i * 0.1) * 5

      ctx.beginPath()
      ctx.moveTo(x + offset, 0)
      ctx.lineTo(x + offset, canvas.height)
      ctx.stroke()
    }

    // 水平网格线
    for (let i = 0; i <= rows; i++) {
      const y = i * gridSize
      const offset = Math.cos(time * 0.001 + i * 0.1) * 5

      ctx.beginPath()
      ctx.moveTo(0, y + offset)
      ctx.lineTo(canvas.width, y + offset)
      ctx.stroke()
    }

    // 绘制网格点
    ctx.fillStyle = 'rgba(210, 177, 219, 0.4)'
    for (let i = 0; i <= cols; i++) {
      for (let j = 0; j <= rows; j++) {
        const x = i * gridSize + Math.sin(time * 0.001 + i * 0.1) * 5
        const y = j * gridSize + Math.cos(time * 0.001 + j * 0.1) * 5
        const size = Math.abs(Math.sin(time * 0.002 + i * 0.1 + j * 0.1)) * 3 + 1

        ctx.beginPath()
        ctx.arc(x, y, size, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    time++
    animationId = requestAnimationFrame(render)
  }

  render()

  return () => {
    window.removeEventListener('resize', resizeCanvas)
    cancelAnimationFrame(animationId)
  }
}

onMounted(() => {
  const cleanup = initCanvas()

  onUnmounted(() => {
    if (cleanup) cleanup()
  })
})
</script>

<template>
  <div class="dynamic-background">
    <canvas ref="canvasRef"></canvas>
  </div>
</template>

<style scoped lang="scss">
.dynamic-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  overflow: hidden;

  canvas {
    display: block;
    width: 100%;
    height: 100%;
  }
}
</style>
