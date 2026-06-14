/**
 * 记录路由过渡动画的起点坐标（鼠标点击位置）
 */
export function setTransitionOrigin(x: number, y: number) {
  document.documentElement.style.setProperty('--transition-origin-x', `${x}px`)
  document.documentElement.style.setProperty('--transition-origin-y', `${y}px`)
}