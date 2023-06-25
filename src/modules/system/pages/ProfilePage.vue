<script setup lang="ts">
import AppPage from '@/core/ui/AppPage.vue'
import ProfileIdentity from '../components/ProfileIdentity.vue'
import ProfileInfoCard from '../components/ProfileInfoCard.vue'
import ProfilePasswordCard from '../components/ProfilePasswordCard.vue'

defineOptions({ name: 'Profile' })
</script>

<template>
  <AppPage>
    <div class="profile-page">
      <ProfileIdentity />
      <ProfileInfoCard />
      <ProfilePasswordCard />
    </div>
  </AppPage>
</template>

<style scoped lang="scss">
.profile-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 960px;
  margin: 0 auto;
}
</style>
