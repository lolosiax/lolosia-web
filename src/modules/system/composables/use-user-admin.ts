import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { createUser, deleteUsers, updateUser, userList } from '@/core/api/user'
import type { UserCreatePayload, UserListRow, UserUpdatePayload } from '@/core/api/user'
import { confirmAction } from '@/core/composables/use-dialog'

/** 用户管理页的状态与副作用（页面只负责编排）。 */
export function useUserAdmin() {
  const rows = ref<UserListRow[]>([])
  const total = ref(0)
  const loading = ref(false)
  const saving = ref(false)
  const query = reactive({ pageNo: 1, pageSize: 10, keys: '' })

  const editing = ref<UserListRow | null>(null)
  const editVisible = ref(false)

  async function load(): Promise<void> {
    loading.value = true
    try {
      const page = await userList({
        pageNo: query.pageNo,
        pageSize: query.pageSize,
        keys: query.keys || null
      })
      rows.value = page.data ?? []
      total.value = page.total ?? 0
    } finally {
      loading.value = false
    }
  }

  function search(): void {
    query.pageNo = 1
    void load()
  }

  function openCreate(): void {
    editing.value = null
    editVisible.value = true
  }

  function openEdit(row: UserListRow): void {
    editing.value = row
    editVisible.value = true
  }

  async function save(payload: UserCreatePayload | UserUpdatePayload): Promise<void> {
    saving.value = true
    try {
      if ('id' in payload) await updateUser(payload)
      else await createUser(payload)
      ElMessage.success('保存成功')
      editVisible.value = false
      await load()
    } finally {
      saving.value = false
    }
  }

  async function remove(row: UserListRow): Promise<void> {
    if (!(await confirmAction(`确定删除用户「${row.userName}」吗？`, '删除用户'))) return
    await deleteUsers([row.id])
    ElMessage.success('删除成功')
    await load()
  }

  return {
    rows,
    total,
    loading,
    saving,
    query,
    editing,
    editVisible,
    load,
    search,
    openCreate,
    openEdit,
    save,
    remove
  }
}
