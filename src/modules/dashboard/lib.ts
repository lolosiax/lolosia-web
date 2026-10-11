import { thumbUrl } from './api'
import type { DashboardFileRow } from './api'
import type { ActiveFileView, PhotoView, RecentFileView } from './types'

const KIND_META: Record<string, { color: string; icon: string }> = {
  image: { color: '#4caf82', icon: 'bi bi-image' },
  video: { color: '#a480ab', icon: 'bi bi-camera-video' },
  audio: { color: '#6f9bd8', icon: 'bi bi-music-note-beamed' },
  other: { color: '#8a7a94', icon: 'bi bi-file-earmark' }
}

export function formatCount(value: number): string {
  return value >= 10000 ? `${(value / 1000).toFixed(1)}k` : String(value)
}

export function bytesToGb(bytes: number): string {
  return (bytes / 1024 / 1024 / 1024).toFixed(1)
}

/** 运行时长：`3天 4时 5分` / `4时 5分` / `5分`；无效值给 `--`。 */
export function uptimeText(ms: number | null | undefined): string {
  if (!ms || ms <= 0) return '--'
  const total = Math.floor(ms / 1000)
  const days = Math.floor(total / 86400)
  const hours = Math.floor((total % 86400) / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  if (days > 0) return `${days}天 ${hours}时 ${minutes}分`
  if (hours > 0) return `${hours}时 ${minutes}分`
  return `${minutes}分`
}

export function kindMeta(kind: string | null): { color: string; icon: string } {
  return KIND_META[kind ?? 'other'] ?? KIND_META.other!
}

export function extOf(name: string): string {
  const index = name.lastIndexOf('.')
  return index < 0 ? 'FILE' : name.slice(index + 1).toUpperCase()
}

export function dirOf(path: string): string {
  const index = path.lastIndexOf('/')
  return index < 0 ? '/' : `/${path.slice(0, index)}`
}

export function relTime(ms: number): string {
  if (!ms) return ''
  const diff = Date.now() - ms
  if (diff < 60_000) return '刚刚'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} 小时前`
  return `${Math.floor(diff / 86_400_000)} 天前`
}

/** 按横竖屏把推荐候选排成「1 大 + 4 小」：竖图优先占高格（首图），横图优先占小格。 */
export function buildPhotoWall(rows: DashboardFileRow[]): PhotoView[] {
  const portrait = (row: DashboardFileRow): boolean => Boolean(row.width && row.height && row.height > row.width)
  const portraits = rows.filter(portrait)
  const rest = rows.filter(row => !portrait(row))
  const feature = portraits[0] ?? rest[0]
  const used = new Set<string>()
  if (feature) used.add(feature.path)
  const smalls: DashboardFileRow[] = []
  for (const row of [...rest, ...portraits]) {
    if (smalls.length >= 4) break
    if (used.has(row.path)) continue
    smalls.push(row)
  }
  return (feature ? [feature, ...smalls] : smalls).map(row => ({
    path: row.path,
    name: row.name,
    src: thumbUrl(row, 1024),
    port: portrait(row)
  }))
}

export function toActiveFiles(rows: DashboardFileRow[], limit = 6): ActiveFileView[] {
  return rows.slice(0, limit).map(row => ({
    path: row.path,
    name: row.name,
    dir: dirOf(row.path),
    time: relTime(row.mtime),
    ...kindMeta(row.kind)
  }))
}

export function toRecentFiles(rows: DashboardFileRow[], limit = 6): RecentFileView[] {
  return rows.slice(0, limit).map(row => ({
    path: row.path,
    name: row.name,
    ext: extOf(row.name),
    time: relTime(row.mtime),
    color: kindMeta(row.kind).color
  }))
}
