<script setup lang="ts">
import { ref, watch } from 'vue'
import { useHotkey } from '@/core/composables/use-keyboard'
import { useDebugStore } from '@/core/stores/debug'
import MenuIcon from '@/core/ui/MenuIcon.vue'

defineOptions({ name: 'Debugger' })

const debug = useDebugStore()
const open = ref(false)

useHotkey('ctrl+alt+0', () => {
  open.value = true
})

/** 布局网格只切 html 上的 class，样式在 core/styles/debug.scss。 */
watch(
  () => debug.showLayoutGrid,
  enabled => {
    document.documentElement.classList.toggle('debug-layout-grid', enabled)
  },
  { immediate: true }
)
</script>

<template>
  <div class="debugger">
    <ElTooltip v-if="debug.enable" content="调试工具" placement="right">
      <ElButton class="debugger__trigger" text circle size="small" @click="open = true">
        <MenuIcon icon="bug-fill" />
      </ElButton>
    </ElTooltip>

    <ElDialog v-model="open" title="调试工具" width="420" append-to-body>
      <section class="debugger__group">
        <h4 class="debugger__group-title">UI</h4>
        <div class="debugger__item">
          <span>显示调试工具图标</span>
          <ElSwitch v-model="debug.enable" />
        </div>
        <div class="debugger__item">
          <span>显示页面布局网格</span>
          <ElSwitch v-model="debug.showLayoutGrid" />
        </div>
        <div class="debugger__item">
          <span>展示网络异常</span>
          <ElSwitch v-model="debug.displayError" />
        </div>
        <div class="debugger__item">
          <span>展示全部网络异常</span>
          <ElSwitch v-model="debug.displayAllError" />
        </div>
      </section>
    </ElDialog>
  </div>
</template>

<style scoped lang="scss">
.debugger {
  &__trigger {
    color: var(--lolosia-color-primary-dark-2);
  }

  &__group-title {
    margin: 0 0 8px;
    color: #909399;
    font-size: 12px;
    font-weight: 400;
  }

  &__item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 0;
  }
}
</style>
