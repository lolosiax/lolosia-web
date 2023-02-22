<script setup lang="ts">
defineOptions({ name: 'LiquidBox' })

withDefaults(defineProps<{ white?: boolean }>(), { white: false })
</script>

<template>
  <div class="liquid-box" :class="{ 'liquid-box--white': white }">
    <slot />
  </div>
</template>

<style scoped lang="scss">
.liquid-box {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 16px;
  box-shadow: 0 4px 16px 0 rgba(31, 38, 135, 0.37);
  padding: 20px;
  transition: all 0.3s ease;

  &--white {
    background-color: rgba(255, 255, 255, 0.6);
    color: var(--el-text-color, #222);
  }

  &:hover {
    background: rgba(255, 255, 255, 0.16);
  }
}
</style>
