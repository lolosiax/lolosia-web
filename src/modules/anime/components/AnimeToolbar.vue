<script setup lang="ts">
// 番组表顶部工具栏：搜索、桌面通知与管理员运维动作。
defineOptions({ name: 'AnimeToolbar' })

defineProps<{
  keyword: string
  canManage: boolean
  notifySupported: boolean
  notifyGranted: boolean
  syncing: boolean
  polling: boolean
  rematching: boolean
  loading: boolean
}>()

const emit = defineEmits<{
  (e: 'update:keyword', value: string): void
  (e: 'search'): void
  (e: 'notify'): void
  (e: 'sync'): void
  (e: 'poll'): void
  (e: 'rematch'): void
  (e: 'refresh'): void
}>()

function onInput(value: string): void {
  emit('update:keyword', value)
}
</script>

<template>
  <div class="toolbar">
    <ElInput
      class="toolbar__search"
      :model-value="keyword"
      placeholder="搜索番剧…"
      clearable
      @update:model-value="onInput"
      @keyup.enter="emit('search')"
      @clear="emit('search')"
    />
    <el-button v-if="notifySupported && !notifyGranted" plain @click="emit('notify')">
      <i class="bi bi-bell" />开启桌面通知
    </el-button>
    <el-button v-if="canManage" :loading="syncing" @click="emit('sync')">
      <i class="bi bi-cloud-arrow-down" />同步目录
    </el-button>
    <el-button v-if="canManage" :loading="polling" @click="emit('poll')">
      <i class="bi bi-arrow-clockwise" />立即拉取
    </el-button>
    <el-button v-if="canManage" :loading="rematching" @click="emit('rematch')">
      <i class="bi bi-stars" />匹配所有未识别
    </el-button>
    <el-button :loading="loading" @click="emit('refresh')">
      <i class="bi bi-arrow-repeat" />刷新
    </el-button>
  </div>
</template>

<style scoped lang="scss">
.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;

  &__search {
    width: 220px;
  }
}

@media (max-width: 1024px) {
  .toolbar__search {
    width: 160px;
  }
}
</style>
