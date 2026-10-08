import type { MediaTagRef } from './api'
import type { EntryGroup, FileGroup, GroupTag, UiEntry } from './types'

/** 1024 进制，保留一位小数。 */
export function formatSize(size: number): string {
  if (!size) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let value = size
  let index = 0
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024
    index += 1
  }
  return `${value.toFixed(index === 0 ? 0 : 1)} ${units[index]}`
}

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

export function formatDate(ms: number): string {
  if (!ms) return '—'
  const date = new Date(ms)
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function formatDateTime(ms: number): string {
  if (!ms) return '—'
  const date = new Date(ms)
  return `${formatDate(ms)} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function formatDuration(ms: number | null): string {
  if (!ms) return '—'
  const total = Math.round(ms / 1000)
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return `${pad(minutes)}:${pad(seconds)}`
}

/** 扩展名 → 图标与配色。 */
const ICONS: Record<string, { icon: string; color: string }> = {
  jpg: { icon: 'file-earmark-image', color: '#4caf82' },
  jpeg: { icon: 'file-earmark-image', color: '#4caf82' },
  png: { icon: 'file-earmark-image', color: '#4caf82' },
  gif: { icon: 'file-earmark-image', color: '#4caf82' },
  webp: { icon: 'file-earmark-image', color: '#4caf82' },
  avif: { icon: 'file-earmark-image', color: '#4caf82' },
  svg: { icon: 'file-earmark-image', color: '#4caf82' },
  mp4: { icon: 'file-earmark-play', color: '#a480ab' },
  mkv: { icon: 'file-earmark-play', color: '#a480ab' },
  webm: { icon: 'file-earmark-play', color: '#a480ab' },
  mov: { icon: 'file-earmark-play', color: '#a480ab' },
  mp3: { icon: 'file-earmark-music', color: '#6f9bd8' },
  flac: { icon: 'file-earmark-music', color: '#6f9bd8' },
  wav: { icon: 'file-earmark-music', color: '#6f9bd8' },
  zip: { icon: 'file-earmark-zip', color: '#d0a45c' },
  '7z': { icon: 'file-earmark-zip', color: '#d0a45c' },
  rar: { icon: 'file-earmark-zip', color: '#d0a45c' },
  pdf: { icon: 'file-earmark-pdf', color: '#e0703c' },
  txt: { icon: 'file-earmark-text', color: '#8a7a94' },
  md: { icon: 'file-earmark-text', color: '#8a7a94' },
  json: { icon: 'file-earmark-code', color: '#8a7a94' }
}

export function iconOf(entry: { directory: boolean; ext: string }): { icon: string; color: string } {
  if (entry.directory) return { icon: 'folder-fill', color: '#d0a45c' }
  return ICONS[entry.ext.toLowerCase()] ?? { icon: 'file-earmark', color: '#8a7a94' }
}

const SAMPLE_CACHE = new Map<string, string>()

/** 8×8 RGB565 采样 → data URI；同一采样只画一次。 */
export function sampleDataUrl(sample: string): string {
  if (sample.length < 256) return ''
  const cached = SAMPLE_CACHE.get(sample)
  if (cached) return cached

  const canvas = document.createElement('canvas')
  canvas.width = 8
  canvas.height = 8
  const context = canvas.getContext('2d')
  if (!context) return ''

  const image = context.createImageData(8, 8)
  for (let i = 0; i < 64; i += 1) {
    const value = Number.parseInt(sample.slice(i * 4, i * 4 + 4), 16)
    const r = ((value >> 11) & 0x1f) * 8
    const g = ((value >> 5) & 0x3f) * 4
    const b = (value & 0x1f) * 8
    image.data[i * 4] = r
    image.data[i * 4 + 1] = g
    image.data[i * 4 + 2] = b
    image.data[i * 4 + 3] = 255
  }
  context.putImageData(image, 0, 0)
  const url = canvas.toDataURL('image/png')
  SAMPLE_CACHE.set(sample, url)
  return url
}

export function typeLabel(entry: { directory: boolean; ext: string; mime: string }): string {
  if (entry.directory) return '文件夹'
  return entry.ext ? entry.ext.toUpperCase() : '文件'
}

export function dirLabel(dir: string): string {
  if (!dir) return '浏览根目录'
  const index = dir.lastIndexOf('/')
  return index < 0 ? dir : dir.slice(index + 1)
}

export function parentPath(path: string): string {
  const index = path.lastIndexOf('/')
  return index < 0 ? '' : path.slice(0, index)
}

export function baseName(path: string): string {
  const index = path.lastIndexOf('/')
  return index < 0 ? path : path.slice(index + 1)
}

export function isSameOrInside(path: string, parent: string): boolean {
  if (!parent) return true
  return path === parent || path.startsWith(`${parent}/`)
}

/** 同目录内改名时，当前浏览路径也要跟着换前缀。 */
export function renamedCurrentPath(current: string, from: string, to: string): string {
  if (!isSameOrInside(current, from)) return current
  return `${to}${current.slice(from.length)}`
}

/** 按年份 / 月份 / 喜欢分组；`favorite` 组只放标心项。 */
export function buildGroups(entries: UiEntry[], group: FileGroup, favorited: (entry: UiEntry) => boolean): EntryGroup[] | null {
  if (group === 'none') return null

  if (group === 'favorite') {
    return [{ key: 'fav', label: '喜欢', entries: entries.filter(favorited) }]
  }

  const buckets = new Map<string, EntryGroup>()
  for (const entry of entries) {
    const date = entry.mtime ? new Date(entry.mtime) : null
    const year = date ? String(date.getFullYear()) : '未知时间'
    const key = group === 'year' ? year : date ? `${year}-${pad(date.getMonth() + 1)}` : '未知时间'
    let bucket = buckets.get(key)
    if (!bucket) {
      bucket = { key, label: key, entries: [] }
      buckets.set(key, bucket)
    }
    bucket.entries.push(entry)
  }

  return [...buckets.values()].sort((a, b) => b.key.localeCompare(a.key))
}

/** 多选条目的标签聚合：同 namespace + name 计数，按次数降序。 */
export function aggregateTags(entries: UiEntry[]): GroupTag[] {
  const counts = new Map<string, GroupTag>()
  for (const entry of entries) {
    for (const tag of entry.tags ?? []) {
      const key = `${tag.namespace}:${tag.name}`
      const current = counts.get(key)
      if (current) current.count += 1
      else counts.set(key, { namespace: tag.namespace, name: tag.name, count: 1 })
    }
  }
  return [...counts.values()].sort((a, b) => b.count - a.count)
}

/** `命名空间:名字` → 标签引用；没写命名空间时落到 `user`。 */
export function parseTag(input: string): MediaTagRef {
  const text = input.trim()
  const index = text.indexOf(':')
  if (index < 0) return { namespace: 'user', name: text }
  return { namespace: text.slice(0, index).trim() || 'user', name: text.slice(index + 1).trim() }
}

export function tagKey(tag: MediaTagRef): string {
  return `${tag.namespace}:${tag.name}`
}

/** 并发上限映射；单项失败不影响其它项。 */
export async function mapLimit<T>(items: T[], limit: number, worker: (item: T) => Promise<void>): Promise<void> {
  let cursor = 0
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor
      cursor += 1
      const item = items[index]
      if (item !== undefined) await worker(item)
    }
  })
  await Promise.all(runners)
}
