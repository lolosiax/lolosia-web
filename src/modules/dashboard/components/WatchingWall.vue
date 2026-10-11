<script setup lang="ts">
// 大家最近在看：热门文件的缩略图墙。
defineOptions({ name: 'WatchingWall' })

defineProps<{
  items: { path: string; name: string; src: string }[]
}>()

function hideImage(event: Event): void {
  const image = event.target as HTMLImageElement
  image.style.visibility = 'hidden'
}
</script>

<template>
  <article class="watching-card">
    <div class="watching-card__head">
      <span class="watching-card__title"><i class="bi bi-eye" />大家最近在看</span>
    </div>

    <div class="watching-card__wall">
      <div v-for="item in items" :key="item.path" class="watching-card__photo" :title="item.name">
        <img :src="item.src" :alt="item.name" loading="lazy" @error="hideImage" />
      </div>
      <p v-if="!items.length" class="watching-card__empty">暂无数据</p>
    </div>
  </article>
</template>

<style scoped lang="scss">
.watching-card {
  padding: 16px 18px;
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.45);
  box-shadow: 0 4px 16px rgba(31, 38, 135, 0.12);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);

  &__head {
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

  &__wall {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 6px;
  }

  &__photo {
    aspect-ratio: 1;
    overflow: hidden;
    border-radius: 9px;
    background: rgba(164, 128, 171, 0.08);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }

    &:hover img {
      transform: scale(1.06);
    }
  }

  &__empty {
    grid-column: 1 / -1;
    margin: 0;
    color: #a99cae;
    font-size: 12px;
  }
}
</style>
