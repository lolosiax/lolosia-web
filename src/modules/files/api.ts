import { apiBaseUrl, get, post, request } from '@/core/lib/http'
import type { ApiEnvelope } from '@/core/lib/http'

/** 媒体评级：合规闸门，不是标签。 */
export type MediaRating = 'unknown' | 'safe' | 'questionable' | 'explicit'

export function needsBlur(rating?: string): boolean {
  return rating === 'questionable' || rating === 'explicit'
}

export function isVideo(entry: FileEntry): boolean {
  return entry.mime.startsWith('video/')
}

export function isViewable(entry: FileEntry): boolean {
  return entry.image || isVideo(entry)
}

export const RATING_LABELS: { value: MediaRating; label: string }[] = [
  { value: 'unknown', label: '未定级' },
  { value: 'safe', label: '安全' },
  { value: 'questionable', label: '擦边' },
  { value: 'explicit', label: '露骨（不外发）' }
]

export interface MediaTagRef {
  namespace: string
  name: string
}

export interface FileEntry {
  name: string
  /** 相对浏览根的路径，根目录是空串。 */
  path: string
  directory: boolean
  size: number
  /** 修改时间（毫秒）。 */
  mtime: number
  ext: string
  mime: string
  image: boolean
  thumb: boolean
  hasChildren: boolean
  /** 只有 `/files/dirs` 填。 */
  hasSubdirs: boolean
  rating: MediaRating
  indexed: boolean
  /** 8×8 采样，每像素 4 位十六进制（RGB565 大端），共 256 字符。 */
  sample: string
  takenAt: number
  exp: number
  sig: string
  tags: MediaTagRef[]
}

export const FAVORITE_TAG: MediaTagRef = { namespace: 'feature', name: '喜欢' }
export const NO_CROP_TAG: MediaTagRef = { namespace: 'feature', name: '不裁剪' }

function hasTag(entry: { tags?: MediaTagRef[] }, tag: MediaTagRef): boolean {
  return Boolean(entry.tags?.some(item => item.namespace === tag.namespace && item.name === tag.name))
}

export function isFavorite(entry: { tags?: MediaTagRef[] }): boolean {
  return hasTag(entry, FAVORITE_TAG)
}

export function isNoCrop(entry: { tags?: MediaTagRef[] }): boolean {
  return hasTag(entry, NO_CROP_TAG)
}

export interface FileListResult {
  path: string
  parent: string | null
  entries: FileEntry[]
}

export interface FileDetail {
  entry: FileEntry
  width: number | null
  height: number | null
  thumbs: number[]
}

export type FileSortKey = 'name' | 'size' | 'mtime' | 'type'
export type FileSortOrder = 'asc' | 'desc'

export function listFiles(path: string, sort: FileSortKey, order: FileSortOrder): Promise<FileListResult> {
  return get<FileListResult>('files/list', { path, sort, order })
}

export function listDirs(path: string): Promise<FileEntry[]> {
  return get<FileEntry[]>('files/dirs', { path })
}

export function fileDetail(path: string): Promise<FileDetail> {
  return get<FileDetail>('files/detail', { path })
}

export function scanDir(path: string): Promise<{ message: string }> {
  return post<{ message: string }>('files/scan', { path })
}

export function regenerateThumbs(paths: string[]): Promise<{ message: string }> {
  return post<{ message: string }>('files/thumb/regenerate', { paths })
}

export interface FileOpResult {
  path: string
  name: string
}

export function renameEntry(path: string, name: string): Promise<FileOpResult> {
  return post<FileOpResult>('files/rename', { path, name })
}

export function mkdirFolder(path: string, name: string): Promise<FileOpResult> {
  return post<FileOpResult>('files/mkdir', { path, name })
}

export function deleteEntry(path: string): Promise<FileOpResult> {
  return post<FileOpResult>('files/delete', { path })
}

export interface FileTransferItem {
  from: string
  path: string
  name: string
}

export interface FileTransferResult {
  items: FileTransferItem[]
  failed: string[]
}

export function copyEntries(paths: string[], dest: string): Promise<FileTransferResult> {
  return post<FileTransferResult>('files/copy', { paths, dest })
}

export function moveEntries(paths: string[], dest: string): Promise<FileTransferResult> {
  return post<FileTransferResult>('files/move', { paths, dest })
}

/** 单文件上传：请求体是裸文件，后端边收边写；大文件不设超时。 */
export async function uploadEntry(
  dir: string,
  file: File,
  onProgress?: (loaded: number) => void
): Promise<FileOpResult> {
  const body = await request<ApiEnvelope<FileOpResult>>({
    url: 'files/upload',
    method: 'post',
    timeout: 0,
    params: { path: dir, name: file.name },
    data: file,
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
    onUploadProgress: event => onProgress?.(event.loaded)
  })
  return body.data
}

/*
 * 签名直链：`<img>` / `<video>` 带不了 Authorization 头，后端校验 exp + sig。
 * token 只用于换源绕缓存，不参与签名。
 */
function signedUrl(kind: 'thumb' | 'raw', entry: FileEntry, query: string, token?: number): string {
  const bust = token ? `&t=${token}` : ''
  return `${apiBaseUrl}files/${kind}?path=${encodeURIComponent(entry.path)}${query}&exp=${entry.exp}&sig=${entry.sig}${bust}`
}

export function thumbUrl(entry: FileEntry, size: number, token?: number): string {
  return signedUrl('thumb', entry, `&size=${size}`, token)
}

export function previewUrl(entry: FileEntry, token?: number): string {
  return signedUrl('thumb', entry, '&size=full', token)
}

export function rawUrl(entry: FileEntry, token?: number): string {
  return signedUrl('raw', entry, '', token)
}

/* ------------------------------ 媒体索引 ------------------------------ */

export interface MediaExifItem {
  key: string
  value: string
}

export interface MediaTagItem {
  id: number
  namespace: string
  name: string
  parentId: number | null
  count: number
  source: string
  negative: boolean
}

export interface MediaGps {
  latitude: number
  longitude: number
}

export interface MediaDetail {
  path: string
  name: string
  kind: string
  size: number
  mtime: number
  width: number | null
  height: number | null
  durationMs: number | null
  rating: MediaRating
  ratingSource: string | null
  analysisSkip: boolean
  caption: string | null
  captionSource: string | null
  takenAt: number | null
  takenAtLocal: string | null
  takenAtOffsetMin: number | null
  cameraMake: string | null
  cameraModel: string | null
  lens: string | null
  aperture: number | null
  exposureTime: string | null
  iso: number | null
  focalLength: number | null
  orientation: number | null
  sample: string
  gps: MediaGps | null
  metadata: MediaExifItem[]
  tags: MediaTagItem[]
  indexed: boolean
  exp: number
  sig: string
}

export interface MediaPropertyReq {
  path: string
  rating?: MediaRating
  analysisSkip?: boolean
  caption?: string
}

export interface MediaPropertyApplyReq {
  path: string
  recursive?: boolean
  rating?: MediaRating
  analysisSkip?: boolean
}

export interface MediaTagsReq {
  path: string
  tags: MediaTagRef[]
}

export function mediaDetail(path: string): Promise<MediaDetail> {
  return get<MediaDetail>('media/detail', { path })
}

export function saveMediaProperty(body: MediaPropertyReq): Promise<{ message: string }> {
  return post<{ message: string }>('media/property/save', body)
}

export function applyMediaProperty(body: MediaPropertyApplyReq): Promise<{ message: string }> {
  return post<{ message: string }>('media/property/apply', body)
}

export function scanMediaIndex(path: string): Promise<{ message: string }> {
  return post<{ message: string }>('media/index/scan', { path })
}

export function attachMediaTags(body: MediaTagsReq): Promise<{ message: string }> {
  return post<{ message: string }>('media/tags/attach', body)
}

export function detachMediaTags(body: MediaTagsReq): Promise<{ message: string }> {
  return post<{ message: string }>('media/tags/detach', body)
}

export function denyMediaTags(body: MediaTagsReq): Promise<{ message: string }> {
  return post<{ message: string }>('media/tags/deny', body)
}

export function folderTags(path: string): Promise<MediaTagItem[]> {
  return get<MediaTagItem[]>('media/folder-tags', { path })
}

export function attachFolderTags(body: MediaTagsReq): Promise<{ message: string }> {
  return post<{ message: string }>('media/folder-tags/attach', body)
}

export function detachFolderTags(body: MediaTagsReq): Promise<{ message: string }> {
  return post<{ message: string }>('media/folder-tags/detach', body)
}

export function tagVocabulary(): Promise<MediaTagItem[]> {
  return get<MediaTagItem[]>('media/tags')
}

export function directoryTags(path: string): Promise<MediaTagItem[]> {
  return get<MediaTagItem[]>('media/dir-tags', { path })
}

export function analyzeMediaIndex(path: string, recursive = true, reanalyze = false): Promise<{ message: string }> {
  return post<{ message: string }>('media/analyze/start', { path, recursive, reanalyze })
}

export interface MediaFolderRemark {
  path: string
  remark: string
}

export function folderRemark(path: string): Promise<MediaFolderRemark> {
  return get<MediaFolderRemark>('media/folder-remark', { path })
}

export function saveFolderRemark(path: string, remark: string): Promise<{ message: string }> {
  return post<{ message: string }>('media/folder-remark/save', { path, remark })
}
