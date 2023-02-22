/**
 * 最近一次鼠标按下的位置，用于路由过渡动画的圆形展开起点。
 * 用捕获阶段的 pointerdown 记录：它会在任何点击回调（router.push）之前触发。
 */
let lastPointer: { x: number; y: number; t: number } | null = null

/** 点击坐标的有效期（毫秒）；过期视为浏览器前进/后退，退回屏幕中心。 */
const ORIGIN_TTL = 1500

function trackPointer(event: PointerEvent): void {
  lastPointer = { x: event.clientX, y: event.clientY, t: Date.now() }
}

if (typeof window !== 'undefined') {
  window.addEventListener('pointerdown', trackPointer, { capture: true, passive: true })
}

export function setTransitionOrigin(x: number, y: number): void {
  document.documentElement.style.setProperty('--transition-origin-x', `${x}px`)
  document.documentElement.style.setProperty('--transition-origin-y', `${y}px`)
}

/** 导航开始时调用：刚点过鼠标就从点击处展开，否则从屏幕中心展开。 */
export function applyTransitionOrigin(): void {
  if (lastPointer && Date.now() - lastPointer.t < ORIGIN_TTL) {
    setTransitionOrigin(lastPointer.x, lastPointer.y)
    return
  }
  setTransitionOrigin(window.innerWidth / 2, window.innerHeight / 2)
}
