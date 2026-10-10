<script setup lang="ts">
// 文件夹标签对话框：目录不在媒体索引里，单独给一个小面板。
// `feature:日期分组` 打开分组能力，`feature:自动分组-年份/月份` 定默认模式。
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { attachFolderTags, detachFolderTags, folderTags } from '../api'
import type { MediaTagItem, MediaTagRef } from '../api'
import { parseTag } from '../lib'

defineOptions({ name: 'FolderTagDialog' })

const props = defineProps<{
  modelValue: boolean
  path: string
  name: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  saved: []
}>()

const visible = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value)
})

const loading = ref(false)
const busy = ref(false)
const error = ref('')
const tags = ref<MediaTagItem[]>([])
const input = ref('')

async function load(): Promise<void> {
  loading.value = true
  error.value = ''
  try {
    tags.value = await folderTags(props.path)
  } catch (err) {
    error.value = err instanceof Error ? err.message : '读取文件夹标签失败'
  } finally {
    loading.value = false
  }
}

watch(
  () => [props.modelValue, props.path] as const,
  () => {
    if (props.modelValue) void load()
  }
)

function labelOf(tag: { namespace: string; name: string }): string {
  return `${tag.namespace}:${tag.name}`
}

async function op(run: () => Promise<{ message: string }>): Promise<void> {
  busy.value = true
  try {
    const result = await run()
    ElMessage.success(result.message)
    tags.value = await folderTags(props.path)
    emit('saved')
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : '标签操作失败')
  } finally {
    busy.value = false
  }
}

function submit(): void {
  const ref = parseTag(input.value)
  if (!ref.name) {
    ElMessage.warning('标签格式不对，写「命名空间:名字」或者只写名字')
    return
  }
  input.value = ''
  void op(() => attachFolderTags({ path: props.path, tags: [ref as MediaTagRef] }))
}

function remove(tag: MediaTagItem): void {
  void op(() => detachFolderTags({ path: props.path, tags: [{ namespace: tag.namespace, name: tag.name }] }))
}
</script>

<template>
  <ElDialog v-model="visible" :title="`文件夹标签 · ${name || '根目录'}`" width="560px" append-to-body>
    <div v-loading="loading" class="folder-tag">
      <ElAlert v-if="error" :title="error" type="error" :closable="false" show-icon />

      <div class="folder-tag__add">
        <ElInput
          v-model="input"
          size="small"
          :disabled="busy"
          placeholder="命名空间:名字，如 feature:日期分组"
          @keyup.enter="submit"
        />
        <ElButton size="small" :disabled="busy" @click="submit">添加</ElButton>
      </div>

      <p class="folder-tag__hint">
        <code>feature:日期分组</code> 打开按日期分组（<code>feature:自动分组-年份</code> /
        <code>feature:自动分组-月份</code> 定进入时的默认模式），日期取自子项名字里的 <code>yyyyMMdd</code>；
        <code>feature:喜欢优先</code> 把已标心的项聚成「喜欢」组。标签不存在会就地新建。
      </p>

      <div v-if="tags.length" class="folder-tag__list">
        <div v-for="tag in tags" :key="tag.id" class="folder-tag__row">
          <ElTag type="primary" size="small" effect="plain">{{ labelOf(tag) }}</ElTag>
          <ElButton link size="small" :disabled="busy" @click="remove(tag)">移除</ElButton>
        </div>
      </div>
      <p v-else class="folder-tag__hint">这个文件夹还没有标签。</p>
    </div>
  </ElDialog>
</template>

<style scoped lang="scss">
.folder-tag {
  font-size: 13px;

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

  &__hint {
    margin: 8px 0 0;
    color: var(--el-text-color-secondary, #999);
    font-size: 12px;
    line-height: 1.6;

    code {
      padding: 1px 4px;
      border-radius: 4px;
      background: rgba(194, 150, 205, 0.16);
      color: var(--lolosia-color-primary-dark-2, #7c74a8);
    }
  }
}
</style>
