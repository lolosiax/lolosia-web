import { ElMessage } from 'element-plus'

/** 拖进来的是不是文件；拖页内文本 / 链接时返回 false，免得抢掉浏览器默认行为。 */
export function hasFiles(event: DragEvent): boolean {
  return Array.from(event.dataTransfer?.types ?? []).includes('Files')
}

/** 取出真正要上传的文件；整目录拖拽当前不支持，明确提示而不是传一个 0 字节文件。 */
export function collectFiles(data: DataTransfer | null): File[] {
  if (!data) return []
  const entries = Array.from(data.items ?? []).map(item => item.webkitGetAsEntry?.() ?? null)
  if (entries.some(entry => entry?.isDirectory)) {
    ElMessage.warning('暂不支持拖拽整个文件夹，请先进去再拖里面的文件')
    return []
  }
  return Array.from(data.files)
}
