<script setup lang="ts">
// 地图右侧浮层：盖在地图上方但保持地图实例与尺寸不变，也不挡左侧菜单。
import FootprintGallery from './FootprintGallery.vue'
import type { FootprintPoint } from '../api'

defineOptions({ name: 'FootprintPanel' })

defineProps<{
  title: string
  photos: FootprintPoint[]
  loading: boolean
  brokenThumbs: Set<string>
  revealed: Record<string, boolean>
  canSaveRegion: boolean
  canEditRegion: boolean
}>()

const emit = defineEmits<{
  close: []
  'save-region': []
  'edit-region': []
  pick: [index: number]
  reveal: [path: string]
  broken: [path: string]
}>()
</script>

<template>
  <aside class="fp-panel">
    <header class="fp-panel__head">
      <h3 class="fp-panel__title">{{ title }}</h3>
      <button type="button" class="fp-panel__close" title="关闭" @click="emit('close')">
        <i class="bi bi-x-lg" />
      </button>
    </header>
    <div v-if="canSaveRegion || canEditRegion" class="fp-panel__actions">
      <ElButton v-if="canSaveRegion" size="small" type="primary" @click="emit('save-region')">保存为区域</ElButton>
      <ElButton v-if="canEditRegion" size="small" @click="emit('edit-region')">编辑区域</ElButton>
    </div>
    <FootprintGallery
      compact
      :photos="photos"
      :loading="loading"
      :broken-thumbs="brokenThumbs"
      :revealed="revealed"
      @pick="emit('pick', $event)"
      @reveal="emit('reveal', $event)"
      @broken="emit('broken', $event)"
    />
  </aside>
</template>

<style scoped lang="scss">
.fp-panel {
  position: absolute;
  z-index: 5;
  top: 10px;
  right: 10px;
  bottom: 10px;
  display: flex;
  flex-direction: column;
  width: min(440px, calc(100% - 20px));
  padding: 14px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.84);
  box-shadow: 0 12px 40px rgba(31, 38, 135, 0.22);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);

  &__head {
    display: flex;
    align-items: center;
    gap: 10px;
    padding-bottom: 10px;
  }

  &__title {
    flex: 1;
    min-width: 0;
    margin: 0;
    overflow: hidden;
    font-size: 15px;
    font-weight: 600;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  &__close {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    padding: 0;
    border: 0;
    border-radius: 9px;
    background: rgba(124, 116, 168, 0.12);
    color: var(--el-text-color-secondary, #909399);
    font-size: 12px;
    cursor: pointer;

    &:hover {
      background: rgba(124, 116, 168, 0.22);
      color: var(--el-text-color-primary, #303133);
    }
  }

  &__actions {
    display: flex;
    gap: 8px;
    padding-bottom: 10px;
  }
}
</style>
