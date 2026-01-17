<script setup lang="ts">
// Hero区 - 首页
import { ref, onMounted, onUnmounted } from 'vue'

// 鼠标位置和偏移量
const mouseX = ref(0)
const mouseY = ref(0)
const offsetX = ref(0)
const offsetY = ref(0)

// 最大偏移量（可调整）
const maxOffset = 10

// 监听鼠标移动事件
const handleMouseMove = (e: MouseEvent) => {
  // 获取屏幕中心坐标
  const centerX = window.innerWidth / 2
  const centerY = window.innerHeight / 2
  
  // 计算鼠标相对于中心的偏移比例（-1 到 1）
  const ratioX = (e.clientX - centerX) / centerX
  const ratioY = (e.clientY - centerY) / centerY
  
  // 计算元素偏移量 - 保持统一方向，鼠标右移所有元素右移，左移所有元素左移
  offsetX.value = ratioX * maxOffset
  offsetY.value = ratioY * maxOffset
}

// 生命周期钩子：组件挂载时添加事件监听
onMounted(() => {
  window.addEventListener('mousemove', handleMouseMove)
})

// 生命周期钩子：组件卸载时移除事件监听
onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMove)
})
</script>

<template>
  <section class="hero-section">
    <!-- 左侧内容 -->
    <div class="left-content">
        <div class="tilted-box animate-on-enter" :style="{ transform: `rotate(-5deg) translate(${offsetX * 0.3}px, ${offsetY * 0.3}px)` }">
        <h1 class="main-title">洛洛希雅</h1>
        <span class="subtitle">Lolosia</span>

        <p class="intro-text">温柔体贴的治愈系大姐姐，擅长协调社团活动， 担任多社团重要角色，是玩家间的情感纽带。</p>

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
        </div>
      </div>
    </div>

    <!-- 右侧展示区 -->
    <div class="right-content">
      <div class="character-container animate-on-enter" :style="{ transform: `translate(${offsetX * 0.5}px, ${offsetY * 0.5}px)` }">
        <div class="character-illustration">
          <!-- 角色立绘占位符 -->
          <div class="character-placeholder">
            <div class="character-shape">
              <img src="@/views/landing/assets/Image_960506661952634.webp" alt="角色立绘" />
            </div>
          </div>
        </div>
      </div>

      <!-- 背景装饰 -->
      <div class="background-decoration">
        <div class="floating-element element-1" :style="{ transform: `translate(${offsetX * 1.5}px, ${offsetY * 1.5}px)` }" />
        <div class="floating-element element-2" :style="{ transform: `translate(${offsetX * 1.2}px, ${offsetY * 1.2}px)` }" />
        <div class="floating-element element-3" :style="{ transform: `translate(${offsetX * 1.8}px, ${offsetY * 1.8}px)` }" />
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.hero-section {
  position: relative;
  width: 100vw;
  height: 100vh;
  display: flex;
  overflow: hidden;

  // 响应式布局
  @media (max-width: 1024px) {
    flex-direction: column;

    .left-content {
      width: 100%;
      height: 50%;
      padding: 0 30px;

      .tilted-box {
        padding: 30px 20px;

        .main-title {
          font-size: 36px;
        }

        .subtitle {
          font-size: 18px;
        }

        .intro-text {
          font-size: 14px;
        }
      }
    }

    .right-content {
      width: 100%;
      height: 50%;
    }
  }

  @media (max-width: 768px) {
    .left-content {
      padding: 0 20px;

      .tilted-box {
        padding: 20px 15px;
        transform: rotate(0deg);

        .main-title {
          font-size: 28px;
        }

        .subtitle {
          font-size: 16px;
          letter-spacing: 2px;
        }
      }
    }

    .right-content {
      .character-illustration {
        .character-placeholder {
          width: 80%;
          height: 80%;
        }
      }

      .background-decoration {
        .floating-element {
          &.element-1 {
            width: 80px;
            height: 80px;
          }

          &.element-2 {
            width: 60px;
            height: 60px;
          }

          &.element-3 {
            width: 70px;
            height: 70px;
          }
        }
      }
    }
  }

  .left-content {
    width: 30%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 60px;

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
        display: block;
        margin-bottom: 30px;
      }

      .intro-text {
        font-size: 16px;
        line-height: 1.8;
        color: #666;
        margin: 0 0 30px 0;
        text-align: justify;
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

  .right-content {
    width: 70%;
    height: 100%;
    position: relative;
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
          overflow: hidden;
          background: linear-gradient(180deg, rgba(210, 177, 219, 0.3) 0%, rgba(164, 128, 171, 0.2) 100%);
          border-radius: 20px;
          box-shadow: 0 20px 40px rgba(210, 177, 219, 0.3);
          animation: float 6s ease-in-out infinite;

          img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
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
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0px) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(5deg);
  }
}
</style>
