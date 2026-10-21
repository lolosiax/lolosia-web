<script setup lang="ts">
import { PHOTO_TILES } from '../../lib'
import PhotoTile from './PhotoTile.vue'

defineOptions({ name: 'PhotoWallSection' })
</script>

<template>
  <section class="photo-wall">
    <div class="photo-wall__container">
      <h2 class="photo-wall__title">照片墙</h2>
      <p class="photo-wall__subtitle">记录洛洛希雅的精彩瞬间</p>
      <div class="photo-wall__grid">
        <PhotoTile v-for="tile in PHOTO_TILES" :key="tile.title" :tile="tile" />
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.photo-wall {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100vw;
  height: 100vh;
  padding: 90px 6vw 60px;
  overflow: hidden;

  &__container {
    width: 100%;
    max-width: 1120px;
  }

  &__title {
    margin: 0 0 6px;
    color: #3d2f42;
    font-size: 30px;
    font-weight: 800;
  }

  &__subtitle {
    margin: 0 0 24px;
    color: #8a7a94;
    font-size: 13px;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    grid-auto-rows: minmax(120px, 18vh);
    gap: 14px;
  }
}

@media (max-width: 960px) {
  .photo-wall {
    align-items: flex-start;
    padding: 84px 24px 40px;
    overflow-y: auto;

    &__title {
      font-size: 24px;
    }

    &__grid {
      grid-auto-rows: 110px;
    }
  }
}

@media (max-width: 640px) {
  .photo-wall__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
