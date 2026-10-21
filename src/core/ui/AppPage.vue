<script setup lang="ts">
import { onActivated, onBeforeUnmount, onDeactivated, onMounted, useId, useSlots } from 'vue'
import { useLayoutStore } from '@/core/stores/layout'

defineOptions({ name: 'AppPage' })

const slots = useSlots()
const layout = useLayoutStore()
const baseId = useId()

const leftId = `${baseId}-left`
const centerId = `${baseId}-center`
const rightId = `${baseId}-right`

function sync(): void {
  const entries = [
    { id: leftId, align: 'left' as const, slot: slots.left },
    { id: centerId, align: 'center' as const, slot: slots.center },
    { id: rightId, align: 'right' as const, slot: slots.right }
  ]

  for (const { id, align, slot } of entries) {
    if (slot) layout.registerNavbar(id, align, slot)
    else layout.unregisterNavbar(id)
  }
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
