import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { pollAnimeFeed, refreshAnimeSeries, rematchAnimeReleases } from '../api'

/** 目录维护 / 立即拉取 / AI 兜底匹配；成功后调用 `reload` 刷新页面数据。 */
export function useAnimeAdmin(reload: () => void) {
  const syncing = ref(false)
  const polling = ref(false)
  const rematching = ref(false)

  async function sync(): Promise<void> {
    syncing.value = true
    try {
      const result = await refreshAnimeSeries()
      ElMessage.success(result.message || '同步完成')
      reload()
    } catch {
      // 拦截器已提示
    } finally {
      syncing.value = false
    }
  }

  async function poll(): Promise<void> {
    polling.value = true
    try {
      const result = await pollAnimeFeed()
      ElMessage.success(result.message || '拉取完成')
      reload()
    } catch {
      // 拦截器已提示
    } finally {
      polling.value = false
    }
  }

  async function rematch(): Promise<void> {
    rematching.value = true
    try {
      const result = await rematchAnimeReleases()
      ElMessage.success(result.message || 'AI 匹配完成')
      reload()
    } catch {
      // 拦截器已提示
    } finally {
      rematching.value = false
    }
  }

  return { syncing, polling, rematching, sync, poll, rematch }
}
