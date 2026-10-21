<script setup lang="ts">
import { useRouter } from 'vue-router'
import logo from '@/core/icons/common/logo.png?url'

defineOptions({ name: 'ErrorView' })

defineProps<{
  code: string
  title: string
  description: string
}>()

const router = useRouter()

function goHome(): void {
  void router.push('/dashboard')
}

function goBack(): void {
  if (window.history.length > 1) router.back()
  else goHome()
}
</script>

<template>
  <div class="error-view">
    <div class="error-view__card">
      <img class="error-view__logo" :src="logo" alt="" />
      <p class="error-view__code">{{ code }}</p>
      <h1 class="error-view__title">{{ title }}</h1>
      <p class="error-view__description">{{ description }}</p>
      <div class="error-view__actions">
        <ElButton type="primary" round @click="goHome">回到首页</ElButton>
        <ElButton round @click="goBack">返回上一页</ElButton>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.error-view {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  min-height: 100dvh;
  padding: 24px;
  background: linear-gradient(to bottom, #d8abe2 0%, #fbf2ff 50%);

  &__card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    width: min(520px, 100%);
    padding: 40px 32px;
    text-align: center;
    background: rgba(255, 255, 255, 0.72);
    border: 1px solid rgba(255, 255, 255, 0.6);
    border-radius: 20px;
    box-shadow: 0 12px 40px rgba(31, 38, 135, 0.16);
    backdrop-filter: blur(12px);
  }

  &__logo {
    width: 64px;
    height: 64px;
    border-radius: 16px;
    box-shadow: 0 10px 24px rgba(74, 45, 94, 0.2);
  }

  &__code {
    margin: 0;
    font-size: 56px;
    font-weight: 700;
    line-height: 1;
    color: var(--lolosia-color-primary-dark-2);
  }

  &__title {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: #4a3d4d;
  }

  &__description {
    margin: 0;
    color: #7a6a7e;
    line-height: 1.7;
  }

  &__actions {
    display: flex;
    gap: 12px;
    margin-top: 8px;
  }
}
</style>
