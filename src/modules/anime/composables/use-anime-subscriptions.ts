import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { animeSubscriptions, deleteAnimeSubscription, saveAnimeSubscription } from '../api'
import type { AnimeSubscription } from '../api'

/** 我的关注：列表、开关与取消关注。 */
export function useAnimeSubscriptions() {
  const items = ref<AnimeSubscription[]>([])
  const loading = ref(false)

  async function load(): Promise<void> {
    loading.value = true
    try {
      items.value = await animeSubscriptions()
    } catch {
      // 接口不可用：保留上一次的取值
    } finally {
      loading.value = false
    }
  }

  /** 拨开关即时写库；失败就重拉还原。 */
  async function toggle(sub: AnimeSubscription, value: boolean | string | number): Promise<void> {
    const enabled = value === true || value === 'true'
    try {
      await saveAnimeSubscription({ seriesId: sub.seriesId, groupName: sub.groupName, enabled })
      sub.enabled = enabled
    } catch {
      await load()
    }
  }

  async function remove(sub: AnimeSubscription): Promise<void> {
    try {
      await deleteAnimeSubscription({ id: sub.id })
      ElMessage.success('已取消关注')
      await load()
    } catch {
      // 拦截器已提示
    }
  }

  onMounted(() => void load())

  return { items, loading, load, toggle, remove }
}
