<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import type { FormRules } from 'element-plus'
import type { RoleCreatePayload, RoleRow, RoleUpdatePayload } from '@/core/api/role'
import { useForm } from '@/core/composables/use-form'
import { requiredRule } from '@/core/lib/validate'

defineOptions({ name: 'RoleEditDialog' })

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    role?: RoleRow | null
    roles?: RoleRow[]
    saving?: boolean
  }>(),
  { role: null, roles: () => [], saving: false }
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [payload: RoleCreatePayload | RoleUpdatePayload]
}>()

const { validate } = useForm()
const isEdit = computed(() => Boolean(props.role?.id))

const model = reactive({
  roleName: '',
  type: '',
  parentId: null as number | null
})

const rules: FormRules = {
  roleName: [requiredRule('请输入组名称')],
  type: [requiredRule('请输入组标识')]
}

watch(
  () => [props.modelValue, props.role] as const,
  ([visible]) => {
    if (!visible) return
    model.roleName = props.role?.roleName ?? ''
    model.type = props.role?.type ?? ''
    model.parentId = props.role?.parentId ?? null
  },
  { immediate: true }
)

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

/** 父组不能选自己，避免把组挂到自己下面。 */
const parentOptions = computed(() => props.roles.filter(role => role.id !== props.role?.id))

async function submit(): Promise<void> {
  if (!(await validate())) return
  const base = { roleName: model.roleName, type: model.type, parentId: model.parentId }
  emit('submit', props.role ? { ...base, id: props.role.id } : base)
}
</script>

<template>
  <ElDialog v-model="visible" :title="isEdit ? '编辑权限组' : '新建权限组'" width="440" append-to-body>
    <ElForm ref="formRef" :model="model" :rules="rules" label-width="80px">
      <ElFormItem label="组名称" prop="roleName">
        <ElInput v-model="model.roleName" placeholder="如：管理员" />
      </ElFormItem>
      <ElFormItem label="组标识" prop="type">
        <ElInput v-model="model.type" placeholder="如：admin / user" />
      </ElFormItem>
      <ElFormItem label="父组">
        <ElSelect v-model="model.parentId" clearable placeholder="不选表示根基组" style="width: 100%">
          <ElOption
            v-for="option in parentOptions"
            :key="option.id"
            :label="option.roleName ?? String(option.id)"
            :value="option.id"
          />
        </ElSelect>
      </ElFormItem>
    </ElForm>
    <template #footer>
      <ElButton @click="visible = false">取消</ElButton>
      <ElButton type="primary" :loading="saving" @click="submit">保存</ElButton>
    </template>
  </ElDialog>
</template>
