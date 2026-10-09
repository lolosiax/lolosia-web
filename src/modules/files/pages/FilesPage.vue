<script setup lang="ts">
// 在线文件管理器：左侧目录树 + 中间文件区 + 右侧预览。
// 浏览位置直接反映在 URL 上（`/files/<文件夹路径>`），因此可以收藏 / 分享到具体目录。
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import AppPage from '@/core/ui/AppPage.vue'
import { confirmAction } from '@/core/composables/use-dialog'
import {
  analyzeMediaIndex,
  attachMediaTags,
  detachMediaTags,
  isNoCrop,
  isViewable,
  NO_CROP_TAG,
  regenerateThumbs,
  scanMediaIndex
} from '../api'
import type { FileSortKey } from '../api'
import { mapLimit, parentPath, renamedCurrentPath } from '../lib'
import { useFilesActions } from '../composables/use-files-actions'
import { useFilesListing } from '../composables/use-files-listing'
import { useFilesPrefs } from '../composables/use-files-prefs'
import { useFilesPreview } from '../composables/use-files-preview'
import { useFilesSelection } from '../composables/use-files-selection'
import { useFilesShortcuts } from '../composables/use-files-shortcuts'
import { useFilesStore } from '../store'
import type { UiEntry } from '../types'
import EntryMenu from '../components/EntryMenu.vue'
import FileGrid from '../components/FileGrid.vue'
import FilePreview from '../components/FilePreview.vue'
import FileSettingDialog from '../components/FileSettingDialog.vue'
import FileToolbar from '../components/FileToolbar.vue'
import FileTree from '../components/FileTree.vue'
import FileUploadPanel from '../components/FileUploadPanel.vue'
import MediaViewer from '../components/MediaViewer.vue'
import NameDialog from '../components/NameDialog.vue'

defineOptions({ name: 'Files' })

const route = useRoute()
const router = useRouter()
const store = useFilesStore()
const prefs = useFilesPrefs()

const { entries, loading, error, load } = useFilesListing()
const { selected, selection, selectedEntries, revealed, onPick, selectAll, applyMarquee, clear, reveal, isRevealed } =
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
const settingOpen = ref(false)
/** 全屏查看器里打开的项（空串 = 未打开）。 */
const viewerPath = ref('')
const treeRef = ref<{ invalidate: (path: string) => Promise<void> } | null>(null)

/* ---------- 右键菜单 ---------- */
const menuPos = ref<{ x: number; y: number } | null>(null)
const menuEntry = ref<UiEntry | null>(null)

/* ---------- 命名对话框（改名 / 新建共用） ---------- */
const nameOpen = ref(false)
const nameMode = ref<'rename' | 'mkdir'>('rename')
const nameEntry = ref<UiEntry | null>(null)
const nameDir = ref('')
const nameBusy = ref(false)

const uploads = computed(() => store.uploads)

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

const sideOpen = computed(() => prefs.previewOpen || uploads.value.length > 0)
const selectedCount = computed(() => selection.value.size)
const remarkDisabled = computed(() => !current.value || (!current.value.directory && !current.value.indexed))

/** 菜单作用于右键的那一项；目录树里的节点不在当前列表时只操作它自己。 */
const menuTargets = computed<UiEntry[]>(() => {
  const entry = menuEntry.value
  if (entry && !entries.value.some(item => item.path === entry.path)) return [entry]
  return selectedEntries.value
})

const menuSingle = computed(() => menuTargets.value.length <= 1)
const menuHasFiles = computed(() => menuTargets.value.some(item => !item.directory))
const menuAllNoCrop = computed(() => {
  const files = menuTargets.value.filter(item => !item.directory)
  return files.length > 0 && files.every(isNoCrop)
})

const nameTitle = computed(() => {
  if (nameMode.value === 'mkdir') return '新建文件夹'
  return nameEntry.value?.directory ? '重命名文件夹' : '重命名文件'
})

const nameInitial = computed(() => (nameMode.value === 'rename' ? nameEntry.value?.name ?? '' : '新建文件夹'))

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

/** 双击：目录进目录；图片 / 视频打开全屏查看器；其余文件当选中处理。 */
function open(entry: UiEntry): void {
  if (entry.directory) navigate(entry.path)
  else if (isViewable(entry)) viewerPath.value = entry.path
  else onPick(entry, 'single')
}

function onViewerVisible(value: boolean): void {
  if (!value) viewerPath.value = ''
}

/** 工具栏「刷新索引」：只做本地扫描（EXIF / 规则打标），不出网。 */
async function onIndexScan(): Promise<void> {
  try {
    const result = await scanMediaIndex(currentPath.value)
    ElMessage.success(result.message)
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : '索引扫描失败')
  }
}

/** 工具栏「开始打标」：对当前目录递归做外发分析。 */
async function onAnalyze(): Promise<void> {
  await runAnalyze(currentPath.value)
}

async function runAnalyze(path: string, reanalyze = false): Promise<void> {
  try {
    const result = await analyzeMediaIndex(path, true, reanalyze)
    ElMessage.success(result.message)
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : '打标请求失败')
  }
}

/* ---------- 右键菜单 ---------- */

function menuAt(entry: UiEntry | null, x: number, y: number): void {
  menuEntry.value = entry
  menuPos.value = {
    x: Math.min(x, window.innerWidth - 152),
    y: Math.min(y, window.innerHeight - 320)
  }
}

function openContextMenu(entry: UiEntry, x: number, y: number): void {
  const inListing = entries.value.some(item => item.path === entry.path)
  if (inListing && !selection.value.has(entry.path)) onPick(entry, 'single')
  menuAt(entry, x, y)
}

function openBlankMenu(event: MouseEvent): void {
  menuAt(null, event.clientX, event.clientY)
}

function closeMenu(): void {
  menuPos.value = null
  menuEntry.value = null
}

function startRename(): void {
  const entry = menuEntry.value
  closeMenu()
  if (!entry) return
  nameMode.value = 'rename'
  nameEntry.value = entry
  nameOpen.value = true
}

function startMkdir(): void {
  closeMenu()
  nameMode.value = 'mkdir'
  nameEntry.value = null
  nameDir.value = currentPath.value
  nameOpen.value = true
}

async function submitName(value: string): Promise<void> {
  if (nameMode.value === 'rename' && value === nameEntry.value?.name) {
    nameOpen.value = false
    return
  }
  nameBusy.value = true
  try {
    const ok =
      nameMode.value === 'rename' && nameEntry.value
        ? await actions.rename(nameEntry.value.path, value)
        : await actions.mkdir(nameDir.value, value)
    if (ok) nameOpen.value = false
  } finally {
    nameBusy.value = false
  }
}

function copySelection(cut: boolean): void {
  const targets = menuTargets.value
  closeMenu()
  if (!targets.length) return
  actions.clipboard(cut ? 'cut' : 'copy', targets.map(item => item.path))
}

async function pasteClipboard(): Promise<void> {
  closeMenu()
  await actions.paste(currentPath.value)
}

async function removeSelection(): Promise<void> {
  const targets = menuTargets.value
  closeMenu()
  if (!targets.length) return
  // 删掉的目录可能正是当前所在目录：先算好退路，删完再一次性导航
  const removedDir = targets.find(
    item => item.directory && (currentPath.value === item.path || currentPath.value.startsWith(`${item.path}/`))
  )
  const fallback = removedDir ? parentPath(removedDir.path) : null
  const ok = await actions.remove(targets.map(item => item.path))
  if (ok && fallback !== null) navigate(fallback)
}

async function moveIntoDir(paths: string[], dir: string): Promise<void> {
  if (!paths.length) return
  const label = dir ? `/${dir}` : '根目录'
  if (!(await confirmAction(`要移动 ${paths.length} 项到${label}吗？`, '确认移动'))) return
  await actions.moveInto(paths, dir)
}

function analyzeEntry(): void {
  const entry = menuEntry.value
  closeMenu()
  if (entry) void runAnalyze(entry.path)
}

async function reanalyzeEntry(): Promise<void> {
  const entry = menuEntry.value
  closeMenu()
  if (!entry) return
  const confirmed = await confirmAction(
    `将对「${entry.name}」及其子目录的全部素材重新外发打标（含已分析项），素材会交给外部大模型并产生费用。`,
    '重新打标（全部）'
  )
  if (confirmed) await runAnalyze(entry.path, true)
}

async function regenerateSelectedThumbs(): Promise<void> {
  const paths = menuTargets.value.filter(item => !item.directory).map(item => item.path)
  closeMenu()
  if (!paths.length) {
    ElMessage.warning('请选择图片文件')
    return
  }
  try {
    const result = await regenerateThumbs(paths)
    ElMessage.success(result.message || `已重新排队 ${paths.length} 个文件`)
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : '重新生成缩略图失败')
  }
}

/** 批量切换「不裁剪」；变更后重算涉及图片的缩略图。 */
async function toggleNoCropOnSelection(): Promise<void> {
  const files = menuTargets.value.filter(item => !item.directory)
  const enabled = files.length > 0 && files.every(isNoCrop)
  closeMenu()
  if (!files.length) {
    ElMessage.warning('「不裁剪」只对图片文件有效')
    return
  }
  let failed = 0
  await mapLimit(files, 6, async entry => {
    if (!entry.indexed) {
      failed += 1
      return
    }
    const tags = [{ ...NO_CROP_TAG }]
    try {
      if (enabled) await detachMediaTags({ path: entry.path, tags })
      else await attachMediaTags({ path: entry.path, tags })
    } catch {
      failed += 1
    }
  })
  if (failed) ElMessage.error(`${failed} 项处理失败`)
  const paths = files.filter(item => item.indexed).map(item => item.path)
  if (paths.length) await regenerateThumbs(paths).catch(() => undefined)
  if (!failed) ElMessage.success(enabled ? '已取消不裁剪' : '已标记不裁剪')
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
  return !nameOpen.value && !settingOpen.value && !viewerPath.value && !menuPos.value
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
            @menu="openContextMenu"
            @menu-blank="openBlankMenu"
            @drop-files="onDropFiles"
            @move-into="moveIntoDir"
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
            @reveal="selected && reveal(selected.path)"
            @save-remark="saveRemark"
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
      @folder-tags="closeMenu"
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

  &__upload {
    flex: 0 1 auto;
    max-height: 45%;
    min-height: 0;
  }
}
</style>
