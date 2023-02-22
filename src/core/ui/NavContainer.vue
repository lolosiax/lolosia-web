<script setup lang="ts">
import { onActivated, onBeforeUnmount, onDeactivated, onMounted, useId, useSlots, watch } from 'vue'
import type { VNode } from 'vue'
import { useLayoutStore, type NavbarAlign } from '@/core/stores/layout'

defineOptions({ name: 'NavContainer' })

const props = withDefaults(defineProps<{ align?: NavbarAlign }>(), { align: 'left' })

const slots = useSlots()
const layout = useLayoutStore()
const id = useId()
const empty = (): VNode[] => []

function sync(): void {
  layout.unregisterNavbar(id)
  layout.registerNavbar(id, props.align, slots.default ?? empty)
}

function clear(): void {
  layout.unregisterNavbar(id)
}

onMounted(sync)
onActivated(sync)
onDeactivated(clear)
onBeforeUnmount(clear)
watch(() => props.align, sync)
</script>

<template>
  <!-- 不渲染 DOM：只把插槽登记给布局外的主面板 -->
  <span v-if="false" />
</template>
