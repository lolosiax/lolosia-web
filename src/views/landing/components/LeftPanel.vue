<script setup lang="ts">
// 左侧面板组件 - 包含倾斜的几何盒子、大标题和个人介绍文案
</script>

<template>
  <div class="left-panel">
    <div class="tilted-box">
      <div class="title-section">
        <h1 class="main-title">洛洛希雅</h1>
        <span class="subtitle">Lolosia</span>
      </div>
      
      <div class="intro-section">
        <p class="intro-text">
          温柔体贴的治愈系大姐姐，擅长协调社团活动，
          担任多社团重要角色，是玩家间的情感纽带。
        </p>
      </div>
      
      <div class="character-info">
        <div class="info-item">
          <span class="label">昵称</span>
          <span class="value">洛洛希雅</span>
        </div>
        <div class="info-item">
          <span class="label">年龄</span>
          <span class="value">20-25岁</span>
        </div>
        <div class="info-item">
          <span class="label">身高</span>
          <span class="value">165cm</span>
        </div>
        <div class="info-item">
          <span class="label">性格</span>
          <span class="value">温柔体贴、善解人意</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.left-panel {
  position: relative;
  width: 25%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 40px;
  
  .tilted-box {
    position: relative;
    width: 100%;
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(10px);
    border-radius: 20px;
    padding: 40px 30px;
    transform: rotate(-5deg);
    box-shadow: 0 10px 30px rgba(210, 177, 219, 0.3);
    z-index: 2;
    
    &::before {
      content: '';
      position: absolute;
      top: -10px;
      left: -10px;
      right: -10px;
      bottom: -10px;
      background: linear-gradient(135deg, rgba(210, 177, 219, 0.3), rgba(164, 128, 171, 0.2));
      border-radius: 25px;
      z-index: -1;
    }
    
    .title-section {
      margin-bottom: 30px;
      
      .main-title {
        font-size: 48px;
        font-weight: bold;
        color: var(--lolosia-color-primary);
        line-height: 1.2;
        margin: 0 0 10px 0;
        text-transform: uppercase;
        letter-spacing: 2px;
      }
      
      .subtitle {
        font-size: 24px;
        color: var(--lolosia-color-primary-light-3);
        font-weight: 300;
        letter-spacing: 4px;
      }
    }
    
    .intro-section {
      margin-bottom: 30px;
      
      .intro-text {
        font-size: 16px;
        line-height: 1.8;
        color: #666;
        margin: 0;
        text-align: justify;
      }
    }
    
    .character-info {
      display: flex;
      flex-direction: column;
      gap: 15px;
      
      .info-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        
        .label {
          font-size: 14px;
          color: #999;
          font-weight: 500;
        }
        
        .value {
          font-size: 14px;
          color: #333;
          font-weight: 600;
        }
      }
    }
  }
}
</style>