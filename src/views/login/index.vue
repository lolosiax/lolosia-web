<template>
  <div class="login-container columnCE">
    <!--    <div class="login-hero">-->
    <!--      <img src="@/assets/layout/login.svg" :alt="settings.title" />-->
    <!--    </div>-->
    <el-form ref="refLoginForm" class="login-form" :model="subForm" :rules="formRules">
      <div class="title-container">
        <h3 class="title text-center">{{ settings.title }}</h3>
      </div>
      <el-form-item prop="userName" :rules="formRules.isNotNull('用户名')">
        <span class="svg-container">
          <ElSvgIcon name="User" :size="14" />
        </span>
        <el-input v-model="subForm.userName" placeholder="用户名" />
        <!--占位-->
      </el-form-item>
      <el-form-item prop="password" :rules="formRules.isNotNull('密码')">
        <span class="svg-container">
          <ElSvgIcon name="Lock" :size="14" />
        </span>
        <el-input
          :key="passwordType"
          ref="refPassword"
          v-model="subForm.password"
          :type="passwordType"
          name="password"
          placeholder="密码"
          @keyup.enter="handleLogin"
        />
        <span class="show-pwd" @click="showPwd">
          <svg-icon :icon-class="passwordType === 'password' ? 'eye' : 'eye-open'" />
        </span>
      </el-form-item>
      <div class="tip-message">{{ tipMessage }}</div>
      <el-button :loading="subLoading" color="#E3B4D0" class="login-btn" size="default" @click.prevent="handleLogin">
        登录
      </el-button>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBasicStore } from '@/store/basic'
import { elMessage, useElement } from '@/hooks/use-element'
import { getMyRole, login } from '@/api/user'
import type { FormInstance, InputInstance } from 'element-plus'
import { settings as viteSettings } from '@/settings'
import { ElMessage } from 'element-plus'

/* listen router change and set the query  */
const { settings } = useBasicStore()
//element valid
const formRules = useElement().formRules
//form
const subForm = reactive({
  userName: '',
  password: ''
})
const state: any = reactive({
  otherQuery: {},
  redirect: undefined
})
const route = useRoute()

function getOtherQuery(query) {
  return Object.keys(query).reduce((acc, cur) => {
    if (cur !== 'redirect') {
      acc[cur] = query[cur]
    }
    return acc
  }, {})
}

watch(
  () => route.query,
  (query) => {
    if (query) {
      state.redirect = query.redirect
      state.otherQuery = getOtherQuery(query)
    }
  },
  { immediate: true }
)

/*
 *  login relative
 * */
let subLoading = $ref(false)
//tip message
let tipMessage = $ref('')
//sub form
const refLoginForm: FormInstance = $ref(null)

function handleLogin() {
  refLoginForm.validate((valid) => {
    if (valid) {
      subLoading = true
      loginFunc()
    } else {
      ElMessage.error('请检查输入是否正确')
    }
  })
}

const router = useRouter()
const basicStore = useBasicStore()

async function loginFunc() {
  try {
    const data = await login(subForm)
    elMessage('登录成功')
    basicStore.setToken(data?.Authorization)
    const role = await getMyRole()
    basicStore.setUserInfo({
      userInfo: data,
      roles: [role.roleType],
      codes: [role.roleId]
    })
    // router.push("/").catch(e => console.error(e));
    if (route.query?.redirect) {
      let url = route.query.redirect as string
      if (viteSettings.viteBasePath.endsWith('/') && url.startsWith('/')) {
        url = url.replace(/^\//, '')
      }
      window.location.href = viteSettings.viteBasePath + url
    } else {
      window.location.href = viteSettings.viteBasePath
    }
  } catch (e: Error | any) {
    tipMessage = e?.message
  } finally {
    subLoading = false
  }
}

/*
 *  password show or hidden
 * */
const passwordType = ref('password')
const refPassword = ref<InputInstance>()

function showPwd() {
  if (passwordType.value === 'password') {
    passwordType.value = ''
  } else {
    passwordType.value = 'password'
  }
  nextTick(() => {
    refPassword.value!.focus()
  })
}
</script>
<style lang="scss" scoped>
$bg: #fbfcff;
$dark_gray: #333;
$gray: #999;
$light_gray: #eee;
.login-container {
  height: 100vh;
  position: relative;
  overflow-y: hidden;
  width: 100%;
  background-color: $bg;
  background-image: url('./1712042358737.jpg');
  background-repeat: no-repeat;
  background-size: cover;
  background-position-x: right;
  background-position-y: center;

  .login-form {
    width: 360px;
    padding: 40px 30px;
    background: #fff6;
    box-shadow: 0 4px 16px rgba(4, 61, 175, 0.15);
    border-radius: 8px;
    margin-right: 10vw;
    z-index: 10;
    @media screen and (min-width: 769px) and (max-width: 992px) {
      margin-right: 10vw;
    }
    @media only screen and (max-width: 768px) {
      margin-right: auto;
      margin-left: auto;
    }
  }

  .title-container {
    .title {
      font-size: 18px;
      color: white;
      margin: 0 auto 25px auto;
      text-align: center;
      font-weight: bold;
    }
  }
}

.login-hero {
  width: 40vw;
  position: absolute;
  top: 50%;
  left: 15vw;
  z-index: 0;
  transform: translateY(-50%);
  @media screen and (min-width: 769px) and (max-width: 992px) {
    width: 60vw;
    left: 5vw;
  }
  @media screen and (max-width: 768px) {
    width: 100vw;
    left: 0;
  }

  img {
    width: 100%;
  }
}

.svg-container {
  padding-left: 16px;
  color: $gray;
  text-align: center;
  width: 30px;
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
}

//错误提示信息
.tip-message {
  color: #e4393c;
  height: 30px;
  margin-top: -12px;
  font-size: 12px;
}

//登录按钮
.login-btn {
  width: 100%;
  margin-bottom: 30px;
}

.show-pwd {
  width: 50px;
  font-size: 16px;
  color: $gray;
  cursor: pointer;
  text-align: center;
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
}
</style>

<style lang="scss">
//css 样式重置 增加个前缀避免全局污染
.login-container {
  .el-input__wrapper {
    background-color: transparent;
    box-shadow: none;
  }

  .el-form-item {
    border: 1px solid #e0e0e0;
    background: #fffb;
    border-radius: 4px;
    color: #999;

    &__content {
      position: relative;
    }
  }

  .el-input input {
    background: transparent;
    border: 0;
    -webkit-appearance: none;
    border-radius: 0;
    padding: 10px 5px 10px 35px;
    color: #999;
    height: 42px; //此处调整item的高度
    caret-color: #999;
  }

  //hidden the input border
  .el-input__inner {
    box-shadow: none !important;
  }
}
</style>
