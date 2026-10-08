<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { needsBlur, rawUrl, thumbUrl } from '../api'
import { sampleDataUrl } from '../lib'
import type { UiEntry } from '../types'
import FileIcon from './FileIcon.vue'

defineOptions({ name: 'FileThumb' })

const props = withDefaults(
  defineProps<{
    entry: UiEntry
    size?: number
    token?: number
    allowRaw?: boolean
    nsfwMode?: 'blur' | 'always'
    revealed?: boolean
  }>(),
  { size: 256, token: 0, allowRaw: false, nsfwMode: 'blur', revealed: false }
)

const failed = ref(false)
const loaded = ref(false)

const sensitive = computed(() => needsBlur(props.entry.rating))
const masked = computed(() => props.nsfwMode === 'blur' && sensitive.value && !props.revealed)
const sample = computed(() => sampleDataUrl(props.entry.sample))

const source = computed(() => {
  const entry = props.entry
  if (!entry.image && !entry.mime.startsWith('video/')) return ''
  if (masked.value) return sample.value
  if (entry.thumb) return thumbUrl(entry, props.size, props.token)
  return props.allowRaw ? rawUrl(entry, props.token) : sample.value
})

const showImage = computed(() => Boolean(source.value) && !failed.value && !props.entry.directory)

watch(
  () => source.value,
  () => {
    failed.value = false
    loaded.value = false
  }
)
</script>

<template>
  <span class="file-thumb">
    <img
      v-if="showImage"
      class="file-thumb__image"
      :class="{ 'file-thumb__image--masked': masked, 'file-thumb__image--loaded': loaded }"
      :src="source"
      alt=""
      loading="lazy"
      draggable="false"
      @load="loaded = true"
      @error="failed = true"
    />
    <FileIcon v-else :ext="entry.ext" :directory="entry.directory" />
    <span v-if="masked" class="file-thumb__mask"><i class="bi bi-eye-slash" /></span>
  </span>
</template>

<style scoped lang="scss">
.file-thumb {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  overflow: hidden;

  &__image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0;
    transition: opacity 0.24s ease, filter 0.2s ease;

    &--loaded {
      opacity: 1;
    }

    &--masked {
      filter: blur(16px) saturate(0.7);
      transform: scale(1.08);
    }
  }

  &__mask {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 15px;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.45);
  }
}
</style>
