<script setup lang="ts">
import ErrorView from './ErrorView.vue'

defineOptions({ name: 'UnauthorizedPage' })
</script>

<template>
  <ErrorView code="401" title="没有访问权限" description="当前账号的角色不允许访问这个页面，换一个账号或联系管理员调整权限组。" />
</template>
