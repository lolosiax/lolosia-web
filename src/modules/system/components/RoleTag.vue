<script setup lang="ts">
import { computed } from 'vue'

defineOptions({ name: 'RoleTag' })

const props = withDefaults(
  defineProps<{
    name?: string | null
    type?: string | null
  }>(),
  { name: null, type: null }
)

const PRESET: Record<string, string> = {
  owner: '#c0392b',
  admin: '#d97706',
  user: '#0ea5a4',
  guest: '#a855f7'
}

/** 未知组按 type 哈希出一个稳定的颜色，保证同一个组每次颜色一致。 */
const color = computed(() => {
  const key = props.type ?? ''
  const preset = Object.keys(PRESET).find(item => key.includes(item))
  if (preset) return PRESET[preset]

  let hash = 0
  for (const char of key || props.name || '') {
    hash = (hash * 31 + (char.codePointAt(0) ?? 0)) % 360
  }
  return `hsl(${hash} 45% 55%)`
})
</script>

<template>
  <ElTag effect="dark" :style="{ backgroundColor: color, borderColor: color }">
    {{ name || '未分配' }}
  </ElTag>
</template>
