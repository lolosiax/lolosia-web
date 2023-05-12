<template>
  <div class="debugger" title="调试器">
    <el-button class="btn" type="primary" link @click="data.dialog = true">
      <menu-icon icon="bug-fill" />
    </el-button>
    <el-dialog v-model="data.dialog" :append-to-body="true" title="Debugger" :width="600">
      <div>
        显示调试网格
        <el-switch v-model="showLayoutGrid" />
      </div>
    </el-dialog>
    <div v-if="showLayoutGrid" v-html="data.gridHtml" />
  </div>
</template>

<script setup lang="ts">
import MenuIcon from "@/layout/sidebar/MenuIcon.vue";
import { useDebuggerStore } from "@/store/debuger";

const store = useDebuggerStore()
const {showLayoutGrid} = storeToRefs(store)

const data = reactive({
  dialog: false,
  gridHtml: `<style>*{ box-shadow: 0 0 1px 0 blue }</style>`
});

</script>

<style scoped lang="scss">
.btn{
  padding: 0.3em !important;
}
</style>
