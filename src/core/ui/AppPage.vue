<script setup lang="ts">
import { onActivated, onBeforeUnmount, onDeactivated, onMounted, useId, useSlots } from 'vue'
import type { VNode } from 'vue'
import { useLayoutStore } from '@/core/stores/layout'

defineOptions({ name: 'AppPage' })

const slots = useSlots()
const layout = useLayoutStore()
const baseId = useId()
const empty = (): VNode[] => []

const leftId = `${baseId}-left`
const centerId = `${baseId}-center`
const rightId = `${baseId}-right`

function sync(): void {
  layout.registerNavbar(leftId, 'left', slots.left ?? empty)
  layout.registerNavbar(centerId, 'center', slots.center ?? empty)
  layout.registerNavbar(rightId, 'right', slots.right ?? empty)
}

function clear(): void {
  layout.unregisterNavbar(leftId)
  layout.unregisterNavbar(centerId)
  layout.unregisterNavbar(rightId)
}

onMounted(sync)
onActivated(sync)
onDeactivated(clear)
onBeforeUnmount(clear)
</script>

<template>
  <div class="app-page">
    <slot />
  </div>
</template>

<style scoped lang="scss">
.app-page {
  height: 100%;
  min-height: 0;
}
</style>
