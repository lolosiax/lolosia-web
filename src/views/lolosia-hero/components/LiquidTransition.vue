<script setup lang="ts">
// 流体过渡效果组件 - 使用Three.js实现
import { ref, onMounted, onUnmounted, watch } from 'vue';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

// Props
const props = defineProps<{
  progress: number;
}>();

// Refs
const containerRef = ref<HTMLDivElement | null>(null);

// Three.js variables
let scene: THREE.Scene;
let camera: THREE.OrthographicCamera;
let renderer: THREE.WebGLRenderer;
let composer: EffectComposer;
let liquidPass: ShaderPass;
let animationId: number;

// 流体过渡着色器
const liquidShader = {
  uniforms: {
    tDiffuse: { value: null },
    progress: { value: 0.0 },
    resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float progress;
    uniform vec2 resolution;
    varying vec2 vUv;
    
    // 噪声函数
    float noise(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }
    
    // 使用GLSL内置的smoothstep函数，无需重新声明
    
    void main() {
      vec2 uv = vUv;
      vec2 aspect = vec2(resolution.x / resolution.y, 1.0);
      
      // 流体扭曲效果
      float liquidProgress = progress;
      vec2 distortion = vec2(
        sin(uv.y * 10.0 + liquidProgress * 5.0) * 0.1 * (1.0 - liquidProgress),
        cos(uv.x * 10.0 + liquidProgress * 5.0) * 0.1 * (1.0 - liquidProgress)
      );
      
      // 遮罩效果 - 模拟液体流动
      float mask = smoothstep(0.0, 1.0, liquidProgress + noise(uv * 5.0 + liquidProgress * 2.0) * 0.2);
      
      // 应用扭曲
      vec4 color = texture2D(tDiffuse, uv + distortion);
      
      // 混合效果
      vec4 liquidColor = vec4(210.0/255.0, 177.0/255.0, 219.0/255.0, 0.3);
      color = mix(color, liquidColor, mask * 0.5);
      
      gl_FragColor = color;
    }
  `
};

// 初始化Three.js场景
function initThreeJS() {
  if (!containerRef.value) return;
  
  // 创建场景
  scene = new THREE.Scene();
  
  // 创建正交相机
  const aspect = window.innerWidth / window.innerHeight;
  camera = new THREE.OrthographicCamera(-aspect, aspect, 1, -1, 0, 1);
  
  // 创建渲染器
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  containerRef.value.appendChild(renderer.domElement);
  
  // 创建后处理composer
  composer = new EffectComposer(renderer);
  
  // 添加渲染通道
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);
  
  // 添加流体过渡通道
  liquidPass = new ShaderPass(liquidShader);
  composer.addPass(liquidPass);
  
  // 监听窗口大小变化
  window.addEventListener('resize', handleResize);
  
  // 开始动画循环
  animate();
}

// 动画循环
function animate() {
  animationId = requestAnimationFrame(animate);
  composer.render();
}

// 处理窗口大小变化
function handleResize() {
  if (!camera || !renderer || !liquidPass) return;
  
  const width = window.innerWidth;
  const height = window.innerHeight;
  const aspect = width / height;
  
  // 更新相机
  camera.left = -aspect;
  camera.right = aspect;
  camera.updateProjectionMatrix();
  
  // 更新渲染器和composer
  renderer.setSize(width, height);
  composer.setSize(width, height);
  
  // 更新着色器分辨率
  liquidPass.uniforms.resolution.value.set(width, height);
}

// 监听progress变化
watch(() => props.progress, (newProgress) => {
  if (liquidPass) {
    liquidPass.uniforms.progress.value = newProgress;
  }
});

// 生命周期钩子
onMounted(() => {
  initThreeJS();
});

onUnmounted(() => {
  // 清理Three.js资源
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
  
  window.removeEventListener('resize', handleResize);
  
  if (renderer && containerRef.value) {
    containerRef.value.removeChild(renderer.domElement);
    renderer.dispose();
  }
  
  if (composer) {
    composer.dispose();
  }
});
</script>

<template>
  <div ref="containerRef" class="liquid-transition"></div>
</template>

<style scoped lang="scss">
.liquid-transition {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 10;
  
  canvas {
    display: block;
  }
}
</style>