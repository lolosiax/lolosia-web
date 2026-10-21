<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import AppPage from '@/core/ui/AppPage.vue'
import { useAuthStore } from '@/core/stores/auth'
import ProfileAboutCard from '../components/ProfileAboutCard.vue'
import ProfileHero from '../components/ProfileHero.vue'
import ProfilePasswordCard from '../components/ProfilePasswordCard.vue'

defineOptions({ name: 'Profile' })

const auth = useAuthStore()

/** 演示资料：接口就绪前先放在前端本地。 */
const profile = reactive({
  name: auth.displayName,
  signature: '把日常收进像素与风里。',
  bio: '喜欢紫色、猫耳和一切软乎乎的东西。白天写代码，晚上整理相册与番组，偶尔在足迹地图上迷路。',
  location: '云端 · 幻想乡',
  website: 'lolosia.moe'
})

const draft = reactive({ name: '', signature: '', bio: '' })
const editVisible = ref(false)

const handle = computed(() => `@${auth.userInfo?.userName ?? 'lolosia'}`)
const joined = computed(() => (auth.userInfo?.createdAt ?? '2026-10-08 12:59:26').slice(0, 10))

const stats = [
  { label: '文件', value: '1,574', icon: 'folder2-open' },
  { label: '足迹', value: '31', icon: 'geo-alt' },
  { label: '番组', value: '108', icon: 'collection-play' },
  { label: '标签', value: '1,045', icon: 'tags' }
]

const fields = computed(() => [
  { label: '账号', value: auth.userInfo?.userName ?? 'lolosia' },
  { label: '邮箱', value: auth.userInfo?.email ?? 'lolosiax@qq.com' },
  { label: '手机号', value: auth.userInfo?.phone || '未绑定' },
  { label: '角色', value: auth.role?.roleName ?? '所有者' },
  { label: 'UID', value: auth.userInfo?.id ?? '500cd780-ba0c-4e27-a77c-12a2d00b80c9', wide: true },
  { label: '注册时间', value: auth.userInfo?.createdAt ?? '2026-10-08 12:59:26' },
  { label: '账户状态', value: '正常' }
])

const tags = ['VRChat', '摄影', '番剧', '像素风', '猫耳', '自托管']

function openEdit(): void {
  draft.name = profile.name
  draft.signature = profile.signature
  draft.bio = profile.bio
  editVisible.value = true
}

function saveProfile(): void {
  profile.name = draft.name.trim() || profile.name
  profile.signature = draft.signature.trim()
  profile.bio = draft.bio.trim()
  editVisible.value = false
  ElMessage.success('资料已保存（本地演示）')
}
</script>

<template>
  <AppPage>
    <div class="profile">
      <ProfileHero
        :name="profile.name"
        :handle="handle"
        :signature="profile.signature"
        :bio="profile.bio"
        :location="profile.location"
        :website="profile.website"
        :joined="joined"
        :role-name="auth.role?.roleName"
        :role-type="auth.roleType"
        :stats="stats"
        @edit="openEdit"
      />

      <div class="profile__grid">
        <ProfileAboutCard :bio="profile.bio" :fields="fields" :tags="tags" />
        <ProfilePasswordCard />
      </div>
    </div>

    <ElDialog
      v-model="editVisible"
      class="profile-edit-dialog"
      title="编辑个人资料"
      width="460"
      append-to-body
      :close-on-click-modal="false"
    >
      <p class="profile__edit-hint">以下内容目前只保存在当前页面，尚未接后端。</p>
      <ElForm label-position="top">
        <ElFormItem label="昵称">
          <ElInput v-model="draft.name" maxlength="20" show-word-limit placeholder="展示用的昵称" />
        </ElFormItem>
        <ElFormItem label="签名">
          <ElInput v-model="draft.signature" maxlength="40" show-word-limit placeholder="一句话介绍自己" />
        </ElFormItem>
        <ElFormItem label="个人介绍">
          <ElInput
            v-model="draft.bio"
            type="textarea"
            :rows="4"
            maxlength="200"
            show-word-limit
            resize="none"
            placeholder="写点关于自己的事"
          />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="editVisible = false">取消</ElButton>
        <ElButton type="primary" @click="saveProfile">保存</ElButton>
      </template>
    </ElDialog>
  </AppPage>
</template>

<style scoped lang="scss">
.profile {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 1120px;
  margin: 0 auto;
  padding-bottom: 8px;

  &__grid {
    display: grid;
    grid-template-columns: minmax(0, 1.6fr) minmax(320px, 1fr);
    gap: 20px;
    align-items: start;
  }

  &__edit-hint {
    margin: 0 0 16px;
    padding: 9px 12px;
    border-radius: 12px;
    background: rgba(194, 150, 205, 0.1);
    color: #8c7b90;
    font-size: 12px;
    line-height: 1.6;
  }
}

:global(.profile-edit-dialog) {
  border: 1px solid rgba(255, 255, 255, 0.85);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 30px 80px rgba(74, 45, 94, 0.24);
  backdrop-filter: blur(20px);

  .el-dialog__title {
    color: #2d1b3a;
    font-weight: 700;
  }

  .el-input__wrapper {
    border-radius: 12px;
    box-shadow: inset 0 0 0 1px rgba(164, 128, 171, 0.22);
  }

  .el-textarea__inner {
    border-radius: 12px;
    box-shadow: inset 0 0 0 1px rgba(164, 128, 171, 0.22);
  }
}

@media (max-width: 980px) {
  .profile__grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
