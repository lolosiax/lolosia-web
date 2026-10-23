import {
  Box3,
  Color,
  DataTexture,
  Group,
  Mesh,
  MeshStandardMaterial,
  MeshToonMaterial,
  NearestFilter,
  Object3D,
  Quaternion,
  RedFormat,
  Scene,
  Vector3
} from 'three'
import type { Material } from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

const TARGET_HEIGHT = 1.15
const WALK_SPEED = 0.36
const IDLE_MIN = 1.2
const IDLE_MAX = 3.6
const BOUNDS = { xMin: -2, xMax: 1.2, zNear: -0.6, zFar: -2 }
const ARM_DROP = 1.05

export type CharacterState = 'idle' | 'walk'

export interface CharacterHandle {
  readonly state: CharacterState
  readonly position: Vector3
  readonly feet: Vector3[]
  update(delta: number, elapsed: number, waterY: number): void
  dispose(): void
}

interface AnimatedBone {
  node: Object3D
  rest: Quaternion
  bendAxis: Vector3
  dropAxis: Vector3 | null
  dropAngle: number
}

type Rig = Record<'leftLeg' | 'rightLeg' | 'leftKnee' | 'rightKnee' | 'leftArm' | 'rightArm' | 'leftElbow' | 'rightElbow' | 'spine', AnimatedBone | null>

function between(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function findBone(root: Group, name: string): Object3D | null {
  const wanted = name.replace(/[\s_.-]/g, '').toLowerCase()
  let found: Object3D | null = null
  root.traverse(object => {
    if (!found && object.name.replace(/[\s_.-]/g, '').toLowerCase() === wanted) found = object
  })
  return found
}

function buildBone(root: Group, name: string, dropAngle = 0): AnimatedBone | null {
  const node = findBone(root, name)
  if (!node) return null

  const rest = node.quaternion.clone()
  const world = node.getWorldQuaternion(new Quaternion())
  const dropAxis = dropAngle
    ? new Vector3(0, 0, 1).applyQuaternion(world.clone().invert()).normalize()
    : null
  const posed = dropAxis ? world.clone().multiply(new Quaternion().setFromAxisAngle(dropAxis, dropAngle)) : world
  const bendAxis = new Vector3(1, 0, 0).applyQuaternion(posed.clone().invert()).normalize()

  return { node, rest, bendAxis, dropAxis, dropAngle }
}

function buildRig(root: Group): Rig {
  root.updateMatrixWorld(true)
  return {
    leftLeg: buildBone(root, 'Left leg'),
    rightLeg: buildBone(root, 'Right leg'),
    leftKnee: buildBone(root, 'Left knee'),
    rightKnee: buildBone(root, 'Right knee'),
    leftArm: buildBone(root, 'Left arm', -ARM_DROP),
    rightArm: buildBone(root, 'Right arm', ARM_DROP),
    leftElbow: buildBone(root, 'Left elbow'),
    rightElbow: buildBone(root, 'Right elbow'),
    spine: buildBone(root, 'Spine')
  }
}

const tempQuat = new Quaternion()

/** 五阶色调阶梯，让漫射光呈现赛璐璐式的硬边分层。 */
let rampTexture: DataTexture | null = null

function getRamp(): DataTexture {
  if (rampTexture) return rampTexture
  const steps = new Uint8Array([70, 120, 175, 225, 255])
  const texture = new DataTexture(steps, steps.length, 1, RedFormat)
  texture.minFilter = NearestFilter
  texture.magFilter = NearestFilter
  texture.generateMipmaps = false
  texture.needsUpdate = true
  rampTexture = texture
  return texture
}

const RIM_ANCHOR =
  'vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;'

/** 把 GLTF 的 PBR 材质换成 Toon 材质，并叠一层边缘光。 */
function toToonMaterial(source: Material, ramp: DataTexture): MeshToonMaterial {
  const pbr = source as MeshStandardMaterial
  const material = new MeshToonMaterial({
    color: pbr.color ? pbr.color.clone() : new Color(0xffffff),
    map: pbr.map ?? null,
    normalMap: pbr.normalMap ?? null,
    normalScale: pbr.normalScale?.clone(),
    alphaMap: pbr.alphaMap ?? null,
    alphaTest: pbr.alphaTest,
    transparent: pbr.transparent,
    opacity: pbr.opacity,
    side: pbr.side,
    depthWrite: pbr.depthWrite,
    vertexColors: pbr.vertexColors,
    gradientMap: ramp
  })
  material.name = source.name
  material.onBeforeCompile = shader => {
    shader.fragmentShader = shader.fragmentShader.replace(
      RIM_ANCHOR,
      `${RIM_ANCHOR}
       float rim = pow(1.0 - clamp(dot(normalize(normal), normalize(vViewPosition)), 0.0, 1.0), 2.6);
       outgoingLight += vec3(1.0, 0.85, 0.94) * rim * 0.22;`
    )
  }
  material.customProgramCacheKey = () => 'toon-rim'
  return material
}

function applyToonShader(model: Object3D): void {
  const ramp = getRamp()
  const previous = new Set<Material>()
  model.traverse(object => {
    if (!(object instanceof Mesh)) return
    const source = object.material
    if (Array.isArray(source)) {
      source.forEach(material => previous.add(material))
      object.material = source.map(material => toToonMaterial(material, ramp))
    } else {
      previous.add(source)
      object.material = toToonMaterial(source, ramp)
    }
  })
  previous.forEach(material => material.dispose())
}

function pose(bone: AnimatedBone | null, angle: number): void {
  if (!bone) return
  bone.node.quaternion.copy(bone.rest)
  if (bone.dropAxis) bone.node.quaternion.multiply(tempQuat.setFromAxisAngle(bone.dropAxis, bone.dropAngle))
  bone.node.quaternion.multiply(tempQuat.setFromAxisAngle(bone.bendAxis, angle))
}

/** 载入 GLB 角色，并用一个极简状态机让她在水面上散步。 */
export async function createCharacter(scene: Scene, url: string): Promise<CharacterHandle> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`角色模型加载失败：${response.status}`)
  const gltf = await new GLTFLoader().parseAsync(await response.arrayBuffer(), '')

  const model = gltf.scene
  const box = new Box3().setFromObject(model)
  model.scale.setScalar(TARGET_HEIGHT / Math.max(box.max.y - box.min.y, 0.001))
  applyToonShader(model)

  const root = new Group()
  root.name = 'moe'
  root.add(model)
  scene.add(root)

  const rig = buildRig(root)
  const leftFoot = findBone(root, 'Left ankle')
  const rightFoot = findBone(root, 'Right ankle')
  const leftFootPos = new Vector3()
  const rightFootPos = new Vector3()
  const feet = [leftFootPos, rightFootPos]

  const position = new Vector3(between(-1.2, 0.4), 0, between(BOUNDS.zFar + 0.4, BOUNDS.zNear - 0.3))
  const target = new Vector3().copy(position)
  const forward = new Vector3()
  const tempDir = new Vector3()
  let state: CharacterState = 'idle'
  let idleFor = between(0.6, 1.8)
  let yaw = 0
  let phase = 0
  let gait = 0

  function pickTarget(): void {
    target.set(between(BOUNDS.xMin, BOUNDS.xMax), 0, between(BOUNDS.zFar, BOUNDS.zNear))
    state = 'walk'
  }

  function move(delta: number): void {
    forward.set(target.x - position.x, 0, target.z - position.z)
    const distance = forward.length()
    if (distance < 0.04) {
      state = 'idle'
      idleFor = between(IDLE_MIN, IDLE_MAX)
      return
    }
    forward.normalize()
    const wanted = Math.atan2(forward.x, forward.z)
    let turn = wanted - yaw
    while (turn > Math.PI) turn -= Math.PI * 2
    while (turn < -Math.PI) turn += Math.PI * 2
    yaw += turn * Math.min(1, delta * 7)
    position.addScaledVector(forward, Math.min(WALK_SPEED * delta, distance))
  }

  function animate(delta: number, elapsed: number): void {
    gait += ((state === 'walk' ? 1 : 0) - gait) * Math.min(1, delta * 6)
    phase += delta * Math.PI * 2 * 1.65

    const swing = Math.sin(phase) * 0.55 * gait
    pose(rig.leftLeg, swing)
    pose(rig.rightLeg, -swing)
    pose(rig.leftKnee, Math.max(0, Math.sin(phase - 1.1)) * 0.85 * gait)
    pose(rig.rightKnee, Math.max(0, Math.sin(phase - 1.1 + Math.PI)) * 0.85 * gait)
    pose(rig.leftArm, -swing * 0.6)
    pose(rig.rightArm, swing * 0.6)
    pose(rig.leftElbow, 0.18 + Math.max(0, swing) * 0.25)
    pose(rig.rightElbow, 0.18 + Math.max(0, -swing) * 0.25)
    pose(rig.spine, Math.sin(elapsed * 1.5) * 0.015 + Math.sin(phase * 2) * 0.025 * gait)
  }

  function update(delta: number, elapsed: number, waterY: number): void {
    if (state === 'idle') {
      idleFor -= delta
      if (idleFor <= 0) pickTarget()
    } else {
      move(delta)
    }

    animate(delta, elapsed)

    const bob = state === 'walk' ? Math.abs(Math.sin(phase)) * 0.02 : Math.sin(elapsed * 1.4) * 0.007
    tempDir.set(0, 1, 0)
    root.position.set(position.x, waterY + bob, position.z)
    root.quaternion.setFromAxisAngle(tempDir, yaw)
    root.rotateZ(state === 'walk' ? Math.sin(phase) * 0.02 : 0)
    root.updateMatrixWorld(true)

    leftFoot?.getWorldPosition(leftFootPos)
    rightFoot?.getWorldPosition(rightFootPos)
  }

  function dispose(): void {
    scene.remove(root)
    model.traverse(object => {
      const mesh = object as { geometry?: { dispose(): void }; material?: { dispose(): void } | Array<{ dispose(): void }> }
      mesh.geometry?.dispose()
      if (Array.isArray(mesh.material)) mesh.material.forEach(material => material.dispose())
      else mesh.material?.dispose()
    })
  }

  return {
    get state() {
      return state
    },
    position,
    feet,
    update,
    dispose
  }
}
