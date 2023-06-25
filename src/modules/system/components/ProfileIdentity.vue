<script setup lang="ts">
import { useAuthStore } from '@/core/stores/auth'
import LiquidBox from '@/core/ui/LiquidBox.vue'
import MenuIcon from '@/core/ui/MenuIcon.vue'
import { useAvatar } from '../composables/use-avatar'
import RoleTag from './RoleTag.vue'

defineOptions({ name: 'ProfileIdentity' })

const auth = useAuthStore()
const { avatarFailed, uploading, showAvatar, pick, onChange } = useAvatar()
</script>

<template>
  <LiquidBox white class="profile-identity">
    <button class="profile-identity__avatar" type="button" :disabled="uploading" @click="pick">
      <img
        v-if="showAvatar"
        class="profile-identity__image"
        :src="auth.avatarUrl"
        alt="头像"
        @error="avatarFailed = true"
      />
      <i v-else class="bi bi-person-circle profile-identity__placeholder" aria-hidden="true" />
      <span class="profile-identity__tip">
        <MenuIcon :icon="uploading ? 'arrow-repeat' : 'camera-fill'" />
      </span>
    </button>

    <div class="profile-identity__meta">
      <h2 class="profile-identity__name">{{ auth.displayName }}</h2>
      <RoleTag :name="auth.role?.roleName" :type="auth.roleType" />
    </div>

    <input ref="fileInput" class="profile-identity__file" type="file" accept="image/*" @change="onChange" />
  </LiquidBox>
</template>

<style scoped lang="scss">
.profile-identity {
  display: flex;
  align-items: center;
  gap: 20px;

  &__avatar {
    position: relative;
    width: 96px;
    height: 96px;
    padding: 0;
    border: 1px solid rgba(255, 255, 255, 0.8);
    border-radius: 24px;
    background: rgba(255, 255, 255, 0.7);
    overflow: hidden;
    cursor: pointer;
  }

  &__image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &__placeholder {
    font-size: 56px;
    color: var(--lolosia-color-primary-dark-2);
  }

  &__tip {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.35);
    color: #fff;
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  &__avatar:hover &__tip {
    opacity: 1;
  }

  &__meta {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__name {
    font-size: 20px;
    font-weight: 600;
    color: #4a3d4d;
  }

  &__file {
    display: none;
  }
}
</style>
