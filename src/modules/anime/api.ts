import { get, getRoot, post } from '@/core/lib/http'

/**
 * 番组表接口（与后端 `controller.AnimeController` 的 DTO 一一对应）。
 *
 * 读接口要 `lolosia.anime.read`，关注增删要 `lolosia.anime.write`；
 * 目录同步 / 立即拉取 / 手动映射要 `lolosia.anime.admin`。时间一律毫秒。
 */

/** 番剧目录里的一部番。 */
export interface AnimeSeries {
  id: number
  /** Bangumi subject id；手工建的番为 `null`。 */
  bangumiId: number | null
  title: string
  titleOriginal: string | null
  cover: string | null
  /** 放送星期 1..7（1 = 周一）；未定档为 `null`。 */
  airWeekday: number | null
  /** 放送时刻（JST），如 `23:30`。 */
  airTime: string | null
  airDate: string | null
  season: string | null
  rating: number | null
  summary: string | null
  status: string
  /** 当前用户是否关注了这部番（任意发布组）。 */
  followed: boolean
  /** 当前用户关注了哪些发布组；空串表示「该番任意发布组」。 */
  followedGroups: string[]
}

/** 某番一个发布组的更新概况（详情面板用）。 */
export interface AnimeGroup {
  groupName: string
  count: number
  latestEpisodeNo: number | null
  latestPublishedAt: number
}

/** 番剧详情：本体 + 各发布组的更新概况。 */
export interface AnimeSeriesDetail {
  series: AnimeSeries
  groups: AnimeGroup[]
}

/** 一条发布记录。 */
export interface AnimeRelease {
  id: number
  guid: string
  seriesId: number | null
  seriesTitle: string
  groupName: string
  title: string
  episodeNo: number | null
  category: string
  torrentUrl: string | null
  detailUrl: string | null
  /** pending / matched / unmatched / ai-unmatched / ignored。 */
  matchState: string
  publishedAt: number
}

/** 一条关注；`groupName` 为空串表示该番任意发布组。 */
export interface AnimeSubscription {
  id: number
  seriesId: number
  seriesTitle: string
  cover: string | null
  groupName: string
  enabled: boolean
}

/** 更新历史的一页。 */
export interface AnimeReleasePage {
  items: AnimeRelease[]
  total: number
}

/** SSE `anime.release` 事件体。 */
export interface AnimeReleaseEvent {
  releaseId: number
  seriesId: number
  seriesTitle: string
  groupName: string
  title: string
  episodeNo: number | null
  torrentUrl: string | null
  detailUrl: string | null
  publishedAt: number
}

/**
 * 封面取图地址：后端回源的大图经 `/res/anime-cover?id=&size=` 按需缩图。
 * `size` 是最长边档位；还没回源（仍是原始 URL）时原样返回。
 */
export function coverSrc(cover: string | null | undefined, size = 256): string | undefined {
  if (!cover) return undefined
  const matched = /^\/res\/resources\/anime\/cover\/(\d+)\.jpg$/.exec(cover)
  return matched ? `${getRoot()}/res/anime-cover?id=${matched[1]}&size=${size}` : cover
}

/** 番组表：`weekday` / `season` 为空则取全部。 */
export function animeTimetable(weekday?: number, season?: string): Promise<AnimeSeries[]> {
  return get<AnimeSeries[]>('/anime/timetable', { weekday, season })
}

/** 关键词搜索番剧（用于关注）。 */
export function animeSearch(keyword: string): Promise<AnimeSeries[]> {
  return get<AnimeSeries[]>('/anime/search', { q: keyword })
}

/** 番详情：本体 + 各发布组更新概况。 */
export function animeSeriesDetail(id: number): Promise<AnimeSeriesDetail> {
  return get<AnimeSeriesDetail>(`/anime/series/${id}`)
}

/** 更新历史（分页）；都不给则取全站最新。 */
export function animeReleases(params: {
  seriesId?: number
  groupName?: string
  offset?: number
  limit?: number
}): Promise<AnimeReleasePage> {
  return get<AnimeReleasePage>('/anime/releases', params)
}

/** 我的关注。 */
export function animeSubscriptions(): Promise<AnimeSubscription[]> {
  return get<AnimeSubscription[]>('/anime/subscriptions')
}

/** 新建 / 更新关注。 */
export function saveAnimeSubscription(body: {
  seriesId: number
  groupName?: string
  enabled?: boolean
}): Promise<{ message: string }> {
  return post<{ message: string }>('/anime/subscription/save', body)
}

/** 取消关注（按 id 或按 (番, 组) 定位）；软删。 */
export function deleteAnimeSubscription(body: {
  id?: number
  seriesId?: number
  groupName?: string
}): Promise<{ message: string }> {
  return post<{ message: string }>('/anime/subscription/delete', body)
}

/** 手动把一条发布映射到番剧；`alias` 非空时追加一条手动别名。 */
export function mapAnimeRelease(body: {
  releaseId: number
  seriesId: number
  alias?: string
}): Promise<{ message: string }> {
  return post<{ message: string }>('/anime/release/map', body)
}

/** 对全部「未识别」发布跑一轮 AI 匹配。 */
export function rematchAnimeReleases(): Promise<{ message: string }> {
  return post<{ message: string }>('/anime/release/rematch')
}

/** 手动同步 Bangumi 番剧目录。 */
export function refreshAnimeSeries(): Promise<{ message: string }> {
  return post<{ message: string }>('/anime/series/refresh')
}

/** 立即触发一次 RSS 拉取（排障用）。 */
export function pollAnimeFeed(): Promise<{ message: string }> {
  return post<{ message: string }>('/anime/feed/poll')
}
