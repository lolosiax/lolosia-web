<script setup lang="ts">
import type { CameraMode, FlyMode } from '../../gpu/camera-rig'
import type { CharacterMode } from '../../character/character'

defineOptions({ name: 'SceneDebugPanel' })

const props = defineProps<{
  characterMode: CharacterMode
  cameraMode: CameraMode
  flyMode: FlyMode
}>()

const emit = defineEmits<{
  character: [mode: CharacterMode]
  camera: [mode: CameraMode]
  fly: [mode: FlyMode]
}>()
</script>

<template>
  <aside class="scene-debug" data-scene-ui>
    <div class="scene-debug__body">
      <p class="scene-debug__title">SCENE DEBUG</p>

      <section class="scene-debug__section">
        <p class="scene-debug__label">角色</p>
        <div class="scene-debug__row">
          <button
            type="button"
            class="scene-debug__btn"
            :class="{ 'is-active': props.characterMode === 'auto' }"
            :aria-pressed="props.characterMode === 'auto'"
            @click="emit('character', 'auto')"
          >
            自动漫步
          </button>
          <button
            type="button"
            class="scene-debug__btn"
            :class="{ 'is-active': props.characterMode === 'clip' }"
            :aria-pressed="props.characterMode === 'clip'"
            @click="emit('character', 'clip')"
          >
            动画剪辑
          </button>
        </div>
      </section>

      <section class="scene-debug__section">
        <p class="scene-debug__label">相机</p>
        <div class="scene-debug__row">
          <button
            type="button"
            class="scene-debug__btn"
            :class="{ 'is-active': props.cameraMode === 'default' }"
            :aria-pressed="props.cameraMode === 'default'"
            @click="emit('camera', 'default')"
          >
            默认
          </button>
          <button
            type="button"
            class="scene-debug__btn"
            :class="{ 'is-active': props.cameraMode === 'fly' }"
            :aria-pressed="props.cameraMode === 'fly'"
            @click="emit('camera', 'fly')"
          >
            飞行
          </button>
        </div>

        <div v-if="props.cameraMode === 'fly'" class="scene-debug__row scene-debug__row--sub">
          <button
            type="button"
            class="scene-debug__btn"
            :class="{ 'is-active': props.flyMode === 'mc' }"
            :aria-pressed="props.flyMode === 'mc'"
            @click="emit('fly', 'mc')"
          >
            创造 MC
          </button>
          <button
            type="button"
            class="scene-debug__btn"
            :class="{ 'is-active': props.flyMode === 'maya' }"
            :aria-pressed="props.flyMode === 'maya'"
            @click="emit('fly', 'maya')"
          >
            建模 Maya
          </button>
        </div>
      </section>

      <p v-if="props.cameraMode === 'fly'" class="scene-debug__hint">
        <template v-if="props.flyMode === 'mc'">WASD 移动 · Space / Shift 升降 · 拖动鼠标转向</template>
        <template v-else>Alt + 左键环绕 · 中键平移 · 右键推拉 · 滚轮缩放</template>
      </p>
    </div>
  </aside>
</template>

<style scoped lang="scss">
$ink: #33203f;
$muted: #7d6a88;
$accent: #8a5f9a;

.scene-debug {
  position: fixed;
  right: 16px;
  bottom: 20px;
  z-index: 20;

  &__body {
    width: 212px;
    padding: 14px;
    border: 1px solid rgb(255 255 255 / 60%);
    border-radius: 14px;
    background: rgb(255 255 255 / 62%);
    box-shadow: 0 18px 44px -28px rgb(58 35 82 / 55%);
    backdrop-filter: blur(14px);
  }

  &__title {
    margin: 0 0 12px;
    color: $accent;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.24em;
  }

  &__section {
    margin-bottom: 12px;
  }

  &__label {
    margin: 0 0 6px;
    color: $muted;
    font-size: 10px;
    letter-spacing: 0.18em;
  }

  &__row {
    display: flex;
    gap: 6px;
  }

  &__row--sub {
    margin-top: 6px;
  }

  &__btn {
    flex: 1;
    padding: 7px 4px;
    border: 1px solid rgb(138 95 154 / 24%);
    border-radius: 8px;
    background: rgb(255 255 255 / 55%);
    color: $muted;
    font: inherit;
    font-size: 11px;
    line-height: 1.2;
    cursor: pointer;
    transition:
      background-color 0.16s ease,
      border-color 0.16s ease,
      color 0.16s ease;

    &:hover {
      border-color: rgb(138 95 154 / 48%);
      color: $ink;
    }

    &.is-active {
      border-color: $accent;
      background: $accent;
      color: #fff;
    }
  }

  &__hint {
    margin: 0;
    padding: 7px 8px;
    border-radius: 8px;
    background: rgb(138 95 154 / 10%);
    color: $muted;
    font-size: 10px;
    line-height: 1.55;
  }
}

@media (max-width: 900px) {
  .scene-debug {
    display: none;
  }
}
</style>
