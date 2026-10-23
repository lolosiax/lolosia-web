import type { SceneCard, SceneHandle, SceneOptions } from './scene'

const CARD_COUNT = 4

const VERTEX = /* glsl */ `#version 300 es
void main() {
  vec2 points[3] = vec2[3](vec2(-1.0, -1.0), vec2(3.0, -1.0), vec2(-1.0, 3.0));
  gl_Position = vec4(points[gl_VertexID], 0.0, 1.0);
}
`

const FRAGMENT = /* glsl */ `#version 300 es
precision highp float;

uniform vec2 uResolution;
uniform vec2 uPointer;
uniform float uTime;
uniform vec4 uCards[4];
uniform vec4 uColors[4];

out vec4 outColor;

float hash21(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

vec3 background(vec2 uv) {
  vec3 c1 = vec3(0.929, 0.871, 0.965);
  vec3 c2 = vec3(0.984, 0.961, 0.992);
  float d = clamp(distance(uv, vec2(0.32, 0.22)) * 1.15, 0.0, 1.0);
  return mix(c1, c2, d);
}

vec3 particles(vec2 px, float time) {
  float cellSize = 90.0;
  vec2 cell = floor(px / cellSize);
  float h = hash21(cell);
  if (h < 0.72) {
    return vec3(0.0);
  }
  vec2 base = cell * cellSize;
  vec2 offset = vec2(hash21(cell + 1.7), hash21(cell + 3.1)) * cellSize;
  vec2 drift = vec2(sin(time * 0.3 + h * 6.28), cos(time * 0.24 + h * 4.0)) * 10.0;
  vec2 center = base + offset + drift;
  float radius = 1.5 + h * 2.0;
  float alpha = (1.0 - smoothstep(radius, radius + 6.0, distance(px, center))) * 0.35;
  return vec3(0.76, 0.59, 0.8) * alpha;
}

vec3 cardColor(vec2 px, int index) {
  vec4 rect = uCards[index];
  vec2 local = (px - rect.xy) / rect.zw;
  if (local.x < 0.0 || local.x > 1.0 || local.y < 0.0 || local.y > 1.0) {
    return vec3(-1.0);
  }

  vec3 theme = uColors[index].rgb;
  vec3 color = mix(theme * 0.62, theme * 0.3, local.y);
  color += vec3(0.05) * (1.0 - abs(local.x - local.y));

  float spacing = 14.0;
  float rowHeight = spacing * 0.866;
  float row = floor(px.y / rowHeight);
  float offset = fract(row * 0.5) * 2.0 * spacing * 0.5;
  float fx = (fract((px.x - offset) / spacing) - 0.5) * spacing;
  float fy = (fract(px.y / rowHeight) - 0.5) * rowHeight;
  float dist = length(vec2(fx, fy));

  float t = clamp((local.x + local.y) * 0.5, 0.0, 1.0);
  float fade = smoothstep(0.35, 0.92, t);
  float radius = 4.2 * (0.15 + 0.85 * fade);
  float dotMask = 1.0 - smoothstep(radius - 1.5, radius + 1.5, dist);
  color = mix(color, theme * 1.15, dotMask * fade * 0.9);
  return color;
}

void main() {
  vec2 px = gl_FragCoord.xy;
  vec2 uv = px / uResolution;
  vec3 color = background(uv);
  color += particles(px, uTime);

  for (int i = 0; i < 4; i++) {
    vec3 card = cardColor(px, i);
    if (card.r >= 0.0) {
      color = card;
    }
  }

  float glow = exp(-distance(px, uPointer) / 220.0) * 0.08;
  color += vec3(0.8, 0.65, 0.9) * glow;
  outColor = vec4(color, 1.0);
}
`

function compile(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type)
  if (!shader) throw new Error('无法创建着色器')
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader) ?? '着色器编译失败')
  }
  return shader
}

/** WebGL2 回退：与 WebGPU 版同一套片元计算。 */
export function createWebGlScene(canvas: HTMLCanvasElement, options: SceneOptions): SceneHandle {
  const raw = canvas.getContext('webgl2', { alpha: false, antialias: false, depth: false })
  if (!raw) throw new Error('WebGL2 不可用')
  // 显式标注类型，避免嵌套函数内丢失窄化
  const gl: WebGL2RenderingContext = raw

  const program = gl.createProgram()
  if (!program) throw new Error('无法创建着色器程序')
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX))
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT))
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) ?? '着色器链接失败')
  }
  gl.useProgram(program)

  const uniforms = {
    resolution: gl.getUniformLocation(program, 'uResolution'),
    pointer: gl.getUniformLocation(program, 'uPointer'),
    time: gl.getUniformLocation(program, 'uTime'),
    cards: gl.getUniformLocation(program, 'uCards'),
    colors: gl.getUniformLocation(program, 'uColors')
  }

  let dpr = 1
  let cards: SceneCard[] = options.cards
  let frame = 0
  let disposed = false

  const colors = options.colors.slice(0, CARD_COUNT)
  const cardData = new Float32Array(CARD_COUNT * 4)
  const colorData = new Float32Array(CARD_COUNT * 4)
  for (let i = 0; i < CARD_COUNT; i++) {
    const color = colors[i] ?? [0.76, 0.59, 0.8]
    colorData.set([color[0], color[1], color[2], 1], i * 4)
  }

  function readCards(): void {
    for (let i = 0; i < CARD_COUNT; i++) {
      const card = cards[i]
      cardData.set([(card?.x ?? 0) * dpr, (card?.y ?? 0) * dpr, (card?.w ?? 0) * dpr, (card?.h ?? 0) * dpr], i * 4)
    }
    gl.uniform4fv(uniforms.cards, cardData)
    gl.uniform4fv(uniforms.colors, colorData)
  }

  readCards()

  function render(now: number): void {
    if (disposed) return
    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.uniform1f(uniforms.time, now / 1000)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
    frame = requestAnimationFrame(render)
  }

  frame = requestAnimationFrame(render)

  return {
    backend: 'webgl2',
    setCards(next: SceneCard[]) {
      cards = next
      readCards()
    },
    setPointer(x: number, y: number) {
      gl.uniform2f(uniforms.pointer, x * dpr, y * dpr)
    },
    resize(width: number, height: number, nextDpr: number) {
      dpr = nextDpr
      canvas.width = Math.max(1, Math.round(width * dpr))
      canvas.height = Math.max(1, Math.round(height * dpr))
      gl.uniform2f(uniforms.resolution, canvas.width, canvas.height)
      readCards()
    },
    dispose() {
      disposed = true
      cancelAnimationFrame(frame)
      gl.deleteProgram(program)
    }
  }
}
