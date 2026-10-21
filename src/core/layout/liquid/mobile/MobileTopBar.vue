<script setup lang="ts">
// 移动端顶栏：返回 / 当前页标题 / 调试 / 用户头像。
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AvatarFrame from '../../shared/AvatarFrame.vue'
import Debugger from '../../shared/Debugger.vue'

defineOptions({ name: 'MobileTopBar' })

const route = useRoute()
const router = useRouter()

const title = computed(() => String(route.meta.title ?? '洛洛希雅'))

function goBack(): void {
  // 直接打开链接时没有上一页，退回控制台而不是点了没反应
  if (window.history.state?.back) router.back()
  else void router.push('/dashboard')
}
</script>

<template>
  <header class="mobile-topbar">
    <button class="mobile-topbar__back" type="button" aria-label="返回" @click="goBack">
      <i class="bi bi-arrow-left" />
    </button>

    <h1 class="mobile-topbar__title">{{ title }}</h1>

    <div class="mobile-topbar__tools">
      <Debugger />
      <AvatarFrame placement="bottom-end" />
    </div>
  </header>
</template>

<style scoped lang="scss">
.mobile-topbar {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: 44px 1fr auto;
  align-items: center;
  gap: 4px;
  height: calc(52px + env(safe-area-inset-top));
  padding: env(safe-area-inset-top) 8px 0;
  background: rgba(255, 255, 255, 0.82);
  border-bottom: 1px solid rgba(210, 177, 219, 0.35);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  flex: 0 0 auto;

  &__back {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    padding: 0;
    margin-left: 2px;
    border: none;
    border-radius: 50%;
    color: var(--lolosia-color-primary);
    background: rgba(210, 177, 219, 0.22);
    cursor: pointer;
    transition: background 0.2s ease;

    i {
      font-size: 20px;
      line-height: 1;
    }

    &:active {
      background: rgba(210, 177, 219, 0.45);
    }
  }

  &__title {
    margin: 0;
    overflow: hidden;
    color: var(--el-text-color-primary);
    font-size: 15px;
    font-weight: 600;
    line-height: 1.2;
    text-align: center;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  &__tools {
    display: flex;
    align-items: center;
    gap: 2px;

    :deep(.debugger) {
      margin: 0;
    }

    :deep(.avatar-frame__trigger) {
      width: 32px;
      height: 32px;
      margin-right: 4px;
    }
  }
}
</style>
