<script setup lang="ts">
// 在线文件管理器：左侧目录树 + 中间文件区 + 右侧预览。
// 浏览位置直接反映在 URL 上（`/files/<文件夹路径>`），因此可以收藏 / 分享到具体目录。
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import AppPage from '@/core/ui/AppPage.vue'
import type { FileSortKey } from '../api'
import { useFilesListing } from '../composables/use-files-listing'
import { useFilesPrefs } from '../composables/use-files-prefs'
import { useFilesPreview } from '../composables/use-files-preview'
import { useFilesSelection } from '../composables/use-files-selection'
import { useFilesStore } from '../store'
import type { UiEntry } from '../types'
import FileGrid from '../components/FileGrid.vue'
import FilePreview from '../components/FilePreview.vue'
import FileToolbar from '../components/FileToolbar.vue'
import FileTree from '../components/FileTree.vue'

defineOptions({ name: 'Files' })

const route = useRoute()
const router = useRouter()
const store = useFilesStore()
const prefs = useFilesPrefs()

const { entries, loading, error, load } = useFilesListing()
const { selected, selection, selectedEntries, revealed, onPick, applyMarquee, clear, reveal, isRevealed } =
  useFilesSelection(() => entries.value)
const {
  detail: previewDetail,
  remark: previewRemark,
  loading: previewLoading,
  load: loadPreview,
  saveRemark: persistRemark,
  clear: clearPreview
} = useFilesPreview()

const dragging = ref(false)

/** 当前目录的相对路径；URL 是唯一来源。 */
const currentPath = computed(() => {
  const raw = route.params.pathMatch
  const segments = Array.isArray(raw) ? raw : raw ? [raw as string] : []
  return segments.filter(Boolean).join('/')
})

/** 主选中项按路径从最新列表里取，SSE / 刷新替换数组后仍指向同一条。 */
const current = computed<UiEntry | null>(() => {
  const path = selected.value?.path
  if (!path) return null
  return entries.value.find(entry => entry.path === path) ?? selected.value
})

const sideOpen = computed(() => prefs.previewOpen)
const selectedCount = computed(() => selection.value.size)
const remarkDisabled = computed(() => !current.value || (!current.value.directory && !current.value.indexed))

function navigate(path: string): void {
  const target = path ? `/files/${path}` : '/files'
  if (target === route.path) return
  void router.push(target)
}

async function reload(): Promise<void> {
  clear()
  clearPreview()
  await load(currentPath.value, prefs.sort, prefs.order)
}

watch(currentPath, () => void reload())
watch([() => prefs.sort, () => prefs.order], () => void reload())

watch(
  () => selected.value?.path,
  () => {
    const entry = current.value
    if (!entry) {
      clearPreview()
      return
    }
    void loadPreview(entry)
  }
)

onMounted(() => void reload())

/** 单击已选中的那一项 = 查看（只放行遮罩）；列表视图走右侧预览。 */
function handlePick(entry: UiEntry, mode: 'single' | 'toggle' | 'range'): void {
  if (mode === 'single' && selected.value?.path === entry.path && prefs.view === 'grid') {
    reveal(entry.path)
    return
  }
  onPick(entry, mode)
}

/** 双击：目录进目录，文件先选中（查看器在下一节点接入）。 */
function open(entry: UiEntry): void {
  if (entry.directory) navigate(entry.path)
  else onPick(entry, 'single')
}

function onSort(key: FileSortKey): void {
  if (prefs.sort === key) prefs.order = prefs.order === 'asc' ? 'desc' : 'asc'
  else prefs.sort = key
}

function onSplitterDown(event: PointerEvent): void {
  event.preventDefault()
  const startX = event.clientX
  const startWidth = store.treeWidth
  dragging.value = true
  const onMove = (move: PointerEvent): void => {
    store.setTreeWidth(startWidth + move.clientX - startX)
  }
  const onUp = (): void => {
    dragging.value = false
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
  }
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
}

async function saveRemark(value: string): Promise<void> {
  const entry = current.value
  if (!entry) return
  try {
    await persistRemark(entry, value)
    ElMessage.success('备注已保存')
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : '保存备注失败')
  }
}
</script>

<template>
  <AppPage>
    <div class="files-page" :class="{ 'is-dragging': dragging }">
      <FileToolbar
        class="files-page__panel files-page__toolbar"
        :path="currentPath"
        :view="prefs.view"
        :sort="prefs.sort"
        :order="prefs.order"
        :group="'none'"
        :group-enabled="false"
        :date-group-enabled="false"
        :fav-first-enabled="false"
        :preview-open="prefs.previewOpen"
        :total="entries.length"
        :selected-count="selectedCount"
        :loading="loading"
        :nsfw-mode="prefs.nsfwMode"
        @navigate="navigate"
        @update:view="prefs.view = $event"
        @update:sort="prefs.sort = $event"
        @update:order="prefs.order = $event"
        @update:preview-open="prefs.previewOpen = $event"
        @update:nsfw-mode="prefs.nsfwMode = $event"
        @refresh="reload"
      />

      <div
        class="files-page__body"
        :class="{ 'has-side': sideOpen }"
        :style="{ '--tree-width': `${store.treeWidth}px` }"
      >
        <aside class="files-page__panel files-page__tree">
          <FileTree
            :current="currentPath"
            @navigate="navigate"
          />
        </aside>

        <div
          class="files-page__splitter"
          role="separator"
          aria-orientation="vertical"
          aria-label="调整目录树宽度"
          :aria-valuenow="store.treeWidth"
          title="拖动调整目录树宽度"
          @pointerdown="onSplitterDown"
        />

        <section class="files-page__panel files-page__grid">
          <div v-if="error" class="files-page__error">{{ error }}</div>
          <FileGrid
            :entries="entries"
            :view="prefs.view"
            :sort="prefs.sort"
            :order="prefs.order"
            :selected="selected?.path ?? ''"
            :selection="selection"
            :loading="loading"
            :path="currentPath"
            :nsfw-mode="prefs.nsfwMode"
            :revealed-paths="revealed"
            @pick="handlePick"
            @pick-blank="clear"
            @marquee="applyMarquee"
            @open="open"
            @sort="onSort"
          />
        </section>

        <aside v-if="sideOpen" class="files-page__side">
          <FilePreview
            class="files-page__panel files-page__preview"
            :entry="current"
            :detail="previewDetail"
            :selection="selectedEntries"
            :loading="previewLoading"
            :nsfw-mode="prefs.nsfwMode"
            :revealed="Boolean(selected && isRevealed(selected.path))"
            :remark="previewRemark"
            :remark-disabled="remarkDisabled"
            @reveal="selected && reveal(selected.path)"
            @save-remark="saveRemark"
          />
        </aside>
      </div>
    </div>
  </AppPage>
</template>

<style scoped lang="scss">
.files-page {
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 10px;
  height: 100%;
  min-height: 0;

  &__panel {
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.6);
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.45);
    box-shadow: 0 4px 16px 0 rgba(31, 38, 135, 0.12);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }

  &__toolbar {
    padding: 0;
  }

  &__body {
    position: relative;
    display: grid;
    grid-template-columns: var(--tree-width, 220px) minmax(0, 1fr);
    gap: 10px;
    min-height: 0;

    &.has-side {
      grid-template-columns: var(--tree-width, 220px) minmax(0, 1fr) 300px;
    }
  }

  &__tree {
    min-height: 0;
  }

  &__grid {
    position: relative;
    display: grid;
    grid-template-rows: 1fr;
    min-height: 0;
  }

  &__error {
    margin: 12px;
    color: var(--el-color-danger, #f56c6c);
    font-size: 13px;
  }

  &__splitter {
    position: absolute;
    top: 0;
    bottom: 0;
    left: var(--tree-width, 220px);
    width: 10px;
    border-radius: 999px;
    cursor: col-resize;
    touch-action: none;

    &::after {
      position: absolute;
      top: 50%;
      left: 3px;
      width: 4px;
      height: 34px;
      border-radius: 999px;
      background: rgba(124, 116, 168, 0.35);
      opacity: 0;
      content: '';
      transform: translateY(-50%);
      transition: opacity 0.15s ease;
    }

    &:hover {
      background: rgba(255, 255, 255, 0.6);

      &::after {
        opacity: 1;
      }
    }
  }

  &.is-dragging {
    cursor: col-resize;
    user-select: none;

    .files-page__splitter::after {
      opacity: 1;
    }
  }

  &__side {
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-height: 0;
  }

  &__preview {
    flex: 1 1 auto;
    min-height: 0;
  }
}
</style>
