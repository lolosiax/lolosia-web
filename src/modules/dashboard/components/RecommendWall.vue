<script setup lang="ts">
// 为你推荐：1 张大图 + 4 张小图的照片墙。
import type { PhotoView } from '../types'

defineOptions({ name: 'RecommendWall' })

defineProps<{ items: PhotoView[] }>()

function hideImage(event: Event): void {
  const image = event.target as HTMLImageElement
  image.style.visibility = 'hidden'
}
</script>

<template>
  <article class="recommend-card">
    <div class="recommend-card__head">
      <span class="recommend-card__title"><i class="bi bi-stars" />为你推荐</span>
      <span class="recommend-card__hint">随机精选</span>
    </div>

    <div class="recommend-card__wall">
      <div
        v-for="(photo, index) in items"
        :key="photo.path"
        class="recommend-card__photo"
        :class="index === 0 ? (photo.port ? 'is-port' : 'is-land') : ''"
      >
        <img :src="photo.src" :alt="photo.name" loading="lazy" @error="hideImage" />
        <span class="recommend-card__name">{{ photo.name }}</span>
      </div>
      <p v-if="!items.length" class="recommend-card__empty">暂无推荐</p>
    </div>
  </article>
</template>

<style scoped lang="scss">
.recommend-card {
  padding: 16px 18px;
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.45);
  box-shadow: 0 4px 16px rgba(31, 38, 135, 0.12);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 10px;
  }

  &__title {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: #4a3d4d;
    font-size: 13px;
    font-weight: 600;
  }

  &__hint {
    color: #a99cae;
    font-size: 11px;
  }

  &__wall {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    grid-auto-rows: 82px;
    gap: 6px;
  }

  &__photo {
    position: relative;
    overflow: hidden;
    border-radius: 10px;
    background: rgba(164, 128, 171, 0.08);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.35s ease;
    }

    &:hover img {
      transform: scale(1.05);
    }

    &.is-port {
      grid-column: span 2;
      grid-row: span 2;
    }

    &.is-land {
      grid-column: span 2;
    }
  }

  &__name {
    position: absolute;
    right: 6px;
    bottom: 5px;
    left: 6px;
    overflow: hidden;
    color: #fff;
    font-size: 10px;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.55);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__empty {
    grid-column: 1 / -1;
    margin: 0;
    color: #a99cae;
    font-size: 12px;
  }
}
</style>
