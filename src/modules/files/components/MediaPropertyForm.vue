<script setup lang="ts">
import { RATING_LABELS } from '../api'
import type { MediaRating } from '../api'

defineOptions({ name: 'MediaPropertyForm' })

const props = defineProps<{
  rating: MediaRating
  analysisSkip: boolean
  caption: string
  indexed: boolean
  forcedSkip: boolean
}>()

const emit = defineEmits<{
  'update:rating': [value: MediaRating]
  'update:analysisSkip': [value: boolean]
  'update:caption': [value: string]
}>()

function onRating(value: string | number | boolean | undefined): void {
  emit('update:rating', value as MediaRating)
}

function onSkip(value: string | number | boolean): void {
  emit('update:analysisSkip', Boolean(value))
}

function onCaption(value: string): void {
  emit('update:caption', value)
}
</script>

<template>
  <div class="property-form">
    <section class="property-form__section">
      <h4>评级</h4>
      <ElRadioGroup :model-value="rating" :disabled="!indexed" @update:model-value="onRating">
        <ElRadio v-for="item in RATING_LABELS" :key="item.value" :value="item.value">
          {{ item.label }}
        </ElRadio>
      </ElRadioGroup>
      <p class="property-form__hint">
        评级是合规闸门而不是标签：模型不参与判定，改它会让该文件立刻退出（或重新进入）外发分析的候选集。
      </p>
    </section>

    <section class="property-form__section">
      <h4>分析策略</h4>
      <ElCheckbox :model-value="analysisSkip" :disabled="forcedSkip || !indexed" @update:model-value="onSkip">
        不上传到外部分析
      </ElCheckbox>
      <p class="property-form__hint">
        露骨内容一律不外发，勾选状态由评级决定；反过来「这张不涉黄，但我就是不想让它上云」也是合法状态。
      </p>
    </section>

    <section class="property-form__section">
      <h4>备注</h4>
      <ElInput
        :model-value="caption"
        type="textarea"
        :rows="2"
        :disabled="!indexed"
        placeholder="备注（一句话）；手填之后模型不再覆盖"
        @update:model-value="onCaption"
      />
    </section>
  </div>
</template>

<style scoped lang="scss">
.property-form {
  &__section {
    margin-bottom: 16px;

    h4 {
      margin: 0 0 8px;
      color: var(--el-text-color-primary, #333);
      font-size: 13px;
      font-weight: 600;
    }
  }

  &__hint {
    margin: 6px 0 0;
    color: var(--el-text-color-secondary, #999);
    font-size: 12px;
    line-height: 1.5;
  }
}
</style>
