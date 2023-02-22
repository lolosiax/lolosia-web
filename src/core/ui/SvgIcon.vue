<script setup lang="ts">
import { computed } from 'vue'

defineOptions({ name: 'SvgIcon' })

const props = withDefaults(
  defineProps<{
    iconClass: string
    className?: string
  }>(),
  { className: '' }
)

/** 雪碧图里的 symbol id，形如 `#icon-user`。 */
const href = computed(() => `#icon-${props.iconClass}`)
const classes = computed(() => (props.className ? `svg-icon ${props.className}` : 'svg-icon'))
</script>

<template>
  <svg :class="classes" aria-hidden="true">
    <use :xlink:href="href" />
  </svg>
</template>

<style scoped lang="scss">
.svg-icon {
  width: 1em;
  height: 1em;
  fill: currentColor;
  vertical-align: -2px;
}
</style>
