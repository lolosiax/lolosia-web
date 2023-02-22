<script setup lang="ts">
import { computed } from 'vue'
import * as ElementIcons from '@element-plus/icons-vue'

defineOptions({ name: 'ElSvgIcon' })

const props = withDefaults(
  defineProps<{
    name?: string
    size?: number
    color?: string
  }>(),
  {
    name: 'Fold',
    size: 18,
    color: ''
  }
)

const icon = computed(() => {
  const icons = ElementIcons as Record<string, unknown>
  return icons[props.name] ?? icons.Fold
})
</script>

<template>
  <ElIcon :size="size" :color="color">
    <component :is="icon" />
  </ElIcon>
</template>
