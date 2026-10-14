import type { AnimeRelease, AnimeReleaseEvent, AnimeSeries } from './api'

/** 放送星期分栏；`0` 表示未定档。 */
export const WEEKDAYS = [
  { value: 1, label: '周一' },
  { value: 2, label: '周二' },
  { value: 3, label: '周三' },
  { value: 4, label: '周四' },
  { value: 5, label: '周五' },
  { value: 6, label: '周六' },
  { value: 7, label: '周日' },
  { value: 0, label: '未定档' }
] as const

export interface WeekColumn {
  weekday: number
  label: string
  items: AnimeSeries[]
}

/** 番组表搜索结果视图（页面传给周分栏面板）。 */
export interface TimetableSearchView {
  mode: boolean
  keyword: string
  searching: boolean
  results: AnimeSeries[]
}

/** 数字星期转中文；空值归为「未定档」。 */
export function weekdayText(weekday: number | null | undefined): string {
  if (!weekday || weekday < 1 || weekday > 7) return '未定档'
  return `周${'一二三四五六日'[weekday - 1]}`
}

/** 毫秒时间戳 → `MM-DD HH:mm`（`withYear` 时带上年份）。 */
export function formatTime(ms: number, withYear = false): string {
  if (!ms) return ''
  const date = new Date(ms)
  const pad = (value: number): string => String(value).padStart(2, '0')
  const dateText = `${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
  const clock = `${pad(date.getHours())}:${pad(date.getMinutes())}`
  return withYear ? `${date.getFullYear()}-${dateText} ${clock}` : `${dateText} ${clock}`
}

/** 目录里出现过的季度，新的在前。 */
export function seasonOptionsOf(series: AnimeSeries[]): string[] {
  const seasons = series.map(item => item.season).filter((value): value is string => Boolean(value))
  return Array.from(new Set(seasons)).sort().reverse()
}

/** 按季度过滤；空串表示全部。 */
export function filterBySeason(series: AnimeSeries[], season: string): AnimeSeries[] {
  return season ? series.filter(item => item.season === season) : series
}

/** 把番剧按放送星期分到七栏 + 未定档栏。 */
export function buildWeekColumns(series: AnimeSeries[], season: string): WeekColumn[] {
  const visible = filterBySeason(series, season)
  return WEEKDAYS.map(day => ({
    weekday: day.value,
    label: day.label,
    items: visible.filter(item => {
      const weekday = item.airWeekday
      const valid = weekday && weekday >= 1 && weekday <= 7 ? weekday : 0
      return valid === day.value
    })
  }))
}

/** SSE 事件转成历史列表条目。 */
export function releaseFromEvent(event: AnimeReleaseEvent): AnimeRelease {
  return {
    id: event.releaseId,
    guid: '',
    seriesId: event.seriesId,
    seriesTitle: event.seriesTitle,
    groupName: event.groupName,
    title: event.title,
    episodeNo: event.episodeNo,
    category: '',
    torrentUrl: event.torrentUrl,
    detailUrl: event.detailUrl,
    matchState: 'matched',
    publishedAt: event.publishedAt
  }
}

/** 目录维护 / 手动映射等运维动作是否可见（后端仍有权限兜底）。 */
export function canManageAnime(roleType: string): boolean {
  return ['owner', 'admin', 'super_admin'].includes(roleType)
}
