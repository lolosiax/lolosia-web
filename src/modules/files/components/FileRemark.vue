<script setup lang="ts">
import { ref } from 'vue'

defineOptions({ name: 'FileRemark' })

const props = defineProps<{
  value: string
  disabled: boolean
}>()

const emit = defineEmits<{ save: [value: string] }>()

const editing = ref(false)
const draft = ref('')

function start(): void {
  if (props.disabled) return
  draft.value = props.value
  editing.value = true
}

function submit(): void {
  emit('save', draft.value.trim())
  editing.value = false
}
</script>

<template>
  <div class="file-remark">
    <template v-if="editing">
      <ElInput v-model="draft" type="textarea" :rows="2" size="small" placeholder="备注（一句话）；留空即清除" />
      <div class="file-remark__actions">
        <ElButton size="small" @click="editing = false">取消</ElButton>
        <ElButton size="small" type="primary" @click="submit">保存</ElButton>
      </div>
    </template>
    <div v-else class="file-remark__view">
      <span class="file-remark__text" :class="{ 'is-empty': !value }">{{ value || '（无备注）' }}</span>
      <button type="button" class="file-remark__edit" title="编辑备注" :disabled="disabled" @click="start">
        <i class="bi bi-pencil" />
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.file-remark {
  &__view {
    display: flex;
    align-items: flex-start;
    gap: 8px;
  }

  &__text {
    flex: 1;
    min-width: 0;
    color: var(--el-text-color-regular, #444);
    font-size: 12px;
    line-height: 1.5;
    white-space: pre-wrap;
    word-break: break-word;

    &.is-empty {
      color: var(--el-text-color-secondary, #bbb);
    }
  }

  &__edit {
    display: grid;
    flex: 0 0 auto;
    place-items: center;
    width: 24px;
    height: 24px;
    border: 1px solid rgba(255, 255, 255, 0.7);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.6);
    color: var(--el-text-color-regular, #555);
    font-size: 12px;
    cursor: pointer;

    &:hover:not(:disabled) {
      color: var(--lolosia-color-primary-dark-2);
      background: rgba(255, 255, 255, 0.9);
    }

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 6px;
  }
}
</style>
