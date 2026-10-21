<script setup lang="ts">
import { GAME_SCENES } from '../../lib'
import GameSceneCard from './GameSceneCard.vue'

defineOptions({ name: 'GameScenesSection' })
</script>

<template>
  <section class="scenes">
    <div class="scenes__container">
      <h2 class="scenes__title">游戏场景</h2>
      <p class="scenes__subtitle">探索洛洛希雅的游戏世界</p>
      <div class="scenes__grid">
        <GameSceneCard v-for="scene in GAME_SCENES" :key="scene.title" :scene="scene" />
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.scenes {
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
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 16px;
  }
}

@media (max-width: 960px) {
  .scenes {
    align-items: flex-start;
    padding: 84px 24px 40px;
    overflow-y: auto;

    &__title {
      font-size: 24px;
    }
  }
}
</style>
