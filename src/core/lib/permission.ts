/**
 * 权限串匹配（与后端 `Permissions.granted` 同语义）。
 *
 * 规则写法：`a.b.c` 允许、`-a.b.c` 拒绝、`a.b.*` 前缀通配、`*` 全部；负号优先。
 */
function matches(rule: string, node: string): boolean {
  if (rule === '*') return true
  if (rule.endsWith('.*')) {
    return node.startsWith(rule.slice(0, -1)) || node === rule.slice(0, -2)
  }
  return rule === node
}

/** 当前用户是否拥有某个权限节点。`rules` 来自 `/user/myRole` 的 `rules`。 */
export function isAllowed(rules: readonly string[] | null | undefined, node: string): boolean {
  if (!rules?.length) return false

  let granted = false
  for (const raw of rules) {
    const deny = raw.startsWith('-')
    const rule = raw.startsWith('-') || raw.startsWith('+') ? raw.slice(1) : raw
    if (!matches(rule, node)) continue
    if (deny) return false
    granted = true
  }
  return granted
}
