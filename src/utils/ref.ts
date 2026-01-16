import type { Ref } from 'vue'
import router from '@/router'
import type { RouteLocationNormalizedLoadedGeneric } from 'vue-router'

export function urlQueryRef(key: string): Ref<string | undefined>
export function urlQueryRef(key: string, defaults: string): Ref<string>
export function urlQueryRef(key: string, defaults?: string): Ref<string | undefined>
export function urlQueryRef(key: string, defaults?: string): Ref<string | undefined> {
  let route: RouteLocationNormalizedLoadedGeneric | undefined = $ref(undefined)
  onMounted(() => {
    route = useRoute()
    if (defaults != undefined || !route.query[key]) {
      route.query[key] = defaults!
    }
  })
  return computed({
    get: () => route?.query?.[key] as string,
    set(value) {
      router.replace({ ...route!, query: { ...route!.query, [key]: value } })
    }
  })
}

export function urlQueryNumberRef(key: string): Ref<number | undefined>
export function urlQueryNumberRef(key: string, defaults: number): Ref<number>
export function urlQueryNumberRef(key: string, defaults?: number): Ref<number | undefined>
export function urlQueryNumberRef(key: string, defaults?: number): Ref<number | undefined> {
  const def = defaults != undefined ? defaults.toString() : undefined
  const ref: Ref<string | undefined> = urlQueryRef(key, def)
  return computed({
    get: () => (ref.value == undefined ? undefined : Number.parseFloat(ref.value)),
    set(value) {
      ref.value = value?.toString()
    }
  }) as any
}
