import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { permissionCatalog } from '@/core/api/permission'
import type { PermissionCatalogEntry, PermissionRules } from '@/core/api/permission'

interface RulesTarget {
  title: string
  load: () => Promise<PermissionRules>
  save: (rules: string[]) => Promise<void>
}

/** 角色 / 用户共用的权限规则编辑器：打开时并行读规则与可选节点。 */
export function useRulesEditor() {
  const visible = ref(false)
  const saving = ref(false)
  const title = ref('权限规则')
  const rules = ref<string[]>([])
  const catalog = ref<PermissionCatalogEntry[]>([])

  let target: RulesTarget | null = null

  async function open(next: RulesTarget): Promise<void> {
    target = next
    title.value = next.title
    visible.value = true
    const [current, entries] = await Promise.all([
      next.load(),
      permissionCatalog().catch((error: unknown) => {
        console.warn('[permission] 读取权限目录失败，只能手输规则', error)
        return [] as PermissionCatalogEntry[]
      })
    ])
    rules.value = current.rules ?? []
    catalog.value = entries
  }

  async function save(nextRules: string[]): Promise<void> {
    if (!target) return
    saving.value = true
    try {
      await target.save(nextRules)
      ElMessage.success('权限规则已保存')
      visible.value = false
    } finally {
      saving.value = false
    }
  }

  return { visible, saving, title, rules, catalog, open, save }
}
