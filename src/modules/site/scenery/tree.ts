import {
  BufferGeometry,
  Color,
  CylinderGeometry,
  Float32BufferAttribute,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshLambertMaterial,
  Points,
  Quaternion,
  ShaderMaterial,
  SphereGeometry,
  Vector3
} from 'three'

const UP = new Vector3(0, 1, 0)
const BARK = 0x8d8098
const LEAF = 0xe0ecc7
const LEAF_FAR = 0xefe6f7
const FOG_COLOR = new Color(0xe9e0f3)

interface Branch {
  start: Vector3
  end: Vector3
  radius: number
  depth: number
}

/** 固定种子的伪随机，保证每次刷新树形一致。 */
function seeded(seed: number): () => number {
  let value = seed
  return () => {
    value |= 0
    value = (value + 0x6d2b79f5) | 0
    let t = Math.imul(value ^ (value >>> 15), 1 | value)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** 递归分叉生长的树骨架，先三次主分叉，再二分叉。 */
function buildBranches(random: () => number): { branches: Branch[]; anchors: Vector3[] } {
  const branches: Branch[] = []
  const anchors: Vector3[] = []

  function grow(start: Vector3, dir: Vector3, length: number, radius: number, depth: number): void {
    const end = start.clone().addScaledVector(dir, length)
    branches.push({ start, end, radius, depth })

    // 末梢三级都挂叶团，让树冠有厚度，而不是只有最外层几个点。
    if (depth <= 2) {
      anchors.push(end.clone())
      if (depth <= 1) anchors.push(start.clone().lerp(end, 0.55))
    }
    if (depth === 0) return

    const count = depth >= 4 ? 3 : 2
    for (let i = 0; i < count; i += 1) {
      const axis = new Vector3(random() - 0.5, random() - 0.5, random() - 0.5).cross(dir)
      if (axis.lengthSq() < 0.0001) axis.set(1, 0, 0)
      axis.normalize()
      const spread = 0.45 + random() * 0.45 + (i / count) * 0.25
      const child = dir.clone().applyAxisAngle(axis, spread)
      child.y += 0.12
      child.normalize()
      grow(end, child, length * (0.68 + random() * 0.12), radius * 0.62, depth - 1)
    }
  }

  grow(new Vector3(0, 0, 0), UP.clone(), 1.25, 0.3, 6)

  // 树根：数量、角度、长度都不相等，且每段都强制向下，不会翘出水面。
  const rootCount = 6 + Math.floor(random() * 4)
  for (let i = 0; i < rootCount; i += 1) {
    const angle = (i / rootCount) * Math.PI * 2 + (random() - 0.5) * 0.9
    const length = (0.5 + random() * 0.7) * (i === 0 ? 1.4 : 1)
    const radius = 0.15 + random() * 0.11
    const start = new Vector3(0, 0.2, 0)
    const dir = new Vector3(Math.cos(angle), -0.35 - random() * 0.18, Math.sin(angle)).normalize()
    const end = start.clone().addScaledVector(dir, length)
    branches.push({ start, end, radius, depth: 1 })

    const childAngle = angle + (random() - 0.5) * 0.7
    const childDir = new Vector3(Math.cos(childAngle), -0.3 - random() * 0.15, Math.sin(childAngle)).normalize()
    const tip = end.clone().addScaledVector(childDir, length * (0.45 + random() * 0.3))
    branches.push({ start: end, end: tip, radius: radius * 0.55, depth: 0 })
  }

  return { branches, anchors }
}

function buildWood(branches: Branch[]): InstancedMesh {
  const geometry = new CylinderGeometry(0.62, 1, 1, 7, 1)
  const material = new MeshLambertMaterial({ color: BARK })
  const mesh = new InstancedMesh(geometry, material, branches.length)
  mesh.name = 'tree-wood'
  mesh.frustumCulled = false

  const matrix = new Matrix4()
  const quaternion = new Quaternion()
  const direction = new Vector3()
  const middle = new Vector3()
  const scale = new Vector3()

  branches.forEach((branch, index) => {
    direction.copy(branch.end).sub(branch.start)
    const length = direction.length()
    quaternion.setFromUnitVectors(UP, direction.normalize())
    middle.copy(branch.start).add(branch.end).multiplyScalar(0.5)
    scale.set(branch.radius, length, branch.radius)
    mesh.setMatrixAt(index, matrix.compose(middle, quaternion, scale))
  })
  mesh.instanceMatrix.needsUpdate = true
  return mesh
}

/** 在每个分叉点补一颗球，盖住圆柱端面的硬切口。 */
function buildJoints(branches: Branch[]): InstancedMesh {
  const geometry = new SphereGeometry(1, 6, 4)
  const material = new MeshLambertMaterial({ color: BARK })
  const mesh = new InstancedMesh(geometry, material, branches.length)
  mesh.name = 'tree-joints'
  mesh.frustumCulled = false

  const matrix = new Matrix4()
  const quaternion = new Quaternion()
  const scale = new Vector3()

  branches.forEach((branch, index) => {
    scale.setScalar(branch.radius * 0.66)
    mesh.setMatrixAt(index, matrix.compose(branch.end, quaternion, scale))
  })
  mesh.instanceMatrix.needsUpdate = true
  return mesh
}

/** 在末梢团簇成点云，颜色是淡绿混大量环境紫白。 */
function buildFoliage(anchors: Vector3[], random: () => number): Points {
  const positions: number[] = []
  const colors: number[] = []
  const sizes: number[] = []
  const base = new Color(LEAF)
  const tint = new Color(LEAF_FAR)
  const color = new Color()

  anchors.forEach(anchor => {
    const count = 52
    for (let i = 0; i < count; i += 1) {
      const theta = random() * Math.PI * 2
      const phi = Math.acos(random() * 2 - 1)
      const radius = Math.cbrt(random())
      const r = 0.55 * radius
      positions.push(
        anchor.x + Math.sin(phi) * Math.cos(theta) * r,
        anchor.y + Math.cos(phi) * r * 0.72,
        anchor.z + Math.sin(phi) * Math.sin(theta) * r
      )

      color
        .copy(base)
        .lerp(tint, 0.32 + random() * 0.26)
        .multiplyScalar(0.9 + random() * 0.14)
      colors.push(color.r, color.g, color.b)
      sizes.push(3.4 + random() * 3.2)
    }
  })

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('aColor', new Float32BufferAttribute(colors, 3))
  geometry.setAttribute('aSize', new Float32BufferAttribute(sizes, 1))

  const material = new ShaderMaterial({
    uniforms: {
      uFogColor: { value: FOG_COLOR },
      uFogNear: { value: 8 },
      uFogFar: { value: 32 }
    },
    vertexShader: /* glsl */ `
      attribute vec3 aColor;
      attribute float aSize;
      uniform float uFogNear;
      uniform float uFogFar;
      varying vec3 vColor;
      varying float vFog;

      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = aSize * (48.0 / max(-mv.z, 1.0));
        vColor = aColor;
        vFog = smoothstep(uFogNear, uFogFar, -mv.z);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uFogColor;
      varying vec3 vColor;
      varying float vFog;

      void main() {
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        float alpha = smoothstep(0.5, 0.14, d) * 0.62;
        vec3 color = mix(vColor, uFogColor, vFog * 0.95);
        alpha *= 1.0 - vFog * 0.55;
        gl_FragColor = vec4(color, alpha);
      }
    `,
    transparent: true,
    depthWrite: false
  })

  const points = new Points(geometry, material)
  points.name = 'tree-leaves'
  points.frustumCulled = false
  points.renderOrder = 1
  return points
}

/** 一棵远景的大树：粗壮树干 + 外扩树根 + 点云树冠。 */
export function createTree(): Group {
  const random = seeded(453)
  const { branches, anchors } = buildBranches(random)
  const group = new Group()
  group.name = 'tree'
  group.add(buildWood(branches), buildJoints(branches), buildFoliage(anchors, random))
  return group
}

/** 释放树的几何与材质。 */
export function disposeTree(group: Group): void {
  group.traverse(object => {
    if (object instanceof Mesh || object instanceof Points) {
      object.geometry.dispose()
      const material = object.material
      if (Array.isArray(material)) material.forEach(item => item.dispose())
      else material.dispose()
    }
  })
}
