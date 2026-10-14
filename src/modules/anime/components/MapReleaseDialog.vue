<script setup lang="ts">
// 手动映射弹窗：把一条未匹配的发布指到某部番，并可选追加手动别名。
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { animeSearch, mapAnimeRelease } from '../api'
import type { AnimeRelease, AnimeSeries } from '../api'

defineOptions({ name: 'MapReleaseDialog' })

const props = defineProps<{
  modelValue: boolean
  release: AnimeRelease | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'mapped'): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value)
})

const keyword = ref('')
const alias = ref('')
const options = ref<AnimeSeries[]>([])
const seriesId = ref<number | null>(null)
const searching = ref(false)
const saving = ref(false)

watch(
  () => props.release,
  release => {
    if (!release) return
    keyword.value = release.seriesTitle || release.title
    alias.value = release.title
    options.value = []
    seriesId.value = null
  },
  { immediate: true }
)

async function search(): Promise<void> {
  const value = keyword.value.trim()
  if (!value) return
  searching.value = true
  try {
    options.value = await animeSearch(value)
  } catch {
    // 拦截器已提示
  } finally {
    searching.value = false
  }
}

async function submit(): Promise<void> {
  const target = props.release
  if (!target || !seriesId.value) {
    ElMessage.warning('请选择要映射到的番剧')
    return
  }
  saving.value = true
  try {
    await mapAnimeRelease({
      releaseId: target.id,
      seriesId: seriesId.value,
      alias: alias.value.trim() || undefined
    })
    ElMessage.success('映射成功')
    visible.value = false
    emit('mapped')
  } catch {
    // 拦截器已提示
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <ElDialog v-model="visible" title="把这条发布映射到番剧" width="560px" append-to-body>
    <ElAlert v-if="release" :title="release.title" type="info" :closable="false" class="map__alert" />
    <div class="map__row">
      <ElInput v-model="keyword" placeholder="搜索番剧名…" clearable @keyup.enter="search">
        <template #append>
          <el-button :loading="searching" @click="search">搜索</el-button>
        </template>
      </ElInput>
    </div>
    <ElSelect v-model="seriesId" class="map__select" placeholder="选择要映射到的番剧" filterable>
      <el-option v-for="item in options" :key="item.id" :label="item.title" :value="item.id" />
    </ElSelect>
    <ElInput v-model="alias" placeholder="可选：把这条标题记为手动别名（下次同类标题自动命中）" />
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="submit">确定</el-button>
    </template>
  </ElDialog>
</template>

<style scoped lang="scss">
.map {
  &__alert {
    margin-bottom: 12px;
  }

  &__row {
    margin-bottom: 12px;
  }

  &__select {
    width: 100%;
    margin-bottom: 12px;
  }
}
</style>
