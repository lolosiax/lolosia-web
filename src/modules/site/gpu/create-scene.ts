import { createCanvas2dScene } from './canvas2d-scene'
import { createWebGlScene } from './webgl-scene'
import { createWebGpuScene } from './webgpu-scene'
import type { SceneCard, SceneColor, SceneResult } from './scene'

/** 适配器探测超时：个别环境 `requestAdapter()` 可能长时间不返回。 */
const ADAPTER_TIMEOUT = 1000

async function hasWebGpuAdapter(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.gpu) return false
  try {
    const adapter = await Promise.race([
      navigator.gpu.requestAdapter(),
      new Promise<null>(resolve => window.setTimeout(() => resolve(null), ADAPTER_TIMEOUT))
    ])
    return adapter !== null
  } catch {
    return false
  }
}

/**
 * 优先使用最新的 WebGPU；不支持时依次回退到 WebGL2、Canvas2D。
 * 同一个 canvas 只能绑定一种上下文，所以先探测适配器、再把着色器建好，
 * 只有这两步都成功才会真正占用 canvas。
 */
export async function createScene(
  canvas: HTMLCanvasElement,
  cards: SceneCard[],
  colors: SceneColor[]
): Promise<SceneResult> {
  if (await hasWebGpuAdapter()) {
    try {
      const handle = await createWebGpuScene(canvas, { cards, colors })
      return { handle, backend: 'webgpu' }
    } catch {
      // 继续尝试 WebGL2
    }
  }

  try {
    const handle = createWebGlScene(canvas, { cards, colors })
    return { handle, backend: 'webgl2' }
  } catch {
    const handle = createCanvas2dScene(canvas, { cards, colors })
    return { handle, backend: 'canvas2d' }
  }
}
