<script setup lang="ts">
// 「整部番 / 任意发布组」的开关块。
defineOptions({ name: 'FollowToggle' })

defineProps<{
  followed: boolean
  loading: boolean
}>()

const emit = defineEmits<{
  (e: 'toggle'): void
}>()
</script>

<template>
  <div class="follow">
    <div class="follow__text">
      <strong>整部番</strong>
      <span>任意发布组出新资源都提醒</span>
    </div>
    <el-button :type="followed ? 'info' : 'primary'" size="small" :loading="loading" @click="emit('toggle')">
      <i :class="followed ? 'bi bi-bell-slash' : 'bi bi-bell'" />
      {{ followed ? '取消关注' : '关注' }}
    </el-button>
  </div>
</template>

<style scoped lang="scss">
.follow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(164, 128, 171, 0.1);

  &__text {
    display: flex;
    flex-direction: column;

    strong {
      color: #3d2f42;
      font-size: 13px;
    }

    span {
      color: #8d7f92;
      font-size: 11px;
    }
  }
}
</style>
