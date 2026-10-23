import type { SceneCard, SceneHandle, SceneOptions } from './scene'

const CARD_COUNT = 4

const SHADER = /* wgsl */ `
struct Uniforms {
  resolution: vec2f,
  pointer: vec2f,
  time: f32,
  pad0: f32,
  pad1: f32,
  pad2: f32,
  cards: array<vec4f, 4>,
  colors: array<vec4f, 4>,
};

@group(0) @binding(0) var<uniform> u: Uniforms;

@vertex
fn vsMain(@builtin(vertex_index) index: u32) -> @builtin(position) vec4f {
  var positions = array<vec2f, 3>(vec2f(-1.0, -1.0), vec2f(3.0, -1.0), vec2f(-1.0, 3.0));
  return vec4f(positions[index], 0.0, 1.0);
}

fn hash21(p: vec2f) -> f32 {
  return fract(sin(dot(p, vec2f(127.1, 311.7))) * 43758.5453123);
}

fn background(uv: vec2f) -> vec3f {
  let c1 = vec3f(0.929, 0.871, 0.965);
  let c2 = vec3f(0.984, 0.961, 0.992);
  let d = clamp(distance(uv, vec2f(0.32, 0.22)) * 1.15, 0.0, 1.0);
  return mix(c1, c2, d);
}

fn particles(px: vec2f, time: f32) -> vec3f {
  let cellSize = 90.0;
  let cell = floor(px / cellSize);
  let h = hash21(cell);
  if (h < 0.72) {
    return vec3f(0.0);
  }
  let base = cell * cellSize;
  let offset = vec2f(hash21(cell + 1.7), hash21(cell + 3.1)) * cellSize;
  let drift = vec2f(sin(time * 0.3 + h * 6.28), cos(time * 0.24 + h * 4.0)) * 10.0;
  let center = base + offset + drift;
  let radius = 1.5 + h * 2.0;
  let alpha = (1.0 - smoothstep(radius, radius + 6.0, distance(px, center))) * 0.35;
  return vec3f(0.76, 0.59, 0.8) * alpha;
}

fn cardColor(px: vec2f, index: i32) -> vec3f {
  let rect = u.cards[index];
  let local = (px - rect.xy) / rect.zw;
  if (local.x < 0.0 || local.x > 1.0 || local.y < 0.0 || local.y > 1.0) {
    return vec3f(-1.0);
  }

  let theme = u.colors[index].rgb;
  var color = mix(theme * 0.62, theme * 0.3, local.y);
  color += vec3f(0.05) * (1.0 - abs(local.x - local.y));

  // 半调点：14px 间距，奇数行半格偏移，沿对角线渐显
  let spacing = 14.0;
  let rowHeight = spacing * 0.866;
  let row = floor(px.y / rowHeight);
  let offset = fract(row * 0.5) * 2.0 * spacing * 0.5;
  let fx = (fract((px.x - offset) / spacing) - 0.5) * spacing;
  let fy = (fract(px.y / rowHeight) - 0.5) * rowHeight;
  let dist = length(vec2f(fx, fy));

  let t = clamp((local.x + local.y) * 0.5, 0.0, 1.0);
  let fade = smoothstep(0.35, 0.92, t);
  let radius = 4.2 * (0.15 + 0.85 * fade);
  let dot = 1.0 - smoothstep(radius - 1.5, radius + 1.5, dist);
  color = mix(color, theme * 1.15, dot * fade * 0.9);
  return color;
}

@fragment
fn fsMain(@builtin(position) pos: vec4f) -> @location(0) vec4f {
  let px = pos.xy;
  let uv = px / u.resolution;
  var color = background(uv);
  color += particles(px, u.time);

  for (var i = 0; i < ${CARD_COUNT}; i = i + 1) {
    let card = cardColor(px, i);
    if (card.r >= 0.0) {
      color = card;
    }
  }

  let glow = exp(-distance(px, u.pointer) / 220.0) * 0.08;
  color += vec3f(0.8, 0.65, 0.9) * glow;
  return vec4f(color, 1.0);
}
`

/** WebGPU 渲染：整页一次全屏绘制，所有图形由片元着色器解析计算。 */
export async function createWebGpuScene(canvas: HTMLCanvasElement, options: SceneOptions): Promise<SceneHandle> {
  const gpu = navigator.gpu
  if (!gpu) throw new Error('WebGPU 不可用')

  const adapter = await gpu.requestAdapter()
  if (!adapter) throw new Error('没有可用的 GPU 适配器')

  const device = await adapter.requestDevice()
  const format = gpu.getPreferredCanvasFormat()

  const module = device.createShaderModule({ code: SHADER })
  device.pushErrorScope('validation')
  const pipeline = device.createRenderPipeline({
    layout: 'auto',
    vertex: { module, entryPoint: 'vsMain' },
    fragment: { module, entryPoint: 'fsMain', targets: [{ format }] },
    primitive: { topology: 'triangle-list' }
  })
  const validationError = await device.popErrorScope()
  if (validationError) throw new Error(validationError.message)

  // 着色器验证通过后再占用 canvas，失败时还能回退到 WebGL2
  const rawContext = canvas.getContext('webgpu')
  if (!rawContext) throw new Error('无法创建 WebGPU 上下文')
  // 显式标注类型，避免嵌套函数内丢失窄化
  const context: GPUCanvasContext = rawContext
  context.configure({ device, format, alphaMode: 'opaque' })

  const uniformData = new Float32Array(40)
  const uniformBuffer = device.createBuffer({
    size: uniformData.byteLength,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  })
  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [{ binding: 0, resource: { buffer: uniformBuffer } }]
  })

  let width = 0
  let height = 0
  let dpr = 1
  let cards: SceneCard[] = options.cards
  let pointerX = -1
  let pointerY = -1
  let frame = 0
  let disposed = false

  const colors = options.colors.slice(0, CARD_COUNT)

  function readColors(): void {
    for (let i = 0; i < CARD_COUNT; i++) {
      const color = colors[i] ?? [0.76, 0.59, 0.8]
      const base = 24 + i * 4
      uniformData[base] = color[0]
      uniformData[base + 1] = color[1]
      uniformData[base + 2] = color[2]
      uniformData[base + 3] = 1
    }
  }

  function readCards(): void {
    for (let i = 0; i < CARD_COUNT; i++) {
      const card = cards[i]
      const base = 8 + i * 4
      uniformData[base] = (card?.x ?? 0) * dpr
      uniformData[base + 1] = (card?.y ?? 0) * dpr
      uniformData[base + 2] = (card?.w ?? 0) * dpr
      uniformData[base + 3] = (card?.h ?? 0) * dpr
    }
  }

  readColors()
  readCards()

  function writeUniforms(time: number): void {
    uniformData[0] = width
    uniformData[1] = height
    uniformData[2] = pointerX
    uniformData[3] = pointerY
    uniformData[4] = time
    device.queue.writeBuffer(uniformBuffer, 0, uniformData)
  }

  function render(now: number): void {
    if (disposed) return
    writeUniforms(now / 1000)

    const encoder = device.createCommandEncoder()
    const pass = encoder.beginRenderPass({
      colorAttachments: [
        {
          view: context.getCurrentTexture().createView(),
          clearValue: { r: 0.98, g: 0.96, b: 0.99, a: 1 },
          loadOp: 'clear',
          storeOp: 'store'
        }
      ]
    })
    pass.setPipeline(pipeline)
    pass.setBindGroup(0, bindGroup)
    pass.draw(3)
    pass.end()
    device.queue.submit([encoder.finish()])

    frame = requestAnimationFrame(render)
  }

  frame = requestAnimationFrame(render)

  return {
    backend: 'webgpu',
    setCards(next: SceneCard[]) {
      cards = next
      readCards()
    },
    setPointer(x: number, y: number) {
      pointerX = x * dpr
      pointerY = y * dpr
    },
    resize(nextWidth: number, nextHeight: number, nextDpr: number) {
      dpr = nextDpr
      canvas.width = Math.max(1, Math.round(nextWidth * dpr))
      canvas.height = Math.max(1, Math.round(nextHeight * dpr))
      // 着色器里的坐标都是设备像素
      width = canvas.width
      height = canvas.height
      readCards()
    },
    dispose() {
      disposed = true
      cancelAnimationFrame(frame)
      uniformBuffer.destroy()
      device.destroy()
    }
  }
}
