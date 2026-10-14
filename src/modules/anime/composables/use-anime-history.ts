import { onBeforeUnmount, ref } from 'vue'
import { onSseEvent } from '@/core/lib/sse'
import { animeReleases } from '../api'
import type { AnimeRelease, AnimeReleaseEvent } from '../api'
import { releaseFromEvent } from '../lib'

const PAGE_SIZE = 50

/** 更新历史：分页拉取，SSE 命中的新发布插到头部并去重。 */
export function useAnimeHistory() {
  const items = ref<AnimeRelease[]>([])
  const loading = ref(false)
  const page = ref(1)
  const total = ref(0)

  async function load(): Promise<void> {
    loading.value = true
    try {
      const result = await animeReleases({
        offset: (page.value - 1) * PAGE_SIZE,
        limit: PAGE_SIZE
      })
      items.value = result.items
      total.value = result.total
    } catch {
      // 接口不可用：保留上一次的取值
    } finally {
      loading.value = false
    }
  }

  function go(next: number): void {
    page.value = next
    void load()
  }

  /** 实时事件：只处理当前页，已有同 id 则忽略。 */
  function onRelease(event: AnimeReleaseEvent): void {
    if (items.value.some(item => item.id === event.releaseId)) return
    items.value.unshift(releaseFromEvent(event))
    total.value += 1
  }

  const off = onSseEvent('anime.release', payload => onRelease(payload as AnimeReleaseEvent))
  onBeforeUnmount(off)

  return { items, loading, page, total, pageSize: PAGE_SIZE, load, go, onRelease }
}
