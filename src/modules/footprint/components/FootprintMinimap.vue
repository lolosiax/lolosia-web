<script setup lang="ts">
// 足迹小地图：按初始视口裁切的中国轮廓 + 省界 + 区域彩色点位 + 当前视口框。
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { CHINA_HEIGHT, CHINA_OUTLINE, CHINA_WIDTH, projectLonLat } from '../china-outline'
import { CHINA_PROVINCE_LINES } from '../china-provinces'
import type { FootprintRegion } from '../api'

defineOptions({ name: 'FootprintMinimap' })

const props = defineProps<{
  regions: FootprintRegion[]
  /** 当前激活的区域 id（波纹常驻）。 */
  activeId: number | null
  /** 侧栏 / 小地图上悬浮的区域 id（其余点位变灰）。 */
  hoveredId: number | null
  /** 主地图当前视口（WGS-84）。 */
  bounds: { minLat: number; minLon: number; maxLat: number; maxLon: number } | null
  /** 右侧照片浮层打开时，把缩略图让到浮层左边。 */
  shifted: boolean
}>()

const emit = defineEmits<{
  select: [region: FootprintRegion]
  hover: [id: number | null]
}>()

interface Marker {
  id: number
  region: FootprintRegion
  x: number
  y: number
  color: string
  r: number
  active: boolean
  hovered: boolean
  dim: boolean
  rank: number
}

interface GeoBox {
  minLat: number
  minLon: number
  maxLat: number
  maxLon: number
}

interface PixelBox {
  x: number
  y: number
  w: number
  h: number
}

const CARD_ASPECT = CHINA_WIDTH / CHINA_HEIGHT
const PADDING_RATIO = 0.06
/** 点位半径按屏幕像素固定，不随取景窗口缩放。 */
const RADIUS_PX = { active: 7, hovered: 6.4, normal: 4.8, dim: 4.2 }
const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max)

/** 小地图 SVG 的实际渲染宽度，用于把屏幕像素换算成 SVG 坐标单位。 */
const svgEl = ref<SVGSVGElement | null>(null)
const svgWidth = ref(226)
let observer: ResizeObserver | null = null

onMounted(() => {
  if (!svgEl.value) return
  svgWidth.value = svgEl.value.clientWidth || svgWidth.value
  observer = new ResizeObserver(entries => {
    const width = entries[0]?.contentRect.width
    if (width) svgWidth.value = width
  })
  observer.observe(svgEl.value)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
})

/** 小地图的取景基准：进页面时的第一个主地图视口，之后不再跟随缩放。 */
const initialBounds = ref<GeoBox | null>(null)
watch(
  () => props.bounds,
  value => {
    if (value && !initialBounds.value) initialBounds.value = { ...value }
  },
  { immediate: true }
)

/** 取景范围：初始视口 ∪ 全部区域点，再留一点边。 */
const windowGeo = computed<GeoBox | null>(() => {
  const base = initialBounds.value
  if (!base) return null
  let { minLat, minLon, maxLat, maxLon } = base
  for (const region of props.regions) {
    minLat = Math.min(minLat, region.lat)
    maxLat = Math.max(maxLat, region.lat)
    minLon = Math.min(minLon, region.lon)
    maxLon = Math.max(maxLon, region.lon)
  }
  const padLat = (maxLat - minLat) * PADDING_RATIO || 0.1
  const padLon = (maxLon - minLon) * PADDING_RATIO || 0.1
  return { minLat: minLat - padLat, maxLat: maxLat + padLat, minLon: minLon - padLon, maxLon: maxLon + padLon }
})

/** 取景窗口的 SVG 像素范围（与轮廓同一投影），并补成卡片的宽高比。 */
const windowPx = computed<PixelBox>(() => {
  const geo = windowGeo.value
  if (!geo) return { x: 0, y: 0, w: CHINA_WIDTH, h: CHINA_HEIGHT }
  const [x1, y1] = projectLonLat(geo.minLon, geo.maxLat)
  const [x2, y2] = projectLonLat(geo.maxLon, geo.minLat)
  let x = Math.min(x1, x2)
  let y = Math.min(y1, y2)
  let w = Math.max(Math.abs(x2 - x1), 1)
  let h = Math.max(Math.abs(y2 - y1), 1)
  if (w / h < CARD_ASPECT) {
    const next = h * CARD_ASPECT
    x -= (next - w) / 2
    w = next
  } else {
    const next = w / CARD_ASPECT
    y -= (next - h) / 2
    h = next
  }
  return { x, y, w, h }
})

const viewBox = computed(() => `${windowPx.value.x} ${windowPx.value.y} ${windowPx.value.w} ${windowPx.value.h}`)

/** 1 屏幕像素对应的 SVG 用户单位。 */
const unitPerPx = computed(() => windowPx.value.w / Math.max(svgWidth.value, 1))

/** 区域点：按「灰 → 普通 → 悬浮 → 激活」排序，悬浮和激活的永远画在最上层。 */
const markers = computed<Marker[]>(() => {
  const box = windowPx.value
  const unit = unitPerPx.value
  return props.regions
    .map(region => {
      const [x, y] = projectLonLat(region.lon, region.lat)
      const active = region.id === props.activeId
      const hovered = region.id === props.hoveredId
      const dim = props.hoveredId !== null && !hovered && !active
      const radiusPx = active ? RADIUS_PX.active : hovered ? RADIUS_PX.hovered : dim ? RADIUS_PX.dim : RADIUS_PX.normal
      const r = radiusPx * unit
      const rank = active ? 3 : hovered ? 2 : dim ? 0 : 1
      return { id: region.id, region, x, y, color: region.color || '#e0703c', r, active, hovered, dim, rank }
    })
    .filter(marker => marker.x >= box.x - 4 && marker.x <= box.x + box.w + 4)
    .filter(marker => marker.y >= box.y - 4 && marker.y <= box.y + box.h + 4)
    .sort((a, b) => a.rank - b.rank)
})

const activeMarker = computed(() => markers.value.find(marker => marker.active) ?? null)

/** 选中点的半透明十字线：只覆盖缩略图画面，不伸到画面外。 */
const crossLines = computed(() => {
  if (!activeMarker.value) return null
  const box = windowPx.value
  return { x1: box.x, x2: box.x + box.w, y1: box.y, y2: box.y + box.h }
})

/** 视口框：经纬度 → SVG 坐标后裁到取景窗口内；完全移出视野就不画。 */
const viewportRect = computed(() => {
  const bounds = props.bounds
  if (!bounds) return null
  const box = windowPx.value
  const [x1, y1] = projectLonLat(bounds.minLon, bounds.maxLat)
  const [x2, y2] = projectLonLat(bounds.maxLon, bounds.minLat)
  const left = clamp(Math.min(x1, x2), box.x, box.x + box.w)
  const right = clamp(Math.max(x1, x2), box.x, box.x + box.w)
  const top = clamp(Math.min(y1, y2), box.y, box.y + box.h)
  const bottom = clamp(Math.max(y1, y2), box.y, box.y + box.h)
  // 放大到街区级别时真实取景框不足 1px，给个最小尺寸让它仍然可见
  const cx = (left + right) / 2
  const cy = (top + bottom) / 2
  const minSide = 4
  const finalLeft = right - left < minSide ? clamp(cx - minSide / 2, box.x, box.x + box.w) : left
  const finalRight = right - left < minSide ? clamp(cx + minSide / 2, box.x, box.x + box.w) : right
  const finalTop = bottom - top < minSide ? clamp(cy - minSide / 2, box.y, box.y + box.h) : top
  const finalBottom = bottom - top < minSide ? clamp(cy + minSide / 2, box.y, box.y + box.h) : bottom
  if (finalRight - finalLeft < 1 || finalBottom - finalTop < 1) return null
  return { x: finalLeft, y: finalTop, w: finalRight - finalLeft, h: finalBottom - finalTop }
})
</script>

<template>
  <div class="fp-mini" :class="{ 'is-shifted': shifted }" @mouseleave="emit('hover', null)">
    <svg
      ref="svgEl"
      class="fp-mini__svg"
      :viewBox="viewBox"
      role="img"
      aria-label="区域分布缩略图"
    >
      <path class="fp-mini__land" :d="CHINA_OUTLINE" />
      <path class="fp-mini__province" :d="CHINA_PROVINCE_LINES" />
      <rect
        v-if="viewportRect"
        class="fp-mini__view"
        :x="viewportRect.x"
        :y="viewportRect.y"
        :width="viewportRect.w"
        :height="viewportRect.h"
        rx="2"
      />
      <g v-if="activeMarker && crossLines" class="fp-mini__cross">
        <line
          :x1="crossLines.x1"
          :y1="activeMarker.y"
          :x2="crossLines.x2"
          :y2="activeMarker.y"
          vector-effect="non-scaling-stroke"
        />
        <line
          :x1="activeMarker.x"
          :y1="crossLines.y1"
          :x2="activeMarker.x"
          :y2="crossLines.y2"
          vector-effect="non-scaling-stroke"
        />
      </g>
      <g v-if="activeMarker" class="fp-mini__ripples">
        <circle :cx="activeMarker.x" :cy="activeMarker.y" :r="activeMarker.r" :stroke="activeMarker.color" vector-effect="non-scaling-stroke" />
        <circle :cx="activeMarker.x" :cy="activeMarker.y" :r="activeMarker.r" :stroke="activeMarker.color" class="is-delay-1" vector-effect="non-scaling-stroke" />
        <circle :cx="activeMarker.x" :cy="activeMarker.y" :r="activeMarker.r" :stroke="activeMarker.color" class="is-delay-2" vector-effect="non-scaling-stroke" />
      </g>
      <g
        v-for="marker in markers"
        :key="marker.id"
        class="fp-mini__marker"
        :class="{ 'is-active': marker.active, 'is-dim': marker.dim }"
        @click="emit('select', marker.region)"
        @mouseenter="emit('hover', marker.id)"
        @mouseleave="emit('hover', null)"
      >
        <title>{{ marker.region.name }}</title>
        <circle
          :cx="marker.x"
          :cy="marker.y"
          :r="marker.r"
          :fill="marker.dim ? '#b9b4c8' : marker.color"
          vector-effect="non-scaling-stroke"
        />
      </g>
    </svg>
  </div>
</template>

<style scoped lang="scss">
.fp-mini {
  position: absolute;
  z-index: 4;
  right: 16px;
  bottom: 16px;
  width: 240px;
  padding: 6px;
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.82);
  box-shadow: 0 8px 26px rgba(31, 38, 135, 0.18);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  transition: right 0.25s ease;

  /* 右侧照片浮层打开时挪到它左边 */
  &.is-shifted {
    right: 470px;
  }

  &__svg {
    display: block;
    width: 100%;
    height: auto;
    overflow: hidden;
  }

  &__land {
    fill: #f0eaf6;
    stroke: #c9bad8;
    stroke-width: 1;
    stroke-linejoin: round;
  }

  /* 省界：国界一半粗，同色 */
  &__province {
    fill: none;
    stroke: #c9bad8;
    stroke-width: 0.5;
    stroke-linejoin: round;
  }

  &__view {
    fill: rgba(141, 106, 160, 0.12);
    stroke: #8d6aa0;
    stroke-width: 1.2;
    stroke-dasharray: 3 2;
  }

  /* 选中点的半透明十字线，允许伸出卡片 */
  &__cross {
    opacity: 0.5;
    stroke: #5b4f66;
    pointer-events: none;

    line {
      stroke-width: 1;
    }
  }

  &__marker {
    cursor: pointer;
    transition: opacity 0.18s ease;

    circle {
      stroke: #fff;
      stroke-width: 1.4;
      transition: fill 0.18s ease, stroke-width 0.18s ease;
    }

    &:hover circle {
      stroke-width: 2;
    }

    &.is-dim {
      opacity: 0.5;
    }

    &.is-active circle {
      stroke-width: 1.8;
    }
  }

  &__ripples {
    pointer-events: none;

    circle {
      fill: none;
      stroke-width: 1.3;
      opacity: 0;
      transform-box: fill-box;
      transform-origin: center;
      animation: fp-mini-ripple 2.7s ease-out infinite;
    }

    .is-delay-1 {
      animation-delay: 0.9s;
    }

    .is-delay-2 {
      animation-delay: 1.8s;
    }
  }
}

@keyframes fp-mini-ripple {
  0% {
    opacity: 0.55;
    transform: scale(0.5);
  }

  70% {
    opacity: 0.16;
  }

  100% {
    opacity: 0;
    transform: scale(3.6);
  }
}
</style>
