<script setup lang="ts">
// 更新历史的一行：时间 + 番名/发布组/话数 + 标题 + 链接。
import type { AnimeRelease } from '../api'
import { formatTime } from '../lib'

defineOptions({ name: 'HistoryRow' })

const props = defineProps<{
  item: AnimeRelease
  canManage: boolean
}>()

const emit = defineEmits<{
  (e: 'open', id: number): void
  (e: 'map', item: AnimeRelease): void
}>()

function openSeries(): void {
  if (props.item.seriesId) emit('open', props.item.seriesId)
}
</script>

<template>
  <li class="his">
    <span class="his__time">{{ formatTime(item.publishedAt) }}</span>
    <div class="his__main">
      <div class="his__line">
        <button type="button" class="his__series" :class="{ 'is-unmatched': !item.seriesId }" @click="openSeries">
          {{ item.seriesTitle || '未匹配' }}
        </button>
        <el-tag size="small" effect="light" round>{{ item.groupName || '未知组' }}</el-tag>
        <el-tag v-if="item.matchState === 'ai-unmatched'" size="small" type="warning" effect="plain" title="AI 判定匹配不到，不再重复匹配">
          AI 未识别
        </el-tag>
        <el-tag v-if="item.episodeNo" size="small" type="info" effect="plain">第 {{ item.episodeNo }} 话</el-tag>
      </div>
      <span class="his__title" :title="item.title">{{ item.title }}</span>
    </div>
    <div class="his__actions">
      <el-button v-if="canManage && !item.seriesId" link type="primary" @click="emit('map', item)">
        <i class="bi bi-link-45deg" />映射
      </el-button>
      <a v-if="item.torrentUrl" :href="item.torrentUrl" target="_blank" rel="noreferrer" title="种子直链">
        <i class="bi bi-file-earmark-arrow-down" />
      </a>
      <a v-if="item.detailUrl" :href="item.detailUrl" target="_blank" rel="noreferrer" title="详情页">
        <i class="bi bi-box-arrow-up-right" />
      </a>
    </div>
  </li>
</template>

<style scoped lang="scss">
.his {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border: 1px solid rgba(255, 255, 255, 0.75);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.52);
  list-style: none;
  transition: background 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.85);
  }

  &__time {
    flex: 0 0 88px;
    color: #8d7f92;
    font-size: 11.5px;
    font-variant-numeric: tabular-nums;
  }

  &__main {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
  }

  &__line {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }

  &__series {
    padding: 0;
    border: none;
    color: #3d2f42;
    font-size: 13px;
    font-weight: 600;
    background: none;
    cursor: pointer;

    &:hover {
      color: #8b6a92;
    }

    &.is-unmatched {
      color: #8d7f92;
      font-style: italic;
      cursor: default;
    }
  }

  &__title {
    overflow: hidden;
    color: #8d7f92;
    font-size: 11.5px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__actions {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
    gap: 12px;

    a {
      color: #8b6a92;
      font-size: 15px;

      &:hover {
        color: #c296cd;
      }
    }
  }
}
</style>
