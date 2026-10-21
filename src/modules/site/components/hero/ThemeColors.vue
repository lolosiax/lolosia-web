<script setup lang="ts">
import { COLOR_THEMES } from '../../lib'

defineOptions({ name: 'ThemeColors' })
</script>

<template>
  <div class="theme-colors">
    <h4>主题色分析</h4>
    <div class="theme-colors__list">
      <div v-for="theme in COLOR_THEMES" :key="theme.code" class="theme-colors__item">
        <span class="theme-colors__swatch" :style="{ background: theme.color }" />
        <span class="theme-colors__name">{{ theme.name }} · {{ theme.code }}</span>
        <span class="theme-colors__meaning">{{ theme.meaning }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.theme-colors {
  padding: 20px 22px;
  border: 1px solid rgba(255, 255, 255, 0.75);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.6);
  box-shadow: 0 10px 26px rgba(164, 128, 171, 0.14);

  h4 {
    margin: 0 0 10px;
    color: #3d2f42;
    font-size: 14px;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  &__item {
    display: grid;
    grid-template-columns: 20px 1fr;
    gap: 2px 10px;
    align-items: center;
  }

  &__swatch {
    grid-row: 1 / 3;
    width: 20px;
    height: 20px;
    border: 1px solid rgba(164, 128, 171, 0.25);
    border-radius: 6px;
  }

  &__name {
    color: #3d2f42;
    font-size: 12.5px;
    font-weight: 600;
  }

  &__meaning {
    color: #8a7a94;
    font-size: 11.5px;
  }
}
</style>
