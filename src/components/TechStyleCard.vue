<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    header?: string,
    bordered?: boolean
  }>(),
  {
    header: '',
    bordered: false
  }
)
</script>

<template>
  <div class="teach-style-card" :class="{ 'has-header': !!header, 'bordered': bordered }">
    <div v-if="header" class="teach-style-card__header">
      <h2>{{ header }}</h2>
    </div>
    <div class="teach-style-card__body">
      <slot />
    </div>
  </div>
</template>

<style scoped lang="scss">
.teach-style-card {
  overflow: hidden;
  background-color: #00000033;
  transition-property: background-color;
  transition-duration: 0.3s;
  transition-timing-function: ease-in-out;

  &.has-header {
    display: grid;
    grid-template-rows: auto 1fr;
    grid-template-columns: 1fr;
  }

  &.bordered {
    border-radius: 1em;
    border: 1px solid #404040;
  }

  &:hover {
    background-color: #88888811;
  }

  .teach-style-card__header {
    width: 100%;
    display: grid;
    justify-content: center;
    padding: 1em 0 0 0;

    h2 {
      text-align: center;
      color: white;
      font-size: 1.2em;
      min-width: 10em;
      padding-bottom: 0.5em;
      border-bottom: 2px solid #33689baa;
    }
  }

  .teach-style-card__body {
    padding: 12px;
    height: 100%;
    width: 100%;
    overflow: hidden;
  }
}
</style>
