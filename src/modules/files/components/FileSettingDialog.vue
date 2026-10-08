<script setup lang="ts">
// 文件管理器设置：整台服务的开关（写回后端并落库），不是个人浏览偏好。
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { settingGet, settingWebdav } from '@/core/api/setting'
import type { AppSetting } from '@/core/api/setting'
import WebdavSetting from './WebdavSetting.vue'

defineOptions({ name: 'FileSettingDialog' })

const props = defineProps<{ modelValue: boolean }>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const visible = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value)
})

const loading = ref(false)
const saving = ref(false)
const error = ref('')
const setting = ref<AppSetting | null>(null)

async function load(): Promise<void> {
  loading.value = true
  error.value = ''
  try {
    setting.value = await settingGet()
  } catch (err) {
    error.value = err instanceof Error ? err.message : '读取设置失败'
  } finally {
    loading.value = false
  }
}

watch(
  () => props.modelValue,
  value => {
    if (value) void load()
  }
)

/** 拨一下就是一次写库；失败时重拉以还原开关。 */
async function toggleAllowHidden(value: boolean | string | number): Promise<void> {
  const next = value === true || value === 'true'
  saving.value = true
  try {
    setting.value = await settingWebdav({ allowHidden: next })
    ElMessage.success(next ? '已开启：WebDAV 允许访问隐藏文件' : '已关闭：WebDAV 不再暴露隐藏文件')
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : '保存失败')
    await load()
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <ElDialog v-model="visible" title="设置" width="600px" top="8vh" append-to-body>
    <div v-loading="loading" class="file-setting">
      <ElAlert v-if="error" :title="error" type="error" :closable="false" show-icon />
      <WebdavSetting v-else-if="setting" :setting="setting" :saving="saving" @change="toggleAllowHidden" />
    </div>

    <template #footer>
      <ElButton @click="visible = false">关 闭</ElButton>
    </template>
  </ElDialog>
</template>

<style scoped lang="scss">
.file-setting {
  min-height: 80px;
  font-size: 13px;
}
</style>
