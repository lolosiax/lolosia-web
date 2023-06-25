<script setup lang="ts">
import { onMounted } from 'vue'
import { rolePermissionList, rolePermissionSave } from '@/core/api/permission'
import type { RoleRow } from '@/core/api/role'
import AppPage from '@/core/ui/AppPage.vue'
import PermissionRulesDialog from '../components/PermissionRulesDialog.vue'
import RoleEditDialog from '../components/RoleEditDialog.vue'
import RoleRowActions from '../components/RoleRowActions.vue'
import { useRoleAdmin } from '../composables/use-role-admin'
import { useRulesEditor } from '../composables/use-rules-editor'

defineOptions({ name: 'SystemRole' })

const {
  rows,
  total,
  loading,
  saving,
  query,
  allRoles,
  editing,
  editVisible,
  load,
  loadAll,
  search,
  openCreate,
  openEdit,
  save,
  remove
} = useRoleAdmin()

const {
  visible: rulesVisible,
  saving: rulesSaving,
  title: rulesTitle,
  rules,
  catalog,
  open: openRulesEditor,
  save: saveRules
} = useRulesEditor()

function parentName(row: RoleRow): string {
  if (!row.parentId) return '根基组'
  return allRoles.value.find(role => role.id === row.parentId)?.roleName ?? String(row.parentId)
}

async function openRules(row: RoleRow): Promise<void> {
  await openRulesEditor({
    title: `组权限 · ${row.roleName ?? row.id}`,
    load: () => rolePermissionList(row.id),
    save: nextRules => rolePermissionSave(row.id, nextRules)
  })
}

onMounted(async () => {
  await Promise.all([load(), loadAll()])
})
</script>

<template>
  <AppPage>
    <template #right>
      <ElInput
        v-model="query.roleName"
        class="role-page__search"
        placeholder="搜索组名称"
        clearable
        @keyup.enter="search"
        @clear="search"
      />
      <ElButton type="primary" @click="openCreate">新增权限组</ElButton>
    </template>

    <ElTable v-loading="loading" :data="rows" row-key="id" stripe class="role-page__table">
      <ElTableColumn prop="id" label="ID" width="70" />
      <ElTableColumn prop="roleName" label="组名称" min-width="140" />
      <ElTableColumn prop="type" label="组标识" min-width="120" />
      <ElTableColumn label="父组" min-width="120">
        <template #default="{ row }">{{ parentName(row as RoleRow) }}</template>
      </ElTableColumn>
      <ElTableColumn prop="createdAt" label="创建时间" min-width="170" />
      <ElTableColumn label="操作" width="190" fixed="right">
        <template #default="{ row }">
          <RoleRowActions :row="row as RoleRow" @edit="openEdit" @rules="openRules" @remove="remove" />
        </template>
      </ElTableColumn>
    </ElTable>

    <ElPagination
      v-model:current-page="query.pageNo"
      v-model:page-size="query.pageSize"
      class="role-page__pager"
      background
      layout="total, sizes, prev, pager, next"
      :total="total"
      :page-sizes="[10, 20, 50]"
      @current-change="load"
      @size-change="search"
    />

    <RoleEditDialog v-model="editVisible" :role="editing" :roles="allRoles" :saving="saving" @submit="save" />
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
.role-page {
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
