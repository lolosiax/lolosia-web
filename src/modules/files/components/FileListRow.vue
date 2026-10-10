<script setup lang="ts">
import { computed } from 'vue'
import { isFavorite } from '../api'
import { formatDateTime, formatSize, typeLabel } from '../lib'
import type { NsfwMode, UiEntry } from '../types'
import FileThumb from './FileThumb.vue'

defineOptions({ name: 'FileListRow' })

const props = defineProps<{
  entry: UiEntry
  selected: boolean
  primary: boolean
  dropTarget?: boolean
  nsfwMode: NsfwMode
  revealed: boolean
}>()

const emit = defineEmits<{
  pick: [entry: UiEntry, event: MouseEvent]
  open: [entry: UiEntry]
  menu: [entry: UiEntry, event: MouseEvent]
  favorite: [entry: UiEntry]
}>()

const date = computed(() => formatDateTime(props.entry.mtime))
const size = computed(() => (props.entry.directory ? '—' : formatSize(props.entry.size)))
const type = computed(() => typeLabel(props.entry))

const favoriteSupported = computed(
  () => props.entry.directory || /^(image|video|audio)\//.test(props.entry.mime)
)
const favoritePending = computed(() => !props.entry.directory && !props.entry.indexed)
const favoriteTitle = computed(() => {
  if (favoritePending.value) return '文件尚未索引'
  return isFavorite(props.entry) ? '取消喜欢' : '标记喜欢'
})

function onFavorite(): void {
  if (!favoritePending.value) emit('favorite', props.entry)
}
</script>

<template>
  <div
    class="file-row"
    :class="{ 'is-selected': selected, 'is-primary': primary, 'is-drop-target': dropTarget }"
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
    <span class="cell fav">
      <button
        v-if="favoriteSupported"
        type="button"
        class="file-row__fav"
        :class="{ 'is-on': isFavorite(entry), 'is-pending': favoritePending }"
        :title="favoriteTitle"
        :aria-label="favoriteTitle"
        @pointerdown.stop
        @click.stop="onFavorite"
      >
        <i v-if="favoritePending" class="bi bi-three-dots" />
        <i v-else class="bi" :class="isFavorite(entry) ? 'bi-heart-fill' : 'bi-heart'" />
      </button>
    </span>
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

  &.is-drop-target {
    background: rgba(194, 150, 205, 0.3);
    box-shadow: inset 0 0 0 2px var(--lolosia-color-primary-light-3, #c296cd);
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

  .fav {
    display: grid;
    flex: none;
    place-items: center;
    width: 40px;
  }

  &__fav {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: transparent;
    color: var(--el-text-color-secondary, #999);
    font-size: 13px;
    line-height: 1;
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.15s ease, color 0.15s ease;

    &.is-on {
      opacity: 1;
      color: #e0526a;
    }

    &.is-pending {
      opacity: 1;
      cursor: default;
    }
  }

  &:hover &__fav {
    opacity: 1;
  }
}
</style>
