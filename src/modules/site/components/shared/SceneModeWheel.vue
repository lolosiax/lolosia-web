<script setup lang="ts">
defineOptions({ name: 'SceneModeWheel' })

defineProps<{
  open: boolean
  highlight: number
}>()
</script>

<template>
  <div v-if="open" class="mode-wheel" aria-hidden="true">
    <div class="mode-wheel__panel">
      <span class="mode-wheel__highlight" :style="{ transform: `translateX(calc(${highlight} * var(--step)))` }" />

      <div class="mode-wheel__col">
        <span class="mode-wheel__num">1</span>
        <svg class="mode-wheel__icon" viewBox="0 0 48 48">
          <circle cx="24" cy="24" r="17" />
          <path class="fill" d="M20 15l14 9-14 9z" />
        </svg>
        <p>播放模式</p>
      </div>

      <div class="mode-wheel__col">
        <span class="mode-wheel__num">2</span>
        <svg class="mode-wheel__icon" viewBox="0 0 48 48">
          <path d="M24 7l15 8.5v17L24 41 9 32.5v-17z" />
          <path d="M9 15.5l15 8.5 15-8.5M24 24v17" />
        </svg>
        <p>MC 模式</p>
      </div>

      <div class="mode-wheel__col">
        <span class="mode-wheel__num">3</span>
        <svg class="mode-wheel__icon" viewBox="0 0 48 48">
          <circle cx="24" cy="24" r="6" />
          <path d="M24 18V7M24 18l12-7M18 24H7" />
          <path d="M24 7l-3 4h6zM36 11l-5 1 4 4zM7 24l4-3v6z" class="fill" />
        </svg>
        <p>Maya 模式</p>
      </div>

      <p class="mode-wheel__hint">点 4 平移高亮 · 松开 3 应用 · Esc 取消</p>
    </div>
  </div>
</template>

<style scoped lang="scss">
.mode-wheel {
  position: fixed;
  inset: 0;
  z-index: 40;
  display: grid;
  place-items: center;
  pointer-events: none;
  animation: mode-wheel-in 0.2s ease both;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at 50% 50%, rgb(20 12 30 / 28%) 0%, transparent 62%);
  }

  &__panel {
    --col-w: 108px;
    --col-gap: 46px;
    --step: calc(var(--col-w) + var(--col-gap));

    position: relative;
    display: flex;
    gap: var(--col-gap);
    animation: mode-wheel-panel-in 0.2s ease both;
    padding: 28px 46px 24px;
    border: 1px solid rgb(255 255 255 / 14%);
    border-radius: 22px;
    background: rgb(24 16 34 / 80%);
    box-shadow: 0 30px 80px -40px rgb(12 6 20 / 90%);
    color: rgb(255 255 255 / 82%);
    backdrop-filter: blur(18px);
  }

  /* 高亮块在两列之间滑动，模拟 MC 的 F3 + F4 切换器。 */
  &__highlight {
    position: absolute;
    top: 28px;
    bottom: 24px;
    left: 46px;
    width: var(--col-w);
    border: 1px solid rgb(243 230 248 / 52%);
    border-radius: 14px;
    background: linear-gradient(180deg, rgb(210 177 219 / 26%), rgb(210 177 219 / 9%));
    box-shadow: 0 0 26px -6px rgb(210 177 219 / 65%);
    pointer-events: none;
    transition: transform 0.18s cubic-bezier(0.22, 1, 0.36, 1);
  }

  &__col {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    width: var(--col-w);
    padding: 10px 6px;
    border-radius: 14px;

    p {
      margin: 0;
      font-size: 12px;
      letter-spacing: 0.08em;
    }
  }

  &__hint {
    position: absolute;
    right: 0;
    bottom: 5px;
    left: 0;
    margin: 0;
    color: rgb(255 255 255 / 48%);
    font-size: 10px;
    letter-spacing: 0.08em;
    text-align: center;
  }

  &__num {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border: 1px solid rgb(255 255 255 / 30%);
    border-radius: 5px;
    color: rgb(255 255 255 / 70%);
    font-size: 11px;
    line-height: 1;
  }

  &__icon {
    width: 54px;
    height: 54px;
    fill: none;
    stroke: currentcolor;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 1.6;
    opacity: 0.9;

    .fill {
      fill: currentcolor;
      stroke: none;
    }
  }
}

@keyframes mode-wheel-in {
  from {
    opacity: 0;
  }
}

@keyframes mode-wheel-panel-in {
  from {
    transform: scale(0.94);
  }
}

@media (max-width: 700px) {
  .mode-wheel__panel {
    --col-w: 82px;
    --col-gap: 16px;

    padding: 20px 18px;
  }

  .mode-wheel__highlight {
    top: 20px;
    bottom: 20px;
    left: 18px;
  }

  .mode-wheel__icon {
    width: 40px;
    height: 40px;
  }
}
</style>
