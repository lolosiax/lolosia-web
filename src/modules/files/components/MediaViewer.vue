<script setup lang="ts">
// 全屏媒体查看器：图片（缩放 / 平移）与视频（原生播放）共用一个浮层。
// 上一张 / 下一张在当前目录的可查看项之间循环，顺序与网格一致。
import { computed, onUnmounted, ref, watch } from 'vue'
import { isVideo, isViewable, needsBlur, rawUrl } from '../api'
import { useMediaSource } from '../composables/use-media-source'
import { useMediaVideo } from '../composables/use-media-video'
import { useMediaZoom } from '../composables/use-media-zoom'
import type { NsfwMode, UiEntry } from '../types'
import MediaMask from './MediaMask.vue'

defineOptions({ name: 'MediaViewer' })

const props = defineProps<{
  modelValue: boolean
  path: string
  entries: UiEntry[]
  nsfwMode: NsfwMode
  revealedPaths: Record<string, boolean>
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'update:path': [value: string]
  reveal: [path: string]
}>()

const rootRef = ref<HTMLElement | null>(null)
const stageRef = ref<HTMLElement | null>(null)
const imgRef = ref<HTMLImageElement | null>(null)
const videoRef = ref<HTMLVideoElement | null>(null)
const progressRef = ref<HTMLElement | null>(null)

const viewable = computed(() => props.entries.filter(isViewable))
const index = ref(-1)
const current = computed(() => viewable.value[index.value] ?? null)
const isVideoMode = computed(() => Boolean(current.value && isVideo(current.value)))

/** 敏感内容遮罩：与缩略图同一口径，双击进来也不能绕过。 */
const masked = computed(() => {
  const entry = current.value
  if (!entry || props.nsfwMode === 'always') return false
  return needsBlur(entry.rating) && !props.revealedPaths[entry.path]
})

/** 图片源：默认原始分辨率 WebP，失败退档位缩略图，原图只在用户主动点击时加载。 */
const {
  showOriginal,
  failed: previewFailed,
  src: imageSrc,
  downloadSrc,
  reset: resetSource,
  onError: onSourceError,
  showRealSize: showOriginalSize
} = useMediaSource(() => current.value)

const {
  ready,
  style: imageStyle,
  percent,
  fitScreen,
  zoomAt,
  zoomBy,
  actualSize,
  onImageLoad,
  onDragStart,
  reset: resetZoom
} = useMediaZoom(
  () => stageRef.value,
  () => imgRef.value
)

const {
  playing,
  progress,
  duration,
  volume,
  muted,
  formatTime,
  togglePlay,
  onMeta,
  onTime,
  toggleMute,
  onVolumeInput,
  onProgressDown,
  reset: resetVideo
} = useMediaVideo(videoRef, progressRef)

const videoSrc = computed(() => (current.value ? rawUrl(current.value, current.value.thumbToken) : ''))

function onWheel(event: WheelEvent): void {
  if (masked.value || isVideoMode.value) return
  zoomAt(event.clientX, event.clientY, Math.exp(-event.deltaY * 0.0015))
}

function onImageError(): void {
  onSourceError()
  resetZoom()
}

function showRealSize(): void {
  showOriginalSize()
  resetZoom()
}

/* ---------- 控件自动隐藏（仅视频） ---------- */

const chromeVisible = ref(true)
let hideTimer: number | null = null

function clearHideTimer(): void {
  if (hideTimer !== null) window.clearTimeout(hideTimer)
  hideTimer = null
}

function showChrome(): void {
  chromeVisible.value = true
  clearHideTimer()
  if (isVideoMode.value && playing.value) {
    hideTimer = window.setTimeout(() => {
      chromeVisible.value = false
    }, 2500)
  }
}

function onMouseMove(): void {
  if (isVideoMode.value) showChrome()
}

watch(playing, value => {
  if (value) {
    showChrome()
    return
  }
  clearHideTimer()
  chromeVisible.value = true
})

/* ---------- 切换 / 全屏 / 关闭 ---------- */

function resetView(): void {
  resetZoom()
  resetVideo()
  resetSource()
  chromeVisible.value = true
}

function step(delta: number): void {
  const total = viewable.value.length
  if (total < 2) return
  index.value = (index.value + delta + total) % total
  emit('update:path', current.value?.path ?? '')
}

function revealCurrent(): void {
  if (current.value) emit('reveal', current.value.path)
}

function close(): void {
  if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined)
  emit('update:modelValue', false)
}

async function toggleFullscreen(): Promise<void> {
  try {
    if (document.fullscreenElement) await document.exitFullscreen()
    else await rootRef.value?.requestFullscreen()
  } catch {
    // 浏览器不支持或被拒绝：忽略
  }
}

function onKeydown(event: KeyboardEvent): void {
  if (!props.modelValue) return
  const tag = (event.target as HTMLElement | null)?.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA') return
  if (event.key === 'Escape') {
    close()
    return
  }
  if (event.key === 'ArrowLeft') {
    event.preventDefault()
    step(-1)
    return
  }
  if (event.key === 'ArrowRight') {
    event.preventDefault()
    step(1)
    return
  }
  if (event.key === ' ' && isVideoMode.value) {
    event.preventDefault()
    togglePlay()
  }
}

watch(
  () => [props.modelValue, props.path] as const,
  () => {
    if (!props.modelValue) return
    const found = viewable.value.findIndex(item => item.path === props.path)
    index.value = found >= 0 ? found : 0
  }
)

watch(
  () => [props.modelValue, current.value?.path] as const,
  ([open]) => {
    if (!open) return
    const entry = current.value
    if (!entry) return
    resetView()
    if (isVideoMode.value) showChrome()
  }
)

watch(isVideoMode, value => {
  if (value) showChrome()
})

window.addEventListener('keydown', onKeydown)
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  clearHideTimer()
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="modelValue && current"
      ref="rootRef"
      class="media-viewer"
      :class="{ 'is-chrome-hidden': isVideoMode && !chromeVisible }"
      @mousemove="onMouseMove"
    >
      <button type="button" class="media-viewer__close mv-chrome" title="关闭（Esc）" @click="close">
        <i class="bi bi-x-lg" />
      </button>

      <button
        v-if="viewable.length > 1"
        type="button"
        class="media-viewer__nav media-viewer__nav--prev mv-chrome"
        title="上一张（←）"
        @click="step(-1)"
      >
        <i class="bi bi-chevron-left" />
      </button>
      <button
        v-if="viewable.length > 1"
        type="button"
        class="media-viewer__nav media-viewer__nav--next mv-chrome"
        title="下一张（→）"
        @click="step(1)"
      >
        <i class="bi bi-chevron-right" />
      </button>

      <div
        v-if="!isVideoMode"
        ref="stageRef"
        class="media-viewer__stage"
        :class="{ 'is-dragging': ready }"
        @wheel.prevent="onWheel"
        @pointerdown="onDragStart($event, masked)"
        @dblclick="toggleFullscreen"
      >
        <MediaMask v-if="masked" @reveal="revealCurrent" />
        <img
          v-else-if="!previewFailed"
          ref="imgRef"
          class="media-viewer__image"
          :class="{ 'is-ready': ready }"
          :src="imageSrc"
          :style="imageStyle"
          alt=""
          draggable="false"
          @load="onImageLoad"
          @error="onImageError"
        />
        <div v-else class="media-viewer__failed">
          <i class="bi bi-image" />
          <span>{{ showOriginal ? '原图加载失败' : '预览暂不可用，可点左下角「显示原图」' }}</span>
        </div>
        <div v-if="!ready && !masked && !previewFailed" class="media-viewer__loading">
          <i class="bi bi-arrow-repeat spinning" />
          加载中…
        </div>
      </div>

      <div v-else class="media-viewer__stage-video" @dblclick="toggleFullscreen">
        <video
          ref="videoRef"
          :key="current.path"
          class="media-viewer__video"
          :src="videoSrc"
          preload="metadata"
          playsinline
          @click="togglePlay"
          @loadedmetadata="onMeta"
          @timeupdate="onTime"
          @play="playing = true"
          @pause="playing = false"
          @ended="playing = false"
        />
      </div>

      <div v-if="!isVideoMode" class="media-viewer__toolbar">
        <button type="button" title="缩小" @click="zoomBy(1 / 1.25)"><i class="bi bi-dash-lg" /></button>
        <span class="media-viewer__zoom">{{ percent }}%</span>
        <button type="button" title="放大" @click="zoomBy(1.25)"><i class="bi bi-plus-lg" /></button>
        <span class="media-viewer__sep" />
        <button type="button" title="原始大小" @click="actualSize">1:1</button>
        <button type="button" title="适应屏幕" @click="fitScreen">适应屏幕</button>
      </div>

      <div v-if="isVideoMode" class="media-viewer__video-bar mv-chrome">
        <button type="button" :title="playing ? '暂停' : '播放'" @click="togglePlay">
          <i class="bi" :class="playing ? 'bi-pause-fill' : 'bi-play-fill'" />
        </button>
        <span class="media-viewer__time">{{ formatTime(progress * duration) }} / {{ formatTime(duration) }}</span>
        <div ref="progressRef" class="media-viewer__progress" @pointerdown="onProgressDown">
          <div class="media-viewer__progress-fill" :style="{ width: `${progress * 100}%` }" />
          <div class="media-viewer__progress-knob" :style="{ left: `${progress * 100}%` }" />
        </div>
        <button type="button" :title="muted ? '取消静音' : '静音'" @click="toggleMute">
          <i class="bi" :class="muted || volume === 0 ? 'bi-volume-mute-fill' : 'bi-volume-up-fill'" />
        </button>
        <input
          class="media-viewer__volume"
          type="range"
          min="0"
          max="1"
          step="0.01"
          :value="muted ? 0 : volume"
          title="音量"
          @input="onVolumeInput"
        />
        <button type="button" title="全屏（双击画面）" @click="toggleFullscreen">
          <i class="bi bi-arrows-fullscreen" />
        </button>
      </div>

      <div v-if="!isVideoMode" class="media-viewer__original">
        <button v-if="!showOriginal" type="button" class="media-viewer__chip" title="查看原始分辨率" @click="showRealSize">
          <i class="bi bi-fullscreen" />
          显示原图
        </button>
        <a class="media-viewer__chip" :href="downloadSrc" :download="current.name" title="下载原图">
          <i class="bi bi-download" />
          下载
        </a>
      </div>

      <div class="media-viewer__caption mv-chrome">{{ current.name }}</div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
.media-viewer {
  position: fixed;
  inset: 0;
  z-index: 3000;
  overflow: hidden;
  background: rgba(12, 12, 16, 0.94);
  color: rgba(255, 255, 255, 0.9);
  user-select: none;

  &.is-chrome-hidden .mv-chrome {
    opacity: 0;
    pointer-events: none;
  }

  &__close {
    position: absolute;
    top: 18px;
    right: 22px;
    z-index: 1;
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border: 1px solid rgba(255, 255, 255, 0.22);
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    color: inherit;
    font-size: 16px;
    cursor: pointer;

    &:hover {
      background: rgba(255, 255, 255, 0.25);
    }
  }

  &__nav {
    position: absolute;
    top: 50%;
    z-index: 1;
    display: grid;
    place-items: center;
    width: 52px;
    height: 52px;
    border: none;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    color: inherit;
    font-size: 22px;
    cursor: pointer;
    transform: translateY(-50%);

    &:hover {
      background: rgba(255, 255, 255, 0.26);
    }

    &--prev {
      left: 24px;
    }

    &--next {
      right: 24px;
    }
  }

  &__stage {
    position: absolute;
    inset: 0;
    z-index: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: grab;

    &.is-dragging:active {
      cursor: grabbing;
    }
  }

  &__image {
    display: block;
    max-width: none;
    max-height: none;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.2s ease;
    transform-origin: center center;
    will-change: transform;
    -webkit-user-drag: none;

    &.is-ready {
      opacity: 1;
    }
  }

  &__loading {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    color: rgba(255, 255, 255, 0.75);
    font-size: 14px;
  }

  &__failed {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    color: rgba(255, 255, 255, 0.7);
    font-size: 13px;

    i {
      font-size: 2.2em;
      opacity: 0.6;
    }
  }

  &__stage-video {
    position: absolute;
    inset: 0;
    z-index: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  &__video {
    width: auto;
    height: auto;
    max-width: 100%;
    max-height: 100%;
    background: #000;
  }

  &__toolbar {
    position: absolute;
    bottom: 28px;
    left: 50%;
    z-index: 1;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: 999px;
    background: rgba(28, 28, 34, 0.78);
    transform: translateX(-50%);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);

    button {
      min-width: 34px;
      height: 32px;
      padding: 0 10px;
      border: none;
      border-radius: 8px;
      background: transparent;
      color: inherit;
      font-size: 13px;
      cursor: pointer;

      &:hover {
        background: rgba(255, 255, 255, 0.16);
      }
    }
  }

  &__zoom {
    min-width: 56px;
    color: rgba(255, 255, 255, 0.85);
    font-size: 13px;
    text-align: center;
    font-variant-numeric: tabular-nums;
  }

  &__sep {
    width: 1px;
    height: 20px;
    margin: 0 2px;
    background: rgba(255, 255, 255, 0.2);
  }

  &__video-bar {
    position: absolute;
    bottom: 22px;
    left: 50%;
    display: flex;
    align-items: center;
    gap: 12px;
    width: min(880px, calc(100vw - 120px));
    padding: 8px 14px;
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: 12px;
    background: rgba(28, 28, 34, 0.8);
    transform: translateX(-50%);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);

    button {
      flex: none;
      width: 34px;
      height: 34px;
      border: none;
      border-radius: 8px;
      background: transparent;
      color: inherit;
      font-size: 16px;
      cursor: pointer;

      &:hover {
        background: rgba(255, 255, 255, 0.16);
      }
    }
  }

  &__time {
    flex: none;
    color: rgba(255, 255, 255, 0.8);
    font-size: 12px;
    font-variant-numeric: tabular-nums;
  }

  &__progress {
    position: relative;
    flex: 1;
    min-width: 80px;
    height: 6px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.22);
    cursor: pointer;
    touch-action: none;
  }

  &__progress-fill {
    position: absolute;
    inset: 0 auto 0 0;
    border-radius: 999px;
    background: var(--lolosia-color-primary, #c296cd);
  }

  &__progress-knob {
    position: absolute;
    top: 50%;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 0 4px rgba(0, 0, 0, 0.5);
    transform: translate(-50%, -50%);
  }

  &__volume {
    flex: none;
    width: 80px;
    accent-color: var(--lolosia-color-primary, #c296cd);
  }

  &__original {
    position: absolute;
    bottom: 28px;
    left: 22px;
    z-index: 1;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__chip {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 999px;
    background: rgba(28, 28, 34, 0.78);
    color: inherit;
    font-size: 13px;
    text-decoration: none;
    cursor: pointer;

    &:hover {
      background: rgba(255, 255, 255, 0.22);
    }
  }

  &__caption {
    position: absolute;
    top: 24px;
    left: 26px;
    z-index: 1;
    max-width: calc(100vw - 160px);
    overflow: hidden;
    color: rgba(255, 255, 255, 0.72);
    font-size: 13px;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
}

.mv-chrome {
  z-index: 1;
  transition: opacity 0.25s ease;
}

.spinning {
  animation: media-viewer-spin 0.9s linear infinite;
}

@keyframes media-viewer-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
