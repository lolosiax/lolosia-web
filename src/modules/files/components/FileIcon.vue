<script setup lang="ts">
import { computed } from 'vue'
import { iconOf } from '../lib'

defineOptions({ name: 'FileIcon' })

const props = withDefaults(defineProps<{ ext: string; directory?: boolean }>(), { directory: false })

const meta = computed(() => iconOf({ directory: props.directory, ext: props.ext }))
</script>

<template>
  <span class="file-icon" :style="{ color: meta.color }">
    <i :class="`bi bi-${meta.icon}`" aria-hidden="true" />
  </span>
</template>

<style scoped lang="scss">
.file-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8em;
  line-height: 1;
}
</style>
