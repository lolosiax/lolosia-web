import useClipboard from 'vue-clipboard3'
import { ElMessage } from 'element-plus'

/** 复制文本；失败时抛错由调用方决定提示。 */
export async function copyText(value: string): Promise<void> {
  const { toClipboard } = useClipboard()
  await toClipboard(value)
}

/** 复制并给一条成功提示，用于列表里的“复制”按钮。 */
export async function copyTextWithToast(value: string, message = '复制成功'): Promise<void> {
  await copyText(value)
  ElMessage.success(message)
}
