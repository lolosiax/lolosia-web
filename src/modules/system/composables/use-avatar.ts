import { computed, ref, useTemplateRef } from 'vue'
import { ElMessage } from 'element-plus'
import { setAvatar } from '@/core/api/user'
import { useAuthStore } from '@/core/stores/auth'

/** 头像上限 2MB，避免把库撑大。 */
const MAX_SIZE = 2 * 1024 * 1024

/** 个人中心头像：选择文件 → 上传 → 用版本号刷新缓存。 */
export function useAvatar() {
  const auth = useAuthStore()
  const fileInput = useTemplateRef<HTMLInputElement>('fileInput')
  const avatarFailed = ref(false)
  const uploading = ref(false)

  const showAvatar = computed(() => Boolean(auth.avatarUrl) && !avatarFailed.value)

  function pick(): void {
    fileInput.value?.click()
  }

  function validate(file: File): boolean {
    if (!file.type.startsWith('image/')) {
      ElMessage.warning('请选择图片文件')
      return false
    }
    if (file.size > MAX_SIZE) {
      ElMessage.warning('头像不能超过 2MB')
      return false
    }
    return true
  }

  async function upload(file: File): Promise<void> {
    const id = auth.userInfo?.id
    if (!id) return

    uploading.value = true
    try {
      await setAvatar(id, file)
      avatarFailed.value = false
      auth.refreshAvatar()
      ElMessage.success('头像已更新')
    } finally {
      uploading.value = false
    }
  }

  function onChange(event: Event): void {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    if (file && validate(file)) void upload(file)
    input.value = ''
  }

  return { fileInput, avatarFailed, uploading, showAvatar, pick, onChange }
}
