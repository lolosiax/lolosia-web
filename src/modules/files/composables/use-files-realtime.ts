import { onBeforeUnmount } from 'vue'
import { onSseEvent } from '@/core/lib/sse'
import type { MediaRating } from '../api'
import type { UiEntry } from '../types'

interface ThumbPayload {
  files?: { path: string; exp: number; sig: string }[]
}

interface IndexPayload {
  path?: string
  rating?: MediaRating
  indexed?: boolean
  takenAt?: number
  sample?: string
}

/** 缩略图生成完成 / 媒体索引更新；命中当前目录时就地刷新条目。 */
export function useFilesRealtime(patch: (path: string, value: Partial<UiEntry>) => void, onSelected: (path: string) => void) {
  const now = Date.now()

  const offThumb = onSseEvent('files:thumb', payload => {
    const data = payload as ThumbPayload
    for (const file of data.files ?? []) {
      patch(file.path, { thumb: true, exp: file.exp, sig: file.sig, thumbToken: now })
      onSelected(file.path)
    }
  })

  const offIndex = onSseEvent('media:index', payload => {
    const data = payload as IndexPayload
    if (!data.path) return
    const value: Partial<UiEntry> = {}
    if (data.rating) value.rating = data.rating
    if (data.indexed !== undefined) value.indexed = data.indexed
    if (data.takenAt !== undefined) value.takenAt = data.takenAt
    if (data.sample !== undefined) value.sample = data.sample
    patch(data.path, value)
    onSelected(data.path)
  })

  onBeforeUnmount(() => {
    offThumb()
    offIndex()
  })
}
