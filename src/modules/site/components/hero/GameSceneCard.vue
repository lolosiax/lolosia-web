<script setup lang="ts">
import type { GameScene } from '../../lib'

defineOptions({ name: 'GameSceneCard' })

defineProps<{ scene: GameScene }>()
</script>

<template>
  <article class="scene-card" :style="{ '--tone': scene.tone }">
    <span class="scene-card__visual"><i class="bi" :class="`bi-${scene.icon}`" /></span>
    <h3 class="scene-card__title">{{ scene.title }}</h3>
    <p class="scene-card__desc">{{ scene.description }}</p>
  </article>
</template>

<style scoped lang="scss">
.scene-card {
  display: flex;
  flex-direction: column;
  padding: 18px;
  border: 1px solid rgba(255, 255, 255, 0.75);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.58);
  box-shadow: 0 12px 28px rgba(31, 38, 135, 0.12);
  backdrop-filter: blur(10px);
  transition: transform 0.3s ease;

  &:hover {
    transform: translateY(-4px);
  }

  &__visual {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 130px;
    margin-bottom: 14px;
    border-radius: 12px;
    color: #fff;
    font-size: 34px;
    background:
      radial-gradient(circle at 30% 25%, rgba(255, 255, 255, 0.65), transparent 55%),
      linear-gradient(145deg, rgba(var(--tone), 0.85), rgba(var(--tone), 0.4));
  }

  &__title {
    margin: 0 0 4px;
    color: #3d2f42;
    font-size: 15px;
    font-weight: 700;
  }

  &__desc {
    margin: 0;
    color: #8a7a94;
    font-size: 12px;
    line-height: 1.6;
  }
}
</style>
