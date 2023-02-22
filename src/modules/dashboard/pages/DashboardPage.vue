<script setup lang="ts">
import { computed } from 'vue'
import AppPage from '@/core/ui/AppPage.vue'
import LiquidBox from '@/core/ui/LiquidBox.vue'
import MenuIcon from '@/core/ui/MenuIcon.vue'
import { buildInfo } from '@/core/config/env'
import { greetingOf } from '@/core/lib/format'
import { useAuthStore } from '@/core/stores/auth'

defineOptions({ name: 'Dashboard' })

const auth = useAuthStore()

const greeting = computed(() => `${greetingOf()}好，${auth.displayName}`)
const roleLabel = computed(() => auth.role?.roleName ?? auth.roleType ?? '未分配')

const cards = [
  { icon: 'person-badge', title: '当前角色', key: 'role' as const },
  { icon: 'git-branch', title: '构建分支', key: 'branch' as const },
  { icon: 'cpu', title: '前端版本', key: 'version' as const }
]

const cardValues = computed<Record<string, string>>(() => ({
  role: roleLabel.value,
  branch: buildInfo.branch || '本地开发',
  version: buildInfo.frontVersion
}))
</script>

<template>
  <AppPage>
    <div class="dashboard">
      <header class="dashboard__header">
        <h2 class="dashboard__greeting">{{ greeting }}</h2>
        <p class="dashboard__hint">这里是新前端的骨架页，业务数据将在后续阶段接回来。</p>
      </header>

      <div class="dashboard__cards">
        <LiquidBox v-for="card in cards" :key="card.key" class="dashboard__card" white>
          <MenuIcon :icon="card.icon" class="dashboard__card-icon" />
          <span class="dashboard__card-title">{{ card.title }}</span>
          <span class="dashboard__card-value">{{ cardValues[card.key] }}</span>
        </LiquidBox>
      </div>
    </div>
  </AppPage>
</template>

<style scoped lang="scss">
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 8px;

  &__greeting {
    font-size: 22px;
    font-weight: 600;
    color: #4a3d4d;
  }

  &__hint {
    margin-top: 6px;
    color: #7a6a7e;
  }

  &__cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
  }

  &__card {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  &__card-icon {
    font-size: 22px;
    color: var(--lolosia-color-primary-dark-2);
  }

  &__card-title {
    font-size: 12px;
    color: #8c7b90;
  }

  &__card-value {
    margin-top: 4px;
    font-size: 15px;
    font-weight: 600;
    color: #4a3d4d;
  }
}
</style>
