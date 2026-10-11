<script setup lang="ts">
// 足迹侧栏：地点模式列人工区域 + 自动热点，时间模式列拍摄会话。
import FootprintRow from './FootprintRow.vue'
import type { FootprintCluster, FootprintPeriod, FootprintRegion } from '../api'
import {
  clusterRange,
  DEFAULT_REGION_COLOR,
  fmtDateTime,
  fmtRadius,
  periodRange,
  thumbOf
} from '../lib'

defineOptions({ name: 'FootprintSidebar' })

const props = defineProps<{
  mode: 'place' | 'time'
  loading: boolean
  error: string
  regions: FootprintRegion[]
  clusters: FootprintCluster[]
  periods: FootprintPeriod[]
  selectedKey: string
  brokenThumbs: Set<string>
}>()

const emit = defineEmits<{
  'select-region': [region: FootprintRegion]
  'select-cluster': [cluster: FootprintCluster]
  'select-period': [period: FootprintPeriod]
  'edit-region': [region: FootprintRegion]
  broken: [path: string]
}>()

function thumbSrc(item: { path: string; exp: number; sig: string }): string {
  if (!item.path || props.brokenThumbs.has(item.path)) return ''
  return thumbOf(item, 128)
}
</script>

<template>
  <aside class="fp-side">
    <p v-if="error" class="fp-side__note is-error">{{ error }}</p>

    <template v-else-if="mode === 'place'">
      <p v-if="loading" class="fp-side__note">加载中…</p>
      <template v-else>
        <p v-if="!clusters.length && !regions.length" class="fp-side__note">
          还没有带 GPS 的照片。可以先在「文件管理」里跑一次本地索引，让它把 EXIF 里的定位抽出来。
        </p>

        <div v-if="regions.length" class="fp-side__group">我的区域</div>
        <FootprintRow
          v-for="region in regions"
          :key="`r-${region.id}`"
          :thumb-src="thumbSrc({ path: region.samplePath, exp: region.exp, sig: region.sig })"
          :title="region.name"
          :sub="`${region.count} 张 · 半径 ${fmtRadius(region.radiusM)}`"
          :active="selectedKey === `r:${region.id}`"
          :dot="region.color || DEFAULT_REGION_COLOR"
          editable
          @select="emit('select-region', region)"
          @edit="emit('edit-region', region)"
          @broken="emit('broken', region.samplePath)"
        />

        <div v-if="clusters.length" class="fp-side__group">自动热点</div>
        <FootprintRow
          v-for="cluster in clusters"
          :key="cluster.id"
          :thumb-src="thumbSrc({ path: cluster.samplePath, exp: cluster.exp, sig: cluster.sig })"
          :title="`${cluster.count} 张`"
          :sub="clusterRange(cluster)"
          :active="selectedKey === `c:${cluster.id}`"
          @select="emit('select-cluster', cluster)"
          @broken="emit('broken', cluster.samplePath)"
        />
      </template>
    </template>

    <template v-else>
      <p v-if="loading" class="fp-side__note">加载中…</p>
      <p v-else-if="!periods.length" class="fp-side__note">还没有带拍摄时间的照片。</p>
      <template v-else>
        <div class="fp-side__group">拍摄会话（{{ periods.length }}）</div>
        <FootprintRow
          v-for="period in periods"
          :key="period.id"
          :thumb-src="thumbSrc({ path: period.samplePath, exp: period.exp, sig: period.sig })"
          :title="periodRange(period)"
          :sub="`${period.count} 张 · ${fmtDateTime(period.startAt)}`"
          :active="selectedKey === period.id"
          @select="emit('select-period', period)"
          @broken="emit('broken', period.samplePath)"
        />
      </template>
    </template>
  </aside>
</template>

<style scoped lang="scss">
.fp-side {
  min-height: 0;
  padding: 8px;
  overflow-y: auto;
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.45);
  box-shadow: 0 4px 16px rgba(31, 38, 135, 0.12);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);

  &__note {
    margin: 0;
    padding: 14px 10px;
    color: var(--el-text-color-secondary, #909399);
    font-size: 13px;
    line-height: 1.7;

    &.is-error {
      color: var(--el-color-danger, #f56c6c);
    }
  }

  &__group {
    position: sticky;
    top: 0;
    z-index: 1;
    padding: 8px;
    background: rgba(255, 255, 255, 0.75);
    color: var(--el-text-color-secondary, #909399);
    font-size: 12px;
    font-weight: 600;
    backdrop-filter: blur(6px);
  }
}
</style>
