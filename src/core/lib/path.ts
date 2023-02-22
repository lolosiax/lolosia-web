const EXTERNAL_REGEX = /^(https?:|mailto:|tel:)/u

/** 是否站外链接（`<a target="_blank">`）。 */
export function isExternal(path: string): boolean {
  return EXTERNAL_REGEX.test(path)
}

/** 拼路由子路径；绝对路径与站外链接原样返回。 */
export function joinPath(basePath: string, path: string): string {
  if (isExternal(path) || path.startsWith('/')) return path
  const base = basePath.replace(/\/+$/u, '')
  const suffix = path.replace(/^\/+/u, '')
  if (!base) return `/${suffix}`
  return `${base}/${suffix}`.replace(/\/{2,}/gu, '/')
}
