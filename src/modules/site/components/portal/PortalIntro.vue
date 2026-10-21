<script setup lang="ts">
import type { PortalCard } from '../../lib'

defineOptions({ name: 'PortalIntro' })

defineProps<{ items: PortalCard[] }>()
</script>

<template>
  <div class="intro">
    <span class="intro__badge"><span class="intro__dot" />Navigation</span>
    <h1 class="intro__title">
      <span>欢迎你</span>
      <em>来自现实的旅人</em>
    </h1>
    <p class="intro__lead">你想要去往何方？</p>

    <ul class="intro__hints">
      <li v-for="item in items" :key="item.id">
        <i class="bi" :class="`bi-${item.icon}`" />
        <span>{{ item.title }}</span>
      </li>
    </ul>

    <span class="intro__tip">选择一个入口 <i class="bi bi-arrow-down" /></span>
  </div>
</template>

<style scoped lang="scss">
.intro {
  display: flex;
  flex-direction: column;
  max-width: 400px;

  &__badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    align-self: flex-start;
    margin-bottom: 26px;
    padding: 6px 16px;
    border: 1px solid rgba(164, 128, 171, 0.25);
    border-radius: 20px;
    color: #8b6a92;
    font-size: 10px;
    letter-spacing: 4px;
    text-transform: uppercase;
    background: rgba(255, 255, 255, 0.5);
    backdrop-filter: blur(8px);
  }

  &__dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #c296cd;
  }

  &__title {
    margin: 0 0 14px;
    font-size: 56px;
    font-weight: 800;
    line-height: 1.1;

    span {
      display: block;
      color: #2d1b3a;
    }

    em {
      display: block;
      padding-bottom: 6px;
      font-size: 64px;
      font-style: normal;
      background: linear-gradient(135deg, #c296cd, #ddc2e5 50%, #a480ab);
      background-clip: text;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
  }

  &__lead {
    margin: 0 0 28px;
    color: #8a7a94;
    font-size: 15px;
  }

  &__hints {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin: 0 0 34px;
    padding: 0;
    list-style: none;

    li {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 9px 14px;
      border: 1px solid rgba(164, 128, 171, 0.12);
      border-radius: 10px;
      color: #8a7a94;
      font-size: 13px;
      background: rgba(255, 255, 255, 0.5);

      i {
        color: #c296cd;
        font-size: 15px;
      }
    }
  }

  &__tip {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: rgba(138, 122, 148, 0.7);
    font-size: 12px;
    letter-spacing: 1px;
  }
}

@media (max-width: 1100px) {
  .intro {
    &__title {
      font-size: 40px;

      em {
        font-size: 46px;
      }
    }
  }
}

@media (max-width: 820px) {
  .intro {
    max-width: 100%;

    &__badge {
      margin-bottom: 18px;
    }

    &__title {
      margin-bottom: 10px;
      font-size: clamp(32px, 8vw, 44px);

      em {
        font-size: clamp(36px, 9.6vw, 52px);
      }
    }

    &__lead {
      margin-bottom: 18px;
    }

    &__hints {
      margin-bottom: 0;
    }
  }
}

@media (max-width: 600px) {
  /* 手机上卡片本身就是入口，重复的导航提示不再占用首屏高度 */
  .intro {
    &__hints,
    &__tip {
      display: none;
    }

    &__lead {
      margin-bottom: 0;
    }
  }
}
</style>
