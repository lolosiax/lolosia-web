<script setup lang="ts">
import logo from '@/core/icons/common/logo.png?url'
import MenuIcon from '@/core/ui/MenuIcon.vue'
import { useAuthStore } from '@/core/stores/auth'
import { useAvatar } from '../composables/use-avatar'
import RoleTag from './RoleTag.vue'

interface Stat {
  label: string
  value: string
  icon: string
}

defineOptions({ name: 'ProfileHero' })

defineProps<{
  name: string
  handle: string
  signature: string
  bio: string
  location: string
  website: string
  joined: string
  roleName?: string | null
  roleType?: string | null
  stats: Stat[]
}>()

const emit = defineEmits<{ edit: [] }>()

const auth = useAuthStore()
const { avatarFailed, uploading, showAvatar, pick, onChange } = useAvatar()
</script>

<template>
  <section class="hero">
    <div class="hero__banner">
      <span class="hero__orb hero__orb--a" />
      <span class="hero__orb hero__orb--b" />
      <span class="hero__grid" />
      <img class="hero__watermark" :src="logo" alt="" />
      <div class="hero__banner-actions">
        <ElButton class="hero__edit" round @click="emit('edit')">
          <MenuIcon icon="pencil-square" />
          编辑资料
        </ElButton>
      </div>
    </div>

    <div class="hero__body">
      <button class="hero__avatar" type="button" :disabled="uploading" aria-label="更换头像" @click="pick">
        <img v-if="showAvatar" :src="auth.avatarUrl" alt="头像" @error="avatarFailed = true" />
        <img v-else :src="logo" alt="" />
        <span class="hero__avatar-mask">
          <MenuIcon :icon="uploading ? 'arrow-repeat' : 'camera-fill'" />
        </span>
      </button>

      <div class="hero__main">
        <div class="hero__title">
          <h1>{{ name }}</h1>
          <RoleTag :name="roleName" :type="roleType" />
          <button class="hero__pencil" type="button" aria-label="修改昵称" @click="emit('edit')">✎</button>
        </div>
        <p class="hero__handle">{{ handle }}<span>·</span>加入于 {{ joined }}</p>
        <p class="hero__signature">{{ signature }}</p>
        <p class="hero__bio">{{ bio }}</p>
        <div class="hero__meta">
          <MenuIcon icon="geo-alt" />
          <span>{{ location }}</span>
          <span class="hero__dot">·</span>
          <MenuIcon icon="link-45deg" />
          <span>{{ website }}</span>
        </div>
      </div>

      <ul class="hero__stats">
        <li v-for="stat in stats" :key="stat.label">
          <MenuIcon :icon="stat.icon" />
          <strong>{{ stat.value }}</strong>
          <span>{{ stat.label }}</span>
        </li>
      </ul>
    </div>

    <input ref="fileInput" class="hero__file" type="file" accept="image/*" @change="onChange" />
  </section>
</template>

<style scoped lang="scss">
.hero {
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.62);
  box-shadow: 0 24px 60px rgba(74, 45, 94, 0.14);
  backdrop-filter: blur(18px) saturate(1.2);
  -webkit-backdrop-filter: blur(18px) saturate(1.2);

  &__banner {
    position: relative;
    height: 192px;
    overflow: hidden;
    border-radius: 27px 27px 0 0;
    background:
      radial-gradient(120% 140% at 8% 0%, rgba(255, 255, 255, 0.55), transparent 55%),
      linear-gradient(120deg, #c5a3e8 0%, #dbb6ee 38%, #f3cfe4 68%, #b79ae0 100%);
  }

  &__orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(6px);

    &--a {
      top: -170px;
      right: 6%;
      width: 340px;
      height: 340px;
      background: rgba(255, 255, 255, 0.26);
    }

    &--b {
      bottom: -130px;
      left: 24%;
      width: 200px;
      height: 200px;
      background: rgba(124, 90, 143, 0.2);
    }
  }

  &__grid {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.15) 1px, transparent 1px);
    background-size: 44px 44px;
    mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.65), transparent 82%);
  }

  &__watermark {
    position: absolute;
    top: 26px;
    right: 38px;
    width: 136px;
    height: 136px;
    border-radius: 32px;
    opacity: 0.18;
    transform: rotate(-8deg);
    filter: saturate(0.85) blur(0.5px);
  }

  &__banner-actions {
    position: absolute;
    top: 18px;
    right: 20px;
    display: flex;
    gap: 8px;
  }

  &__edit.el-button {
    height: 34px;
    padding: 0 14px;
    border: 1px solid rgba(255, 255, 255, 0.55);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.3);
    color: #3a2347;
    font-size: 12.5px;
    font-weight: 600;
    backdrop-filter: blur(10px);

    &:hover,
    &:focus {
      border-color: rgba(255, 255, 255, 0.8);
      background: rgba(255, 255, 255, 0.58);
      color: #2d1b3a;
    }
  }

  &__body {
    display: grid;
    grid-template-columns: 132px minmax(0, 1fr) auto;
    gap: 24px;
    align-items: start;
    padding: 0 32px 28px;
  }

  &__avatar {
    position: relative;
    width: 132px;
    height: 132px;
    margin-top: -54px;
    padding: 5px;
    border: 0;
    border-radius: 50%;
    background: linear-gradient(140deg, #fff 0%, #e7d2f3 55%, #c9a6e6 100%);
    box-shadow: 0 16px 34px rgba(74, 45, 94, 0.24);
    cursor: pointer;

    img {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background: #f3e9fb;
      object-fit: cover;
    }
  }

  &__avatar-mask {
    position: absolute;
    inset: 5px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: rgba(45, 27, 58, 0.42);
    color: #fff;
    font-size: 22px;
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  &__avatar:hover &__avatar-mask {
    opacity: 1;
  }

  &__main {
    min-width: 0;
    padding-top: 18px;
  }

  &__title {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;

    h1 {
      margin: 0;
      color: #2d1b3a;
      font-size: 28px;
      font-weight: 800;
      line-height: 1.2;
      letter-spacing: -0.02em;
    }
  }

  &__pencil {
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    border: 1px solid rgba(164, 128, 171, 0.24);
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.72);
    color: #8d6aa0;
    font-size: 15px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: #fff;
      box-shadow: 0 6px 14px rgba(164, 128, 171, 0.2);
      transform: translateY(-1px);
    }
  }

  &__handle {
    margin: 6px 0 0;
    color: #8c7b90;
    font-size: 12.5px;

    span {
      margin: 0 6px;
      opacity: 0.5;
    }
  }

  &__signature {
    margin: 10px 0 0;
    color: #6b5a73;
    font-size: 14px;
    font-weight: 600;
  }

  &__bio {
    max-width: 620px;
    margin: 6px 0 0;
    color: #7a6a7e;
    font-size: 13px;
    line-height: 1.8;
  }

  &__meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 10px;
    margin-top: 12px;
    color: #8c7b90;
    font-size: 12px;

    .menu-icon {
      color: #a480ab;
      font-size: 13px;
    }
  }

  &__dot {
    opacity: 0.5;
  }

  &__stats {
    display: grid;
    grid-template-columns: repeat(2, minmax(86px, 1fr));
    gap: 8px;
    min-width: 236px;
    margin: 18px 0 0;
    padding: 12px 14px;
    border: 1px solid rgba(164, 128, 171, 0.16);
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.55);
    list-style: none;

    li {
      display: grid;
      grid-template-columns: auto 1fr;
      align-items: center;
      column-gap: 8px;
      padding: 5px 7px;
      border-radius: 12px;

      .menu-icon {
        grid-row: span 2;
        color: #a480ab;
        font-size: 16px;
      }

      strong {
        color: #3a2347;
        font-size: 16px;
        font-weight: 800;
        line-height: 1.1;
        font-variant-numeric: tabular-nums;
      }

      span {
        color: #8c7b90;
        font-size: 11px;
      }
    }
  }

  &__file {
    display: none;
  }
}

@media (max-width: 960px) {
  .hero {
    &__body {
      grid-template-columns: 112px minmax(0, 1fr);
      gap: 20px;
    }

    &__avatar {
      width: 112px;
      height: 112px;
      margin-top: -46px;
    }

    &__stats {
      grid-column: 1 / -1;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      margin-top: 0;
    }
  }
}

@media (max-width: 640px) {
  .hero {
    &__banner {
      height: 150px;
    }

    &__watermark {
      top: 18px;
      right: 10px;
      width: 104px;
      height: 104px;
      border-radius: 24px;
    }

    &__body {
      grid-template-columns: minmax(0, 1fr);
      gap: 14px;
      padding: 0 20px 22px;
    }

    &__avatar {
      width: 96px;
      height: 96px;
      margin-top: -48px;
    }

    &__main {
      padding-top: 0;
    }

    &__title h1 {
      font-size: 23px;
    }

    &__stats {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      min-width: 0;
    }
  }
}
</style>
