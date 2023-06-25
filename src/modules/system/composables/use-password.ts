import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormRules } from 'element-plus'
import { updatePassword } from '@/core/api/user'
import { useForm } from '@/core/composables/use-form'
import { confirmPasswordRule, requiredRule } from '@/core/lib/validate'

/** 修改自己的密码（后端 `id` 缺省即当前登录人）。 */
export function usePassword() {
  const { validate, resetFields } = useForm()
  const saving = ref(false)
  const form = reactive({ origin: '', target: '', confirm: '' })

  const rules: FormRules = {
    origin: [requiredRule('请输入当前密码')],
    target: [requiredRule('请输入新密码'), { min: 6, message: '新密码至少 6 位', trigger: 'blur' }],
    confirm: [requiredRule('请再次输入新密码'), confirmPasswordRule(() => form.target)]
  }

  async function submit(): Promise<void> {
    if (!(await validate())) return

    saving.value = true
    try {
      await updatePassword({ origin: form.origin, target: form.target })
      ElMessage.success('密码已更新')
      resetFields()
    } finally {
      saving.value = false
    }
  }

  return { saving, form, rules, submit }
}
