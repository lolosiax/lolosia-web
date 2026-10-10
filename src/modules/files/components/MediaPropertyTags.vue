<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { MediaTagItem, MediaTagRef } from '../api'
import { parseTag } from '../lib'

defineOptions({ name: 'MediaPropertyTags' })

const props = defineProps<{
  tags: MediaTagItem[]
  indexed: boolean
  busy: boolean
}>()

const emit = defineEmits<{
  attach: [tag: MediaTagRef]
  detach: [tag: MediaTagItem]
  deny: [tag: MediaTagItem]
  undeny: [tag: MediaTagItem]
}>()

const input = ref('')

const positiveTags = computed(() => props.tags.filter(tag => !tag.negative))
const deniedTags = computed(() => props.tags.filter(tag => tag.negative))
const disabled = computed(() => !props.indexed || props.busy)

function labelOf(tag: { namespace: string; name: string }): string {
  return `${tag.namespace}:${tag.name}`
}

function sourceLabel(source: string): string {
  if (source === 'manual') return '人工'
  if (source === 'rule') return '规则'
  if (source === 'model') return '模型'
  return source
}

function submit(): void {
  const tag = parseTag(input.value)
  if (!tag.name) {
    ElMessage.warning('标签格式不对，写「命名空间:名字」或者只写名字')
    return
  }
  input.value = ''
  emit('attach', tag)
}
</script>

<template>
  <section class="property-tags">
    <h4>标签</h4>
    <div class="property-tags__add">
      <ElInput
        v-model="input"
        size="small"
        :disabled="disabled"
        placeholder="命名空间:名字，如 series:崩坏三；只写名字则落到 user"
        @keyup.enter="submit"
      />
      <ElButton size="small" :disabled="disabled" @click="submit">添加</ElButton>
    </div>
    <p class="property-tags__hint">
      命名空间：character（角色）/ series（作品）/ object / action / scene，随手打的用 user。
      标签不存在会就地新建；打上来的来源记为「人工」，规则与模型都不再改它。
    </p>

    <div v-if="positiveTags.length" class="property-tags__list">
      <div v-for="tag in positiveTags" :key="tag.id" class="property-tags__row">
        <ElTag :type="tag.source === 'manual' ? 'primary' : 'info'" size="small" effect="plain">
          {{ labelOf(tag) }}
        </ElTag>
        <span class="property-tags__source">{{ sourceLabel(tag.source) }}</span>
        <ElButton link size="small" :disabled="busy" @click="emit('deny', tag)">否决</ElButton>
        <ElButton link size="small" :disabled="busy" @click="emit('detach', tag)">移除</ElButton>
      </div>
    </div>
    <p v-else class="property-tags__hint">还没有标签。</p>

    <template v-if="deniedTags.length">
      <p class="property-tags__hint">已否决（这张图明确不是这些标签；规则与模型都不会再加回来）：</p>
      <div class="property-tags__list">
        <div v-for="tag in deniedTags" :key="tag.id" class="property-tags__row">
          <ElTag type="danger" size="small" effect="plain" class="is-denied">{{ labelOf(tag) }}</ElTag>
          <ElButton link size="small" :disabled="busy" @click="emit('undeny', tag)">取消否决</ElButton>
        </div>
      </div>
    </template>
  </section>
</template>

<style scoped lang="scss">
.property-tags {
  margin-bottom: 16px;

  h4 {
    margin: 0 0 8px;
    color: var(--el-text-color-primary, #333);
    font-size: 13px;
    font-weight: 600;
  }

  &__add {
    display: flex;
    gap: 8px;
  }

  &__list {
    margin-top: 8px;
  }

  &__row {
    display: flex;
    align-items: center;
    gap: 8px;

    & + & {
      margin-top: 6px;
    }
  }

  &__source {
    color: var(--el-text-color-secondary, #999);
    font-size: 12px;
  }

  .is-denied {
    text-decoration: line-through;
  }

  &__hint {
    margin: 6px 0 0;
    color: var(--el-text-color-secondary, #999);
    font-size: 12px;
    line-height: 1.5;
  }
}
</style>
