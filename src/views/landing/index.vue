<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getRoot } from '@/utils/request'

const router = useRouter()
const bgCanvas = ref<HTMLCanvasElement | null>(null)
const mouseX = ref(0)
const mouseY = ref(0)

const hoveringImage = ref<string>()
const hoveringImage0 = ref<string>()

const kigurumiCardBg = computed(
  () => `${getRoot()}/res/resources/landing/d5391250-3388-4a6e-9bec-37e7682f3152.png?webp`
)
const lolosiaCardBg = computed(() => `${getRoot()}/res/resources/landing/Image_1775403972460_494.png?webp`)
const lolosiaHoverBg = computed(() => `${getRoot()}/res/resources/landing/Image_1775402728678_548.png?webp`)

interface CardItem {
  id: number
  title: string
  subtitle: string
  description: string
  icon: string
  bgClass: string
  path?: string
  external?: string
  bgImage?: string | Ref<string>
  hoverImage?: string | Ref<string>
}

const cards: CardItem[] = reactive([
  {
    id: 1,
    title: '软件外包服务',
    subtitle: 'Software Outsourcing',
    description: '定制化解决方案 · 赋能商业创新',
    icon: '⊞',
    bgClass: 'bg-card-1',
    path: '/'
  },
  {
    id: 2,
    title: 'OVR叠加层应用',
    subtitle: 'OVR Overlay Apps',
    description: '虚拟与现实 · 无缝融合体验',
    icon: '◈',
    bgClass: 'bg-card-2',
    path: '/'
  },
  {
    id: 3,
    title: 'VRC Kigurumi社团',
    subtitle: 'VRC Kigurumi Club',
    description: '二次元角色 · 沉浸式社交',
    icon: '✦',
    bgClass: 'bg-card-3',
    external: 'https://vrc.group/VRCKIG.4693',
    bgImage: kigurumiCardBg
  },
  {
    id: 4,
    title: '洛洛希雅',
    subtitle: 'Lolosia',
    description: '虚拟偶像个人主页 · 进入梦幻世界',
    icon: '♡',
    bgClass: 'bg-card-4',
    path: '/lolosia',
    bgImage: lolosiaCardBg,
    hoverImage: lolosiaHoverBg
  }
])

watch(hoveringImage, (it) => {
  if (it) {
    hoveringImage0.value = hoveringImage.value
  }
})

const leftCards = computed(() => cards.slice(0, 3))
const rightCard = computed(() => cards[3])

function handleCardClick(card: CardItem) {
  if (card.path) {
    router.push(card.path)
  } else if (card.external) {
    window.open(card.external, '_blank')
  }
}

// ── Canvas Animated Background ──
let animationId = 0

function initBgCanvas() {
  const canvas = bgCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  let w = 0,
    h = 0
  function resize() {
    w = canvas.width = window.innerWidth
    h = canvas.height = window.innerHeight
  }
  resize()
  window.addEventListener('resize', resize)

  const particles: { x: number; y: number; vx: number; vy: number; r: number; alpha: number }[] = []
  const count = 50
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.2,
      r: Math.random() * 2.5 + 0.5,
      alpha: Math.random() * 0.15 + 0.03
    })
  }

  function draw() {
    ctx.clearRect(0, 0, w, h)

    // Light pastel gradient background
    const grad = ctx.createRadialGradient(w * 0.3, h * 0.2, 0, w * 0.5, h * 0.4, w * 0.9)
    grad.addColorStop(0, 'rgba(235, 220, 245, 1)')
    grad.addColorStop(0.4, 'rgba(245, 235, 250, 1)')
    grad.addColorStop(0.8, 'rgba(250, 245, 252, 1)')
    grad.addColorStop(1, 'rgba(255, 250, 255, 1)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)

    // Floating particles (soft purple)
    for (const p of particles) {
      p.x += p.vx
      p.y += p.vy
      if (p.x < 0) p.x = w
      if (p.x > w) p.x = 0
      if (p.y < 0) p.y = h
      if (p.y > h) p.y = 0

      ctx.beginPath()
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(194, 150, 205, ${p.alpha})`
      ctx.fill()
    }

    // Soft connection lines near mouse
    const mx = mouseX.value,
      my = mouseY.value
    if (mx > 0 && my > 0) {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 100) {
            const alpha = (1 - dist / 100) * 0.06
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(194, 150, 205, ${alpha})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }
    }

    animationId = requestAnimationFrame(draw)
  }
  draw()

  return () => {
    cancelAnimationFrame(animationId)
    window.removeEventListener('resize', resize)
  }
}

let bgCleanup: (() => void) | null = null

function handleMouseMove(e: MouseEvent) {
  mouseX.value = e.clientX
  mouseY.value = e.clientY
}

onMounted(() => {
  bgCleanup = initBgCanvas()
  window.addEventListener('mousemove', handleMouseMove)
})

onUnmounted(() => {
  if (bgCleanup) bgCleanup()
  window.removeEventListener('mousemove', handleMouseMove)
})
</script>

<template>
  <div class="portal-page" @mousemove="handleMouseMove">
    <!-- Canvas Background -->
    <canvas ref="bgCanvas" class="bg-canvas" />

    <!-- Decorative top-right accent blob -->
    <div class="blob blob-1" />
    <div class="blob blob-2" />

    <!-- Main Content -->
    <div class="content-wrapper">
      <!-- Hover fullscreen background overlay -->
      <Transition name="hover-bg">
        <div v-if="hoveringImage" class="hover-bg-overlay" :style="{ backgroundImage: `url(${hoveringImage0})` }" />
      </Transition>
      <!-- ===== Left Panel ===== -->
      <div class="left-panel">
        <div class="welcome-container">
          <div class="brand-badge">
            <span class="badge-dot" />
            <span>NAVIGATION</span>
          </div>

          <h1 class="main-title">
            <span class="title-line">想去</span>
            <span class="title-line accent">哪里？</span>
          </h1>

          <p class="subtitle-text">选择你的目的地，开启一段旅程</p>

          <div class="divider">
            <span class="divider-icon">◇</span>
          </div>

          <div class="nav-hints">
            <div v-for="card in leftCards" :key="card.id" class="hint-item">
              <span class="hint-icon">{{ card.icon }}</span>
              <span class="hint-label">{{ card.title }}</span>
            </div>
            <div class="hint-item accent">
              <span class="hint-icon">♡</span>
              <span class="hint-label">洛洛希雅</span>
            </div>
          </div>

          <div class="scroll-prompt">
            <span class="scroll-text">选择一个入口</span>
            <span class="scroll-arrow">↓</span>
          </div>
        </div>

        <div class="copyright-bar">
          <span>© 2026 Lolosia. All rights reserved.</span>
        </div>
      </div>

      <!-- ===== Right Panel: Slanted Parallelogram Grid ===== -->
      <div class="right-panel">
        <div class="skew-container">
          <div class="card-grid">
            <!-- Left Column: 3 cards -->
            <div class="grid-col col-small">
              <div
                v-for="card in leftCards"
                :key="card.id"
                class="card-item"
                @click="handleCardClick(card)"
                @mouseenter="hoveringImage = card.hoverImage || card.bgImage"
                @mouseleave="hoveringImage = undefined"
              >
                <div class="card-border">
                  <div class="card-content">
                    <!-- Decorative background image layer -->
                    <div
                      class="card-bg"
                      :class="card.bgClass"
                      :style="{
                        backgroundImage: card.bgImage ? `url(${card.bgImage})` : undefined,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }"
                    />

                    <!-- Manga-style scatter gradient (bottom portion) -->
                    <div class="card-scatter" />

                    <!-- Card content -->
                    <div class="card-content">
                      <div class="card-icon-frame">
                        <span class="card-icon">{{ card.icon }}</span>
                      </div>
                      <div class="card-title">{{ card.title }}</div>
                      <div class="card-subtitle">{{ card.subtitle }}</div>
                    </div>

                    <!-- Hover glow -->
                    <div class="card-shine" />
                  </div>
                </div>
              </div>
            </div>

            <!-- Right Column: 1 large card (洛洛希雅) -->
            <div class="grid-col col-large">
              <div
                class="card-item card-large"
                @click="handleCardClick(rightCard)"
                @mouseenter="hoveringImage = rightCard.hoverImage || rightCard.bgImage"
                @mouseleave="hoveringImage = undefined"
              >
                <div class="card-border">
                  <div class="card-content">
                    <div
                      class="card-bg"
                      :class="rightCard.bgClass"
                      :style="{
                        backgroundImage: `url(${lolosiaCardBg})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }"
                    />
                    <div class="card-scatter" />

                    <div class="card-content">
                      <div class="card-avatar">
                        <div class="avatar-ring">
                          <span class="avatar-icon">{{ rightCard.icon }}</span>
                        </div>
                      </div>
                      <div class="card-title">{{ rightCard.title }}</div>
                      <div class="card-subtitle">{{ rightCard.subtitle }}</div>
                      <div class="card-description">{{ rightCard.description }}</div>
                      <div class="card-cta">
                        <span>进入主页</span>
                        <span class="cta-arrow">→</span>
                      </div>
                    </div>

                    <div class="card-shine" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
// ── Design Tokens ──
$primary: #c296cd;
$primary-light: #d2b1db;
$primary-lighter: #dfcde6;
$primary-dark: #a480ab;
$bg-light: #faf5ff;
$text-dark: #2d1b3a;
$text-muted: #8a7a94;
$card-radius: 16px;

// ═══════════════════════════
//  ROOT: .portal-page
// ═══════════════════════════
.portal-page {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  background: $bg-light;
  color: $text-dark;

  // ── BG Canvas ──
  .bg-canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
    pointer-events: none;
  }

  // ── Decorative Blobs ──
  .blob {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    z-index: 0;
    pointer-events: none;

    &-1 {
      width: 600px;
      height: 600px;
      top: -200px;
      right: -150px;
      background: radial-gradient(circle, rgba($primary-light, 0.3), transparent 70%);
    }
    &-2 {
      width: 400px;
      height: 400px;
      bottom: -100px;
      left: 10%;
      background: radial-gradient(circle, rgba($primary-lighter, 0.25), transparent 70%);
    }
  }

  // ── Content Wrapper ──
  .content-wrapper {
    position: relative;
    z-index: 1;
    display: flex;
    width: 100%;
    height: 100%;

    // Hover fullscreen overlay
    .hover-bg-overlay {
      position: absolute;
      inset: 0;
      z-index: 0;
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      pointer-events: none;
    }

    // ═══════════════════════════
    //  LEFT PANEL
    // ═══════════════════════════
    .left-panel {
      flex: 0 0 48%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 60px 50px 40px;
      position: relative;

      .welcome-container {
        max-width: 400px;
        margin: 0 auto;

        .brand-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 10px;
          letter-spacing: 4px;
          text-transform: uppercase;
          color: $primary-dark;
          border: 1px solid rgba($primary, 0.25);
          padding: 6px 16px;
          border-radius: 20px;
          margin-bottom: 28px;
          background: rgba(255, 255, 255, 0.5);
          backdrop-filter: blur(8px);

          .badge-dot {
            width: 5px;
            height: 5px;
            border-radius: 50%;
            background: $primary;
          }
        }

        .main-title {
          font-size: 60px;
          font-weight: 800;
          line-height: 1.1;
          margin: 0 0 14px;

          .title-line {
            display: block;
            color: $text-dark;

            &.accent {
              font-size: 72px;
              background: linear-gradient(135deg, $primary 0%, lighten($primary, 12%) 50%, $primary-dark 100%);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
              position: relative;

              &::after {
                content: '';
                position: absolute;
                bottom: 4px;
                left: 0;
                width: 100%;
                height: 4px;
                background: linear-gradient(90deg, $primary, transparent);
                border-radius: 2px;
                opacity: 0.35;
              }
            }
          }
        }

        .subtitle-text {
          font-size: 15px;
          color: $text-muted;
          margin: 0 0 32px;
          font-weight: 400;
          letter-spacing: 0.3px;
        }

        .divider {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 32px;

          &::before,
          &::after {
            content: '';
            flex: 1;
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba($primary, 0.3), transparent);
          }

          .divider-icon {
            color: rgba($primary, 0.4);
            font-size: 12px;
          }
        }

        .nav-hints {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 44px;

          .hint-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 10px 14px;
            border-radius: 10px;
            cursor: default;
            transition: all 0.3s ease;
            background: rgba(255, 255, 255, 0.5);
            border: 1px solid rgba($primary, 0.1);

            .hint-icon {
              font-size: 16px;
              width: 30px;
              height: 30px;
              display: flex;
              align-items: center;
              justify-content: center;
              border-radius: 8px;
              background: rgba($primary, 0.1);
              color: $primary;
              flex-shrink: 0;
            }

            .hint-label {
              font-size: 13px;
              color: $text-muted;
              font-weight: 500;
            }

            &.accent {
              background: rgba($primary, 0.1);
              border-color: rgba($primary, 0.2);

              .hint-icon {
                background: rgba($primary, 0.2);
                color: $primary-dark;
              }
              .hint-label {
                color: $text-dark;
                font-weight: 600;
              }
            }
          }
        }

        .scroll-prompt {
          display: flex;
          align-items: center;
          gap: 10px;

          .scroll-text {
            font-size: 12px;
            color: rgba($text-muted, 0.6);
            letter-spacing: 1px;
          }
          .scroll-arrow {
            font-size: 14px;
            color: rgba($primary, 0.5);
            animation: bounce-down 2s ease-in-out infinite;
          }
        }
      }

      .copyright-bar {
        position: absolute;
        bottom: 20px;
        left: 50px;
        font-size: 11px;
        color: rgba($text-muted, 0.4);
        letter-spacing: 0.5px;
      }
    }

    // ═══════════════════════════
    //  RIGHT PANEL — Slanted Grid
    // ═══════════════════════════
    .right-panel {
      flex: 0 0 42%;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px 60px 40px 20px;
      position: relative;
      overflow: clip;
      overflow-clip-margin: 30px;

      .skew-container {
        width: 100%;
        height: 100%;
        max-height: 620px;
        transform-origin: center center;
        position: relative;

        .card-grid {
          display: grid;
          grid-template-columns: 1fr 1.15fr;
          gap: 16px;
          height: 100%;
          transform-origin: center center;

          .grid-col {
            display: flex;
            flex-direction: column;
            gap: 16px;
            transform: skewX(-5deg);

            &.col-small {
              justify-content: space-between;
            }
            &.col-large {
              height: 100%;
            }

            // ── CARDS (shared) ──
            .card-item {
              position: relative;
              overflow: hidden;
              cursor: pointer;
              transition: all 0.45s cubic-bezier(0.23, 1, 0.32, 1);
              transform: translateY(0) scale(1);
              min-height: 0;

              &:hover {
                transform: translateY(-5px) scale(1.02);
                z-index: 5;

                .card-shine {
                  opacity: 1;
                }
                .card-bg {
                  transform: scale(1.06);
                }
                .card-cta {
                  gap: 12px;
                  .cta-arrow {
                    transform: translateX(4px);
                    opacity: 1;
                  }
                }
                .card-avatar .avatar-ring {
                  transform: scale(1.08);
                  border-color: rgba(255, 255, 255, 0.5);
                  box-shadow: 0 0 50px rgba($primary, 0.3);
                }
              }

              &:active {
                transform: translateY(-2px) scale(0.98);
              }

              .card-border {
                border-radius: $card-radius;
                overflow: hidden;
                height: 100%;
                width: 100%;

                // Outer card-content (skew wrapper)
                .card-content {
                  height: 100%;
                  width: 100%;
                  transform: skewX(3deg);
                }

                // ── Card Background (CSS art) ──
                .card-bg {
                  position: absolute;
                  inset: -5%;
                  z-index: 0;
                  transition: transform 0.6s cubic-bezier(0.23, 1, 0.32, 1);
                  overflow: hidden;

                  &.bg-card-1 {
                    background: linear-gradient(135deg, rgba(102, 126, 234, 0.5) 0%, rgba(118, 75, 162, 0.35) 100%);
                    &::after {
                      content: '';
                      position: absolute;
                      inset: 0;
                      background:
                        repeating-linear-gradient(
                          0deg,
                          transparent,
                          transparent 20px,
                          rgba(255, 255, 255, 0.06) 20px,
                          rgba(255, 255, 255, 0.06) 21px
                        ),
                        repeating-linear-gradient(
                          90deg,
                          transparent,
                          transparent 20px,
                          rgba(255, 255, 255, 0.06) 20px,
                          rgba(255, 255, 255, 0.06) 21px
                        );
                    }
                  }
                  &.bg-card-2 {
                    background: linear-gradient(135deg, rgba(240, 147, 251, 0.45) 0%, rgba(245, 87, 108, 0.3) 100%);
                    &::after {
                      content: '';
                      position: absolute;
                      inset: 0;
                      background:
                        radial-gradient(ellipse at 20% 70%, rgba(255, 255, 255, 0.12) 0%, transparent 50%),
                        radial-gradient(ellipse at 80% 30%, rgba(255, 255, 255, 0.08) 0%, transparent 40%);
                    }
                  }
                  &.bg-card-3 {
                    background: linear-gradient(135deg, rgba(79, 172, 254, 0.45) 0%, rgba(0, 242, 254, 0.25) 100%);
                    &::after {
                      content: '';
                      position: absolute;
                      inset: 0;
                      background: repeating-conic-gradient(
                        from 45deg,
                        rgba(255, 255, 255, 0.04) 0deg 10deg,
                        transparent 10deg 20deg
                      );
                    }
                  }
                  &.bg-card-4 {
                    background: linear-gradient(135deg, rgba($primary, 0.55) 0%, rgba($primary-dark, 0.35) 100%);
                    &::after {
                      content: '';
                      position: absolute;
                      inset: 0;
                      background:
                        radial-gradient(circle at 30% 40%, rgba(255, 255, 255, 0.15) 0%, transparent 40%),
                        radial-gradient(circle at 70% 60%, rgba(255, 255, 255, 0.1) 0%, transparent 30%);
                    }
                  }
                }

                // ── Manga-style Scatter Dots ──
                .card-scatter {
                  position: absolute;
                  bottom: 0;
                  left: 0;
                  width: 100%;
                  height: 58%;
                  z-index: 1;
                  pointer-events: none;
                  overflow: hidden;
                  background:
                    radial-gradient(circle, rgba(255, 255, 255, 0.5) 0.4px, transparent 0.4px) repeat 0 0 / 8px 8px,
                    radial-gradient(circle, rgba(255, 255, 255, 0.5) 0.7px, transparent 0.7px) repeat 0 8% / 14px 14px,
                    radial-gradient(circle, rgba(255, 255, 255, 0.55) 1.1px, transparent 1.1px) repeat 0 20% / 22px 22px,
                    radial-gradient(circle, rgba(255, 255, 255, 0.6) 1.6px, transparent 1.6px) repeat 0 36% / 32px 32px,
                    radial-gradient(circle, rgba(255, 255, 255, 0.65) 2.2px, transparent 2.2px) repeat 0 55% / 44px 44px,
                    radial-gradient(circle, rgba(255, 255, 255, 0.7) 3px, transparent 3px) repeat 0 78% / 58px 58px;
                  mask-image: linear-gradient(
                    to bottom,
                    transparent 5%,
                    rgba(0, 0, 0, 0.25) 15%,
                    rgba(0, 0, 0, 0.6) 35%,
                    black 60%,
                    black 100%
                  );
                  -webkit-mask-image: linear-gradient(
                    to bottom,
                    transparent 5%,
                    rgba(0, 0, 0, 0.25) 15%,
                    rgba(0, 0, 0, 0.6) 35%,
                    black 60%,
                    black 100%
                  );
                }

                // Inner content container
                .card-content {
                  position: relative;
                  z-index: 3;
                  padding: 18px 20px;
                  display: flex;
                  flex-direction: column;
                  height: 100%;
                }

                // ── Card Shine ──
                .card-shine {
                  position: absolute;
                  inset: 0;
                  z-index: 4;
                  opacity: 0;
                  transition: opacity 0.5s ease;
                  pointer-events: none;
                  border-radius: $card-radius;
                  background: linear-gradient(135deg, transparent 30%, rgba(255, 255, 255, 0.12) 50%, transparent 70%);
                  box-shadow: inset 0 0 40px rgba(255, 255, 255, 0.05);
                }
              }
            }

            // ── SMALL CARDS ──
            &.col-small .card-item {
              flex: 1;
              min-height: 0;

              .card-content {
                padding: 14px 18px;
                justify-content: flex-start;
                padding-bottom: 40px;
              }

              .card-icon-frame {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 36px;
                height: 36px;
                border-radius: 10px;
                background: rgba(255, 255, 255, 0.25);
                backdrop-filter: blur(4px);
                margin-bottom: 6px;
                flex-shrink: 0;

                .card-icon {
                  font-size: 18px;
                  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
                }
              }

              .card-title {
                font-size: 14px;
                font-weight: 700;
                letter-spacing: 0.5px;
                margin-bottom: 2px;
                color: #fff;
                text-shadow: 0 1px 6px rgba(0, 0, 0, 0.2);
              }

              .card-subtitle {
                font-size: 9px;
                color: rgba(255, 255, 255, 0.6);
                letter-spacing: 0.5px;
                text-transform: uppercase;
              }
            }

            // ── LARGE CARD (洛洛希雅) ──
            &.col-large .card-item {
              height: 100%;

              .card-content {
                align-items: center;
                justify-content: center;
                text-align: center;
                gap: 6px;
                padding: 28px 22px 50px;
              }

              .card-avatar {
                margin-bottom: 10px;

                .avatar-ring {
                  width: 68px;
                  height: 68px;
                  border-radius: 50%;
                  background: rgba(255, 255, 255, 0.18);
                  backdrop-filter: blur(8px);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  border: 2px solid rgba(255, 255, 255, 0.25);
                  box-shadow: 0 0 30px rgba($primary, 0.25);
                  transition: all 0.4s ease;

                  .avatar-icon {
                    font-size: 28px;
                    filter: drop-shadow(0 0 8px rgba($primary, 0.3));
                  }
                }
              }

              .card-title {
                font-size: 24px;
                font-weight: 800;
                letter-spacing: 3px;
                color: #fff;
                text-shadow: 0 2px 5px rgba(0, 0, 0, 0.75);
              }

              .card-subtitle {
                font-size: 11px;
                color: rgba(255, 255, 255, 0.55);
                letter-spacing: 2px;
                text-transform: uppercase;
                margin-bottom: 2px;
                text-shadow: 0 2px 5px rgba(0, 0, 0, 0.75);
              }

              .card-description {
                font-size: 12px;
                color: rgba(255, 255, 255, 0.45);
                line-height: 1.5;
                max-width: 220px;
                font-weight: 300;
                text-shadow: 0 2px 5px rgba(0, 0, 0, 0.75);
              }

              .card-cta {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                margin-top: 14px;
                padding: 7px 22px;
                border-radius: 20px;
                background: rgba(255, 255, 255, 0.12);
                backdrop-filter: blur(4px);
                border: 1px solid rgba(255, 255, 255, 0.18);
                font-size: 12px;
                font-weight: 500;
                letter-spacing: 1px;
                transition: all 0.3s ease;
                color: rgba(255, 255, 255, 0.85);

                .cta-arrow {
                  transition: all 0.3s ease;
                  opacity: 0.5;
                }
              }
            }
          }
        }
      }
    }
  }
}

// ═══════════════════════════
//  ANIMATIONS
// ═══════════════════════════
@keyframes bounce-down {
  0%,
  100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  50% {
    transform: translateY(6px);
    opacity: 1;
  }
}

// ═══════════════════════════
//  TRANSITION: hover-bg
// ═══════════════════════════
.hover-bg-enter-active,
.hover-bg-leave-active {
  transition: opacity 0.8s ease;
}
.hover-bg-enter-from,
.hover-bg-leave-to {
  opacity: 0;
}

// ═══════════════════════════
//  RESPONSIVE
// ═══════════════════════════
@media (max-width: 1024px) {
  .portal-page .content-wrapper {
    flex-direction: column;

    .left-panel {
      flex: 0 0 auto;
      padding: 36px 30px 16px;
      height: 38vh;
      justify-content: flex-start;
    }
    .right-panel {
      flex: 0 0 auto;
      padding: 10px 30px 30px;
      height: 62vh;
    }
  }

  .portal-page {
    .main-title {
      font-size: 38px;
      .title-line.accent {
        font-size: 48px;
      }
    }
    .skew-container {
      max-height: none;
      transform: none;
      .card-grid {
        transform: none;
      }
    }
    .card-item:hover {
      transform: translateY(-3px) scale(1.01);
    }
  }
}

@media (max-width: 768px) {
  .portal-page {
    .left-panel {
      display: none;
    }

    .right-panel {
      flex: 1;
      padding: 16px;
    }

    .card-grid {
      grid-template-columns: 1fr;
      gap: 10px;

      .col-small {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 10px;
      }
      .col-large .card-large {
        min-height: 180px;
      }
    }
  }
}
</style>
