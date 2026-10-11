<script setup lang="ts">
// 侧栏的一行：缩略图 + 标题 + 副标题（可选编辑按钮）。
defineOptions({ name: 'FootprintRow' })

defineProps<{
  thumbSrc: string
  title: string
  sub: string
  active: boolean
  /** 区域颜色圆点；空串表示不画。 */
  dot?: string
  editable?: boolean
}>()

const emit = defineEmits<{
  select: []
  edit: []
  broken: []
}>()
</script>

<template>
  <button type="button" class="fp-row" :class="{ 'is-active': active }" @click="emit('select')">
    <img v-if="thumbSrc" class="fp-row__thumb" :src="thumbSrc" alt="" loading="lazy" @error="emit('broken')" />
    <span v-else class="fp-row__thumb is-fallback"><i class="bi bi-image" /></span>
    <span class="fp-row__main">
      <span class="fp-row__title" :class="{ 'has-dot': Boolean(dot) }" :style="dot ? { '--dot': dot } : undefined">
        {{ title }}
      </span>
      <span class="fp-row__sub">{{ sub }}</span>
    </span>
    <span v-if="editable" class="fp-row__edit" title="编辑区域" @click.stop="emit('edit')">
      <i class="bi bi-pencil" />
    </span>
  </button>
</template>

<style scoped lang="scss">
.fp-row {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 7px 8px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover {
    background: rgba(194, 150, 205, 0.18);
  }

  &.is-active {
    background: rgba(124, 116, 168, 0.22);
  }

  &__thumb {
    flex: 0 0 auto;
    width: 40px;
    height: 40px;
    border-radius: 8px;
    background: rgba(0, 0, 0, 0.05);
    object-fit: cover;

    &.is-fallback {
      display: flex;
      align-items: center;
      justify-content: center;
      color: #b9b4c8;
    }
  }

  &__main {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  &__title {
    overflow: hidden;
    color: #4a3d4d;
    font-size: 13px;
    text-overflow: ellipsis;
    white-space: nowrap;

    &.has-dot::before {
      display: inline-block;
      width: 8px;
      height: 8px;
      margin-right: 5px;
      border-radius: 50%;
      background: var(--dot, #e0703c);
      box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.75);
      content: '';
    }
  }

  &__sub {
    overflow: hidden;
    color: var(--el-text-color-secondary, #909399);
    font-size: 11px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__edit {
    flex: 0 0 auto;
    padding: 4px 6px;
    border-radius: 6px;
    color: var(--el-text-color-secondary, #909399);

    &:hover {
      background: rgba(0, 0, 0, 0.06);
      color: var(--el-text-color-primary, #303133);
    }
  }
}
</style>
