import { ref } from 'vue'
import type { Ref } from 'vue'

/** 视频播放状态与控件：原生播放、自绘进度条、音量、静音。 */
export function useMediaVideo(videoRef: Ref<HTMLVideoElement | null>, progressRef: Ref<HTMLElement | null>) {
  const playing = ref(false)
  const progress = ref(0)
  const duration = ref(0)
  const volume = ref(1)
  const muted = ref(false)

  function formatTime(seconds: number): string {
    if (!Number.isFinite(seconds) || seconds < 0) return '00:00'
    const total = Math.floor(seconds)
    const h = Math.floor(total / 3600)
    const m = Math.floor((total % 3600) / 60)
    const s = total % 60
    const mm = String(m).padStart(2, '0')
    const ss = String(s).padStart(2, '0')
    return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
  }

  function togglePlay(): void {
    const video = videoRef.value
    if (!video) return
    if (video.paused) void video.play().catch(() => undefined)
    else video.pause()
  }

  function onMeta(): void {
    const video = videoRef.value
    if (!video) return
    duration.value = Number.isFinite(video.duration) ? video.duration : 0
    video.volume = volume.value
    video.muted = muted.value
  }

  function onTime(): void {
    const video = videoRef.value
    if (!video || !duration.value) return
    progress.value = video.currentTime / duration.value
  }

  function applyVolume(value: number): void {
    volume.value = value
    const video = videoRef.value
    if (!video) return
    video.volume = value
    if (value > 0) {
      muted.value = false
      video.muted = false
    }
  }

  function toggleMute(): void {
    muted.value = !muted.value
    if (videoRef.value) videoRef.value.muted = muted.value
  }

  function onVolumeInput(event: Event): void {
    const target = event.target as HTMLInputElement | null
    if (target) applyVolume(Number(target.value))
  }

  function seekTo(ratio: number): void {
    const video = videoRef.value
    if (!video || !Number.isFinite(video.duration)) return
    video.currentTime = Math.min(1, Math.max(0, ratio)) * video.duration
  }

  function onProgressDown(event: PointerEvent): void {
    const bar = progressRef.value
    if (!bar) return
    event.preventDefault()
    const move = (point: PointerEvent): void => {
      const rect = bar.getBoundingClientRect()
      seekTo((point.clientX - rect.left) / rect.width)
    }
    move(event)
    const up = (): void => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  function reset(): void {
    playing.value = false
    progress.value = 0
    duration.value = 0
  }

  return {
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
    reset
  }
}
