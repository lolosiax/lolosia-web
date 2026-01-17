<script setup lang="ts">
// 详细介绍区
</script>

<template>
  <section class="about-section">
    <div class="container">
      <!-- 标题 -->
      <h2 class="section-title animate-on-enter">关于洛洛希雅</h2>
      
      <!-- 内容网格 -->
      <div class="content-grid">
        <!-- 左侧：详细介绍 -->
        <div class="about-content animate-on-enter">
          <h3 class="subsection-title">角色背景</h3>
          <p class="about-text">
            洛洛希雅是一位温柔体贴的治愈系大姐姐，在游戏中以协调社团活动而闻名。她担任多个大型游戏社团的重要角色，凭借着亲和力和领导力成为了玩家间的情感纽带。
          </p>
          
          <h3 class="subsection-title">性格特点</h3>
          <p class="about-text">
            温柔体贴、善解人意、可靠稳重是洛洛希雅的核心性格特点。她总是愿意倾听他人的烦恼，并用温暖的话语给予安慰和支持。
          </p>
          
          <h3 class="subsection-title">兴趣爱好</h3>
          <ul class="hobby-list">
            <li class="hobby-item">社团活动策划</li>
            <li class="hobby-item">音乐欣赏</li>
            <li class="hobby-item">绘画创作</li>
            <li class="hobby-item">旅行探索</li>
          </ul>
        </div>
        
        <!-- 右侧：角色特征 -->
        <div class="character-features animate-on-enter">
          <div class="feature-card">
            <h4 class="feature-title">外貌特征</h4>
            <ul class="feature-list">
              <li>宽大柔软的猫耳（粉色内耳）</li>
              <li>长而蓬松的紫色长发（发尾微卷）</li>
              <li>头顶蓝色蝴蝶结装饰</li>
              <li>修长身材，四肢纤细</li>
              <li>白色为主色调的休闲运动装</li>
            </ul>
          </div>
          
          <div class="feature-card">
            <h4 class="feature-title">主题色分析</h4>
            <div class="color-analysis">
              <div class="color-item">
                <div class="color-swatch" style="background-color: #D2B1DB;"></div>
                <div class="color-info">
                  <span class="color-name">主色调</span>
                  <span class="color-code">#D2B1DB</span>
                  <span class="color-meaning">淡紫色 - 象征温柔与神秘</span>
                </div>
              </div>
              <div class="color-item">
                <div class="color-swatch" style="background-color: #FFFFFF;"></div>
                <div class="color-info">
                  <span class="color-name">辅助色</span>
                  <span class="color-code">#FFFFFF</span>
                  <span class="color-meaning">白色 - 代表纯洁与清新</span>
                </div>
              </div>
              <div class="color-item">
                <div class="color-swatch" style="background-color: #6C757D;"></div>
                <div class="color-info">
                  <span class="color-name">点缀色</span>
                  <span class="color-code">#6C757D</span>
                  <span class="color-meaning">蓝色 - 体现冷静与可靠</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.about-section {
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
      margin-bottom: 40px;
    }
    
    .content-grid {
      gap: 40px;
    }
  }
  
  @media (max-width: 768px) {
    height: auto;
    min-height: 100vh;
    padding: 40px 0;
    
    .section-title {
      font-size: 28px;
      margin-bottom: 30px;
    }
    
    .content-grid {
      grid-template-columns: 1fr;
      gap: 30px;
    }
    
    .about-content {
      .subsection-title {
        font-size: 20px;
        margin: 20px 0 10px 0;
      }
      
      .about-text {
        font-size: 14px;
      }
      
      .hobby-list {
        gap: 10px;
        
        .hobby-item {
          padding: 8px 16px;
          font-size: 14px;
        }
      }
    }
    
    .character-features {
      .feature-card {
        padding: 20px;
        
        .feature-title {
          font-size: 18px;
        }
        
        .feature-list {
          li {
            font-size: 14px;
          }
        }
        
        .color-analysis {
          .color-item {
            gap: 10px;
            
            .color-swatch {
              width: 40px;
              height: 40px;
            }
            
            .color-info {
              .color-name {
                font-size: 14px;
              }
              
              .color-code,
              .color-meaning {
                font-size: 12px;
              }
            }
          }
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
    margin-bottom: 60px;
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
  
  .content-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 60px;
    align-items: start;
  }
  
  .about-content {
    .subsection-title {
      font-size: 24px;
      font-weight: 600;
      color: var(--lolosia-color-primary);
      margin: 30px 0 15px 0;
      
      &:first-child {
        margin-top: 0;
      }
    }
    
    .about-text {
      font-size: 16px;
      line-height: 1.8;
      color: #666;
      margin-bottom: 20px;
      text-align: justify;
    }
    
    .hobby-list {
      display: flex;
      flex-wrap: wrap;
      gap: 15px;
      list-style: none;
      padding: 0;
      margin: 20px 0;
      
      .hobby-item {
        padding: 10px 20px;
        background: rgba(210, 177, 219, 0.2);
        border-radius: 20px;
        color: var(--lolosia-color-primary);
        font-weight: 500;
        transition: all 0.3s ease;
        
        &:hover {
          background: var(--lolosia-color-primary);
          color: white;
          transform: translateY(-3px);
        }
      }
    }
  }
  
  .character-features {
    display: flex;
    flex-direction: column;
    gap: 30px;
    
    .feature-card {
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      padding: 30px;
      box-shadow: 0 5px 20px rgba(210, 177, 219, 0.2);
      border: 1px solid rgba(210, 177, 219, 0.3);
      
      .feature-title {
        font-size: 20px;
        font-weight: 600;
        color: var(--lolosia-color-primary);
        margin-bottom: 20px;
      }
      
      .feature-list {
        list-style: none;
        padding: 0;
        margin: 0;
        
        li {
          padding: 10px 0;
          color: #666;
          position: relative;
          padding-left: 25px;
          
          &::before {
            content: '•';
            position: absolute;
            left: 0;
            color: var(--lolosia-color-primary);
            font-size: 20px;
            line-height: 1;
          }
          
          &:not(:last-child) {
            border-bottom: 1px solid rgba(210, 177, 219, 0.2);
          }
        }
      }
      
      .color-analysis {
        display: flex;
        flex-direction: column;
        gap: 15px;
        
        .color-item {
          display: flex;
          align-items: center;
          gap: 15px;
          
          .color-swatch {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          }
          
          .color-info {
            display: flex;
            flex-direction: column;
            
            .color-name {
              font-weight: 600;
              color: var(--lolosia-color-primary);
            }
            
            .color-code {
              font-family: monospace;
              color: #999;
              font-size: 14px;
            }
            
            .color-meaning {
              color: #666;
              font-size: 14px;
            }
          }
        }
      }
    }
  }
}
</style>