<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { PermissionCatalogEntry } from '@/core/api/permission'

defineOptions({ name: 'PermissionRulesDialog' })

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    title?: string
    rules?: string[]
    catalog?: PermissionCatalogEntry[]
    saving?: boolean
    hint?: string
  }>(),
  { title: '权限规则', rules: () => [], catalog: () => [], saving: false, hint: '' }
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  save: [rules: string[]]
}>()

const draft = ref<string[]>([])

watch(
  () => [props.modelValue, props.rules] as const,
  ([visible]) => {
    if (visible) draft.value = [...props.rules]
  },
  { immediate: true }
)

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

const catalogOptions = computed(() => props.catalog.map(entry => entry.node))
</script>

<template>
  <ElDialog v-model="visible" :title="title" width="560" append-to-body>
    <p class="permission-hint">
      规则语法：<code>a.b.c</code> 允许、<code>-a.b.c</code> 拒绝、<code>a.b.*</code> 通配、<code>*</code> 全部；负号优先。
    </p>
    <ElSelect
      v-model="draft"
      multiple
      filterable
      allow-create
      default-first-option
      class="permission-select"
      placeholder="选择或输入规则"
    >
      <ElOption v-for="node in catalogOptions" :key="node" :label="node" :value="node" />
    </ElSelect>
    <p v-if="hint" class="permission-note">{{ hint }}</p>
    <template #footer>
      <ElButton @click="visible = false">取消</ElButton>
      <ElButton type="primary" :loading="saving" @click="emit('save', draft)">保存</ElButton>
    </template>
  </ElDialog>
</template>

<style scoped lang="scss">
.permission-select {
  width: 100%;
}

.permission-hint,
.permission-note {
  margin: 0 0 10px;
  font-size: 12px;
  color: #8c7b90;
  line-height: 1.6;
}

.permission-note {
  margin: 10px 0 0;
}
</style>
