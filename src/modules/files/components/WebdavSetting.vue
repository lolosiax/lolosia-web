<script setup lang="ts">
import type { AppSetting } from '@/core/api/setting'

defineOptions({ name: 'WebdavSetting' })

defineProps<{
  setting: AppSetting
  saving: boolean
}>()

const emit = defineEmits<{
  change: [value: boolean | string | number]
}>()
</script>

<template>
  <section class="webdav-setting">
    <h4>WebDAV</h4>
    <div class="webdav-setting__row">
      <div class="webdav-setting__label">
        <span>是否允许访问隐藏文件</span>
        <p class="webdav-setting__hint">
          打开后，`.` 开头的隐藏目录（如缩略图缓存 <code>.cache</code>）与
          <code>lost+found</code> 在 WebDAV 客户端里可见、可读、可写；关闭时既不列举也直连不到。
          在线文件管理器始终不显示隐藏项。
        </p>
        <p class="webdav-setting__hint">
          典型用途：把这台机器的 <code>/dav</code> 映射成网络驱动器，此时缩略图缓存要落在
          <code>/.cache</code> 下，不开这个开关连建目录都会被拒。
        </p>
      </div>
      <ElSwitch
        :model-value="setting.webdav.allowHidden"
        :loading="saving"
        :disabled="saving"
        @update:model-value="emit('change', $event)"
      />
    </div>
  </section>
</template>

<style scoped lang="scss">
.webdav-setting {
  margin-bottom: 16px;

  h4 {
    margin: 0 0 10px;
    color: var(--el-text-color-primary, #333);
    font-size: 13px;
    font-weight: 600;
  }

  &__row {
    display: flex;
    align-items: flex-start;
    gap: 16px;
  }

  &__label {
    flex: 1;
    min-width: 0;

    > span {
      color: var(--el-text-color-regular, #444);
    }

    code {
      padding: 0 4px;
      border-radius: 4px;
      background: rgba(0, 0, 0, 0.05);
      font-size: 12px;
    }
  }

  &__hint {
    margin: 6px 0 0;
    color: var(--el-text-color-secondary, #999);
    font-size: 12px;
    line-height: 1.6;
  }
}
</style>
