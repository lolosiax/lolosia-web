<script setup lang="ts">
// 游戏场景区
import { ref } from 'vue'

// 游戏场景数据
const gameScenes = ref([
  { id: 1, title: '社团活动室', description: '洛洛希雅组织社团活动的地方' },
  { id: 2, title: '游戏世界', description: '虚拟游戏中的奇幻场景' },
  { id: 3, title: '舞台表演', description: '精彩的舞台表演现场' },
  { id: 4, title: '日常场景', description: '洛洛希雅的日常生活场景' }
])
</script>

<template>
  <section class="game-scenes-section">
    <div class="container">
      <!-- 标题 -->
      <h2 class="section-title animate-on-enter">游戏场景</h2>
      <p class="section-subtitle animate-on-enter">探索洛洛希雅的游戏世界</p>

      <!-- 场景卡片 -->
      <div class="scenes-container-wrapper">
        <div class="scenes-container">
          <div v-for="scene in gameScenes" :key="scene.id" class="scene-card animate-on-enter">
            <div class="scene-image">
              <div class="image-placeholder" />
            </div>
            <div class="scene-content">
              <h3 class="scene-title">{{ scene.title }}</h3>
              <p class="scene-description">{{ scene.description }}</p>
              <button class="scene-button">查看详情</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.game-scenes-section {
  position: relative;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(210, 177, 219, 0.1) 100%);

  // 响应式布局
  @media (max-width: 1024px) {
    padding: 60px 0;

    .container {
      width: 90%;
    }

    .section-title {
      font-size: 36px;
    }

    .section-subtitle {
      font-size: 16px;
      margin-bottom: 40px;
    }

    .scene-card {
      flex: 0 0 300px;
    }
  }

  @media (max-width: 768px) {
    height: auto;
    min-height: 100vh;
    padding: 40px 0;

    .section-title {
      font-size: 28px;
    }

    .section-subtitle {
      font-size: 14px;
      margin-bottom: 30px;
    }

    .scenes-container {
      gap: 20px;
      padding: 15px 0;
    }

    .scene-card {
      flex: 0 0 280px;
    }

    .scene-image {
      height: 180px;

      .image-placeholder {
        &::before {
          font-size: 48px;
        }
      }
    }

    .scene-content {
      padding: 20px;
    }

    .scene-title {
      font-size: 20px;
    }

    .scene-description {
      font-size: 14px;
    }

    .scene-button {
      padding: 8px 16px;
      font-size: 14px;
    }
  }

  @media (max-width: 480px) {
    .scene-card {
      flex: 0 0 250px;
    }

    .scene-image {
      height: 160px;
    }

    .scene-content {
      padding: 15px;
    }

    .scene-title {
      font-size: 18px;
    }
  }

  .container {
    width: 80%;
    max-width: 1200px;
    margin: 0 auto;
  }

  .section-title {
    font-size: 42px;
    font-weight: bold;
    color: var(--lolosia-color-primary);
    text-align: center;
    margin-bottom: 15px;
    position: relative;

    &::after {
      content: '';
      position: absolute;
      bottom: -15px;
      left: 50%;
      transform: translateX(-50%);
      width: 80px;
      height: 4px;
      background: var(--lolosia-color-primary-light-3);
      border-radius: 2px;
    }
  }

  .section-subtitle {
    font-size: 18px;
    color: #999;
    text-align: center;
    margin-bottom: 60px;
  }

  .scenes-container-wrapper {
  }

  .scenes-container {
    display: flex;
    gap: 30px;
    overflow-y: hidden;
    overflow-x: auto;
    padding: 20px 0;
    scrollbar-width: thin;
    scrollbar-color: var(--lolosia-color-primary-light-3) transparent;

    &::-webkit-scrollbar {
      height: 8px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background: var(--lolosia-color-primary-light-3);
      border-radius: 4px;
    }

    &::-webkit-scrollbar-thumb:hover {
      background: var(--lolosia-color-primary);
    }
  }

  .scene-card {
    flex: 0 0 350px;
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(10px);
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 5px 20px rgba(210, 177, 219, 0.2);
    border: 1px solid rgba(210, 177, 219, 0.3);
    transition: all 0.3s ease;
    cursor: pointer;

    &:hover {
      transform: translateY(-10px);
      box-shadow: 0 15px 30px rgba(210, 177, 219, 0.3);
    }
  }

  .scene-image {
    width: 100%;
    height: 200px;
    overflow: hidden;

    .image-placeholder {
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, rgba(210, 177, 219, 0.3) 0%, rgba(223, 205, 230, 0.2) 100%);
      display: flex;
      align-items: center;
      justify-content: center;

      &::before {
        content: '🎮';
        font-size: 64px;
        opacity: 0.3;
      }
    }
  }

  .scene-content {
    padding: 25px;
  }

  .scene-title {
    font-size: 24px;
    font-weight: 600;
    color: var(--lolosia-color-primary);
    margin-bottom: 10px;
  }

  .scene-description {
    font-size: 14px;
    line-height: 1.6;
    color: #666;
    margin-bottom: 20px;
  }

  .scene-button {
    padding: 10px 20px;
    background: var(--lolosia-color-primary);
    color: white;
    border: none;
    border-radius: 20px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      background: var(--lolosia-color-primary-dark-2);
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(210, 177, 219, 0.4);
    }
  }
}
</style>
