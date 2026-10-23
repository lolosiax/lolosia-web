/** 背景渲染层需要的一张卡片矩形（CSS 像素，原点为视口左上角）。 */
export interface SceneCard {
  x: number
  y: number
  w: number
  h: number
}

/** 卡片主题色，`[r, g, b]`，取值 0-1。 */
export type SceneColor = [number, number, number]

export type SceneBackend = 'webgpu' | 'webgl2' | 'canvas2d'

export interface SceneHandle {
  readonly backend: SceneBackend
  setCards(cards: SceneCard[]): void
  setPointer(x: number, y: number): void
  resize(width: number, height: number, dpr: number): void
  dispose(): void
}

export interface SceneOptions {
  cards: SceneCard[]
  colors: SceneColor[]
}

export interface SceneResult {
  handle: SceneHandle
  backend: SceneBackend
}

/** 把 `"125, 142, 209"` 解析成 0-1 的三元组，失败时退回淡紫。 */
export function parseRgb(rgb: string): SceneColor {
  const parts = rgb.split(',').map(part => Number.parseFloat(part.trim()) / 255)
  if (parts.length !== 3 || parts.some(Number.isNaN)) return [0.76, 0.59, 0.8]
  return [parts[0] ?? 0.76, parts[1] ?? 0.59, parts[2] ?? 0.8]
}
