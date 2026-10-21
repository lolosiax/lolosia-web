<script setup lang="ts">
import type { PhotoTile } from '../../lib'

defineOptions({ name: 'PhotoTile' })

defineProps<{ tile: PhotoTile }>()
</script>

<template>
  <article class="photo-tile" :style="{ '--tone': tile.tone }">
    <span class="photo-tile__icon"><i class="bi" :class="`bi-${tile.icon}`" /></span>
    <h3 class="photo-tile__title">{{ tile.title }}</h3>
    <span class="photo-tile__caption">Photo Wall</span>
  </article>
</template>

<style scoped lang="scss">
.photo-tile {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  min-height: 0;
  padding: 18px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 16px;
  background:
    radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.6), transparent 55%),
    linear-gradient(150deg, rgba(var(--tone), 0.55), rgba(var(--tone), 0.2));
  box-shadow: 0 12px 26px rgba(31, 38, 135, 0.1);
  transition: transform 0.3s ease;

  &:hover {
    transform: translateY(-4px) scale(1.01);
  }

  &__icon {
    position: absolute;
    top: 16px;
    right: 16px;
    color: rgba(255, 255, 255, 0.9);
    font-size: 22px;
  }

  &__title {
    margin: 0 0 2px;
    color: #fff;
    font-size: 15px;
    font-weight: 700;
    text-shadow: 0 2px 8px rgba(61, 47, 66, 0.35);
  }

  &__caption {
    color: rgba(255, 255, 255, 0.72);
    font-size: 9px;
    letter-spacing: 2px;
    text-transform: uppercase;
  }
}
</style>
