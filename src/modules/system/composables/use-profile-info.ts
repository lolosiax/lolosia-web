import { computed, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getMyInfo, updateUser } from '@/core/api/user'
import { isAllowed } from '@/core/lib/permission'
import { useAuthStore } from '@/core/stores/auth'

/** 个人资料：是否可改由后端权限节点决定（普通用户只读）。 */
export function useProfileInfo() {
  const auth = useAuthStore()
  const editing = ref(false)
  const saving = ref(false)
  const form = reactive({ realName: '', phone: '', email: '' })

  const canEdit = computed(() => isAllowed(auth.role?.rules, 'lolosia.user.write'))

  function start(): void {
    form.realName = auth.userInfo?.realName ?? ''
    form.phone = auth.userInfo?.phone ?? ''
    form.email = auth.userInfo?.email ?? ''
    editing.value = true
  }

  function cancel(): void {
    editing.value = false
  }

  async function save(): Promise<void> {
    const id = auth.userInfo?.id
    if (!id) return

    saving.value = true
    try {
      await updateUser({
        id,
        realName: form.realName || null,
        phone: form.phone || null,
        email: form.email || null
      })
      auth.patchUserInfo(await getMyInfo())
      editing.value = false
      ElMessage.success('资料已更新')
    } finally {
      saving.value = false
    }
  }

  return { editing, saving, form, canEdit, start, cancel, save }
}
