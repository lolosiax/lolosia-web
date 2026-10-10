<script setup lang="ts">
// 去重的「搜索 + 选择」标签控件：输入框 + 悬浮候选。
// 只在获得焦点时拉一次词表与本目录已用标签，之后全在本地过滤；点候选不关闭，可连点批量加。
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { directoryTags, tagVocabulary } from '../api'
import type { MediaTagItem, MediaTagRef } from '../api'
import TagCandidate from './TagCandidate.vue'

defineOptions({ name: 'TagPicker' })

const props = defineProps<{ path: string }>()

const emit = defineEmits<{
  select: [tag: MediaTagRef]
  close: []
}>()

const root = ref<HTMLElement>()
const input = ref<HTMLInputElement>()

const query = ref('')
const activeNs = ref('')
const pinned = ref(false)
const vocabulary = ref<MediaTagItem[]>([])
const folderUsed = ref<MediaTagItem[]>([])
const loading = ref(false)

function keyOf(tag: { namespace: string; name: string }): string {
  return `${tag.namespace}\u0000${tag.name}`
}

/** 目录已用标签 → 出现的文件数；目录自己挂的记 0。 */
const usedMap = computed(() => {
  const map = new Map<string, number>()
  for (const tag of folderUsed.value) map.set(keyOf(tag), tag.count ?? 0)
  return map
})

const isUsed = (tag: { namespace: string; name: string }): boolean => usedMap.value.has(keyOf(tag))
const usedCount = (tag: { namespace: string; name: string }): number => usedMap.value.get(keyOf(tag)) ?? 0

const namespaces = computed(() => {
  const list: string[] = []
  for (const tag of vocabulary.value) if (!list.includes(tag.namespace)) list.push(tag.namespace)
  return list
})

/** 输入拆成命名空间部分与名字部分；带冒号按第一个冒号分。 */
const parts = computed(() => {
  const raw = query.value.trim()
  const at = raw.indexOf(':')
  const colon = at >= 0
  const rawNs = colon ? raw.slice(0, at).trim() : raw
  const rawName = colon ? raw.slice(at + 1).trim() : raw
  return { colon, rawNs, rawName, ns: rawNs.toLowerCase(), name: rawName.toLowerCase() }
})

const visibleNamespaces = computed(() => {
  const { ns, name } = parts.value
  const holding = new Set<string>()
  if (name) {
    for (const tag of vocabulary.value) {
      if (tag.name.toLowerCase().includes(name)) holding.add(tag.namespace)
    }
  }
  return namespaces.value.filter(item => !ns || item.toLowerCase().includes(ns) || holding.has(item))
})

const orderedNamespaces = computed(() => {
  const used = new Set(folderUsed.value.map(tag => tag.namespace))
  return [...visibleNamespaces.value].sort((a, b) => Number(used.has(b)) - Number(used.has(a)))
})

const visibleNsSet = computed(() => new Set(orderedNamespaces.value))
const scopedNsSet = computed(() => {
  if (pinned.value && visibleNsSet.value.has(activeNs.value)) return new Set([activeNs.value])
  return visibleNsSet.value
})

function pickNamespace(ns: string): void {
  activeNs.value = ns
  pinned.value = true
}

const currentNs = computed(() => {
  if (orderedNamespaces.value.includes(activeNs.value)) return activeNs.value
  return orderedNamespaces.value[0] || 'user'
})

const createNs = computed(() => (parts.value.colon ? parts.value.rawNs || currentNs.value : currentNs.value))
const searching = computed(() => parts.value.name.length > 0)

const candidates = computed<MediaTagItem[]>(() => {
  const { name } = parts.value
  const used = usedMap.value
  if (!name) {
    return vocabulary.value
      .filter(tag => tag.namespace === currentNs.value)
      .sort((a, b) => (used.get(keyOf(b)) ?? -1) - (used.get(keyOf(a)) ?? -1) || a.name.localeCompare(b.name))
  }
  return vocabulary.value
    .filter(tag => scopedNsSet.value.has(tag.namespace) && tag.name.toLowerCase().includes(name))
    .sort((a, b) => {
      const ap = a.name.toLowerCase().startsWith(name) ? 0 : 1
      const bp = b.name.toLowerCase().startsWith(name) ? 0 : 1
      if (ap !== bp) return ap - bp
      const au = used.has(keyOf(a)) ? 0 : 1
      const bu = used.has(keyOf(b)) ? 0 : 1
      if (au !== bu) return au - bu
      return a.namespace.localeCompare(b.namespace) || a.name.localeCompare(b.name)
    })
    .slice(0, 60)
})

/* ---------- 悬浮层定位 ---------- */

const pos = ref({ left: 0, bottom: 0, width: 0 })

function updatePos(): void {
  const element = input.value
  if (!element) return
  const rect = element.getBoundingClientRect()
  const width = Math.max(rect.width, 240)
  const left = Math.min(Math.max(8, rect.left), Math.max(8, window.innerWidth - width - 8))
  pos.value = { left, bottom: Math.max(8, window.innerHeight - rect.top + 6), width }
}

const popStyle = computed(() => ({
  left: `${pos.value.left}px`,
  bottom: `${pos.value.bottom}px`,
  width: `${pos.value.width}px`
}))

/* ---------- 数据 ---------- */

let loaded = false

async function load(): Promise<void> {
  if (loaded) return
  loading.value = true
  try {
    const [vocab, used] = await Promise.all([tagVocabulary(), directoryTags(props.path)])
    vocabulary.value = vocab
    folderUsed.value = used
    loaded = true
  } catch {
    // 未登录 / 无权限：当作空词表，用户仍可输入新标签
  } finally {
    loading.value = false
  }
}

watch(
  () => props.path,
  () => {
    loaded = false
    if (root.value) void load()
  }
)

watch(query, () => {
  pinned.value = false
})

/* ---------- 交互 ---------- */

/** 选中候选后清空输入并保持打开，便于连点批量。 */
function pick(tag: { namespace: string; name: string }): void {
  emit('select', { namespace: tag.namespace, name: tag.name })
  query.value = ''
}

function onEnter(): void {
  const { rawName, name } = parts.value
  if (!name) return
  const namespace = createNs.value
  const exact =
    candidates.value.find(tag => tag.namespace === namespace && tag.name.toLowerCase() === name) ??
    candidates.value.find(tag => tag.name.toLowerCase() === name)
  pick(exact ?? { namespace, name: rawName })
}

function onFocusOut(e: FocusEvent): void {
  const next = e.relatedTarget as Node | null
  if (next && root.value?.contains(next)) return
  window.setTimeout(() => {
    const active = document.activeElement
    if (active && root.value?.contains(active)) return
    emit('close')
  }, 0)
}

onMounted(async () => {
  window.addEventListener('resize', updatePos)
  window.addEventListener('scroll', updatePos, true)
  await nextTick()
  updatePos()
  input.value?.focus()
  void load()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updatePos)
  window.removeEventListener('scroll', updatePos, true)
})
</script>

<template>
  <div ref="root" class="tag-picker" @focusout="onFocusOut">
    <input
      ref="input"
      v-model="query"
      class="tag-picker__input"
      placeholder="搜索标签或分组；写「分组:名字」可限定分组"
      @keydown.enter.prevent="onEnter"
      @keydown.esc.prevent="emit('close')"
    />

    <Teleport to="body">
      <div class="tag-picker__pop" :style="popStyle" @mousedown.prevent>
        <div class="tag-picker__ns">
          <button
            v-for="ns in orderedNamespaces"
            :key="ns"
            type="button"
            class="tag-picker__ns-tab"
            :class="{ 'is-active': ns === currentNs }"
            :title="`只看 ${ns}`"
            @click="pickNamespace(ns)"
          >
            {{ ns }}
          </button>
          <span v-if="loading" class="tag-picker__loading">读取中…</span>
        </div>

        <div class="tag-picker__list">
          <TagCandidate
            v-for="tag in candidates"
            :key="`${tag.namespace}:${tag.name}`"
            :tag="tag"
            :used="isUsed(tag)"
            :count="usedCount(tag)"
            :show-namespace="searching"
            @pick="pick(tag)"
          />

          <p v-if="!loading && !candidates.length" class="tag-picker__empty">
            {{ searching ? `没有包含「${parts.rawName}」的标签，回车按「${createNs}」新建` : '这个分段还没有标签' }}
          </p>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped lang="scss">
.tag-picker {
  width: 100%;

  &__input {
    width: 100%;
    padding: 3px 8px;
    border: 1px solid var(--lolosia-color-primary-light-3, #c296cd);
    border-radius: 8px;
    outline: none;
    background: rgba(255, 255, 255, 0.9);
    color: var(--el-text-color-regular, #444);
    font: inherit;
    font-size: 12px;
  }

  &__pop {
    position: fixed;
    z-index: 3000;
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 8px;
    border: 1px solid rgba(255, 255, 255, 0.7);
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.92);
    box-shadow: 0 8px 24px 0 rgba(31, 38, 135, 0.18);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }

  &__ns {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px;
  }

  &__ns-tab {
    padding: 2px 8px;
    border: 1px solid transparent;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.04);
    color: var(--el-text-color-secondary, #888);
    font: inherit;
    font-size: 12px;
    line-height: 1.6;
    cursor: pointer;

    &:hover {
      color: var(--el-text-color-regular, #555);
    }

    &.is-active {
      border-color: var(--lolosia-color-primary, #a06bb0);
      background: var(--lolosia-color-primary, #a06bb0);
      color: #fff;
    }
  }

  &__loading {
    color: var(--el-text-color-secondary, #999);
    font-size: 12px;
  }

  &__list {
    display: flex;
    flex-wrap: wrap;
    align-content: flex-start;
    gap: 5px;
    max-height: 150px;
    overflow-x: hidden;
    overflow-y: auto;
  }

  &__empty {
    margin: 2px 0;
    color: var(--el-text-color-secondary, #999);
    font-size: 12px;
  }
}
</style>
