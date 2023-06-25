<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { roleList } from '@/core/api/role'
import type { RoleRow } from '@/core/api/role'
import { userPermissionList, userPermissionSave } from '@/core/api/permission'
import type { UserListRow } from '@/core/api/user'
import AppPage from '@/core/ui/AppPage.vue'
import PermissionRulesDialog from '../components/PermissionRulesDialog.vue'
import RoleTag from '../components/RoleTag.vue'
import UserEditDialog from '../components/UserEditDialog.vue'
import UserRowActions from '../components/UserRowActions.vue'
import { useRulesEditor } from '../composables/use-rules-editor'
import { useUserAdmin } from '../composables/use-user-admin'

defineOptions({ name: 'SystemUser' })

const {
  rows,
  total,
  loading,
  saving,
  query,
  editing,
  editVisible,
  load,
  search,
  openCreate,
  openEdit,
  save,
  remove
} = useUserAdmin()

const {
  visible: rulesVisible,
  saving: rulesSaving,
  title: rulesTitle,
  rules,
  catalog,
  open: openRulesEditor,
  save: saveRules
} = useRulesEditor()

const roles = ref<RoleRow[]>([])
/** 拥有者组不参与分配，避免通过界面把别人提成 owner。 */
const assignableRoles = computed(() => roles.value.filter(role => role.type !== 'owner'))

async function openRules(row: UserListRow): Promise<void> {
  await openRulesEditor({
    title: `用户直授权限 · ${row.userName}`,
    load: () => userPermissionList(row.id),
    save: nextRules => userPermissionSave(row.id, nextRules)
  })
}

onMounted(async () => {
  const [list] = await Promise.all([roleList(), load()])
  roles.value = list
})
</script>

<template>
  <AppPage>
    <template #right>
      <ElInput
        v-model="query.keys"
        class="user-page__search"
        placeholder="搜索账号 / 姓名"
        clearable
        @keyup.enter="search"
        @clear="search"
      />
      <ElButton type="primary" @click="openCreate">新增用户</ElButton>
    </template>

    <ElTable v-loading="loading" :data="rows" row-key="id" stripe class="user-page__table">
      <ElTableColumn type="index" label="#" width="60" />
      <ElTableColumn prop="userName" label="账号" min-width="120" />
      <ElTableColumn prop="realName" label="姓名" min-width="120" />
      <ElTableColumn label="状态" width="90">
        <template #default="{ row }">
          <ElTag :type="row.isUse ? 'success' : 'danger'" effect="dark">
            {{ row.isUse ? '正常' : '停用' }}
          </ElTag>
        </template>
      </ElTableColumn>
      <ElTableColumn label="所属组" min-width="130">
        <template #default="{ row }">
          <RoleTag :name="row.roleName" :type="row.roleType ?? row.type" />
        </template>
      </ElTableColumn>
      <ElTableColumn prop="updatedAt" label="更新时间" min-width="170" />
      <ElTableColumn label="操作" width="190" fixed="right">
        <template #default="{ row }">
          <UserRowActions :row="row as UserListRow" @edit="openEdit" @rules="openRules" @remove="remove" />
        </template>
      </ElTableColumn>
    </ElTable>

    <ElPagination
      v-model:current-page="query.pageNo"
      v-model:page-size="query.pageSize"
      class="user-page__pager"
      background
      layout="total, sizes, prev, pager, next"
      :total="total"
      :page-sizes="[10, 20, 50]"
      @current-change="load"
      @size-change="search"
    />

    <UserEditDialog
      v-model="editVisible"
      :user="editing"
      :roles="assignableRoles"
      :saving="saving"
      @submit="save"
    />
    <PermissionRulesDialog
      v-model="rulesVisible"
      :title="rulesTitle"
      :rules="rules"
      :catalog="catalog"
      :saving="rulesSaving"
      @save="saveRules"
    />
  </AppPage>
</template>

<style scoped lang="scss">
.user-page {
  &__search {
    width: 220px;
  }

  &__table {
    border-radius: 12px;
    overflow: hidden;
  }

  &__pager {
    margin-top: 16px;
    justify-content: flex-end;
  }
}
</style>
