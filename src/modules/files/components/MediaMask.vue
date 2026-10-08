<script setup lang="ts">
defineOptions({ name: 'MediaMask' })

const emit = defineEmits<{ reveal: [] }>()
</script>

<template>
  <div class="media-mask" @click="emit('reveal')">
    <i class="bi bi-eye-slash-fill" />
    <span>点击查看</span>
  </div>
</template>

<style scoped lang="scss">
.media-mask {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 40px 56px;
  border-radius: 16px;
  background: rgba(60, 60, 70, 0.55);
  color: rgba(255, 255, 255, 0.75);
  font-size: 14px;
  cursor: pointer;
  backdrop-filter: blur(14px) saturate(0.5);
  -webkit-backdrop-filter: blur(14px) saturate(0.5);

  i {
    font-size: 2.4em;
  }
}
</style>
