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
  display: flex;
  flex-direction: column;
  min-height: 0;
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
    margin-bottom: 12px;
    flex-wrap: wrap;
  }

  &__title {
    display: inline-flex;
    align-items: center;
    gap: 7px;
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
    grid-template-columns: repeat(3, minmax(0, 1fr));
    grid-template-rows: repeat(2, minmax(0, 1fr));
    gap: 10px;
    flex: 1 1 auto;
    min-height: 0;
  }

  &__photo {
    position: relative;
    min-height: 0;
    overflow: hidden;
    border-radius: 14px;
    background: rgba(164, 128, 171, 0.08);
    box-shadow: 0 6px 16px rgba(164, 128, 171, 0.2);
    transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.4s ease;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.35s ease;
    }

    &:hover {
      transform: translateY(-4px) scale(1.03);
      box-shadow: 0 14px 30px rgba(164, 128, 171, 0.35);

      img {
        transform: scale(1.08);
      }

      .recommend-card__name {
        opacity: 1;
        transform: translateY(0);
      }
    }

    &.is-port {
      grid-row: span 2;
    }

    &.is-land {
      grid-column: span 2;
    }
  }

  &__name {
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;
    overflow: hidden;
    padding: 16px 10px 8px;
    background: linear-gradient(to top, rgba(45, 27, 58, 0.72), transparent);
    color: #fff;
    font-size: 12px;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
    opacity: 0;
    transform: translateY(6px);
    transition: all 0.35s ease;
  }

  &__empty {
    grid-column: 1 / -1;
    margin: 0;
    color: #a99cae;
    font-size: 12px;
  }
}
</style>
