import { computed, ref } from 'vue'
import { previewUrl, rawUrl, thumbUrl } from '../api'
import type { UiEntry } from '../types'

/** 原始分辨率 WebP 预览失败时，退回已生成的档位缩略图（由大到小）。 */
const THUMB_FALLBACKS = [1024, 512, 256] as const

/**
 * 全屏查看器的图片源。
 *
 * 默认是原始分辨率的 WebP 预览；请求失败先退到档位缩略图，全部失败也只提示，
 * 不自动切原图 —— HDR / 超大原图不该在用户没点「显示原图」时被加载。
 */
export function useMediaSource(entry: () => UiEntry | null) {
  const showOriginal = ref(false)
  const thumbIndex = ref(0)
  const thumbFallback = ref(false)
  const failed = ref(false)

  const src = computed(() => {
    const item = entry()
    if (!item) return ''
    if (showOriginal.value) return rawUrl(item, item.thumbToken)
    if (thumbFallback.value) {
      return thumbUrl(item, THUMB_FALLBACKS[thumbIndex.value] ?? 256, item.thumbToken)
    }
    return previewUrl(item, item.thumbToken)
  })

  const downloadSrc = computed(() => {
    const item = entry()
    return item ? `${rawUrl(item, item.thumbToken)}&download=1` : ''
  })

  function reset(): void {
    showOriginal.value = false
    thumbFallback.value = false
    thumbIndex.value = 0
    failed.value = false
  }

  /** 当前源加载失败：full → 1024 → 512 → 256，都不行就交给用户决定是否看原图。 */
  function onError(): void {
    if (showOriginal.value) {
      failed.value = true
      return
    }
    if (!thumbFallback.value && entry()?.thumb) {
      thumbFallback.value = true
      thumbIndex.value = 0
      return
    }
    if (thumbFallback.value && thumbIndex.value < THUMB_FALLBACKS.length - 1) {
      thumbIndex.value += 1
      return
    }
    failed.value = true
  }

  function showRealSize(): void {
    showOriginal.value = true
    failed.value = false
  }

  return { showOriginal, failed, src, downloadSrc, reset, onError, showRealSize }
}
