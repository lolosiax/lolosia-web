<template>
  <div class="user-profile">
    <el-card header="个人信息">
      <el-descriptions label-width="120px" size="default" border :column="1">
        <el-descriptions-item label="头像">
          <div class="avatar-frame">
            <img :src="userInfo.avatar || UserImage" class="avatar" alt="用户头像" @click="showAvatarEditor = true" />
            <div class="avatar-tip">
              <i class="bi bi-pen-fill" />
              <span>修改头像</span>
            </div>
          </div>
        </el-descriptions-item>
        <el-descriptions-item label="用户名">
          {{ userInfo.realName }}
        </el-descriptions-item>
        <el-descriptions-item label="账号">
          {{ userInfo.userName }}
        </el-descriptions-item>
        <el-descriptions-item label="手机号">
          {{ userInfo.phone }}
        </el-descriptions-item>
        <el-descriptions-item label="UID">
          {{ userInfo.id }}
        </el-descriptions-item>
        <el-descriptions-item label="注册日期">
          {{ userInfo.createdAt }}
        </el-descriptions-item>
        <el-descriptions-item label="上次更新">
          {{ userInfo.updatedAt }}
        </el-descriptions-item>
      </el-descriptions>
    </el-card>
    <avatar-edit v-model="showAvatarEditor" />
  </div>
</template>

<script setup lang="ts">
import AvatarEdit from "@/views/user/profile/components/AvatarEditor.vue";
import UserImage from "@/assets/layout/user.png";
import MenuIcon from "@/components/MenuIcon.vue";

const showAvatarEditor = ref(false);
const userInfo = toRef(useBasicStore(), "userInfo");

</script>

<style scoped lang="scss">
.user-profile {
  max-width: 1024px;
  margin: 0 auto;

  .avatar-frame {
    position: relative;
    height: 96px;
    width: 96px;
    overflow: hidden;
    border-radius: 24%;

    &:not(:hover) .avatar-tip {
      display: none;
    }

    .avatar {
      height: 96px;
      width: 96px;
      cursor: pointer;
      -webkit-user-drag: none;
      -moz-user-drag: none;
      user-drag: none;
    }

    .avatar-tip {
      position: absolute;
      left: 0;
      top: 0;
      height: 100%;
      width: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      background-color: #88888888;
      color: white;
      pointer-events: none;

      .bi {
        font-size: 2em;
      }
    }
  }
}
</style>
