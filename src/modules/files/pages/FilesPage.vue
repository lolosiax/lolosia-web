<script setup lang="ts">
// 在线文件管理器：左侧目录树 + 中间文件区 + 右侧预览。
// 浏览位置直接反映在 URL 上（`/files/<文件夹路径>`），因此可以收藏 / 分享到具体目录。
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import AppPage from '@/core/ui/AppPage.vue'
import { isViewable } from '../api'
import type { FileSortKey } from '../api'
import { renamedCurrentPath } from '../lib'
import { useFilesActions } from '../composables/use-files-actions'
import { useFilesClipboard } from '../composables/use-files-clipboard'
import { useFilesGroups } from '../composables/use-files-groups'
import { useFilesListing } from '../composables/use-files-listing'
import { useFilesMedia } from '../composables/use-files-media'
import { useFilesMenu } from '../composables/use-files-menu'
import { useFilesPrefs } from '../composables/use-files-prefs'
import { useFilesPreview } from '../composables/use-files-preview'
import { useFilesRealtime } from '../composables/use-files-realtime'
import { useFilesSelection } from '../composables/use-files-selection'
import { useFilesShortcuts } from '../composables/use-files-shortcuts'
import { useFilesTagPanel } from '../composables/use-files-tag-panel'
import { useFilesTags } from '../composables/use-files-tags'
import { useFilesStore } from '../store'
import type { UiEntry } from '../types'
import EntryMenu from '../components/EntryMenu.vue'
import FileGrid from '../components/FileGrid.vue'
import FilePreview from '../components/FilePreview.vue'
import FilePropertyDialog from '../components/FilePropertyDialog.vue'
import FileSettingDialog from '../components/FileSettingDialog.vue'
import FileToolbar from '../components/FileToolbar.vue'
import FileTree from '../components/FileTree.vue'
import FileUploadPanel from '../components/FileUploadPanel.vue'
import FolderTagDialog from '../components/FolderTagDialog.vue'
import MediaViewer from '../components/MediaViewer.vue'
import NameDialog from '../components/NameDialog.vue'
import TagMenu from '../components/TagMenu.vue'
import TagPanel from '../components/TagPanel.vue'

defineOptions({ name: 'Files' })

const route = useRoute()
const router = useRouter()
const store = useFilesStore()
const prefs = useFilesPrefs()

const { entries, loading, error, load, patch } = useFilesListing()
const {
  path: previewPath,
  detail: previewDetail,
  media: previewMedia,
  tagsOfFolder: previewFolderTags,
  remark: previewRemark,
  loading: previewLoading,
  load: loadPreview,
  saveRemark: persistRemark,
  clear: clearPreview
} = useFilesPreview()

const dragging = ref(false)
const settingOpen = ref(false)
/** 全屏查看器里打开的项（空串 = 未打开）。 */
const viewerPath = ref('')
const treeRef = ref<{ invalidate: (path: string) => Promise<void> } | null>(null)

/* ---------- 属性 / 文件夹标签对话框 ---------- */
const propertyOpen = ref(false)
const folderTagOpen = ref(false)
const folderTagTarget = ref<UiEntry | null>(null)

const uploads = computed(() => store.uploads)

/** 当前目录的相对路径；URL 是唯一来源。 */
const currentPath = computed(() => {
  const raw = route.params.pathMatch
  const segments = Array.isArray(raw) ? raw : raw ? [raw as string] : []
  return segments.filter(Boolean).join('/')
})

const { group, dateGroupEnabled, favFirstEnabled, groupEnabled, displayGroups, displayEntries, loadFolderTags, snapshotFavorites } =
  useFilesGroups(entries, currentPath)

const { selected, selection, selectedEntries, revealed, onPick, selectAll, applyMarquee, clear, reveal, isRevealed } =
  useFilesSelection(() => displayEntries.value)

const { groupTags, addTags, removeTag, toggleFavorite } = useFilesTags(selection, selectedEntries)

/** 主选中项按路径从最新列表里取，SSE / 刷新替换数组后仍指向同一条。 */
const current = computed<UiEntry | null>(() => {
  const path = selected.value?.path
  if (!path) return null
  return entries.value.find(entry => entry.path === path) ?? selected.value
})

const sideOpen = computed(() => prefs.previewOpen || uploads.value.length > 0)
const selectedCount = computed(() => selection.value.size)
const remarkDisabled = computed(() => !current.value || (!current.value.directory && !current.value.indexed))

function navigate(path: string): void {
  const target = path ? `/files/${path}` : '/files'
  if (target === route.path) return
  void router.push(target)
}

const actions = useFilesActions({
  changed: dirs => void handleChanged(dirs),
  renamed: (from, to) => {
    const next = renamedCurrentPath(currentPath.value, from, to)
    if (next !== currentPath.value) navigate(next)
  }
})

const {
  menuPos,
  menuEntry,
  menuTargets,
  menuSingle,
  menuHasFiles,
  menuAllNoCrop,
  nameOpen,
  nameTitle,
  nameInitial,
  nameBusy,
  openContextMenu,
  openBlankMenu,
  closeMenu,
  startRename,
  startMkdir,
  submitName
} = useFilesMenu({ entries, currentPath, selection, selectedEntries, actions, onPick })

const { copySelection, pasteClipboard, removeSelection, moveIntoDir } = useFilesClipboard({
  menuTargets,
  closeMenu,
  currentPath,
  actions,
  navigate
})

const { onIndexScan, onAnalyze, analyzeEntry, reanalyzeEntry, regenerateSelectedThumbs, toggleNoCropOnSelection } =
  useFilesMedia({ currentPath, menuEntry, menuTargets, closeMenu })

/** 目录内容变更：让目录树对应层失效；当前目录受影响时重列。 */
async function handleChanged(dirs: string[]): Promise<void> {
  const unique = [...new Set(dirs)]
  for (const dir of unique) await treeRef.value?.invalidate(dir)
  const affected = unique.some(dir => currentPath.value === dir || currentPath.value.startsWith(`${dir}/`))
  if (affected) await reload()
}

async function reload(): Promise<void> {
  clear()
  clearPreview()
  viewerPath.value = ''
  await load(currentPath.value, prefs.sort, prefs.order)
  // 分组与组内「喜欢优先」用的是进目录那一刻的快照，只在重列时重算
  snapshotFavorites()
}

/** 标签 / 评级改完后重拉预览，让右侧标签栏与属性数据保持同一份。 */
function refreshPreview(): Promise<void> {
  const entry = current.value
  return entry ? loadPreview(entry) : Promise.resolve()
}

const { tagRows, tagHint, tagMenuPos, openTagMenu, closeTagMenu, addTagsToSelection, applyTagToAll, removeTagFromAll } =
  useFilesTagPanel({
    selectedEntries,
    selection,
    groupTags,
    current,
    selectedCount,
    previewPath,
    previewFolderTags,
    previewMedia,
    addTags,
    removeTag,
    refreshPreview
  })

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

// 缩略图生成完成 / 索引更新：命中主选中项时顺手刷新预览
useFilesRealtime(patch, path => {
  if (selected.value?.path !== path) return
  const entry = entries.value.find(item => item.path === path)
  if (entry) void loadPreview(entry)
})

/** 单击已选中的那一项 = 查看（只放行遮罩）；列表视图走右侧预览。 */
function handlePick(entry: UiEntry, mode: 'single' | 'toggle' | 'range'): void {
  if (mode === 'single' && selected.value?.path === entry.path && prefs.view === 'grid') {
    reveal(entry.path)
    return
  }
  onPick(entry, mode)
}

/** 双击：目录进目录；图片 / 视频打开全屏查看器；其余文件当选中处理。 */
function open(entry: UiEntry): void {
  if (entry.directory) navigate(entry.path)
  else if (isViewable(entry)) viewerPath.value = entry.path
  else onPick(entry, 'single')
}

function onViewerVisible(value: boolean): void {
  if (!value) viewerPath.value = ''
}

/* ---------- 标签 / 喜欢 ---------- */

/** 网格卡片上的心：未索引的文件后端给不出标签关联，先拦一下。 */
async function onFavorite(entry: UiEntry): Promise<void> {
  if (!entry.directory && !entry.indexed) {
    ElMessage.warning('文件尚未索引，暂时不能标心')
    return
  }
  await toggleFavorite(entry)
  if (current.value?.path === entry.path) await refreshPreview()
}

/* ---------- 属性 / 文件夹标签 ---------- */

function openProperty(): void {
  if (current.value) propertyOpen.value = true
}

/** 属性页保存后：重拉当前目录与预览，让评级 / 标签 / 备注一起跟上。 */
async function onPropertySaved(): Promise<void> {
  const entry = current.value
  if (!entry) return
  await load(currentPath.value, prefs.sort, prefs.order)
  await loadPreview(entry)
}

function openFolderTags(): void {
  const entry = menuEntry.value
  closeMenu()
  if (!entry) return
  folderTagTarget.value = entry
  folderTagOpen.value = true
}

/** 改的正是当前所在目录时，分组栏与默认模式要立刻跟着变（改子目录则等进去时再生效）。 */
async function onFolderTagsSaved(): Promise<void> {
  const target = folderTagTarget.value
  if (!target) return
  if (target.path === currentPath.value) await loadFolderTags()
  if (current.value?.path === target.path) await refreshPreview()
}

/* ---------- 上传 / 拖拽 ---------- */

async function onDropFiles(files: File[], dir: string): Promise<void> {
  await store.enqueue(dir, files)
  await treeRef.value?.invalidate(dir)
  if (dir === currentPath.value) await reload()
  const group = store.uploads.find(item => item.dir === dir)
  const failed = group?.items.filter(item => item.status === 'error').length ?? 0
  if (failed) ElMessage.error(`${failed} 个文件上传失败，详情见右侧上传面板`)
}

/* ---------- 快捷键 ---------- */

function hotkeysEnabled(): boolean {
  return (
    !nameOpen.value &&
    !settingOpen.value &&
    !viewerPath.value &&
    !menuPos.value &&
    !tagMenuPos.value &&
    !propertyOpen.value &&
    !folderTagOpen.value
  )
}

function copyHotkey(cut: boolean): void {
  const targets = selectedEntries.value
  if (!targets.length) return
  actions.clipboard(cut ? 'cut' : 'copy', targets.map(item => item.path))
}

useFilesShortcuts({
  enabled: hotkeysEnabled,
  copy: () => copyHotkey(false),
  cut: () => copyHotkey(true),
  paste: () => void pasteClipboard(),
  selectAll: () => selectAll(),
  remove: () => void removeSelection()
})

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
        :group="group"
        :group-enabled="groupEnabled"
        :date-group-enabled="dateGroupEnabled"
        :fav-first-enabled="favFirstEnabled"
        :preview-open="prefs.previewOpen"
        :total="entries.length"
        :selected-count="selectedCount"
        :loading="loading"
        :nsfw-mode="prefs.nsfwMode"
        @navigate="navigate"
        @update:view="prefs.view = $event"
        @update:sort="prefs.sort = $event"
        @update:order="prefs.order = $event"
        @update:group="group = $event"
        @update:preview-open="prefs.previewOpen = $event"
        @update:nsfw-mode="prefs.nsfwMode = $event"
        @index-scan="onIndexScan"
        @analyze="onAnalyze"
        @refresh="reload"
        @setting="settingOpen = true"
      />

      <div
        class="files-page__body"
        :class="{ 'has-side': sideOpen }"
        :style="{ '--tree-width': `${store.treeWidth}px` }"
      >
        <aside class="files-page__panel files-page__tree">
          <FileTree
            ref="treeRef"
            :current="currentPath"
            @navigate="navigate"
            @menu="openContextMenu"
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
            :entries="displayEntries"
            :groups="displayGroups"
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
            @menu="openContextMenu"
            @menu-blank="openBlankMenu"
            @drop-files="onDropFiles"
            @move-into="moveIntoDir"
            @favorite="onFavorite"
          />
        </section>

        <aside v-if="sideOpen" class="files-page__side">
          <FilePreview
            v-if="prefs.previewOpen"
            class="files-page__panel files-page__preview"
            :entry="current"
            :detail="previewDetail"
            :selection="selectedEntries"
            :loading="previewLoading"
            :nsfw-mode="prefs.nsfwMode"
            :revealed="Boolean(selected && isRevealed(selected.path))"
            :remark="previewRemark"
            :remark-disabled="remarkDisabled"
            @property="openProperty"
            @reveal="selected && reveal(selected.path)"
            @save-remark="saveRemark"
          />
          <TagPanel
            v-if="prefs.previewOpen"
            class="files-page__panel files-page__tags"
            :rows="tagRows"
            :can-tag="selectedEntries.length > 0"
            :hint="tagHint"
            :path="currentPath"
            @add="addTagsToSelection"
            @menu="openTagMenu"
          />
          <FileUploadPanel
            v-if="uploads.length"
            class="files-page__panel files-page__upload"
            :groups="uploads"
            @clear="store.clearFinished()"
            @remove="store.removeGroup($event)"
          />
        </aside>
      </div>
    </div>

    <EntryMenu
      :open="Boolean(menuPos)"
      :x="menuPos?.x ?? 0"
      :y="menuPos?.y ?? 0"
      :entry="menuEntry"
      :single="menuSingle"
      :has-files="menuHasFiles"
      :all-no-crop="menuAllNoCrop"
      :can-paste="Boolean(store.clipboard)"
      @close="closeMenu"
      @rename="startRename"
      @folder-tags="openFolderTags"
      @analyze="analyzeEntry"
      @reanalyze="reanalyzeEntry"
      @no-crop="toggleNoCropOnSelection"
      @regenerate="regenerateSelectedThumbs"
      @copy="copySelection(false)"
      @cut="copySelection(true)"
      @remove="removeSelection"
      @mkdir="startMkdir"
      @paste="pasteClipboard"
    />

    <FilePropertyDialog v-model="propertyOpen" :path="current?.path ?? ''" @saved="onPropertySaved" />

    <FolderTagDialog
      v-model="folderTagOpen"
      :path="folderTagTarget?.path ?? ''"
      :name="folderTagTarget?.name ?? ''"
      @saved="onFolderTagsSaved"
    />

    <TagMenu
      :open="Boolean(tagMenuPos)"
      :x="tagMenuPos?.x ?? 0"
      :y="tagMenuPos?.y ?? 0"
      @apply="applyTagToAll"
      @remove="removeTagFromAll"
      @close="closeTagMenu"
    />

    <NameDialog
      v-model="nameOpen"
      :title="nameTitle"
      :initial="nameInitial"
      :busy="nameBusy"
      @confirm="submitName"
    />

    <FileSettingDialog v-model="settingOpen" />

    <MediaViewer
      :model-value="Boolean(viewerPath)"
      :path="viewerPath"
      :entries="entries"
      :nsfw-mode="prefs.nsfwMode"
      :revealed-paths="revealed"
      @update:model-value="onViewerVisible"
      @update:path="viewerPath = $event"
      @reveal="reveal"
    />
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

  &__tags {
    flex: 0 0 auto;
    max-height: 38%;
    min-height: 0;
  }

  &__upload {
    flex: 0 1 auto;
    max-height: 45%;
    min-height: 0;
  }
}
</style>
