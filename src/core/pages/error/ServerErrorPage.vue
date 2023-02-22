<script setup lang="ts">
import ErrorView from './ErrorView.vue'

defineOptions({ name: 'ServerErrorPage' })
</script>

<template>
  <ErrorView code="500" title="服务开小差了" description="后端暂时没能完成这次请求，稍后重试；如果一直这样，看看服务端日志。" />
</template>
