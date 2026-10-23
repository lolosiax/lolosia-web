<script setup lang="ts">
import type { LandingCard } from '../../composables/use-landing-cards'

defineOptions({ name: 'LandingIntro' })

defineProps<{ cards: LandingCard[] }>()
</script>

<template>
  <div class="left-panel">
    <div class="welcome-container">
      <div class="brand-badge">
        <span class="badge-dot" />
        <span>NAVIGATION</span>
      </div>

      <h1 class="main-title">
        <span class="title-line title-line-0" data-text="欢迎你">欢迎你</span>
        <span class="title-line title-line-1 accent" data-text="来自现实的旅人">来自现实的旅人</span>
      </h1>

      <p class="subtitle-text">你想要去往何方？</p>

      <div class="divider">
        <span class="divider-icon">◇</span>
      </div>

      <div class="nav-hints">
        <div v-for="card in cards" :key="card.id" class="hint-item">
          <span class="hint-icon">{{ card.icon }}</span>
          <span class="hint-label">{{ card.title }}</span>
        </div>
        <div class="hint-item accent">
          <span class="hint-icon">♡</span>
          <span class="hint-label">洛洛希雅</span>
        </div>
      </div>

      <div class="scroll-prompt">
        <span class="scroll-text">选择一个入口</span>
        <span class="scroll-arrow">↓</span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
$primary: #c296cd;
$primary-dark: #a480ab;
$text-dark: #2d1b3a;
$text-muted: #8a7a94;

.left-panel {
  position: absolute;
  inset: 0 50% 0 0;

  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 60px 50px 40px;
}

.welcome-container {
  max-width: 400px;
  margin: 0 auto;
}

.brand-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 10px;
  letter-spacing: 4px;
  text-transform: uppercase;
  color: $primary-dark;
  border: 1px solid rgba($primary, 0.25);
  padding: 6px 16px;
  border-radius: 20px;
  margin-bottom: 28px;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(8px);

  .badge-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: $primary;
  }
}

.main-title {
  font-size: 60px;
  font-weight: 800;
  line-height: 1.1;
  margin: 0 0 14px;
  isolation: isolate;

  .title-line {
    display: block;
    color: $text-dark;
    position: relative;

    &::before {
      content: attr(data-text);
      position: absolute;
      z-index: -1;
      -webkit-text-stroke: 4px white;
      -webkit-text-fill-color: transparent;
    }

    &.accent {
      font-size: 72px;
      background: linear-gradient(135deg, $primary 0%, lighten($primary, 12%) 50%, $primary-dark 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      padding-bottom: 5px;

      &::after {
        content: '';
        position: absolute;
        bottom: 4px;
        left: 0;
        width: 100%;
        height: 4px;
        background: linear-gradient(90deg, $primary, transparent);
        border-radius: 2px;
        opacity: 0.35;
      }
    }
  }
}

.subtitle-text {
  font-size: 15px;
  color: $text-muted;
  margin: 0 0 32px;
  font-weight: 400;
  letter-spacing: 0.3px;
}

.divider {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba($primary, 0.3), transparent);
  }

  .divider-icon {
    color: rgba($primary, 0.4);
    font-size: 12px;
  }
}

.nav-hints {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 44px;

  .hint-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 14px;
    border-radius: 10px;
    cursor: default;
    transition: all 0.3s ease;
    background: rgba(255, 255, 255, 0.5);
    border: 1px solid rgba($primary, 0.1);

    .hint-icon {
      font-size: 16px;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      background: rgba($primary, 0.1);
      color: $primary;
      flex-shrink: 0;
    }

    .hint-label {
      font-size: 13px;
      color: $text-muted;
      font-weight: 500;
    }

    &.accent {
      background: rgba($primary, 0.1);
      border-color: rgba($primary, 0.2);

      .hint-icon {
        background: rgba($primary, 0.2);
        color: $primary-dark;
      }
      .hint-label {
        color: $text-dark;
        font-weight: 600;
      }
    }
  }
}

.scroll-prompt {
  display: flex;
  align-items: center;
  gap: 10px;

  .scroll-text {
    font-size: 12px;
    color: rgba($text-muted, 0.6);
    letter-spacing: 1px;
  }
  .scroll-arrow {
    font-size: 14px;
    color: rgba($primary, 0.5);
    animation: bounce-down 2s ease-in-out infinite;
  }
}

@keyframes bounce-down {
  0%,
  100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  50% {
    transform: translateY(6px);
    opacity: 1;
  }
}

@media (max-width: 1024px) {
  .left-panel {
    position: static;
    top: auto;
    right: auto;
    bottom: auto;
    left: auto;
    height: auto;
    padding: 40px 32px 0;
    justify-content: flex-start;
  }

  .welcome-container {
    width: 100%;
    max-width: 720px;
    margin: 0 auto;

    .main-title {
      font-size: clamp(34px, 7.6vw, 56px);

      .title-line.accent {
        font-size: clamp(40px, 9.4vw, 64px);
      }
    }

    .subtitle-text {
      margin-bottom: 24px;
    }

    .divider {
      margin-bottom: 24px;
    }

    .nav-hints {
      margin-bottom: 28px;
    }
  }
}

@media (max-width: 768px) {
  .left-panel {
    padding: 32px 20px 0;

    .brand-badge {
      margin-bottom: 20px;
      font-size: 9px;
      letter-spacing: 3px;
      padding: 5px 12px;
    }

    .main-title {
      font-size: clamp(30px, 8vw, 44px);
      margin-bottom: 10px;
      line-height: 1.15;

      .title-line::before {
        -webkit-text-stroke-width: 3px;
      }

      .title-line.accent {
        font-size: clamp(34px, 9.6vw, 52px);
      }
    }

    .subtitle-text {
      font-size: 14px;
      margin-bottom: 4px;
    }

    // 手机上卡片本身就是入口，重复的提示列表与分割线隐藏
    .divider,
    .nav-hints,
    .scroll-prompt {
      display: none;
    }
  }
}
</style>
