<script setup lang="ts">
import { computed, ref, watch } from 'vue'

defineOptions({ name: 'NameDialog' })

const props = defineProps<{
  modelValue: boolean
  title: string
  initial: string
  busy?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: [value: string]
}>()

const visible = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value)
})

const value = ref('')

watch(
  () => [props.modelValue, props.initial] as const,
  ([open]) => {
    if (open) value.value = props.initial
  }
)

function submit(): void {
  const text = value.value.trim()
  if (!text) return
  emit('confirm', text)
}
</script>

<template>
  <ElDialog v-model="visible" :title="title" width="380px" append-to-body>
    <ElInput
      v-model="value"
      maxlength="255"
      placeholder="名字"
      @keyup.enter="submit"
    />
    <template #footer>
      <ElButton @click="visible = false">取消</ElButton>
      <ElButton type="primary" :loading="busy" @click="submit">确定</ElButton>
    </template>
  </ElDialog>
</template>
