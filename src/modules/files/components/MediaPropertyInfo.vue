<script setup lang="ts">
import { computed } from 'vue'
import type { MediaDetail } from '../api'
import { formatDateTime, formatSize } from '../lib'

defineOptions({ name: 'MediaPropertyInfo' })

const props = defineProps<{ detail: MediaDetail }>()

function text(value?: string | number | null): string {
  return value === null || value === undefined || value === '' ? '—' : String(value)
}

const baseRows = computed(() => {
  const data = props.detail
  const rows = [
    { label: '路径', value: `/${data.path}` },
    { label: '类型', value: data.kind },
    { label: '大小', value: formatSize(data.size) },
    { label: '修改时间', value: formatDateTime(data.mtime) },
    { label: '像素尺寸', value: data.width && data.height ? `${data.width} × ${data.height}` : '—' },
    { label: '拍摄时间', value: data.takenAtLocal ?? formatDateTime(data.takenAt ?? 0) },
    { label: '评级来源', value: text(data.ratingSource) },
    { label: '备注来源', value: text(data.captionSource) }
  ]
  if (data.durationMs) rows.push({ label: '时长', value: `${Math.round(data.durationMs / 1000)} 秒` })
  return rows
})

const exifRows = computed(() => {
  const data = props.detail
  const rows = [
    { label: '机身', value: [data.cameraMake, data.cameraModel].filter(Boolean).join(' ') || '—' },
    { label: '镜头', value: text(data.lens) },
    { label: '光圈', value: data.aperture ? `f/${data.aperture}` : '—' },
    { label: '快门', value: text(data.exposureTime) },
    { label: 'ISO', value: text(data.iso) },
    { label: '焦距', value: data.focalLength ? `${data.focalLength} mm` : '—' },
    { label: '朝向', value: text(data.orientation) },
    { label: '时区偏移', value: data.takenAtOffsetMin === null ? '—' : `${data.takenAtOffsetMin} 分钟` }
  ]
  if (data.gps) {
    rows.push({ label: 'GPS', value: `${data.gps.latitude.toFixed(5)}, ${data.gps.longitude.toFixed(5)}` })
  }
  return rows
})
</script>

<template>
  <div class="property-info">
    <section class="property-info__section">
      <h4>通用</h4>
      <dl class="property-info__rows">
        <template v-for="row in baseRows" :key="row.label">
          <dt>{{ row.label }}</dt>
          <dd :title="row.value">{{ row.value }}</dd>
        </template>
      </dl>
    </section>

    <section class="property-info__section">
      <h4>元数据（EXIF）</h4>
      <dl class="property-info__rows">
        <template v-for="row in exifRows" :key="row.label">
          <dt>{{ row.label }}</dt>
          <dd :title="row.value">{{ row.value }}</dd>
        </template>
      </dl>
      <details v-if="detail.metadata.length" class="property-info__more">
        <summary>全部 {{ detail.metadata.length }} 项</summary>
        <dl class="property-info__rows">
          <div v-for="item in detail.metadata" :key="item.key" class="property-info__wide" :title="item.key">
            {{ item.key }}：{{ item.value }}
          </div>
        </dl>
      </details>
    </section>
  </div>
</template>

<style scoped lang="scss">
.property-info {
  &__section {
    margin-bottom: 16px;

    h4 {
      margin: 0 0 8px;
      color: var(--el-text-color-primary, #333);
      font-size: 13px;
      font-weight: 600;
    }
  }

  &__rows {
    display: grid;
    grid-template-columns: 92px 1fr;
    gap: 4px 10px;
    margin: 0;

    dt {
      color: var(--el-text-color-secondary, #999);
      word-break: break-all;
    }

    dd {
      margin: 0;
      color: var(--el-text-color-regular, #444);
      word-break: break-all;
    }
  }

  &__wide {
    grid-column: 1 / -1;
    color: var(--el-text-color-regular, #444);
    word-break: break-all;
  }

  &__more {
    margin-top: 8px;

    summary {
      color: var(--el-text-color-secondary, #999);
      font-size: 12px;
      cursor: pointer;
    }

    .property-info__rows {
      max-height: 220px;
      margin-top: 6px;
      overflow: auto;
    }
  }
}
</style>
