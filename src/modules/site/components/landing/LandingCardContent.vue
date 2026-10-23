<script setup lang="ts">
import type { LandingCard } from '../../composables/use-landing-cards'

defineOptions({ name: 'LandingCardContent' })

defineProps<{ card: LandingCard; large?: boolean }>()
</script>

<template>
  <div class="card-content" :class="{ 'card-content--large': large }">
    <template v-if="large">
      <div class="card-avatar">
        <img src="https://ssl.lolosia.moe/assets/avatar.webp" class="avatar-img" />
      </div>
      <div class="card-title">{{ card.title }} {{ card.subtitle }}</div>
      <div class="card-description">{{ card.description }}</div>
    </template>

    <template v-else>
      <div class="card-icon-frame">
        <span class="card-icon">{{ card.icon }}</span>
      </div>
      <div class="card-title">
        <div>{{ card.title }}</div>
      </div>
      <div class="card-subtitle">{{ card.subtitle }}</div>
    </template>
  </div>
</template>

<style scoped lang="scss">
$primary: #c296cd;

.card-content {
  position: absolute;
  z-index: 3;
  padding: 18px 20px;
  bottom: 0;
  justify-content: flex-start;
  display: grid;
  grid-template-columns: auto 1fr;
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
  flex-shrink: 0;
  grid-row: 1 / 3;
  margin-right: 1em;

  .card-icon {
    font-size: 18px;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
  }
}

.card-title {
  margin-bottom: 2px;

  div {
    padding: 1px 4px;
    color: #fff;
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0.5px;
    border-radius: 6px;
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    text-shadow:
      0 1px 6px rgba(0, 0, 0, 0.2),
      0 0 8px rgba(var(--card-rgb), 0.5);
    display: inline-block;
  }
}

.card-subtitle {
  font-size: 9px;
  color: rgba(255, 255, 255, 0.6);
  letter-spacing: 0.5px;
  text-transform: uppercase;
  padding: 1px 4px;
  border-radius: 2px;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  text-shadow: 0 0 6px rgba(var(--card-rgb), 0.4);
}

// ── LARGE CARD (洛洛希雅) ──
.card-content--large {
  align-items: center;
  gap: 4px 12px;
  padding: 20px 22px;

  .card-avatar {
    grid-row: 1 / 3;
    grid-column: 1;
    align-self: center;

    .avatar-img {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid rgba(255, 255, 255, 0.3);
      box-shadow: 0 0 20px rgba($primary, 0.3);
      display: block;
    }
  }

  .card-title {
    grid-row: 1;
    grid-column: 2;
    font-size: 15px;
    font-weight: 800;
    letter-spacing: 1px;
    color: #fff;
    padding: 2px 8px;
    border-radius: 4px;
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    text-shadow:
      0 2px 5px rgba(0, 0, 0, 0.75),
      0 0 12px rgba(var(--card-rgb), 0.6);
    margin: 0;
  }

  .card-description {
    grid-row: 2;
    grid-column: 2;
    font-size: 11px;
    color: rgba(255, 255, 255, 0.45);
    line-height: 1.5;
    font-weight: 300;
    padding: 2px 8px;
    border-radius: 4px;
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    text-shadow:
      0 2px 5px rgba(0, 0, 0, 0.75),
      0 0 8px rgba(var(--card-rgb), 0.5);
    margin: 0;
  }
}
</style>
