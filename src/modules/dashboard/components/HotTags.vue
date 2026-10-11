<script setup lang="ts">
// 热门标签云：字号与浓淡随引用次数变化。
import { ref } from 'vue'
import type { HotTagView } from '../types'

defineOptions({ name: 'HotTags' })

const props = defineProps<{ tags: HotTagView[] }>()

const hover = ref('')

function tagStyle(tag: HotTagView): Record<string, string> {
  const max = props.tags[0]?.count || 1
  const ratio = Math.min(1, tag.count / max)
  const size = 13 + ratio * 15
  const active = hover.value === `${tag.namespace}:${tag.name}`
  return {
    fontSize: `${active ? size + 2 : size}px`,
    color: `rgba(164, 128, 171, ${0.55 + ratio * 0.45})`,
    fontWeight: ratio > 0.6 ? '700' : '500',
    transform: active ? 'translateY(-2px) scale(1.06)' : 'none'
  }
}
</script>

<template>
  <article class="hot-tags">
    <div class="hot-tags__head">
      <span class="hot-tags__title"><i class="bi bi-hash" />最活跃的标签</span>
      <span class="hot-tags__hint">按引用热度</span>
    </div>

    <div class="hot-tags__cloud">
      <span
        v-for="tag in tags"
        :key="`${tag.namespace}:${tag.name}`"
        class="hot-tags__tag"
        :style="tagStyle(tag)"
        :title="`${tag.namespace}:${tag.name}`"
        @mouseenter="hover = `${tag.namespace}:${tag.name}`"
        @mouseleave="hover = ''"
      >
        {{ tag.name }}
        <em>{{ tag.count }}</em>
      </span>
      <span v-if="!tags.length" class="hot-tags__empty">暂无标签</span>
    </div>
  </article>
</template>

<style scoped lang="scss">
.hot-tags {
  padding: 16px 18px;
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.45);
  box-shadow: 0 4px 16px rgba(31, 38, 135, 0.12);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 10px;
  }

  &__title {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: #4a3d4d;
    font-size: 13px;
    font-weight: 600;
  }

  &__hint {
    color: #a99cae;
    font-size: 11px;
  }

  &__cloud {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 10px;
    max-height: 132px;
    overflow-y: auto;
  }

  &__tag {
    display: inline-flex;
    align-items: baseline;
    gap: 3px;
    line-height: 1.3;
    cursor: default;
    transition: transform 0.15s ease;

    em {
      color: #b3a7b8;
      font-size: 10px;
      font-style: normal;
    }
  }

  &__empty {
    color: #a99cae;
    font-size: 12px;
  }
}
</style>
