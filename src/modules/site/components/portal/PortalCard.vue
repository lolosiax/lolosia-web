<script setup lang="ts">
import type { PortalCard } from '../../lib'

defineOptions({ name: 'PortalCard' })

defineProps<{ card: PortalCard }>()

const emit = defineEmits<{
  (e: 'open', card: PortalCard): void
}>()
</script>

<template>
  <button
    type="button"
    class="portal-card"
    :class="{ 'is-large': card.large }"
    :style="{ '--tone': card.tone }"
    @click="emit('open', card)"
  >
    <span class="portal-card__glow" />
    <span class="portal-card__icon"><i class="bi" :class="`bi-${card.icon}`" /></span>
    <span class="portal-card__body">
      <span class="portal-card__title">{{ card.title }}</span>
      <span class="portal-card__subtitle">{{ card.subtitle }}</span>
      <span class="portal-card__desc">{{ card.description }}</span>
    </span>
  </button>
</template>

<style scoped lang="scss">
.portal-card {
  position: relative;
  display: flex;
  flex: 1;
  align-items: flex-end;
  gap: 12px;
  min-height: 0;
  padding: 20px;
  overflow: hidden;
  border: 1px solid rgba(var(--tone), 0.55);
  border-radius: 16px;
  color: #fff;
  text-align: left;
  background:
    linear-gradient(140deg, rgba(var(--tone), 0.85), rgba(var(--tone), 0.38)),
    linear-gradient(140deg, rgba(255, 255, 255, 0.12), transparent);
  box-shadow: 0 14px 30px rgba(var(--tone), 0.25);
  cursor: pointer;
  transition:
    transform 0.35s cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 0.35s ease;

  &:hover {
    transform: translateY(-5px) scale(1.015);
    box-shadow: 0 20px 40px rgba(var(--tone), 0.4);

    .portal-card__glow {
      opacity: 1;
    }
  }

  &:active {
    transform: translateY(-1px) scale(0.99);
  }

  &__glow {
    position: absolute;
    inset: 0;
    opacity: 0;
    background: linear-gradient(120deg, transparent 30%, rgba(255, 255, 255, 0.18) 50%, transparent 70%);
    transition: opacity 0.4s ease;
    pointer-events: none;
  }

  &__icon {
    display: inline-flex;
    flex: 0 0 40px;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 12px;
    font-size: 19px;
    background: rgba(255, 255, 255, 0.24);
    backdrop-filter: blur(6px);
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  &__title {
    font-size: 15px;
    font-weight: 800;
    letter-spacing: 0.5px;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
  }

  &__subtitle {
    font-size: 9px;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    opacity: 0.7;
  }

  &__desc {
    margin-top: 4px;
    font-size: 11px;
    line-height: 1.4;
    opacity: 0.68;
  }

  &.is-large {
    flex: none;
    height: 100%;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-end;

    .portal-card__icon {
      width: 56px;
      height: 56px;
      font-size: 26px;
    }

    .portal-card__title {
      font-size: 22px;
    }

    .portal-card__desc {
      font-size: 12.5px;
    }
  }
}

@media (max-width: 820px) {
  .portal-card {
    flex: none;
    min-height: 104px;
    padding: 16px;

    &.is-large {
      height: auto;
      min-height: 168px;
    }
  }
}
</style>
