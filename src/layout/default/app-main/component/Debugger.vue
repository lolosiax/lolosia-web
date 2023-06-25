<template>
  <div class="debugger" title="调试器">
    <el-button v-if="store.enable" class="btn" type="primary" link @click="data.dialog = true">
      <menu-icon icon="bug-fill" />
    </el-button>
    <el-dialog v-if="data.dialog" v-model="data.dialog" :append-to-body="true" title="调试工具" :width="600">
      <div class="debugger-items">
        <p>UI</p>
        <div class="switch-item">
          <p>显示页面布局网格</p>
          <el-switch v-model="ui.showLayoutGrid" />
        </div>
        <hr />
        <p>消息面板</p>
        <div class="switch-item">
          <p>始终显示消息面板</p>
          <el-switch v-model="messageFrame.alwaysShow" />
        </div>
        <div class="switch-item">
          <p>页面变更时打印间隔消息</p>
          <el-switch v-model="messageFrame.showPageSwitchMsg" />
        </div>
        <hr />
        <p>网络</p>
        <div class="switch-item">
          <p>打印网络请求至消息面板</p>
          <el-switch v-model="network.printMsg.enable" />
        </div>
        <template v-if="network.printMsg.enable">
          <div class="switch-item">
            <p>> 显示请求时间</p>
            <el-switch v-model="network.printMsg.showTime" />
          </div>
          <div class="switch-item">
            <p>> 等待消息面板显示</p>
            <el-switch v-model="network.printMsg.waitMessageFrameShow" />
          </div>
        </template>
      </div>
    </el-dialog>
    <div v-if="ui.showLayoutGrid" v-html="data.gridHtml" />
  </div>
</template>

<script setup lang="ts">
import MenuIcon from "@/components/MenuIcon.vue";
import { useDebuggerStore } from "@/store/debuger";
import bus from "@/utils/bus";

const store = useDebuggerStore();
const { ui, network, messageFrame } = storeToRefs(store);

const data = reactive({
  dialog: false,
  gridHtml: `<style>*{ box-shadow: 0 0 1px 0 blue }</style>`
});

function onDebuggerShow() {
  data.dialog = true;
}

onMounted(() => {
  bus.on("debugger:show", onDebuggerShow);
});

onUnmounted(() => {
  bus.off("debugger:show", onDebuggerShow);
});

</script>

<style scoped lang="scss">
.debugger {
  margin-left: 0 !important;

  .btn {
    margin-left: 1em;
    padding: 0.3em !important;
  }
}

.debugger-items {
  padding: 0 2em 0 2em;
  position: relative;

  > p {
    position: relative;
    left: -0.5em;
    margin: 0.5em 0 0.5em 0;
    color: gray;
  }

  > hr {
    margin: 1em 0 0 0;
  }

  .switch-item {
    display: flex;
    align-items: center;
    color: black;

    > p {
      display: block;
      flex-grow: 1;
      margin: 0;
      line-height: 2em;
      font-size: 1.1em;
    }

    .el-switch {
      position: relative;
      transform: scale(1.4);
      right: 2em;
    }
  }
}
</style>
