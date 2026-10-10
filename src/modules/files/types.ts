import type { FileEntry, FileSortKey, FileSortOrder, MediaTagRef } from './api'

/** 带缓存版本号的条目：SSE 重签后自增，驱动缩略图换源。 */
export interface UiEntry extends FileEntry {
  thumbToken?: number
}

export type FileView = 'grid' | 'list'
export type FileGroup = 'none' | 'year' | 'month' | 'favorite'
export type NsfwMode = 'blur' | 'always'

export interface EntryGroup {
  key: string
  label: string
  entries: UiEntry[]
}

export interface GroupTag extends MediaTagRef {
  count: number
}

export interface TagRow extends MediaTagRef {
  key: string
  /** 多选聚合时给出的项数；单选没有这个值。 */
  count?: number
  negative?: boolean
  title: string
}

export interface FilesPrefs {
  view: FileView
  sort: FileSortKey
  order: FileSortOrder
  previewOpen: boolean
  nsfwMode: NsfwMode
}
