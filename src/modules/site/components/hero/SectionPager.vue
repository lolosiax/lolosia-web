<script setup lang="ts">
defineOptions({ name: 'SectionPager' })

defineProps<{
  sections: readonly { id: string; label: string }[]
  active: number
}>()

const emit = defineEmits<{
  (e: 'go', index: number): void
}>()
</script>

<template>
  <div class="pager">
    <button type="button" title="上一屏" :disabled="active === 0" @click="emit('go', active - 1)">
      <i class="bi bi-chevron-up" />
    </button>
    <div class="pager__dots">
      <button
        v-for="(item, index) in sections"
        :key="item.id"
        type="button"
        class="pager__dot"
        :class="{ 'is-active': active === index }"
        :title="item.label"
        @click="emit('go', index)"
      >
        {{ index + 1 }}
      </button>
    </div>
    <button type="button" title="下一屏" :disabled="active === sections.length - 1" @click="emit('go', active + 1)">
      <i class="bi bi-chevron-down" />
    </button>
  </div>
</template>

<style scoped lang="scss">
.pager {
  position: absolute;
  top: 50%;
  right: 26px;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  transform: translateY(-50%);

  button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: none;
    color: #8b6a92;
    background: rgba(255, 255, 255, 0.55);
    cursor: pointer;
    transition: all 0.25s ease;

    &:hover:not(:disabled) {
      color: #fff;
      background: linear-gradient(135deg, #c296cd, #a480ab);
    }

    &:disabled {
      opacity: 0.35;
      cursor: default;
    }
  }

  > button {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    font-size: 14px;
    backdrop-filter: blur(8px);
  }

  &__dots {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__dot {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    font-size: 11px;
    font-weight: 700;

    &.is-active {
      color: #fff;
      background: linear-gradient(135deg, #c296cd, #a480ab);
      box-shadow: 0 4px 12px rgba(164, 128, 171, 0.4);
    }
  }
}

@media (max-width: 720px) {
  .pager {
    right: 12px;

    &__dot {
      width: 22px;
      height: 22px;
      font-size: 10px;
    }
  }
}
</style>
