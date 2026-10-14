<script setup lang="ts">
// 番剧详情抽屉：本体信息 + 各发布组更新概况 + 最近发布 + 关注操作。
//
// 关注粒度是 (番剧, 发布组)：`groupName` 为空串表示「该番任意发布组」。
// 每次关注 / 取关都按最新详情重载，避免本地状态与后端不一致。
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { animeReleases, animeSeriesDetail, coverSrc, deleteAnimeSubscription, saveAnimeSubscription } from '../api'
import type { AnimeRelease, AnimeSeriesDetail } from '../api'
import FollowToggle from './FollowToggle.vue'
import GroupRow from './GroupRow.vue'
import ReleaseRow from './ReleaseRow.vue'
import SeriesFacts from './SeriesFacts.vue'

defineOptions({ name: 'SeriesDetailDrawer' })

const props = defineProps<{
  modelValue: boolean
  seriesId: number | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'changed'): void
}>()

const RELEASE_LIMIT = 30

const visible = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value)
})

const loading = ref(false)
const acting = ref(false)
const detail = ref<AnimeSeriesDetail | null>(null)
const releases = ref<AnimeRelease[]>([])
const coverFailed = ref(false)

const series = computed(() => detail.value?.series ?? null)
const groups = computed(() => detail.value?.groups ?? [])
/** 是否已关注「任意发布组」。 */
const anyFollowed = computed(() => series.value?.followedGroups.includes('') ?? false)

function isGroupFollowed(name: string): boolean {
  return series.value?.followedGroups.includes(name) ?? false
}

async function load(): Promise<void> {
  const id = props.seriesId
  if (!id) return
  // 切到另一部番时先清空旧详情，避免上一部番的封面/标题先占位（切图闪烁）
  if (detail.value?.series.id !== id) {
    detail.value = null
    releases.value = []
  }
  loading.value = true
  coverFailed.value = false
  try {
    const [value, page] = await Promise.all([
      animeSeriesDetail(id),
      animeReleases({ seriesId: id, limit: RELEASE_LIMIT }).catch(() => ({ items: [] as AnimeRelease[], total: 0 }))
    ])
    detail.value = value
    releases.value = page.items
  } catch {
    // 拦截器已提示
  } finally {
    loading.value = false
  }
}

/** 关注 / 取关 (番, 组)；`groupName` 为空串即「任意发布组」。 */
async function toggleFollow(groupName: string): Promise<void> {
  const id = props.seriesId
  if (!id || acting.value) return
  acting.value = true
  try {
    if (isGroupFollowed(groupName)) {
      await deleteAnimeSubscription({ seriesId: id, groupName })
      ElMessage.success(groupName ? `已取消关注「${groupName}」` : '已取消关注整部番')
    } else {
      await saveAnimeSubscription({ seriesId: id, groupName })
      ElMessage.success(groupName ? `已关注「${groupName}」` : '已关注整部番（任意发布组）')
    }
    await load()
    emit('changed')
  } catch {
    // 拦截器已提示
  } finally {
    acting.value = false
  }
}

/** 收到实时事件时刷新本番的发布列表。 */
function onRelease(): void {
  if (props.modelValue) void load()
}
defineExpose({ onRelease })

watch([() => props.modelValue, () => props.seriesId], ([open]) => {
  if (open) void load()
})
</script>

<template>
  <ElDrawer v-model="visible" :size="600" append-to-body :title="series?.title || '番剧详情'">
    <div v-if="series" v-loading="loading" class="detail">
      <header class="head">
        <div class="head__cover">
          <img
            v-if="series.cover && !coverFailed"
            :key="series.id"
            :src="coverSrc(series.cover, 512)"
            :alt="series.title"
            @error="coverFailed = true"
          />
          <div v-else class="head__fallback">无封面</div>
        </div>
        <div class="head__main">
          <h3>{{ series.title }}</h3>
          <p v-if="series.titleOriginal" class="head__original">{{ series.titleOriginal }}</p>
          <SeriesFacts :series="series" />
          <p v-if="series.summary" class="head__summary">{{ series.summary }}</p>
        </div>
      </header>

      <section class="block">
        <span class="block__title"><i class="bi bi-bell" />关注</span>
        <FollowToggle :followed="anyFollowed" :loading="acting" @toggle="toggleFollow('')" />
      </section>

      <section class="block">
        <span class="block__title"><i class="bi bi-people" />发布组（{{ groups.length }}）</span>
        <ElEmpty v-if="!groups.length" description="暂无发布记录" :image-size="70" />
        <ul v-else class="list">
          <GroupRow
            v-for="group in groups"
            :key="group.groupName"
            :group="group"
            :followed="isGroupFollowed(group.groupName)"
            :acting="acting"
            @toggle="toggleFollow(group.groupName)"
          />
        </ul>
      </section>

      <section class="block">
        <span class="block__title"><i class="bi bi-clock-history" />最近发布</span>
        <ElEmpty v-if="!releases.length" description="暂无发布记录" :image-size="70" />
        <ul v-else class="list">
          <ReleaseRow v-for="release in releases" :key="release.id" :release="release" />
        </ul>
      </section>
    </div>
    <ElEmpty v-else-if="!loading" description="未找到该番剧" />
  </ElDrawer>
</template>

<style scoped lang="scss">
.detail {
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-height: 200px;
}

.head {
  display: flex;
  gap: 14px;

  &__cover {
    flex: 0 0 108px;
    width: 108px;
    height: 150px;
    overflow: hidden;
    border-radius: 12px;
    background: rgba(164, 128, 171, 0.12);

    img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__fallback {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    color: #a99cae;
    font-size: 12px;
    background: linear-gradient(135deg, rgba(164, 128, 171, 0.16), rgba(138, 169, 224, 0.16));
  }

  &__main {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 8px;
    min-width: 0;

    h3 {
      margin: 0;
      color: #3d2f42;
      font-size: 18px;
    }
  }

  &__original {
    margin: 0;
    color: #8d7f92;
    font-size: 12px;
  }

  &__summary {
    max-height: 96px;
    margin: 0;
    overflow-y: auto;
    color: #5a4568;
    font-size: 12.5px;
    line-height: 1.6;
  }
}

.block {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid rgba(164, 128, 171, 0.18);

  &__title {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: #3d2f42;
    font-size: 14px;
    font-weight: 700;

    i {
      color: #c296cd;
    }
  }
}

.list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}
</style>
