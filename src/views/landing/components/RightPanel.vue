<script setup lang="ts">
// 右侧展示区组件 - 展示虚拟偶像立绘
</script>

<template>
  <div class="right-panel">
    <div class="character-container">
      <!-- 角色立绘容器 - 突破边框设计 -->
      <div class="character-illustration">
        <!-- 这里将放置角色立绘，使用占位符 -->
        <div class="character-placeholder">
          <div class="character-shape"></div>
        </div>
      </div>
    </div>
    
    <!-- 背景装饰元素 -->
    <div class="background-decoration">
      <div class="floating-element element-1"></div>
      <div class="floating-element element-2"></div>
      <div class="floating-element element-3"></div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.right-panel {
  position: relative;
  width: 75%;
  height: 100vh;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(210, 177, 219, 0.2) 0%, rgba(223, 205, 230, 0.1) 100%);
  
  .character-container {
    position: relative;
    z-index: 2;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .character-illustration {
    position: relative;
    width: 80%;
    height: 100%;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    
    .character-placeholder {
      width: 60%;
      height: 90%;
      position: relative;
      
      .character-shape {
        width: 100%;
        height: 100%;
        background: linear-gradient(180deg, rgba(210, 177, 219, 0.3) 0%, rgba(164, 128, 171, 0.2) 100%);
        border-radius: 20px;
        box-shadow: 0 20px 40px rgba(210, 177, 219, 0.3);
        animation: float 6s ease-in-out infinite;
      }
    }
  }
  
  .background-decoration {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 1;
    
    .floating-element {
      position: absolute;
      background: rgba(210, 177, 219, 0.15);
      border-radius: 50%;
      animation: float 8s ease-in-out infinite;
      
      &.element-1 {
        width: 120px;
        height: 120px;
        top: 20%;
        left: 10%;
        animation-delay: 0s;
      }
      
      &.element-2 {
        width: 80px;
        height: 80px;
        top: 60%;
        right: 15%;
        animation-delay: 2s;
      }
      
      &.element-3 {
        width: 100px;
        height: 100px;
        bottom: 20%;
        left: 20%;
        animation-delay: 4s;
      }
    }
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(5deg);
  }
}
</style>