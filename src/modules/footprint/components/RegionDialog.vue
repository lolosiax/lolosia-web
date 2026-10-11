<script setup lang="ts">
// 新建 / 编辑区域圈：自己保存与删除，成功后只通知页面刷新。
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { confirmAction } from '@/core/composables/use-dialog'
import { deleteFootprintRegion, saveFootprintRegion } from '../api'
import type { FootprintRegion } from '../api'
import { DEFAULT_REGION_COLOR, fmtRadius } from '../lib'

defineOptions({ name: 'RegionDialog' })

const props = defineProps<{
  modelValue: boolean
  /** 传入 = 编辑，空 = 新建。 */
  region: FootprintRegion | null
  lat: number
  lon: number
  radiusM: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  saved: []
}>()

const visible = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value)
})

const form = reactive({
  name: '',
  radiusM: 300,
  color: DEFAULT_REGION_COLOR as string | null,
  description: ''
})
const saving = ref(false)

watch(
  () => [props.modelValue, props.region, props.lat, props.lon, props.radiusM] as const,
  () => {
    if (!props.modelValue) return
    form.name = props.region?.name ?? ''
    form.radiusM = props.region?.radiusM ?? props.radiusM
    form.color = props.region?.color || DEFAULT_REGION_COLOR
    form.description = props.region?.description ?? ''
  }
)

async function submit(): Promise<void> {
  if (!form.name.trim()) {
    ElMessage.warning('请填写区域名')
    return
  }
  saving.value = true
  try {
    await saveFootprintRegion({
      id: props.region?.id,
      name: form.name.trim(),
      lat: props.region?.lat ?? props.lat,
      lon: props.region?.lon ?? props.lon,
      radiusM: form.radiusM,
      color: form.color,
      description: form.description
    })
    ElMessage.success('已保存区域')
    visible.value = false
    emit('saved')
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : '保存失败')
  } finally {
    saving.value = false
  }
}

async function remove(): Promise<void> {
  if (!props.region) return
  const confirmed = await confirmAction(`确定删除「${props.region.name}」吗？圈只是标注，照片不受影响。`, '删除区域')
  if (!confirmed) return
  saving.value = true
  try {
    await deleteFootprintRegion(props.region.id)
    ElMessage.success('已删除区域')
    visible.value = false
    emit('saved')
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : '删除失败')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <ElDialog v-model="visible" :title="region ? '编辑区域' : '新建区域'" width="420px" append-to-body>
    <div class="region-form">
      <label class="region-form__row">
        <span>区域名</span>
        <ElInput v-model="form.name" maxlength="64" placeholder="如 江汉路步行街" />
      </label>
      <label class="region-form__row">
        <span>半径</span>
        <ElSlider v-model="form.radiusM" :min="50" :max="3000" :step="50" class="region-form__slider" />
        <em>{{ fmtRadius(form.radiusM) }}</em>
      </label>
      <label class="region-form__row">
        <span>颜色</span>
        <ElColorPicker v-model="form.color" />
      </label>
      <label class="region-form__row">
        <span>备注</span>
        <ElInput v-model="form.description" maxlength="120" placeholder="可选" />
      </label>
      <p class="region-form__coord">
        中心点：{{ (region?.lat ?? lat).toFixed(5) }}, {{ (region?.lon ?? lon).toFixed(5) }}
      </p>
    </div>

    <template #footer>
      <ElButton v-if="region" type="danger" plain :disabled="saving" @click="remove">删除</ElButton>
      <ElButton @click="visible = false">取消</ElButton>
      <ElButton type="primary" :loading="saving" @click="submit">保存</ElButton>
    </template>
  </ElDialog>
</template>

<style scoped lang="scss">
.region-form {
  display: flex;
  flex-direction: column;
  gap: 14px;

  &__row {
    display: flex;
    align-items: center;
    gap: 12px;

    > span {
      flex: 0 0 48px;
      color: var(--el-text-color-regular, #606266);
      font-size: 13px;
    }

    em {
      flex: 0 0 60px;
      color: var(--el-text-color-secondary, #909399);
      font-size: 12px;
      font-style: normal;
      text-align: right;
    }
  }

  &__slider {
    flex: 1;
  }

  &__coord {
    margin: 0;
    color: var(--el-text-color-secondary, #909399);
    font-size: 12px;
  }
}
</style>
