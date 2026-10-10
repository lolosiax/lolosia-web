<script setup lang="ts">
// 多选聚合标签的右键菜单：都作用于当前整份选择，只摘关联、不删词表。
defineOptions({ name: 'TagMenu' })

defineProps<{
  open: boolean
  x: number
  y: number
}>()

const emit = defineEmits<{
  apply: []
  remove: []
  close: []
}>()
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="tag-menu__mask" @click="emit('close')" @contextmenu.prevent="emit('close')" />
    <div v-if="open" class="tag-menu" :style="{ left: `${x}px`, top: `${y}px` }">
      <button type="button" class="tag-menu__item" @click="emit('apply')">
        <i class="bi bi-check2-square" />
        应用到全部
      </button>
      <button type="button" class="tag-menu__item is-danger" @click="emit('remove')">
        <i class="bi bi-x-square" />
        删除该标签
      </button>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
.tag-menu__mask {
  position: fixed;
  inset: 0;
  z-index: 2000;
}

.tag-menu {
  position: fixed;
  z-index: 2001;
  min-width: 132px;
  padding: 4px;
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 6px 20px rgba(31, 38, 135, 0.18);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);

  &__item {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 7px 10px;
    border: 0;
    border-radius: 7px;
    background: transparent;
    color: inherit;
    font: inherit;
    font-size: 13px;
    text-align: left;
    cursor: pointer;

    &:hover {
      background: rgba(194, 150, 205, 0.22);
    }

    &.is-danger {
      color: var(--el-color-danger, #f56c6c);

      &:hover {
        background: rgba(245, 108, 108, 0.14);
      }
    }
  }
}
</style>
