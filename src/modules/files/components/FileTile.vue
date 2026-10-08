<script setup lang="ts">
import type { NsfwMode, UiEntry } from '../types'
import FileThumb from './FileThumb.vue'

defineOptions({ name: 'FileTile' })

defineProps<{
  entry: UiEntry
  selected: boolean
  primary: boolean
  nsfwMode: NsfwMode
  revealed: boolean
}>()

const emit = defineEmits<{
  pick: [entry: UiEntry, event: MouseEvent]
  open: [entry: UiEntry]
  menu: [entry: UiEntry, event: MouseEvent]
}>()
</script>

<template>
  <div
    class="file-tile"
    :class="{ 'is-selected': selected, 'is-primary': primary }"
    :data-drop-dir="entry.directory ? entry.path : undefined"
    :data-entry-path="entry.path"
    :title="entry.name"
    role="button"
    tabindex="0"
    :aria-pressed="selected"
    @click="emit('pick', entry, $event)"
    @dblclick="emit('open', entry)"
    @contextmenu="emit('menu', entry, $event)"
    @keydown.enter.prevent="emit('open', entry)"
    @keydown.space.prevent="emit('pick', entry, $event)"
  >
    <div class="file-tile__thumb">
      <FileThumb
        :entry="entry"
        :size="256"
        :token="entry.thumbToken"
        :nsfw-mode="nsfwMode"
        :revealed="revealed"
      />
    </div>
    <div class="file-tile__name">{{ entry.name }}</div>
  </div>
</template>

<style scoped lang="scss">
.file-tile {
  padding: 8px 6px 6px;
  border: 1px solid transparent;
  border-radius: 12px;
  cursor: default;
  transition: background-color 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.6);
  }

  &.is-selected {
    background: rgba(194, 150, 205, 0.22);
    border-color: var(--lolosia-color-primary-light-3);
  }

  &.is-primary {
    box-shadow: inset 0 0 0 2px var(--lolosia-color-primary-light-3, #c296cd);
  }

  &__thumb {
    position: relative;
    display: grid;
    place-items: center;
    height: 104px;
    overflow: hidden;
    font-size: 2.4em;
  }

  &__name {
    display: -webkit-box;
    margin-top: 6px;
    overflow: hidden;
    font-size: 12px;
    line-height: 1.3;
    text-align: center;
    word-break: break-all;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }
}
</style>
