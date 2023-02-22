import type { FormItemRule } from 'element-plus'

const EMAIL_REGEX = /^([a-zA-Z]|[0-9])(\w|-)+@[a-zA-Z0-9]+\.([a-zA-Z]{2,})$/u
const PHONE_REGEX = /^0?1[0-9]{10}$/u

export function isEmail(value: string): boolean {
  return EMAIL_REGEX.test(value)
}

export function isMobilePhone(value: string): boolean {
  return PHONE_REGEX.test(value)
}

/** 必填规则。 */
export function requiredRule(message: string, trigger: 'blur' | 'change' = 'blur'): FormItemRule {
  return { required: true, message, trigger }
}

/** 正则规则；`pattern` 为空时只做必填。 */
export function patternRule(message: string, pattern?: RegExp, trigger: 'blur' | 'change' = 'blur'): FormItemRule {
  if (!pattern) return requiredRule(message, trigger)
  return {
    trigger,
    validator: (_rule, value: string, callback) => {
      if (!value) return callback(new Error(message))
      return pattern.test(value) ? callback() : callback(new Error(message))
    }
  }
}

export function emailRule(message = '邮箱格式不正确'): FormItemRule[] {
  return [requiredRule('请输入邮箱'), patternRule(message, EMAIL_REGEX)]
}

export function phoneRule(message = '手机号格式不正确'): FormItemRule[] {
  return [requiredRule('请输入手机号'), patternRule(message, PHONE_REGEX)]
}

/** 选填正则：留空放行，填了才校验格式。 */
export function optionalPatternRule(message: string, pattern: RegExp, trigger: 'blur' | 'change' = 'blur'): FormItemRule {
  return {
    trigger,
    validator: (_rule, value: string, callback) => {
      if (!value) return callback()
      return pattern.test(value) ? callback() : callback(new Error(message))
    }
  }
}

/** 选填邮箱：留空放行，填了才校验格式。 */
export function optionalEmailRule(message = '邮箱格式不正确'): FormItemRule[] {
  return [optionalPatternRule(message, EMAIL_REGEX)]
}

/** 选填手机号：留空放行，填了才校验格式。 */
export function optionalPhoneRule(message = '手机号格式不正确'): FormItemRule[] {
  return [optionalPatternRule(message, PHONE_REGEX)]
}

/** 两次密码一致校验。 */
export function confirmPasswordRule(getPassword: () => string, message = '两次输入的密码不一致'): FormItemRule {
  return {
    trigger: 'blur',
    validator: (_rule, value: string, callback) => {
      if (value !== getPassword()) return callback(new Error(message))
      return callback()
    }
  }
}
