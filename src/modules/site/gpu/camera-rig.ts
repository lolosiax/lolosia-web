import { Euler, PerspectiveCamera, Vector2, Vector3 } from 'three'

export type CameraMode = 'default' | 'fly'
export type FlyMode = 'mc' | 'maya'

/** 上次离开飞行相机时的位置与朝向；`fly` 用于恢复上次使用的飞行手感。 */
export interface CameraPose {
  x: number
  y: number
  z: number
  yaw: number
  pitch: number
  targetX: number
  targetY: number
  targetZ: number
  distance: number
  fly: FlyMode
}

export interface CameraRig {
  readonly mode: CameraMode
  readonly flyMode: FlyMode
  /** MC 已锁定指针，或 Maya 已进入操作态（面板淡出）。 */
  readonly active: boolean
  setMode(mode: CameraMode): void
  setFlyMode(mode: FlyMode): void
  setPointer(x: number, y: number): void
  update(delta: number): void
  dispose(): void
}

interface CameraRigOptions {
  camera: PerspectiveCamera
  defaultPosition: Vector3
  defaultLookAt: Vector3
  tilt: number
  pose: CameraPose | null
  lockTarget: HTMLElement
  onPose: (pose: CameraPose) => void
  onActivityChange?: (active: boolean) => void
  onModeChange?: (mode: CameraMode) => void
}

/** 只在画布空白处接管指针，面板、卡片、链接仍保持可点。 */
const UI_SELECTOR = 'button, a, input, textarea, select, [data-scene-ui]'
const MC_SPEED = 2.6
const MC_LOOK_SENSITIVITY = 0.0024
const MAYA_ORBIT_SENSITIVITY = 0.006
const MAYA_PAN_SENSITIVITY = 0.0018
const MAYA_ZOOM_SENSITIVITY = 0.0012
const MAYA_DEFAULT_DISTANCE = 4.5
const SAVE_INTERVAL = 1
const PITCH_LIMIT = Math.PI / 2 - 0.05

type DragState = 'look' | 'orbit' | 'pan' | 'dolly' | null

function isUiTarget(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest(UI_SELECTOR))
}

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)
}

function clampPitch(value: number): number {
  return Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, value))
}

function clampDistance(value: number): number {
  return Math.max(0.6, Math.min(40, value))
}

/**
 * 三种相机手感：
 * - default：视差看向水面，保持原来的轻微倾斜；
 * - fly/mc：Minecraft 创造模式，WASD 水平移动、Space/Shift 升降、拖动转向；
 * - fly/maya：Alt + 左/中/右键分别环绕、平移、推拉，滚轮缩放。
 */
class CameraRigImpl implements CameraRig {
  private readonly camera: PerspectiveCamera
  private readonly defaultPosition: Vector3
  private readonly defaultLookAt: Vector3
  private readonly tilt: number
  private readonly lockTarget: HTMLElement
  private readonly onPose: (pose: CameraPose) => void
  private readonly onActivityChange: (active: boolean) => void
  private readonly onModeChange: (mode: CameraMode) => void
  private readonly pointer = new Vector2()
  private readonly defaultTarget = new Vector3()
  private readonly focus = new Vector3()
  private readonly forward = new Vector3()
  private readonly right = new Vector3()
  private readonly up = new Vector3()
  private readonly offset = new Vector3()
  private readonly euler = new Euler(0, 0, 0, 'YXZ')
  private readonly keys = new Set<string>()

  private currentMode: CameraMode = 'default'
  private currentFlyMode: FlyMode
  private savedPose: CameraPose | null
  private yaw = 0
  private pitch = 0
  private distance = MAYA_DEFAULT_DISTANCE
  private dragging: DragState = null
  private lastX = 0
  private lastY = 0
  private saveTimer = 0
  private activeState = false
  private altReleased = false
  private cursorX = 0
  private cursorY = 0

  constructor(options: CameraRigOptions) {
    this.camera = options.camera
    this.defaultPosition = options.defaultPosition
    this.defaultLookAt = options.defaultLookAt
    this.tilt = options.tilt
    this.lockTarget = options.lockTarget
    this.onPose = options.onPose
    this.onActivityChange = options.onActivityChange ?? (() => {})
    this.onModeChange = options.onModeChange ?? (() => {})
    this.currentFlyMode = options.pose?.fly ?? 'mc'
    this.savedPose = options.pose

    window.addEventListener('mousedown', this.onMouseDown)
    window.addEventListener('mousemove', this.onMouseMove)
    window.addEventListener('mouseup', this.onMouseUp)
    window.addEventListener('wheel', this.onWheel, { passive: false })
    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
    window.addEventListener('contextmenu', this.onContextMenu)
    window.addEventListener('blur', this.onBlur)
    document.addEventListener('pointerlockchange', this.onPointerLockChange)
  }

  get mode(): CameraMode {
    return this.currentMode
  }

  get flyMode(): FlyMode {
    return this.currentFlyMode
  }

  get active(): boolean {
    return this.activeState
  }

  setMode(next: CameraMode): void {
    if (next === this.currentMode) return
    if (this.currentMode === 'fly') {
      this.savePose()
      this.releaseLock()
      this.setActive(false)
    }
    this.currentMode = next
    this.keys.clear()
    this.dragging = null
    if (next === 'fly') this.restorePose()
    this.onModeChange(next)
  }

  setFlyMode(next: FlyMode): void {
    if (next === this.currentFlyMode) return
    if (this.currentMode === 'fly') {
      this.releaseLock()
      this.setActive(false)
    }
    this.currentFlyMode = next
    if (this.currentMode === 'fly') {
      this.aimFromCamera()
      this.savePose()
    }
  }

  setPointer(x: number, y: number): void {
    this.pointer.set(x, y)
  }

  update(delta: number): void {
    if (this.currentMode === 'default') {
      this.updateDefault()
    } else if (this.currentFlyMode === 'mc') {
      this.updateMc(delta)
    } else {
      this.updateMaya(delta)
    }
  }

  dispose(): void {
    if (this.currentMode === 'fly') this.savePose()
    this.releaseLock()
    window.removeEventListener('mousedown', this.onMouseDown)
    window.removeEventListener('mousemove', this.onMouseMove)
    window.removeEventListener('mouseup', this.onMouseUp)
    window.removeEventListener('wheel', this.onWheel)
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
    window.removeEventListener('contextmenu', this.onContextMenu)
    window.removeEventListener('blur', this.onBlur)
    document.removeEventListener('pointerlockchange', this.onPointerLockChange)
  }

  private setActive(value: boolean): void {
    if (this.activeState === value) return
    this.activeState = value
    this.onActivityChange(value)
  }

  private releaseLock(): void {
    this.altReleased = false
    if (document.pointerLockElement === this.lockTarget) document.exitPointerLock()
  }

  private requestLock(): void {
    if (this.currentMode !== 'fly' || this.currentFlyMode !== 'mc') return
    if (document.pointerLockElement === this.lockTarget) return
    const result = this.lockTarget.requestPointerLock() as unknown as Promise<void> | void
    // 锁定被拒时保留操作态，退回拖拽转向；按 Esc 仍可退出。
    if (result) void result.catch(() => undefined)
  }

  /** 松开 Alt 时，指针停在面板/按钮上就保持释放，避免和界面抢鼠标。 */
  private requestLockIfScene(): void {
    const hovered = document.elementFromPoint(this.cursorX, this.cursorY)
    if (hovered && isUiTarget(hovered)) return
    this.requestLock()
  }

  private aimFromCamera(): void {
    this.euler.setFromQuaternion(this.camera.quaternion, 'YXZ')
    this.yaw = this.euler.y
    if (this.currentFlyMode === 'maya') {
      // Maya 的 pitch 是「相机相对焦点的高度角」，与相机自身俯仰符号相反；
      // 取反后重建的偏移才与当前朝向一致，切换模式时相机不会跳位。
      this.pitch = clampPitch(-this.euler.x)
      this.distance = MAYA_DEFAULT_DISTANCE
      this.camera.getWorldDirection(this.forward)
      this.focus.copy(this.camera.position).addScaledVector(this.forward, this.distance)
      this.applyMaya()
    } else {
      this.pitch = clampPitch(this.euler.x)
      this.applyMc()
    }
  }

  private applyMc(): void {
    this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ')
  }

  private applyMaya(): void {
    const cosPitch = Math.cos(this.pitch)
    this.offset
      .set(cosPitch * Math.sin(this.yaw), Math.sin(this.pitch), cosPitch * Math.cos(this.yaw))
      .multiplyScalar(this.distance)
    this.camera.position.copy(this.focus).add(this.offset)
    this.camera.lookAt(this.focus)
  }

  private restorePose(): void {
    const pose = this.savedPose
    if (!pose) {
      this.aimFromCamera()
      return
    }

    this.camera.position.set(pose.x, pose.y, pose.z)
    if (pose.fly === this.currentFlyMode) {
      this.yaw = pose.yaw
      this.pitch = clampPitch(pose.pitch)
      this.distance = clampDistance(pose.distance)
      this.focus.set(pose.targetX, pose.targetY, pose.targetZ)
      if (this.currentFlyMode === 'maya') this.applyMaya()
      else this.applyMc()
      return
    }

    // 上次存的是另一种飞行手感：只沿用位置，朝向按当前画面重新推导。
    this.aimFromCamera()
  }

  private savePose(): void {
    const pose: CameraPose = {
      x: this.camera.position.x,
      y: this.camera.position.y,
      z: this.camera.position.z,
      yaw: this.yaw,
      pitch: this.pitch,
      targetX: this.focus.x,
      targetY: this.focus.y,
      targetZ: this.focus.z,
      distance: this.distance,
      fly: this.currentFlyMode
    }
    this.savedPose = pose
    this.onPose(pose)
  }

  private updateDefault(): void {
    this.defaultTarget.set(
      this.defaultPosition.x + this.pointer.x * 0.22,
      this.defaultPosition.y + this.pointer.y * 0.16,
      this.defaultPosition.z
    )
    this.camera.position.lerp(this.defaultTarget, 0.05)
    this.camera.lookAt(this.defaultLookAt)
    this.camera.rotation.z += this.tilt
  }

  private updateMc(delta: number): void {
    const forwardInput = (this.keys.has('KeyW') ? 1 : 0) - (this.keys.has('KeyS') ? 1 : 0)
    const strafeInput = (this.keys.has('KeyD') ? 1 : 0) - (this.keys.has('KeyA') ? 1 : 0)
    const liftInput =
      (this.keys.has('Space') ? 1 : 0) - (this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') ? 1 : 0)

    if (forwardInput || strafeInput || liftInput) {
      const sin = Math.sin(this.yaw)
      const cos = Math.cos(this.yaw)
      const step = MC_SPEED * delta
      this.camera.position.x += (-sin * forwardInput + cos * strafeInput) * step
      this.camera.position.z += (-cos * forwardInput - sin * strafeInput) * step
      this.camera.position.y += liftInput * step
    }

    this.applyMc()
    this.tickSave(delta)
  }

  private updateMaya(delta: number): void {
    this.applyMaya()
    this.tickSave(delta)
  }

  private tickSave(delta: number): void {
    this.saveTimer += delta
    if (this.saveTimer < SAVE_INTERVAL) return
    this.saveTimer = 0
    this.savePose()
  }

  private panBy(dx: number, dy: number): void {
    this.camera.updateMatrix()
    this.right.setFromMatrixColumn(this.camera.matrix, 0)
    this.up.setFromMatrixColumn(this.camera.matrix, 1)
    const scale = this.distance * MAYA_PAN_SENSITIVITY
    this.focus.addScaledVector(this.right, -dx * scale).addScaledVector(this.up, dy * scale)
  }

  private readonly onMouseDown = (event: MouseEvent): void => {
    if (this.currentMode !== 'fly' || isUiTarget(event.target)) return

    if (event.button !== 0) {
      if (this.currentFlyMode !== 'maya' || !this.activeState || !event.altKey) return
      event.preventDefault()
      this.dragging = event.button === 1 ? 'pan' : 'dolly'
      this.lastX = event.clientX
      this.lastY = event.clientY
      return
    }

    event.preventDefault()
    if (this.currentFlyMode === 'mc') {
      this.dragging = 'look'
      this.lastX = event.clientX
      this.lastY = event.clientY
      // 先进入操作态让面板淡出，锁定失败时仍可拖动转向，Esc 也能退回。
      this.setActive(true)
      this.requestLock()
      return
    }

    // Maya：第一次点击进入操作态（面板淡出），之后 Alt + 拖拽才动相机。
    if (!this.activeState) {
      this.setActive(true)
      return
    }
    if (!event.altKey) return
    this.dragging = 'orbit'
    this.lastX = event.clientX
    this.lastY = event.clientY
  }

  private readonly onMouseMove = (event: MouseEvent): void => {
    this.cursorX = event.clientX
    this.cursorY = event.clientY

    if (this.currentMode === 'fly' && this.currentFlyMode === 'mc' && document.pointerLockElement === this.lockTarget) {
      this.yaw -= event.movementX * MC_LOOK_SENSITIVITY
      this.pitch = clampPitch(this.pitch - event.movementY * MC_LOOK_SENSITIVITY)
      return
    }

    if (!this.dragging || this.currentMode !== 'fly') return
    event.preventDefault()
    const dx = event.clientX - this.lastX
    const dy = event.clientY - this.lastY
    this.lastX = event.clientX
    this.lastY = event.clientY

    if (this.dragging === 'look') {
      this.yaw -= dx * MC_LOOK_SENSITIVITY
      this.pitch = clampPitch(this.pitch - dy * MC_LOOK_SENSITIVITY)
    } else if (this.dragging === 'orbit') {
      this.yaw -= dx * MAYA_ORBIT_SENSITIVITY
      this.pitch = clampPitch(this.pitch + dy * MAYA_ORBIT_SENSITIVITY)
    } else if (this.dragging === 'pan') {
      this.panBy(dx, dy)
    } else {
      this.distance = clampDistance(this.distance * Math.exp(dy * 0.01))
    }
  }

  private readonly onMouseUp = (): void => {
    this.dragging = null
  }

  private readonly onWheel = (event: WheelEvent): void => {
    if (this.currentMode !== 'fly' || this.currentFlyMode !== 'maya' || isUiTarget(event.target)) return
    this.distance = clampDistance(this.distance * Math.exp(event.deltaY * MAYA_ZOOM_SENSITIVITY))
    event.preventDefault()
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (this.currentMode !== 'fly' || isEditable(event.target)) return

    // MC：按住 Alt 临时交出鼠标，同时把两侧面板放回来，方便点界面；
    // 松开时若指针回到场景空白处，再重新锁定。
    if (this.currentFlyMode === 'mc' && this.activeState && /^Alt(Left|Right)$/.test(event.code)) {
      event.preventDefault()
      this.altReleased = true
      this.dragging = null
      if (document.pointerLockElement === this.lockTarget) document.exitPointerLock()
      this.setActive(false)
      return
    }

    // MC：未锁定时 Esc 也要能退出操作态。
    if (this.currentFlyMode === 'mc' && this.activeState && event.code === 'Escape') {
      this.releaseLock()
      this.setActive(false)
      return
    }

    // Maya：Esc 直接退出 Maya，回到默认相机。
    if (this.currentFlyMode === 'maya' && this.activeState && event.code === 'Escape') {
      event.preventDefault()
      this.setMode('default')
      return
    }

    if (event.code === 'Space') event.preventDefault()
    this.keys.add(event.code)
  }

  private readonly onKeyUp = (event: KeyboardEvent): void => {
    if (this.altReleased && /^Alt(Left|Right)$/.test(event.code)) {
      this.altReleased = false
      this.requestLockIfScene()
      return
    }
    this.keys.delete(event.code)
  }

  private readonly onContextMenu = (event: MouseEvent): void => {
    if (this.currentMode === 'fly') event.preventDefault()
  }

  /** 窗口失焦时清掉按键与拖拽，避免回到页面后相机持续移动。 */
  private readonly onBlur = (): void => {
    this.keys.clear()
    this.dragging = null
    this.altReleased = false

    if (this.currentMode !== 'fly') return
    if (this.currentFlyMode === 'maya' && this.activeState) {
      this.setMode('default')
      return
    }
    if (this.currentFlyMode === 'mc' && this.activeState && document.pointerLockElement !== this.lockTarget) {
      this.altReleased = false
      this.setActive(false)
    }
  }

  private readonly onPointerLockChange = (): void => {
    if (document.pointerLockElement === this.lockTarget) {
      this.setActive(true)
      return
    }
    if (this.altReleased) return
    this.setActive(false)
  }
}

export function createCameraRig(options: CameraRigOptions): CameraRig {
  return new CameraRigImpl(options)
}
