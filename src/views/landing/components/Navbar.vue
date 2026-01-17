<script setup lang="ts">
// 导航栏组件 - 包含主导航和子站点入口
</script>

<template>
  <nav class="navbar">
    <!-- 主导航 -->
    <div class="main-nav">
      <ul class="nav-list">
        <li class="nav-item">
          <a href="#" class="nav-link">首页</a>
        </li>
        <li class="nav-item">
          <a href="#" class="nav-link">详细介绍</a>
        </li>
        <li class="nav-item">
          <a href="#" class="nav-link">照片墙</a>
        </li>
        <li class="nav-item">
          <a href="#" class="nav-link">游戏场景</a>
        </li>
        <li class="nav-item">
          <a href="#" class="nav-link">关于我</a>
        </li>
      </ul>
    </div>
    
    <!-- 子站点入口 -->
    <div class="subsite-entrance">
      <div class="subsite-icons">
        <a href="#" class="subsite-icon" title="游戏主页">
          <div class="icon-circle"></div>
        </a>
        <a href="#" class="subsite-icon" title="社交平台">
          <div class="icon-circle"></div>
        </a>
        <a href="#" class="subsite-icon" title="粉丝社区">
          <div class="icon-circle"></div>
        </a>
      </div>
    </div>
    
    <!-- 版权信息 -->
    <div class="copyright">
      <p>© 2024 洛洛希雅 Lolosia. All rights reserved.</p>
    </div>
  </nav>
</template>

<style scoped lang="scss">
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 50px;
  z-index: 100;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0) 100%);
  
  .main-nav {
    .nav-list {
      display: flex;
      gap: 40px;
      list-style: none;
      margin: 0;
      padding: 0;
      
      .nav-item {
        .nav-link {
          text-decoration: none;
          color: var(--lolosia-color-primary);
          font-size: 16px;
          font-weight: 500;
          transition: all 0.3s ease;
          position: relative;
          
          &::after {
            content: '';
            position: absolute;
            bottom: -5px;
            left: 0;
            width: 0;
            height: 2px;
            background: var(--lolosia-color-primary);
            transition: width 0.3s ease;
          }
          
          &:hover {
            color: var(--lolosia-color-primary-dark-2);
            
            &::after {
              width: 100%;
            }
          }
        }
      }
    }
  }
  
  .subsite-entrance {
    .subsite-icons {
      display: flex;
      gap: 20px;
      
      .subsite-icon {
        text-decoration: none;
        
        .icon-circle {
          width: 40px;
          height: 40px;
          background: rgba(210, 177, 219, 0.2);
          border-radius: 50%;
          transition: all 0.3s ease;
          border: 2px solid var(--lolosia-color-primary-light-3);
          
          &:hover {
            transform: scale(1.1);
            background: rgba(210, 177, 219, 0.4);
            border-color: var(--lolosia-color-primary);
          }
        }
      }
    }
  }
  
  .copyright {
    position: absolute;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    
    p {
      font-size: 12px;
      color: #999;
      margin: 0;
      font-weight: 300;
    }
  }
}
</style>