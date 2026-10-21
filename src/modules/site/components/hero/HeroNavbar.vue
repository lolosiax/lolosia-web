<script setup lang="ts">
// 全屏展示页的导航：分页锚点 + 控制台 / 个人中心 / 返回入口页。
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/core/stores/auth'

defineOptions({ name: 'HeroNavbar' })

defineProps<{
  sections: readonly { id: string; label: string }[]
  active: number
}>()

const emit = defineEmits<{
  (e: 'go', index: number): void
}>()

const router = useRouter()
const auth = useAuthStore()

function goDashboard(): void {
  void router.push('/dashboard')
}

function goProfile(): void {
  void router.push(auth.token ? '/profile' : '/login')
}

function goLanding(): void {
  void router.push('/')
}
</script>

<template>
  <nav class="hero-nav">
    <div class="hero-nav__links">
      <button
        v-for="(item, index) in sections"
        :key="item.id"
        type="button"
        class="hero-nav__link"
        :class="{ 'is-active': active === index }"
        @click="emit('go', index)"
      >
        {{ item.label }}
      </button>
    </div>
    <div class="hero-nav__actions">
      <button type="button" title="进入控制台" @click="goDashboard"><i class="bi bi-list" /></button>
      <button type="button" title="个人中心" @click="goProfile"><i class="bi bi-person" /></button>
      <button type="button" title="返回入口页" @click="goLanding"><i class="bi bi-arrow-return-left" /></button>
    </div>
  </nav>
</template>

<style scoped lang="scss">
.hero-nav {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 20px 40px;

  &__links {
    display: flex;
    gap: 6px;
  }

  &__link {
    padding: 7px 14px;
    border: none;
    border-radius: 999px;
    color: rgba(74, 61, 77, 0.65);
    font-size: 13px;
    font-weight: 600;
    background: transparent;
    cursor: pointer;
    transition: all 0.25s ease;

    &:hover {
      color: #2d1b3a;
      background: rgba(255, 255, 255, 0.5);
    }

    &.is-active {
      color: #fff;
      background: linear-gradient(135deg, #c296cd, #a480ab);
      box-shadow: 0 4px 14px rgba(164, 128, 171, 0.35);
    }
  }

  &__actions {
    display: flex;
    gap: 10px;

    button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border: 1px solid rgba(255, 255, 255, 0.7);
      border-radius: 50%;
      color: #8b6a92;
      font-size: 15px;
      background: rgba(255, 255, 255, 0.55);
      cursor: pointer;
      backdrop-filter: blur(8px);
      transition: all 0.25s ease;

      &:hover {
        color: #fff;
        background: linear-gradient(135deg, #c296cd, #a480ab);
        transform: translateY(-2px);
      }
    }
  }
}

@media (max-width: 720px) {
  .hero-nav {
    padding: 14px 18px;

    &__links {
      gap: 2px;
    }

    &__link {
      padding: 6px 9px;
      font-size: 12px;
    }
  }
}
</style>
