<script setup lang="ts">
// 照片网格：敏感图先糊上，点一下先放行遮罩、再点才进全屏。
import type { FootprintPoint } from '../api'
import { isSensitive, thumbOf } from '../lib'

defineOptions({ name: 'FootprintGallery' })

const props = defineProps<{
  photos: FootprintPoint[]
  loading: boolean
  brokenThumbs: Set<string>
  revealed: Record<string, boolean>
}>()

const emit = defineEmits<{
  pick: [index: number]
  reveal: [path: string]
  broken: [path: string]
}>()

function blurred(point: FootprintPoint): boolean {
  return isSensitive(point.rating) && !props.revealed[point.path]
}

function click(point: FootprintPoint, index: number): void {
  if (blurred(point)) {
    emit('reveal', point.path)
    return
  }
  emit('pick', index)
}
</script>

<template>
  <div class="fp-gallery">
    <p v-if="loading" class="fp-gallery__note">加载中…</p>
    <p v-else-if="!photos.length" class="fp-gallery__note">这里还没有可显示的照片。</p>
    <div v-else class="fp-gallery__grid">
      <button
        v-for="(point, index) in photos"
        :key="point.path"
        type="button"
        class="fp-gallery__cell"
        :title="point.name"
        @click="click(point, index)"
      >
        <img
          v-if="!brokenThumbs.has(point.path)"
          :class="{ 'is-blur': blurred(point) }"
          :src="thumbOf(point)"
          alt=""
          loading="lazy"
          @error="emit('broken', point.path)"
        />
        <span v-else class="fp-gallery__fallback"><i class="bi bi-image" /></span>
        <span v-if="blurred(point)" class="fp-gallery__mask"><i class="bi bi-eye-slash" />点击查看</span>
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.fp-gallery {
  flex: 1;
  min-height: 0;
  overflow-y: auto;

  &__note {
    margin: 0;
    padding: 24px 16px;
    color: var(--el-text-color-secondary, #909399);
    font-size: 13px;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 8px;
    padding: 2px;
  }

  &__cell {
    position: relative;
    padding: 0;
    overflow: hidden;
    border: 0;
    border-radius: 10px;
    background: rgba(0, 0, 0, 0.05);
    cursor: pointer;

    &::before {
      display: block;
      padding-top: 100%;
      content: '';
    }

    img {
      position: absolute;
      inset: 0;
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: filter 0.2s ease, transform 0.2s ease;
    }

    &:hover img {
      transform: scale(1.03);
    }

    .is-blur {
      filter: blur(14px) saturate(0.7);
    }
  }

  &__fallback {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #b9b4c8;
    font-size: 22px;
  }

  &__mask {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    background: rgba(30, 30, 40, 0.28);
    color: #fff;
    font-size: 11px;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  }
}
</style>
