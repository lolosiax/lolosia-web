import {
  Matrix4,
  Object3D,
  PerspectiveCamera,
  SRGBColorSpace,
  Scene,
  Vector3,
  WebGLRenderer,
  WebGLRenderTarget
} from 'three'

const BIAS = new Matrix4().set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1)

export interface WaterReflectionOptions {
  planeY: number
  lookAt: Vector3
}

export interface WaterReflectionHandle {
  /** 渲染镜像画面，返回贴图与采样矩阵；hidden 会在渲染期间临时隐藏。 */
  render(
    renderer: WebGLRenderer,
    scene: Scene,
    camera: PerspectiveCamera,
    hidden: Object3D[]
  ): { texture: WebGLRenderTarget['texture']; matrix: Matrix4 }
  setSize(width: number, height: number): void
  dispose(): void
}

/**
 * 平面反射：把相机沿水平面镜像后重渲染一遍场景。
 * 对水平面来说比逐像素 SSR 更便宜、也更稳定。
 */
export function createWaterReflection(options: WaterReflectionOptions): WaterReflectionHandle {
  const target = new WebGLRenderTarget(1, 1)
  target.texture.colorSpace = SRGBColorSpace
  target.texture.generateMipmaps = false

  const mirrorCamera = new PerspectiveCamera()
  const mirrorLook = new Vector3()
  const matrix = new Matrix4()
  const result = { texture: target.texture, matrix }

  function render(
    renderer: WebGLRenderer,
    scene: Scene,
    camera: PerspectiveCamera,
    hidden: Object3D[]
  ): { texture: WebGLRenderTarget['texture']; matrix: Matrix4 } {
    camera.updateMatrixWorld()
    mirrorCamera.position.set(
      camera.position.x,
      2 * options.planeY - camera.position.y,
      camera.position.z
    )
    mirrorLook.set(options.lookAt.x, 2 * options.planeY - options.lookAt.y, options.lookAt.z)
    mirrorCamera.up.set(0, -1, 0)
    mirrorCamera.lookAt(mirrorLook)
    mirrorCamera.fov = camera.fov
    mirrorCamera.aspect = camera.aspect
    mirrorCamera.near = camera.near
    mirrorCamera.far = camera.far
    mirrorCamera.updateProjectionMatrix()
    mirrorCamera.updateMatrixWorld()

    matrix
      .copy(BIAS)
      .multiply(mirrorCamera.projectionMatrix)
      .multiply(mirrorCamera.matrixWorldInverse)

    hidden.forEach(object => {
      object.visible = false
    })
    renderer.setRenderTarget(target)
    renderer.render(scene, mirrorCamera)
    renderer.setRenderTarget(null)
    hidden.forEach(object => {
      object.visible = true
    })
    return result
  }

  function setSize(width: number, height: number): void {
    target.setSize(Math.max(1, Math.floor(width)), Math.max(1, Math.floor(height)))
  }

  function dispose(): void {
    target.dispose()
  }

  return { render, setSize, dispose }
}
