<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormRules } from 'element-plus'
import type { RoleRow } from '@/core/api/role'
import type { UserCreatePayload, UserListRow, UserUpdatePayload } from '@/core/api/user'
import { useForm } from '@/core/composables/use-form'
import { optionalEmailRule, optionalPhoneRule, requiredRule } from '@/core/lib/validate'

defineOptions({ name: 'UserEditDialog' })

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    user?: UserListRow | null
    roles?: RoleRow[]
    saving?: boolean
  }>(),
  { user: null, roles: () => [], saving: false }
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [payload: UserCreatePayload | UserUpdatePayload]
}>()

const { validate } = useForm()
const isEdit = computed(() => Boolean(props.user?.id))

const model = reactive({
  userName: '',
  realName: '',
  phone: '',
  email: '',
  password: '',
  roleId: 4,
  isUse: 1
})

const rules: FormRules = {
  userName: [requiredRule('请输入用户名')],
  phone: optionalPhoneRule(),
  email: optionalEmailRule()
}

const EMPTY = { userName: '', realName: '', phone: '', email: '', password: '', roleId: 4, isUse: 1 }

/** 打开弹窗时把行数据灌进表单；新建或空值走默认。 */
function fillModel(user: UserListRow | null): void {
  if (!user) {
    Object.assign(model, EMPTY)
    return
  }
  Object.assign(model, EMPTY, {
    userName: user.userName,
    realName: user.realName ?? '',
    phone: user.phone ?? '',
    email: user.email ?? '',
    roleId: user.roleId ?? EMPTY.roleId,
    isUse: user.isUse ?? EMPTY.isUse
  })
}

watch(
  () => [props.modelValue, props.user] as const,
  ([visible]) => {
    if (visible) fillModel(props.user)
  },
  { immediate: true }
)

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

async function submit(): Promise<void> {
  if (!(await validate())) return
  if (!isEdit.value && !model.password) {
    ElMessage.warning('新建用户需要设置初始密码')
    return
  }

  const base = {
    userName: model.userName,
    realName: model.realName || null,
    phone: model.phone || null,
    email: model.email || null,
    isUse: model.isUse,
    password: model.password || null
  }

  if (props.user) {
    emit('submit', { ...base, id: props.user.id, roleId: model.roleId })
    return
  }
  emit('submit', { ...base, roleId: model.roleId })
}
</script>

<template>
  <ElDialog v-model="visible" :title="isEdit ? '编辑用户' : '新建用户'" width="480" append-to-body>
    <ElForm ref="formRef" :model="model" :rules="rules" label-width="80px">
      <ElFormItem label="用户名" prop="userName">
        <ElInput v-model="model.userName" placeholder="登录名" />
      </ElFormItem>
      <ElFormItem label="姓名">
        <ElInput v-model="model.realName" placeholder="显示名称" />
      </ElFormItem>
      <ElFormItem label="手机号" prop="phone">
        <ElInput v-model="model.phone" placeholder="可选" />
      </ElFormItem>
      <ElFormItem label="邮箱" prop="email">
        <ElInput v-model="model.email" placeholder="可选" />
      </ElFormItem>
      <ElFormItem label="密码">
        <ElInput
          v-model="model.password"
          type="password"
          show-password
          :placeholder="isEdit ? '留空表示不修改' : '初始密码'"
        />
      </ElFormItem>
      <ElFormItem label="所属组">
        <ElSelect v-model="model.roleId" placeholder="选择权限组" style="width: 100%">
          <ElOption v-for="role in roles" :key="role.id" :label="role.roleName ?? String(role.id)" :value="role.id" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="状态">
        <ElRadioGroup v-model="model.isUse">
          <ElRadio :value="1">启用</ElRadio>
          <ElRadio :value="0">停用</ElRadio>
        </ElRadioGroup>
      </ElFormItem>
    </ElForm>
    <template #footer>
      <ElButton @click="visible = false">取消</ElButton>
      <ElButton type="primary" :loading="saving" @click="submit">保存</ElButton>
    </template>
  </ElDialog>
</template>
