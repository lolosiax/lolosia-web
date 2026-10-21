<script setup lang="ts">
defineOptions({ name: 'FeatureList' })

defineProps<{
  title: string
  items: string[]
}>()
</script>

<template>
  <div class="feature-list">
    <h4>{{ title }}</h4>
    <ul>
      <li v-for="item in items" :key="item">{{ item }}</li>
    </ul>
  </div>
</template>

<style scoped lang="scss">
.feature-list {
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

  ul {
    display: flex;
    flex-direction: column;
    gap: 7px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  li {
    position: relative;
    padding-left: 16px;
    color: #6b5c70;
    font-size: 12.5px;
    line-height: 1.6;

    &::before {
      content: '';
      position: absolute;
      top: 8px;
      left: 0;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #c296cd;
    }
  }
}
</style>
