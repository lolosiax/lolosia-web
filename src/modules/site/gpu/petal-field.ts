import {
  Color,
  DoubleSide,
  DynamicDrawUsage,
  Euler,
  InstancedMesh,
  Matrix4,
  PlaneGeometry,
  Quaternion,
  ShaderMaterial,
  Vector3
} from 'three'

const PETAL_COUNT = 50
const TOP_Y = 3.0
const BOTTOM_Y = -1.9
const X_RANGE = 4.2
const NEAR_Z = 0.8
const FAR_Z = -4.6
const SWAY_X = 0.3
const SWAY_Z = 0.25

const VERTEX = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vColor;
  varying float vDepth;

  void main() {
    vUv = uv;
    vColor = instanceColor;
    vec4 mv = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
    vDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`

const FRAGMENT = /* glsl */ `
  uniform vec3 uFog;
  varying vec2 vUv;
  varying vec3 vColor;
  varying float vDepth;

  void main() {
    vec2 p = vUv - 0.5;
    float body = length(p * vec2(1.55, 1.02));
    float alpha = smoothstep(0.44, 0.32, body);

    float notch = smoothstep(0.11, 0.0, length((p - vec2(0.0, -0.44)) * vec2(1.7, 1.0)));
    alpha *= 1.0 - notch * 0.95;

    float vein = smoothstep(0.016, 0.0, abs(p.x)) * 0.16;
    float rim = smoothstep(0.26, 0.44, body) * 0.2;
    vec3 color = mix(vColor, vec3(1.0), vein + rim);
    color *= 1.0 - smoothstep(0.34, 0.46, body) * 0.22;

    float depthFade = smoothstep(12.0, 4.0, vDepth);
    alpha *= mix(0.3, 1.0, depthFade);
    color = mix(uFog, color, mix(0.45, 1.0, depthFade));

    if (alpha < 0.01) discard;
    gl_FragColor = vec4(color, alpha * 0.92);
  }
`

/** 每片花瓣的独立运动参数。 */
interface Petal {
  x: number
  y: number
  z: number
  speed: number
  phase: number
  size: number
  spinX: number
  spinY: number
  spinZ: number
}

/** 半透明粉 / 白花瓣。 */
const PALETTE = [
  [1.0, 0.74, 0.84],
  [1.0, 0.64, 0.78],
  [1.0, 0.9, 0.94],
  [0.98, 0.69, 0.81],
  [1.0, 0.81, 0.89]
] as const

function between(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function pickPalette(): Color {
  const [r, g, b] = PALETTE[Math.floor(Math.random() * PALETTE.length)] ?? [1, 0.9, 0.95]
  return new Color(r, g, b)
}

function createPetal(): Petal {
  return {
    x: between(-X_RANGE, X_RANGE),
    y: between(BOTTOM_Y, TOP_Y),
    z: between(FAR_Z, NEAR_Z),
    speed: between(0.12, 0.3),
    phase: Math.random() * Math.PI * 2,
    size: between(0.1, 0.3),
    spinX: between(-0.5, 0.5),
    spinY: between(-0.7, 0.7),
    spinZ: between(-0.6, 0.6)
  }
}

/** 实例化花瓣群：CPU 只更新 50 个矩阵，形状与柔边在着色器里完成。 */
export function createPetalField(fogColor: Color) {
  const geometry = new PlaneGeometry(1, 1)
  const material = new ShaderMaterial({
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    uniforms: { uFog: { value: fogColor } },
    transparent: true,
    depthWrite: false,
    side: DoubleSide
  })
  material.name = 'petal'

  const mesh = new InstancedMesh(geometry, material, PETAL_COUNT)
  mesh.name = 'petals'
  mesh.frustumCulled = false
  mesh.renderOrder = 2
  mesh.instanceMatrix.setUsage(DynamicDrawUsage)

  const petals: Petal[] = Array.from({ length: PETAL_COUNT }, createPetal)
  petals.forEach((_, index) => mesh.setColorAt(index, pickPalette()))
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true

  const matrix = new Matrix4()
  const position = new Vector3()
  const scale = new Vector3()
  const quaternion = new Quaternion()
  const euler = new Euler()

  function update(elapsed: number, delta: number): void {
    petals.forEach((petal, index) => {
      petal.y -= petal.speed * delta
      if (petal.y < BOTTOM_Y) {
        petal.y = TOP_Y
        petal.x = between(-X_RANGE, X_RANGE)
        petal.z = between(FAR_Z, NEAR_Z)
      }

      const x = petal.x + Math.sin(elapsed * 0.5 + petal.phase) * SWAY_X
      const z = petal.z + Math.cos(elapsed * 0.28 + petal.phase) * SWAY_Z
      position.set(x, petal.y, z)
      scale.setScalar(petal.size)
      euler.set(elapsed * petal.spinX + petal.phase, elapsed * petal.spinY + petal.phase, elapsed * petal.spinZ)
      quaternion.setFromEuler(euler)
      matrix.compose(position, quaternion, scale)
      mesh.setMatrixAt(index, matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
  }

  function dispose(): void {
    geometry.dispose()
    material.dispose()
    mesh.dispose()
  }

  return { mesh, update, dispose }
}
