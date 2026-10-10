<script setup lang="ts">
import { isFavorite } from '../api'
import type { NsfwMode, UiEntry } from '../types'
import FileThumb from './FileThumb.vue'

defineOptions({ name: 'FileTile' })

defineProps<{
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

/** 目录走 folder_tag、媒体文件走 media_asset_tag；其余文件挂不上标签。 */
const favoriteSupported = (entry: UiEntry): boolean =>
  entry.directory || /^(image|video|audio)\//.test(entry.mime)
const favoritePending = (entry: UiEntry): boolean => !entry.directory && !entry.indexed
const favoriteTitle = (entry: UiEntry): string => {
  if (favoritePending(entry)) return '文件尚未索引'
  return isFavorite(entry) ? '取消喜欢' : '标记喜欢'
}

function onFavorite(entry: UiEntry): void {
  if (favoritePending(entry)) return
  emit('favorite', entry)
}
</script>

<template>
  <div
    class="file-tile"
    :class="{ 'is-selected': selected, 'is-primary': primary, 'is-drop-target': dropTarget }"
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
      <button
        v-if="favoriteSupported(entry)"
        type="button"
        class="file-tile__fav"
        :class="{ 'is-on': isFavorite(entry), 'is-pending': favoritePending(entry) }"
        :title="favoriteTitle(entry)"
        :aria-label="favoriteTitle(entry)"
        @pointerdown.stop
        @click.stop="onFavorite(entry)"
      >
        <i v-if="favoritePending(entry)" class="bi bi-three-dots" />
        <i v-else class="bi" :class="isFavorite(entry) ? 'bi-heart-fill' : 'bi-heart'" />
      </button>
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

  &.is-drop-target {
    background: rgba(194, 150, 205, 0.3);
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

  &__fav {
    position: absolute;
    right: 4px;
    bottom: 4px;
    z-index: 2;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.82);
    box-shadow: 0 1px 4px rgba(31, 38, 135, 0.22);
    color: var(--el-text-color-secondary, #999);
    font-size: 13px;
    line-height: 1;
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.15s ease, color 0.15s ease, transform 0.1s ease;

    &:hover {
      transform: scale(1.12);
    }

    &.is-on {
      opacity: 1;
      color: #e0526a;
    }

    &.is-pending {
      opacity: 1;
      cursor: default;

      &:hover {
        transform: none;
      }
    }
  }

  &:hover &__fav {
    opacity: 1;
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
