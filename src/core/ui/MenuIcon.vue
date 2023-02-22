<script setup lang="ts">
import { computed } from 'vue'

defineOptions({ name: 'MenuIcon' })

const props = defineProps<{ icon?: string | null }>()

/** 兼容 `house-door` 与 `bi-house-door` 两种写法。 */
const className = computed(() => {
  const icon = props.icon?.trim()
  if (!icon) return 'bi bi-dot'
  return icon.startsWith('bi-') ? `bi ${icon}` : `bi bi-${icon}`
})
</script>

<template>
  <i class="menu-icon" :class="className" aria-hidden="true" />
</template>

<style scoped lang="scss">
.menu-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}
</style>
