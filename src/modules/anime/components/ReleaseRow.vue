<script setup lang="ts">
// 详情里的最近发布一行。
import type { AnimeRelease } from '../api'
import { formatTime } from '../lib'

defineOptions({ name: 'ReleaseRow' })

defineProps<{ release: AnimeRelease }>()
</script>

<template>
  <li class="release">
    <div class="release__main">
      <span class="release__title" :title="release.title">{{ release.title }}</span>
      <span class="release__meta">
        <span class="release__group">{{ release.groupName }}</span>
        <template v-if="release.episodeNo"> · 第 {{ release.episodeNo }} 话</template>
        · {{ formatTime(release.publishedAt) }}
      </span>
    </div>
    <div class="release__links">
      <a v-if="release.torrentUrl" :href="release.torrentUrl" target="_blank" rel="noreferrer" title="种子直链">
        <i class="bi bi-file-earmark-arrow-down" />
      </a>
      <a v-if="release.detailUrl" :href="release.detailUrl" target="_blank" rel="noreferrer" title="详情页">
        <i class="bi bi-box-arrow-up-right" />
      </a>
    </div>
  </li>
</template>

<style scoped lang="scss">
.release {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.5);
  transition: background 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.85);
  }

  &__main {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  &__title {
    overflow: hidden;
    color: #3d2f42;
    font-size: 12.5px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__meta {
    color: #8d7f92;
    font-size: 11px;
  }

  &__group {
    color: #8b6a92;
  }

  &__links {
    display: flex;
    flex: 0 0 auto;
    gap: 10px;

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
