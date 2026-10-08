import type { InjectionKey } from 'vue'
import type { FileEntry } from './api'

/** 目录树共享上下文：子项缓存、展开态与拖拽落点。 */
export interface FileTreeContext {
  childrenMap: Record<string, FileEntry[]>
  expanded: Set<string>
  loading: Set<string>
  toggle: (path: string) => void
  dropPath: { current: string | null }
}

export const FILE_TREE_KEY: InjectionKey<FileTreeContext> = Symbol('fileTree')
