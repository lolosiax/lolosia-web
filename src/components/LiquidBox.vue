<script setup lang="ts">
const prop = defineProps<{
  wBg?: boolean
}>()
</script>

<template>
  <div class="liquid-box" :class="{ 'w-bg': wBg }">
    <slot />
  </div>
</template>

<style scoped lang="scss">
.liquid-box {
  background: rgba(255, 255, 255, 0.1); /* 半透明白色背景 */
  backdrop-filter: blur(10px); /* 磨砂效果（核心） */
  -webkit-backdrop-filter: blur(10px); /* 兼容Safari */
  border-radius: 16px; /* 大圆角 */
  box-shadow: 0 4px 16px 0 rgba(31, 38, 135, 0.37); /* 扩散白色阴影 */
  border: 1px solid rgba(255, 255, 255, 0.18); /* 边框模拟玻璃反光 */
  padding: 20px;
  transition: all 0.3s ease; /* 平滑过渡 */

  /* hover时变亮（微软风格） */
  .liquid-box.hover_bright:hover {
    background: rgba(255, 255, 255, 0.15);
    box-shadow: 0 12px 40px 0 rgba(31, 38, 135, 0.45);
  }

  &.w-bg {
    background-color: rgba(255, 255, 255, 0.6);
    color: var(--el-text-color, #222222);
  }
}

</style>
