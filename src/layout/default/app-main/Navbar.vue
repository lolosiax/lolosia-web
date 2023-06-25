<template>
  <div class="navbar reset-el-dropdown">
    <div class="navbar-left">
      <div class="nav-bar-system rowSC">
        <!--  切换sidebar按钮  -->
        <hamburger
          v-if="settings.showHamburger"
          :is-active="sidebar.opened"
          class="hamburger-container"
          @toggle-click="toggleSideBar"
        />
        <!--  面包屑导航  -->
        <breadcrumb class="breadcrumb-container" />
      </div>
      <component :is="item" v-for="(item, i) of navbar.left" :key="i" />
    </div>
    <div class="navbar-center">
      <!--导航标题-->
      <div v-if="settings.showNavbarTitle" class="heardCenterTitle">{{ settings.title }}</div>
      <component :is="item" v-for="(item, i) of navbar.center" :key="i" />
    </div>
    <div class="navbar-right">
      <component :is="item" v-for="(item, i) of navbar.right" :key="i" />
      <!-- 下拉操作菜单 -->
      <debugger />
      <div v-if="settings.ShowDropDown" class="right-menu rowSC">
        <!--        <ScreenFull />-->
        <!--        <ScreenLock />-->
        <!--        <ThemeSelect />-->
        <!--        <SizeSelect />-->
        <!--        <LangSelect />-->
        <el-dropdown trigger="click" size="default">
          <div class="avatar-wrapper" :title="(userInfo?.realName || userInfo?.userName) + ' - 在线'">
            <img :src="userInfo.avatar ?? userImage" alt="用户头像" class="user-avatar" />
            <div class="user-avatar-status" :style="{backgroundColor: !online ? 'red' : null}">
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
          <template #dropdown>
            <el-dropdown-menu class="drop-down">
              <el-dropdown-item class="welcome-user">
                {{ time }}好，<b>{{ userInfo.realName || userImage.userName || "平台用户" }}</b>
              </el-dropdown-item>
              <router-link to="/">
                <el-dropdown-item divided>{{ langTitle("Home") }}</el-dropdown-item>
              </router-link>
              <router-link to="/user/profile">
                <el-dropdown-item>个人中心</el-dropdown-item>
              </router-link>
              <el-dropdown-item divided @click="loginOut">{{ langTitle("login out") }}</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { VNode } from "vue";
import { nextTick } from "vue";
import { useRouter } from "vue-router";
import Breadcrumb from "./Breadcrumb.vue";
import Hamburger from "./Hamburger.vue";
import LangSelect from "./component/LangSelect.vue";
import ScreenFull from "./component/ScreenFull.vue";
import SizeSelect from "./component/SizeSelect.vue";
import ThemeSelect from "./component/ThemeSelect.vue";
import ScreenLock from "./component/ScreenLock.vue";
import { resetState } from "@/hooks/use-permission";
import { elMessage } from "@/hooks/use-element";
import { useBasicStore } from "@/store/basic";
import { langTitle } from "@/hooks/use-common";
import userImage from "@/assets/layout/user.png";
import Debugger from "@/layout/default/app-main/component/Debugger.vue";
import MenuIcon from "@/components/MenuIcon.vue";
import { useDebuggerStore } from "@/store/debuger";

const basicStore = useBasicStore();
const { settings, sidebar, setToggleSideBar, userInfo } = basicStore;
const online = toRef(basicStore, "online");

const toggleSideBar = () => {
  setToggleSideBar();
};
//退出登录
const router = useRouter();
const loginOut = () => {
  elMessage("退出登录成功");
  router.push(`/login?redirect=/`);
  nextTick(() => {
    resetState();
  });
};

const time = computed(() => {
  const hover = new Date().getHours();
  if (hover > 20) return "晚上";
  if (hover > 17) return "傍晚";
  if (hover > 13) return "下午";
  if (hover > 11) return "中午";
  if (hover > 8) return "上午";
  if (hover > 5) return "早上";
  return "凌晨";
});

const navbar = reactive({
  left: [] as VNode[],
  center: [] as VNode[],
  right: [] as VNode[]
});

watch(() => basicStore.navbar.cursor, () => {
  const left = navbar.left = [] as VNode[];
  for (const value of basicStore.navbar.left.values()) {
    left.push(...value);
  }
  const center = navbar.center = [] as VNode[];
  for (const value of basicStore.navbar.center.values()) {
    center.push(...value);
  }
  const right = navbar.right = [] as VNode[];
  for (const value of basicStore.navbar.right.values()) {
    right.push(...value);
  }
});

</script>

<style lang="scss" scoped>

.online-status {
  display: flex;
  align-items: center;

  .menu-icon {
    color: gold;
    margin-right: 0.5em;
  }

  span {
    color: red;
  }
}

.navbar {
  height: var(--nav-bar-height);
  overflow: hidden;
  background: var(--nav-bar-background);
  box-shadow: var(--nav-bar-box-shadow);
  z-index: 1;
  display: flex;
  align-items: center;
  overflow-x: auto;

  &::-webkit-scrollbar {
    display: none;
  }

  .nav-bar-system {
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .navbar-left {
    display: flex;
    align-items: center;

    > * {
      margin-right: 1em;
    }
  }

  .navbar-center {
    flex: 1 1;
    display: flex;
    align-items: center;
    justify-content: center;

    > * {
      margin: 0.5em;
    }
  }

  .navbar-right {
    display: flex;
    align-items: center;
    justify-content: flex-end;

    > * {
      margin-left: 1em;
    }
  }

  //center-title
  .heardCenterTitle {
    text-align: center;
    position: absolute;
    top: 50%;
    left: 46%;
    font-weight: 600;
    font-size: 20px;
    transform: translate(-50%, -50%);
  }

  //drop-down
  .right-menu {
    cursor: pointer;
    margin-right: 16px;
    background-color: var(--nav-bar-right-menu-background);

    //logo
    .avatar-wrapper {
      margin-top: 5px;
      position: relative;
      cursor: pointer;

      .user-avatar {
        cursor: pointer;
        width: 40px;
        height: 40px;
        border-radius: 10px;
      }

      .user-avatar-status {
        position: absolute;
        right: -2px;
        bottom: 0;
        height: 10px;
        width: 10px;
        border-radius: 50%;
        background-color: #55e802;
        box-shadow: 0 0 3px black;
      }

      .el-icon-caret-bottom {
        cursor: pointer;
        position: absolute;
        right: -20px;
        top: 25px;
        font-size: 12px;
      }
    }
  }
}

.drop-down {
}
</style>
