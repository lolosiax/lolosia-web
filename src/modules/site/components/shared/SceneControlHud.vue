<script setup lang="ts">
import type { CameraMode, FlyMode } from '../../gpu/camera-rig'

defineOptions({ name: 'SceneControlHud' })

defineProps<{
  cameraMode: CameraMode
  flyMode: FlyMode
  active: boolean
}>()
</script>

<template>
  <div v-if="cameraMode === 'fly' && !active && flyMode === 'mc'" class="scene-hud" aria-live="polite">
    <kbd class="scene-hud__key scene-hud__key--mouse" aria-label="鼠标">
      <svg viewBox="0 0 14 20" aria-hidden="true">
        <rect x="1" y="1" width="12" height="18" rx="6" />
        <path d="M7 2v5" />
      </svg>
    </kbd>
    <span class="scene-hud__tip">点击屏幕开始操作</span>
  </div>

  <div v-else-if="cameraMode === 'fly' && flyMode === 'mc'" class="scene-hud" aria-live="polite">
    <span class="scene-hud__group">
      <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd>
      <em>移动</em>
    </span>
    <span class="scene-hud__group"><kbd>Space</kbd><em>上升</em></span>
    <span class="scene-hud__group"><kbd>Shift</kbd><em>下降</em></span>
    <span class="scene-hud__group">
      <kbd class="scene-hud__key--mouse" aria-label="鼠标">
        <svg viewBox="0 0 14 20" aria-hidden="true">
          <rect x="1" y="1" width="12" height="18" rx="6" />
          <path d="M7 2v5" />
        </svg>
      </kbd>
      <em>视角</em>
    </span>
    <span class="scene-hud__group"><kbd>Esc</kbd><em>退出锁定</em></span>
    <span class="scene-hud__group"><kbd>Alt</kbd><em>临时释放鼠标</em></span>
    <span class="scene-hud__tip">松开 Alt 恢复锁定</span>
  </div>

  <div v-else-if="cameraMode === 'fly'" class="scene-hud" aria-live="polite">
    <span v-if="!active" class="scene-hud__tip">点击屏幕开始操作</span>
    <span class="scene-hud__group">
      <kbd>Alt</kbd><i>+</i>
      <kbd class="scene-hud__key--mouse">
        <svg viewBox="0 0 14 20" aria-hidden="true">
          <rect x="1" y="1" width="12" height="18" rx="6" />
          <path d="M7 2v5" />
        </svg>
        <span>左键</span>
      </kbd>
      <em>环绕</em>
    </span>
    <span class="scene-hud__group">
      <kbd>Alt</kbd><i>+</i>
      <kbd class="scene-hud__key--mouse">
        <svg viewBox="0 0 14 20" aria-hidden="true">
          <rect x="1" y="1" width="12" height="18" rx="6" />
          <path d="M7 2v5" />
        </svg>
        <span>中键</span>
      </kbd>
      <em>平移</em>
    </span>
    <span class="scene-hud__group">
      <kbd>Alt</kbd><i>+</i>
      <kbd class="scene-hud__key--mouse">
        <svg viewBox="0 0 14 20" aria-hidden="true">
          <rect x="1" y="1" width="12" height="18" rx="6" />
          <path d="M7 2v5" />
        </svg>
        <span>右键</span>
      </kbd>
      <em>推拉</em>
    </span>
    <span class="scene-hud__group"><kbd>Esc</kbd><em>退出</em></span>
  </div>
</template>

<style scoped lang="scss">
.scene-hud {
  position: fixed;
  bottom: 22px;
  left: 6vw;
  z-index: 26;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 14px;
  max-width: min(92vw, 980px);
  padding: 9px 13px;
  border: 1px solid rgb(255 255 255 / 12%);
  border-radius: 10px;
  background: rgb(27 18 38 / 78%);
  box-shadow: 0 16px 40px -28px rgb(20 10 30 / 80%);
  color: rgb(255 255 255 / 88%);
  font-size: 11px;
  letter-spacing: 0.03em;
  line-height: 1;
  pointer-events: none;
  backdrop-filter: blur(10px);
  animation: scene-hud-in 0.25s ease both;
}

.scene-hud__group {
  display: inline-flex;
  align-items: center;
  gap: 3px;

  em {
    margin-left: 3px;
    color: rgb(255 255 255 / 62%);
    font-style: normal;
  }

  i {
    color: rgb(255 255 255 / 45%);
    font-style: normal;
  }
}

kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  height: 22px;
  min-width: 22px;
  padding: 0 5px;
  border: 1px solid rgb(255 255 255 / 34%);
  border-bottom-width: 2px;
  border-radius: 4px;
  background: rgb(255 255 255 / 12%);
  color: #fff;
  font-family: inherit;
  font-size: 10px;
  font-weight: 600;
  line-height: 1;

  &.scene-hud__key--mouse {
    padding: 0 6px;

    svg {
      width: 11px;
      height: 17px;
      fill: none;
      stroke: currentcolor;
      stroke-width: 1.2;
    }

    span {
      color: rgb(255 255 255 / 78%);
      font-size: 9px;
      font-weight: 500;
    }
  }
}

.scene-hud__tip {
  color: rgb(255 255 255 / 58%);
  font-size: 10px;
}

@keyframes scene-hud-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
}

@media (max-width: 900px) {
  .scene-hud {
    right: 16px;
    bottom: 14px;
    left: 16px;
    gap: 8px 10px;
    font-size: 10px;
  }
}
</style>
