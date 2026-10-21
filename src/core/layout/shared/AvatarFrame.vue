<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { logout } from '@/core/api/user'
import { greetingOf } from '@/core/lib/format'
import { useAuthStore } from '@/core/stores/auth'

defineOptions({ name: 'AvatarFrame' })

const auth = useAuthStore()
const router = useRouter()
const avatarFailed = ref(false)

const greeting = computed(() => `${greetingOf()}好，${auth.displayName}`)
const showAvatar = computed(() => Boolean(auth.avatarUrl) && !avatarFailed.value)

watch(
  () => auth.avatarUrl,
  () => {
    avatarFailed.value = false
  }
)

function goHome(): void {
  void router.push('/dashboard')
}

function goProfile(): void {
  void router.push('/profile')
}

async function handleLogout(): Promise<void> {
  try {
    await logout()
  } catch (error) {
    console.warn('[auth] 退出接口失败，仍然清理本地会话', error)
  }
  auth.reset()
  ElMessage.success('退出登录成功')
  await router.replace({ path: '/login', query: { redirect: '/' } })
}
</script>

<template>
  <ElDropdown trigger="click" placement="right-end" class="avatar-frame">
    <button class="avatar-frame__trigger" type="button" aria-label="用户菜单">
      <img v-if="showAvatar" class="avatar-frame__image" :src="auth.avatarUrl" alt="" @error="avatarFailed = true" />
      <i v-else class="bi bi-person-circle avatar-frame__placeholder" aria-hidden="true" />
    </button>
    <template #dropdown>
      <ElDropdownMenu>
        <ElDropdownItem disabled>{{ greeting }}</ElDropdownItem>
        <ElDropdownItem divided @click="goHome">首页</ElDropdownItem>
        <ElDropdownItem @click="goProfile">个人中心</ElDropdownItem>
        <ElDropdownItem @click="handleLogout">退出登录</ElDropdownItem>
      </ElDropdownMenu>
    </template>
  </ElDropdown>
</template>

<style scoped lang="scss">
.avatar-frame {
  &__trigger {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    padding: 0;
    border: 1px solid rgba(255, 255, 255, 0.7);
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.6);
    cursor: pointer;
    overflow: hidden;
  }

  &__image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &__placeholder {
    font-size: 24px;
    color: var(--lolosia-color-primary-dark-2);
  }
}
</style>
