import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { createRole, destroyRole, roleList, rolePage, updateRole } from '@/core/api/role'
import type { RoleCreatePayload, RoleRow, RoleUpdatePayload } from '@/core/api/role'
import { confirmAction } from '@/core/composables/use-dialog'

/** 角色（权限组）管理页的状态与副作用。 */
export function useRoleAdmin() {
  const rows = ref<RoleRow[]>([])
  const total = ref(0)
  const loading = ref(false)
  const saving = ref(false)
  const query = reactive({ pageNo: 1, pageSize: 10, roleName: '' })

  /** 下拉/父组选择用的全量列表。 */
  const allRoles = ref<RoleRow[]>([])
  const editing = ref<RoleRow | null>(null)
  const editVisible = ref(false)

  async function load(): Promise<void> {
    loading.value = true
    try {
      const page = await rolePage({
        pageNo: query.pageNo,
        pageSize: query.pageSize,
        roleName: query.roleName || null
      })
      rows.value = page.rows ?? []
      total.value = page.total ?? 0
    } finally {
      loading.value = false
    }
  }

  async function loadAll(): Promise<void> {
    allRoles.value = await roleList()
  }

  function search(): void {
    query.pageNo = 1
    void load()
  }

  function openCreate(): void {
    editing.value = null
    editVisible.value = true
  }

  function openEdit(row: RoleRow): void {
    editing.value = row
    editVisible.value = true
  }

  async function save(payload: RoleCreatePayload | RoleUpdatePayload): Promise<void> {
    saving.value = true
    try {
      if ('id' in payload) await updateRole(payload)
      else await createRole(payload)
      ElMessage.success('保存成功')
      editVisible.value = false
      await Promise.all([load(), loadAll()])
    } finally {
      saving.value = false
    }
  }

  async function remove(row: RoleRow): Promise<void> {
    if (!(await confirmAction(`确定删除权限组「${row.roleName ?? row.id}」吗？`, '删除权限组'))) return
    await destroyRole(row.id)
    ElMessage.success('删除成功')
    await Promise.all([load(), loadAll()])
  }

  return {
    rows,
    total,
    loading,
    saving,
    query,
    allRoles,
    editing,
    editVisible,
    load,
    loadAll,
    search,
    openCreate,
    openEdit,
    save,
    remove
  }
}
