import moment from 'moment-mini'

/** 日期格式化；空值返回空串，非法日期原样返回。 */
export function formatDate(value: string | number | Date | null | undefined, pattern = 'YYYY-MM-DD HH:mm:ss'): string {
  if (value === null || value === undefined || value === '') return ''
  const date = moment(value)
  return date.isValid() ? date.format(pattern) : String(value)
}

/** 相对时间，如「3 分钟前」。 */
export function formatFromNow(value: string | number | Date | null | undefined): string {
  if (value === null || value === undefined || value === '') return ''
  const date = moment(value)
  return date.isValid() ? date.fromNow() : String(value)
}

const SIZE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'] as const

/** 字节数转可读大小。 */
export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined || Number.isNaN(bytes)) return '-'
  if (bytes < 1024) return `${bytes} B`
  let size = bytes
  let unit = 0
  while (size >= 1024 && unit < SIZE_UNITS.length - 1) {
    size /= 1024
    unit += 1
  }
  return `${size.toFixed(size >= 100 ? 0 : 1)} ${SIZE_UNITS[unit]}`
}

/** 秒数转 `hh:mm:ss` / `mm:ss`。 */
export function formatDuration(seconds: number | null | undefined): string {
  if (!seconds || seconds < 0) return '00:00'
  const total = Math.floor(seconds)
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const rest = total % 60
  const pad = (value: number): string => String(value).padStart(2, '0')
  return hours > 0 ? `${pad(hours)}:${pad(minutes)}:${pad(rest)}` : `${pad(minutes)}:${pad(rest)}`
}

/** 按当前时间返回问候语。 */
export function greetingOf(date = new Date()): string {
  const hour = date.getHours()
  if (hour > 20) return '晚上'
  if (hour > 17) return '傍晚'
  if (hour > 13) return '下午'
  if (hour > 11) return '中午'
  if (hour > 8) return '上午'
  if (hour > 5) return '早上'
  return '凌晨'
}
