import { ref } from 'vue'
import { ElMessageBox } from 'element-plus'

/** 弹窗开关。 */
export function useDialog(initial = false) {
  const visible = ref(initial)

  function open(): void {
    visible.value = true
  }

  function close(): void {
    visible.value = false
  }

  function toggle(): void {
    visible.value = !visible.value
  }

  return { visible, open, close, toggle }
}

/** 二次确认；确认返回 true，取消返回 false。 */
export async function confirmAction(message: string, title = '确认'): Promise<boolean> {
  try {
    await ElMessageBox.confirm(message, title, {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    return true
  } catch {
    return false
  }
}
