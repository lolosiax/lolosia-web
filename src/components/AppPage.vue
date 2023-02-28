<template>
  <div>
    <slot/>
    <slot v-if="false" name="left"/>
    <slot v-if="false" name="center"/>
    <slot v-if="false" name="right"/>
  </div>
</template>

<script lang="ts">

import type { VNode } from 'vue'
import { useBasicStore } from '@/store/basic'
export default defineComponent({
  name: 'AppPage',
  data() {
    return {
      left: [] as VNode[],
      right: [] as VNode[],
      center: [] as VNode[],
      default: [] as VNode[]
    }
  },
  mounted() {
    this.onShowing()
  },
  activated() {
    this.onShowing()
  },
  beforeUnmount() {
    this.onHide()
  },
  deactivated() {
    this.onHide()
  },
  created() {
    const { navbar } = useBasicStore()
    const { left, right, center, default: d } = this.$slots
    this.left = left?.() ?? []
    this.right = right?.() ?? []
    this.center = center?.() ?? []
    this.default = d?.() ?? []
    navbar.left.push(...this.left)
    navbar.right.push(...this.right)
    navbar.center.push(...this.center)
  },
  methods: {
    onShowing() {
      const { left, right, center } = useBasicStore().navbar
      const pair = [
        [left, this.left],
        [right, this.right],
        [center, this.center]
      ]
      for (const [s, l] of pair) {
        for (const item of s) {
          if (!l.includes(item)) l.push(item)
        }
      }
    },
    onHide() {
      const { left, right, center } = useBasicStore().navbar
      const pair = [
        [left, this.left],
        [right, this.right],
        [center, this.center]
      ]
      for (const [s, l] of pair) {
        for (const item of l) {
          const index = s.indexOf(item)
          if (index > -1) s.splice(index, 1)
        }
      }
    }
  },
})

</script>

<style scoped lang="scss">

</style>
