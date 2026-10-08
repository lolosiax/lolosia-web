<script setup lang="ts">
import { computed } from 'vue'
import { formatDateTime, formatSize, typeLabel } from '../lib'
import type { NsfwMode, UiEntry } from '../types'
import FileThumb from './FileThumb.vue'

defineOptions({ name: 'FileListRow' })

const props = defineProps<{
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

const date = computed(() => formatDateTime(props.entry.mtime))
const size = computed(() => (props.entry.directory ? '—' : formatSize(props.entry.size)))
const type = computed(() => typeLabel(props.entry))
</script>

<template>
  <div
    class="file-row"
    :class="{ 'is-selected': selected, 'is-primary': primary }"
    :data-drop-dir="entry.directory ? entry.path : undefined"
    :data-entry-path="entry.path"
    role="button"
    tabindex="0"
    :aria-pressed="selected"
    @click="emit('pick', entry, $event)"
    @dblclick="emit('open', entry)"
    @contextmenu="emit('menu', entry, $event)"
    @keydown.enter.prevent="emit('open', entry)"
    @keydown.space.prevent="emit('pick', entry, $event)"
  >
    <span class="file-row__icon cell icon">
      <FileThumb
        :entry="entry"
        :size="256"
        :token="entry.thumbToken"
        :nsfw-mode="nsfwMode"
        :revealed="revealed"
      />
    </span>
    <span class="file-row__name cell name"><span class="name-text">{{ entry.name }}</span></span>
    <span class="file-row__date cell">{{ date }}</span>
    <span class="file-row__type cell">{{ type }}</span>
    <span class="file-row__size cell">{{ size }}</span>
  </div>
</template>

<style scoped lang="scss">
.file-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 10px;
  border-radius: 10px;
  font-size: 13px;
  cursor: default;
  transition: background-color 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.6);
  }

  &.is-selected {
    background: rgba(194, 150, 205, 0.22);
  }

  &.is-primary {
    box-shadow: inset 2px 0 0 var(--lolosia-color-primary-light-3, #c296cd);
  }

  .cell {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .icon {
    display: grid;
    flex: none;
    place-items: center;
    width: 30px;
    height: 30px;
    overflow: hidden;
    font-size: 1.3em;
  }

  .name {
    flex: 1;
    min-width: 0;
  }

  &__date {
    width: 170px;
  }

  &__type {
    width: 120px;
  }

  &__size {
    width: 110px;
  }
}
</style>
