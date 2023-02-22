<script setup lang="ts">
import { computed, h, Fragment } from 'vue'
import type { VNode } from 'vue'
import { collectNavbarNodes } from '@/core/composables/use-navbar-slot'
import { useLayoutStore } from '@/core/stores/layout'

defineOptions({ name: 'AppNavBar' })

const layout = useLayoutStore()
const hasNavbar = computed(() => layout.hasNavbar)

function region(align: 'left' | 'center' | 'right') {
  return (): VNode => h(Fragment, collectNavbarNodes(layout.navbarRenderers(align)))
}

const LeftRegion = region('left')
const CenterRegion = region('center')
const RightRegion = region('right')
</script>

<template>
  <div v-if="hasNavbar" class="app-nav-bar">
    <div class="app-nav-bar__region app-nav-bar__region--left">
      <component :is="LeftRegion" />
    </div>
    <div class="app-nav-bar__region app-nav-bar__region--center">
      <component :is="CenterRegion" />
    </div>
    <div class="app-nav-bar__region app-nav-bar__region--right">
      <component :is="RightRegion" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.app-nav-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  height: var(--nav-bar-height);
  padding: 0 12px;
  flex: 0 0 auto;
  overflow-x: auto;

  &::-webkit-scrollbar {
    display: none;
  }

  &__region {
    display: flex;
    align-items: center;
    gap: 8px;

    &--center {
      flex: 1;
      justify-content: center;
    }

    &--right {
      margin-left: auto;
      justify-content: flex-end;
    }
  }
}
</style>
