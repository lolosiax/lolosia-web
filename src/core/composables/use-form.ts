import { useTemplateRef } from 'vue'
import type { FormInstance } from 'element-plus'

/**
 * 表单控制：校验 / 重置 / 清校验。
 *
 * 模板里写 `<el-form ref="formRef">`，本组合式函数按名字取到同一个实例。
 */
export function useForm() {
  const formRef = useTemplateRef<FormInstance>('formRef')

  async function validate(): Promise<boolean> {
    if (!formRef.value) return true
    try {
      await formRef.value.validate()
      return true
    } catch {
      return false
    }
  }

  function resetFields(): void {
    formRef.value?.resetFields()
  }

  function clearValidate(): void {
    formRef.value?.clearValidate()
  }

  return { formRef, validate, resetFields, clearValidate }
}
