<script setup lang="ts">
// 文件属性：只读元数据 + 标签 / 评级 / 外发策略 / 描述。
// 标签是即时生效的独立接口；评级与描述随「保存」一起提交。
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  applyMediaProperty,
  attachMediaTags,
  denyMediaTags,
  detachMediaTags,
  mediaDetail,
  saveMediaProperty
} from '../api'
import type { MediaDetail, MediaRating, MediaTagItem, MediaTagRef } from '../api'
import MediaPropertyForm from './MediaPropertyForm.vue'
import MediaPropertyInfo from './MediaPropertyInfo.vue'
import MediaPropertyTags from './MediaPropertyTags.vue'

defineOptions({ name: 'FilePropertyDialog' })

const props = defineProps<{
  modelValue: boolean
  path: string
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
const saving = ref(false)
const tagBusy = ref(false)
const error = ref('')
const detail = ref<MediaDetail | null>(null)

const rating = ref<MediaRating>('unknown')
const analysisSkip = ref(false)
const caption = ref('')

const forcedSkip = computed(() => rating.value === 'explicit')
const effectiveSkip = computed(() => forcedSkip.value || analysisSkip.value)
const dirPath = computed(() => (props.path.includes('/') ? props.path.slice(0, props.path.lastIndexOf('/')) : ''))

async function load(): Promise<void> {
  if (!props.path) return
  loading.value = true
  error.value = ''
  detail.value = null
  try {
    const value = await mediaDetail(props.path)
    detail.value = value
    rating.value = value.rating
    analysisSkip.value = value.analysisSkip
    caption.value = value.caption ?? ''
  } catch (err) {
    error.value = err instanceof Error ? err.message : '读取媒体详情失败'
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

async function save(): Promise<void> {
  saving.value = true
  try {
    const result = await saveMediaProperty({
      path: props.path,
      rating: rating.value,
      analysisSkip: effectiveSkip.value,
      caption: caption.value
    })
    ElMessage.success(result.message)
    emit('saved')
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : '保存失败')
  } finally {
    saving.value = false
  }
}

async function applyNearby(recursive: boolean): Promise<void> {
  saving.value = true
  try {
    const result = await applyMediaProperty({
      path: dirPath.value,
      recursive,
      rating: rating.value,
      analysisSkip: effectiveSkip.value
    })
    ElMessage.success(result.message)
    emit('saved')
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : '批量定级失败')
  } finally {
    saving.value = false
  }
}

/** 只重拉详情，不动 `rating` / `caption` 这几个可能躺着未保存编辑的 ref。 */
async function refreshDetail(): Promise<void> {
  try {
    detail.value = await mediaDetail(props.path)
  } catch (err) {
    error.value = err instanceof Error ? err.message : '读取媒体详情失败'
  }
}

async function tagOp(run: () => Promise<{ message: string }>): Promise<void> {
  tagBusy.value = true
  try {
    const result = await run()
    ElMessage.success(result.message)
    await refreshDetail()
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : '标签操作失败')
  } finally {
    tagBusy.value = false
  }
}

function attachTag(tag: MediaTagRef): void {
  void tagOp(() => attachMediaTags({ path: props.path, tags: [tag] }))
}

function detachTag(tag: MediaTagItem): void {
  void tagOp(() => detachMediaTags({ path: props.path, tags: [{ namespace: tag.namespace, name: tag.name }] }))
}

function denyTag(tag: MediaTagItem): void {
  void tagOp(() => denyMediaTags({ path: props.path, tags: [{ namespace: tag.namespace, name: tag.name }] }))
}

/** 取消否决 = 重新打上同来源的标签，后端会把否决位翻正。 */
function undenyTag(tag: MediaTagItem): void {
  void tagOp(() => attachMediaTags({ path: props.path, tags: [{ namespace: tag.namespace, name: tag.name }] }))
}
</script>

<template>
  <ElDialog v-model="visible" title="属性" width="720px" top="6vh" append-to-body>
    <div v-loading="loading" class="property-dialog">
      <ElAlert v-if="error" :title="error" type="error" :closable="false" show-icon />
      <p v-else-if="!detail && !loading" class="property-dialog__hint">未找到该文件的媒体信息。</p>

      <template v-else-if="detail">
        <p v-if="!detail.indexed" class="property-dialog__hint">
          这个文件还没被媒体索引登记，评级与备注暂时存不下来 —— 先在上方工具栏点一次「刷新索引」。
        </p>

        <MediaPropertyInfo :detail="detail" />

        <MediaPropertyTags
          :tags="detail.tags"
          :indexed="detail.indexed"
          :busy="tagBusy"
          @attach="attachTag"
          @detach="detachTag"
          @deny="denyTag"
          @undeny="undenyTag"
        />

        <MediaPropertyForm
          v-model:rating="rating"
          v-model:analysis-skip="analysisSkip"
          v-model:caption="caption"
          :indexed="detail.indexed"
          :forced-skip="forcedSkip"
        />
      </template>
    </div>

    <template #footer>
      <div class="property-dialog__footer">
        <div class="property-dialog__footer-left">
          <ElButton :disabled="saving || !detail?.indexed" @click="applyNearby(false)">应用到本目录</ElButton>
          <ElButton :disabled="saving || !detail?.indexed" @click="applyNearby(true)">
            应用到本目录（含子目录）
          </ElButton>
        </div>
        <div>
          <ElButton @click="visible = false">取 消</ElButton>
          <ElButton type="primary" :loading="saving" :disabled="!detail?.indexed" @click="save">保 存</ElButton>
        </div>
      </div>
    </template>
  </ElDialog>
</template>

<style scoped lang="scss">
.property-dialog {
  max-height: 66vh;
  padding-right: 4px;
  overflow: auto;
  font-size: 13px;

  &__hint {
    margin: 6px 0;
    color: var(--el-text-color-secondary, #999);
    font-size: 12px;
    line-height: 1.5;
  }

  &__footer {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  &__footer-left {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
}
</style>
