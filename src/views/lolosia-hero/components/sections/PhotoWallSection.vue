<script setup lang="ts">
// 照片墙区
import { ref, onMounted } from 'vue';
import gsap from 'gsap';

// 照片数据
const photos = ref([
  { id: 1, title: '日常快照' },
  { id: 2, title: '社团活动' },
  { id: 3, title: '游戏场景' },
  { id: 4, title: '角色立绘' },
  { id: 5, title: '活动海报' },
  { id: 6, title: '生活记录' },
  { id: 7, title: '节日祝福' },
  { id: 8, title: '角色设定' },
  { id: 9, title: '游戏截图' }
]);

// 初始化照片墙动画
function initPhotoWallAnimation() {
  const photoItems = document.querySelectorAll('.photo-item');
  
  // 为每个照片添加悬停动画
  photoItems.forEach((item, index) => {
    item.addEventListener('mouseenter', () => {
      gsap.to(item, {
        scale: 1.1,
        zIndex: 10,
        duration: 0.3,
        ease: 'power2.out'
      });
    });
    
    item.addEventListener('mouseleave', () => {
      gsap.to(item, {
        scale: 1,
        zIndex: 1,
        duration: 0.3,
        ease: 'power2.in'
      });
    });
  });
}

onMounted(() => {
  initPhotoWallAnimation();
});
</script>

<template>
  <section class="photo-wall-section">
    <div class="container">
      <!-- 标题 -->
      <h2 class="section-title animate-on-enter">照片墙</h2>
      <p class="section-subtitle animate-on-enter">记录洛洛希雅的精彩瞬间</p>
      
      <!-- 照片网格 -->
      <div class="photo-grid">
        <div 
          v-for="photo in photos" 
          :key="photo.id"
          class="photo-item animate-on-enter"
          :style="{ animationDelay: `${photo.id * 0.1}s` }"
        >
          <div class="photo-placeholder">
            <div class="photo-shape"></div>
          </div>
          <div class="photo-info">
            <h4 class="photo-title">{{ photo.title }}</h4>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.photo-wall-section {
  position: relative;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
  background: linear-gradient(135deg, rgba(210, 177, 219, 0.1) 0%, rgba(255, 255, 255, 0.95) 100%);
  
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
    
    .photo-grid {
      gap: 20px;
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
    
    .photo-grid {
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 15px;
    }
    
    .photo-item {
      &:nth-child(3n+1) {
        grid-row: span 1;
      }
      
      &:nth-child(3n+3) {
        grid-row: span 1;
      }
    }
    
    .photo-info {
      padding: 15px;
      
      .photo-title {
        font-size: 14px;
      }
    }
  }
  
  @media (max-width: 480px) {
    .photo-grid {
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 10px;
    }
    
    .photo-placeholder {
      .photo-shape {
        &::before {
          font-size: 32px;
        }
      }
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
  
  .photo-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 30px;
    perspective: 1000px;
  }
  
  .photo-item {
    position: relative;
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(10px);
    border-radius: 15px;
    overflow: hidden;
    box-shadow: 0 5px 20px rgba(210, 177, 219, 0.2);
    border: 1px solid rgba(210, 177, 219, 0.3);
    transition: all 0.3s ease;
    cursor: pointer;
    transform-style: preserve-3d;
    
    &:nth-child(3n+1) {
      grid-row: span 2;
    }
    
    &:nth-child(3n+3) {
      grid-row: span 1;
    }
  }
  
  .photo-placeholder {
    width: 100%;
    padding-bottom: 100%;
    position: relative;
    
    .photo-shape {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, rgba(210, 177, 219, 0.3) 0%, rgba(223, 205, 230, 0.2) 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      
      &::before {
        content: '📷';
        font-size: 48px;
        opacity: 0.3;
      }
    }
  }
  
  .photo-info {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 20px;
    background: linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.6) 100%);
    color: white;
    
    .photo-title {
      font-size: 16px;
      font-weight: 600;
      margin: 0;
    }
  }
}
</style>