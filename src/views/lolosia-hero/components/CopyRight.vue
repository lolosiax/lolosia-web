<script setup lang="ts">
const buildEnv = (() => {
  const time = import.meta.env.VITE_BUILD_TIMESTAMP
  const version = import.meta.env.VITE_PROJECT_VERSION || import.meta.env.PROJECT_VERSION
  if (time) {
    let build = import.meta.env.VITE_BUILD_DISPLAY_NAME
    let hash = (import.meta.env.VITE_GIT_COMMIT || '').slice(0, 8)
    build = build ? `构建 ${build} 于` : '构建于'
    hash = hash ? `-${hash}` : ''
    return `当前版本 ${version}${hash} ${build} ${time}`
  } else {
    return `版本 ${version}-dev`
  }
})()
</script>

<template>
  <div class="copyright">
    <span>© 2026 Lolosia, all rights reserved.</span>
    <br />
    <span>鲁ICP备 000000000号-0，{{ buildEnv }}</span>
  </div>
</template>

<style scoped lang="scss">
.copyright {
  position: absolute;
  bottom: 0.5em;
  left: 0.5em;

  color: var(--lolosia-color-primary-light-3);
  font-size: 0.9em;
}
</style>
