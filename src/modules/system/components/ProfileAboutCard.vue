<script setup lang="ts">
import MenuIcon from '@/core/ui/MenuIcon.vue'

interface Field {
  label: string
  value: string
  wide?: boolean
}

defineOptions({ name: 'ProfileAboutCard' })

defineProps<{
  bio: string
  fields: Field[]
  tags: string[]
}>()
</script>

<template>
  <section class="about">
    <header class="about__head">
      <div class="about__heading">
        <MenuIcon icon="person-vcard" />
        <h2>关于我</h2>
      </div>
      <span class="about__hint">个人介绍</span>
    </header>

    <p class="about__bio">{{ bio }}</p>

    <div class="about__fields">
      <div v-for="field in fields" :key="field.label" class="about__field" :class="{ 'is-wide': field.wide }">
        <span>{{ field.label }}</span>
        <strong>{{ field.value }}</strong>
      </div>
    </div>

    <div class="about__tags">
      <span v-for="tag in tags" :key="tag">{{ tag }}</span>
    </div>
  </section>
</template>

<style scoped lang="scss">
.about {
  padding: 24px 26px;
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.62);
  box-shadow: 0 18px 44px rgba(74, 45, 94, 0.1);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 14px;
  }

  &__heading {
    display: flex;
    align-items: center;
    gap: 9px;

    .menu-icon {
      display: grid;
      place-items: center;
      width: 32px;
      height: 32px;
      border-radius: 10px;
      background: linear-gradient(135deg, #efe1f7, #dcc6ec);
      color: #8d6aa0;
      font-size: 15px;
    }

    h2 {
      margin: 0;
      color: #2d1b3a;
      font-size: 16px;
      font-weight: 700;
    }
  }

  &__hint {
    padding: 4px 10px;
    border-radius: 999px;
    background: rgba(194, 150, 205, 0.12);
    color: #a480ab;
    font-size: 11px;
  }

  &__bio {
    margin: 0 0 18px;
    color: #6b5a73;
    font-size: 13.5px;
    line-height: 1.9;
  }

  &__fields {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
    padding: 16px;
    border: 1px solid rgba(164, 128, 171, 0.12);
    border-radius: 16px;
    background: rgba(247, 241, 251, 0.65);
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;

    span {
      color: #a99cae;
      font-size: 10.5px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    strong {
      overflow: hidden;
      color: #3a2347;
      font-size: 13px;
      font-weight: 600;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &.is-wide {
      grid-column: 1 / -1;

      strong {
        white-space: normal;
        word-break: break-all;
      }
    }
  }

  &__tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 16px;

    span {
      padding: 6px 11px;
      border: 1px solid rgba(164, 128, 171, 0.16);
      border-radius: 999px;
      background: rgba(194, 150, 205, 0.12);
      color: #7c5a8f;
      font-size: 11.5px;
    }
  }
}
</style>
