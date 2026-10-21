<script setup lang="ts">
import { computed, watch } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { useRouteCacheStore } from '@/core/stores/route-cache'

defineOptions({ name: 'AppMain' })

const route = useRoute()
const cache = useRouteCacheStore()

/** `viewKey` 让同一模块内换子路径时复用同一个页面实例。 */
const pageKey = computed(() => route.meta.viewKey ?? route.path)

interface CacheTrail {
  name: string
  cached: boolean
  dropOnLeave: boolean
}

let trail: CacheTrail | null = null

function syncCache(): void {
  const name = typeof route.name === 'string' ? route.name : ''

  if (trail && trail.cached && trail.dropOnLeave && trail.name !== name) {
    cache.remove(trail.name)
    cache.removeDeep(trail.name)
  }

  if (name && route.meta.cachePage) {
    cache.add(name)
    if (route.matched.length > 2) cache.addDeep(name)
  }

  trail = name ? { name, cached: Boolean(route.meta.cachePage), dropOnLeave: Boolean(route.meta.leaveRmCachePage) } : null
}

watch(() => route.name, syncCache, { immediate: true })
</script>

<template>
  <main class="app-main">
    <RouterView v-slot="{ Component }">
      <KeepAlive :include="cache.cachedViews">
        <component :is="Component" :key="pageKey" />
      </KeepAlive>
    </RouterView>
  </main>
</template>

<style scoped lang="scss">
.app-main {
  position: relative;
  flex: 1;
  min-height: 0;
  padding: var(--app-main-padding);
  overflow: auto;
}
</style>
