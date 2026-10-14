<script setup lang="ts">
// 我的关注里的单行：封面 + 番名 + 发布组 + 开关/取消。
import { coverSrc } from '../api'
import type { AnimeSubscription } from '../api'

defineOptions({ name: 'SubRow' })

defineProps<{ sub: AnimeSubscription }>()

const emit = defineEmits<{
  (e: 'open', id: number): void
  (e: 'toggle', value: string | number | boolean): void
  (e: 'remove'): void
}>()

function onChange(value: string | number | boolean): void {
  emit('toggle', value)
}
</script>

<template>
  <li class="sub">
    <button type="button" class="sub__cover" @click="emit('open', sub.seriesId)">
      <img v-if="sub.cover" :src="coverSrc(sub.cover)" :alt="sub.seriesTitle" loading="lazy" />
      <span v-else class="sub__fallback"><i class="bi bi-collection-play" /></span>
    </button>
    <button type="button" class="sub__main" @click="emit('open', sub.seriesId)">
      <span class="sub__title">{{ sub.seriesTitle || `番剧 #${sub.seriesId}` }}</span>
      <el-tag size="small" effect="light" round>{{ sub.groupName || '全部发布组' }}</el-tag>
    </button>
    <div class="sub__actions">
      <ElSwitch
        :model-value="sub.enabled"
        inline-prompt
        active-text="开"
        inactive-text="关"
        @change="onChange"
      />
      <el-button link type="danger" title="取消关注" @click="emit('remove')">
        <i class="bi bi-trash3" />
      </el-button>
    </div>
  </li>
</template>

<style scoped lang="scss">
.sub {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  border: 1px solid rgba(255, 255, 255, 0.75);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.58);
  box-shadow: 0 4px 14px rgba(31, 38, 135, 0.1);
  list-style: none;

  &__cover {
    flex: 0 0 46px;
    width: 46px;
    height: 62px;
    padding: 0;
    overflow: hidden;
    border: none;
    border-radius: 8px;
    background: rgba(164, 128, 171, 0.12);
    cursor: pointer;

    img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__fallback {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    color: rgba(164, 128, 171, 0.65);
    background: linear-gradient(135deg, rgba(164, 128, 171, 0.16), rgba(138, 169, 224, 0.16));
  }

  &__main {
    display: flex;
    flex: 1;
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
    min-width: 0;
    padding: 0;
    border: none;
    background: none;
    cursor: pointer;
  }

  &__title {
    overflow: hidden;
    width: 100%;
    color: #3d2f42;
    font-size: 13.5px;
    font-weight: 600;
    text-align: left;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__actions {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
    gap: 6px;
  }
}
</style>
