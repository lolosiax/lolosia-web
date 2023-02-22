<script setup lang="ts">
import ErrorView from './ErrorView.vue'

defineOptions({ name: 'NotFoundPage' })
</script>

<template>
  <ErrorView code="404" title="页面走丢了" description="地址可能已经变更，或者这个页面从来就不存在。" />
</template>
