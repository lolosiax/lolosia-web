<script setup lang="ts">
// 番组表里的单张番剧卡片：封面 + 标题 + 播出时刻 + 关注标记。
import { computed, ref, watch } from 'vue'
import { coverSrc } from '../api'
import type { AnimeSeries } from '../api'
import { weekdayText } from '../lib'

defineOptions({ name: 'SeriesCard' })

const props = defineProps<{ series: AnimeSeries }>()

const emit = defineEmits<{
  (e: 'select', id: number): void
}>()

/** 封面加载失败（未收录 / 防盗链）时换成占位块。 */
const coverFailed = ref(false)
watch(
  () => props.series.id,
  () => {
    coverFailed.value = false
  }
)

const scheduled = computed(() => props.series.airTime || weekdayText(props.series.airWeekday))
const groups = computed(() => props.series.followedGroups.slice(0, 2))
</script>

<template>
  <article class="series" :class="{ 'is-followed': series.followed }" @click="emit('select', series.id)">
    <div class="series__cover">
      <img
        v-if="series.cover && !coverFailed"
        :src="coverSrc(series.cover)"
        :alt="series.title"
        loading="lazy"
        @error="coverFailed = true"
      />
      <div v-else class="series__fallback"><i class="bi bi-collection-play" /></div>
      <span v-if="series.rating" class="series__rating"><i class="bi bi-star-fill" />{{ series.rating.toFixed(1) }}</span>
      <span v-if="series.followed" class="series__flag" title="已关注"><i class="bi bi-bell-fill" /></span>
    </div>

    <div class="series__body">
      <h4 class="series__title" :title="series.title">{{ series.title }}</h4>
      <div class="series__meta">
        <span class="series__time"><i class="bi bi-clock" />{{ scheduled }}</span>
        <span v-if="series.season" class="series__season">{{ series.season }}</span>
      </div>
      <div v-if="groups.length" class="series__groups">
        <el-tag v-for="group in groups" :key="group || '#any'" size="small" effect="light" round>
          {{ group || '全部发布组' }}
        </el-tag>
        <span v-if="series.followedGroups.length > 2" class="series__more">+{{ series.followedGroups.length - 2 }}</span>
      </div>
    </div>
  </article>
</template>

<style scoped lang="scss">
.series {
  display: flex;
  gap: 10px;
  padding: 8px;
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.58);
  box-shadow: 0 4px 14px rgba(31, 38, 135, 0.1);
  cursor: pointer;
  transition:
    transform 0.22s cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 0.22s ease,
    border-color 0.22s ease;

  &:hover {
    transform: translateY(-3px);
    border-color: rgba(164, 128, 171, 0.5);
    box-shadow: 0 12px 26px rgba(164, 128, 171, 0.26);
  }

  &.is-followed {
    border-color: rgba(164, 128, 171, 0.55);
  }

  &__cover {
    position: relative;
    flex: 0 0 62px;
    width: 62px;
    height: 86px;
    overflow: hidden;
    border-radius: 10px;
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
    color: rgba(164, 128, 171, 0.65);
    font-size: 22px;
    background: linear-gradient(135deg, rgba(164, 128, 171, 0.16), rgba(138, 169, 224, 0.16));
  }

  &__rating,
  &__flag {
    position: absolute;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: #fff;
  }

  &__rating {
    left: 4px;
    bottom: 4px;
    gap: 3px;
    padding: 1px 5px;
    border-radius: 999px;
    font-size: 10px;
    font-weight: 700;
    background: rgba(45, 27, 58, 0.62);

    i {
      color: #f0c04c;
      font-size: 9px;
    }
  }

  &__flag {
    top: 4px;
    right: 4px;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    font-size: 10px;
    background: linear-gradient(135deg, #c296cd, #a480ab);
    box-shadow: 0 2px 6px rgba(164, 128, 171, 0.5);
  }

  &__body {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 5px;
    min-width: 0;
    padding: 2px 2px 2px 0;
  }

  &__title {
    display: -webkit-box;
    margin: 0;
    overflow: hidden;
    color: #3d2f42;
    font-size: 13px;
    font-weight: 700;
    line-height: 1.3;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #8d7f92;
    font-size: 11px;
  }

  &__time {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-variant-numeric: tabular-nums;
  }

  &__season {
    padding: 0 5px;
    border-radius: 4px;
    color: #8b6a92;
    background: rgba(164, 128, 171, 0.14);
  }

  &__groups {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px;
    margin-top: auto;

    :deep(.el-tag) {
      height: 18px;
      padding: 0 6px;
      --el-tag-font-size: 10px;
    }
  }

  &__more {
    color: #8d7f92;
    font-size: 10px;
  }
}
</style>
