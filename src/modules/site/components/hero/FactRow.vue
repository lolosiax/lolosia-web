<script setup lang="ts">
defineOptions({ name: 'FactRow' })

defineProps<{
  label: string
  value: string
}>()
</script>

<template>
  <div class="fact">
    <span class="fact__label">{{ label }}</span>
    <span class="fact__value">{{ value }}</span>
  </div>
</template>

<style scoped lang="scss">
.fact {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  &__label {
    color: #9a8ca0;
    font-size: 13px;
  }

  &__value {
    color: #3d2f42;
    font-size: 13px;
    font-weight: 600;
    text-align: right;
  }
}
</style>
