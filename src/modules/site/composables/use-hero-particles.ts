import { onBeforeUnmount, onMounted } from 'vue'
import type { Ref } from 'vue'
import * as THREE from 'three'

const PARTICLE_COUNT = 360

/** 主视觉背景：缓慢旋转的粒子星尘；WebGL 不可用时静默跳过。 */
export function useHeroParticles(canvas: Ref<HTMLCanvasElement | null>) {
  let frame = 0
  let cleanup: (() => void) | null = null

  onMounted(() => {
    const element = canvas.value
    if (!element) return

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ canvas: element, alpha: true, antialias: true })
    } catch {
      return
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100)
    camera.position.z = 12

    const positions = new Float32Array(PARTICLE_COUNT * 3)
    for (let index = 0; index < PARTICLE_COUNT; index += 1) {
      positions[index * 3] = (Math.random() - 0.5) * 24
      positions[index * 3 + 1] = (Math.random() - 0.5) * 16
      positions[index * 3 + 2] = (Math.random() - 0.5) * 14
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const material = new THREE.PointsMaterial({
      color: 0xd2b1db,
      size: 0.07,
      transparent: true,
      opacity: 0.8,
      depthWrite: false
    })
    const points = new THREE.Points(geometry, material)
    scene.add(points)

    const resize = (): void => {
      const width = element.clientWidth
      const height = element.clientHeight
      if (!width || !height) return
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
    }

    const animate = (): void => {
      points.rotation.y += 0.0007
      points.rotation.x += 0.0002
      renderer.render(scene, camera)
      frame = requestAnimationFrame(animate)
    }

    resize()
    window.addEventListener('resize', resize)
    animate()
    cleanup = () => {
      window.removeEventListener('resize', resize)
      renderer.dispose()
      geometry.dispose()
      material.dispose()
    }
  })

  onBeforeUnmount(() => {
    cancelAnimationFrame(frame)
    cleanup?.()
  })
}
