<template>
  <div class="avatar-wrapper" :title="(userInfo?.realName || userInfo?.userName) + ' - 在线'">
    <img :src="userInfo.avatar ?? userImage" alt="用户头像" class="user-avatar" />
    <div class="user-avatar-status" :style="{ backgroundColor: !online ? 'red' : null }">
      <el-popover :visible="!online" :effect="'dark'" :width="170">
        <template #reference>
          <div />
        </template>
        <div class="online-status">
          <menu-icon icon="exclamation-triangle-fill" />
          <span>与服务器连接中断</span>
        </div>
      </el-popover>
    </div>
  </div>
</template>

<script setup lang="ts">
import userImage from '@/assets/layout/user.png'
import { useBasicStore } from '@/store/basic'

const basicStore = useBasicStore()
const { settings, sidebar, userInfo } = basicStore

const online = toRef(basicStore, 'online')
</script>

<style scoped lang="scss"></style>
