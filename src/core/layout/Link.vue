<script setup lang="ts">
import { computed } from 'vue'
import { isExternal } from '@/core/lib/path'

defineOptions({ name: 'NavLink' })

const props = defineProps<{ to: string }>()

const tag = computed(() => (isExternal(props.to) ? 'a' : 'RouterLink'))

const linkAttrs = computed(() =>
  isExternal(props.to) ? { href: props.to, target: '_blank', rel: 'noopener noreferrer' } : { to: props.to }
)
</script>

<template>
  <component :is="tag" v-bind="linkAttrs">
    <slot />
  </component>
</template>
