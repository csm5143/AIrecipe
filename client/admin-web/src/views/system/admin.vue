<template>
  <div class="page-container">
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">管理员</h2>
        <p class="text-muted">管理后台管理员账号</p>
      </div>
      <el-button type="primary" @click="handleAddAdmin">
        <el-icon><Plus /></el-icon>
        添加管理员
      </el-button>
    </div>

    <div class="card-container">
      <el-table :data="tableData" v-loading="loading" row-key="id">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="管理员" min-width="200">
          <template #default="{ row }">
            <div class="admin-info">
              <el-avatar :size="40" :src="row.avatar" class="admin-avatar">
                {{ row.nickname?.charAt(0) }}
              </el-avatar>
              <div class="admin-detail">
                <span class="admin-name">{{ row.nickname }}</span>
                <span class="admin-username">@{{ row.username }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="role" label="角色" width="120" align="center">
          <template #default="{ row }">
            <span class="role-pill" :class="row.role.toLowerCase().replace('_', '-')">
              {{ getRoleText(row.role) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="email" label="邮箱" width="180">
          <template #default="{ row }">
            <span class="text-mono text-small">{{ row.email }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              active-value="ACTIVE"
              inactive-value="DISABLED"
              @change="handleStatusChange(row)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="lastLoginAt" label="最后登录" width="160" align="center">
          <template #default="{ row }">
            <span class="text-muted text-small">{{ row.lastLoginAt || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="120" align="center">
          <template #default="{ row }">
            <span class="text-muted text-small">{{ row.createdAt }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right" align="center">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button type="primary" link @click="handleEdit(row)">
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>
              <el-button
                type="danger"
                link
                @click="handleDelete(row)"
                :disabled="row.role === 'SUPER_ADMIN'"
              >
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 添加/编辑管理员对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑管理员' : '添加管理员'"
      width="500px"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="form.nickname" placeholder="请输入昵称" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="form.role" placeholder="选择角色" style="width: 100%">
            <el-option label="超级管理员" value="SUPER_ADMIN" />
            <el-option label="管理员" value="ADMIN" />
            <el-option label="编辑" value="EDITOR" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="!isEdit" label="初始密码" prop="password">
          <el-input v-model="form.password" type="password" placeholder="请输入初始密码" show-password />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio value="ACTIVE">启用</el-radio>
            <el-radio value="DISABLED">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { Plus, Edit, Delete } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';

const loading = ref(false);
const dialogVisible = ref(false);
const isEdit = ref(false);
const formRef = ref();

const form = reactive({
  id: 0,
  username: '',
  nickname: '',
  email: '',
  role: 'ADMIN',
  password: '',
  status: 'ACTIVE',
});

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度 3-20 个字符', trigger: 'blur' },
  ],
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' },
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' },
  ],
  password: [
    { required: true, message: '请输入初始密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' },
  ],
};

const tableData = ref([
  {
    id: 1,
    username: 'admin',
    nickname: '超级管理员',
    email: 'admin@airecipe.com',
    avatar: '',
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
    lastLoginAt: '2024-01-20 10:30',
    createdAt: '2023-01-01',
  },
  {
    id: 2,
    username: 'editor01',
    nickname: '内容编辑',
    email: 'editor@airecipe.com',
    avatar: '',
    role: 'EDITOR',
    status: 'ACTIVE',
    lastLoginAt: '2024-01-19 15:20',
    createdAt: '2023-06-15',
  },
  {
    id: 3,
    username: 'manager01',
    nickname: '运营经理',
    email: 'manager@airecipe.com',
    avatar: '',
    role: 'ADMIN',
    status: 'ACTIVE',
    lastLoginAt: '2024-01-18 09:45',
    createdAt: '2023-08-20',
  },
  {
    id: 4,
    username: 'editor02',
    nickname: '食谱编辑',
    email: 'recipe@airecipe.com',
    avatar: '',
    role: 'EDITOR',
    status: 'DISABLED',
    lastLoginAt: '2024-01-10 14:00',
    createdAt: '2023-09-01',
  },
]);

function getRoleText(role: string) {
  const map: Record<string, string> = {
    SUPER_ADMIN: '超级管理员',
    ADMIN: '管理员',
    EDITOR: '编辑',
  };
  return map[role] || role;
}

function handleAddAdmin() {
  isEdit.value = false;
  Object.assign(form, {
    id: 0,
    username: '',
    nickname: '',
    email: '',
    role: 'ADMIN',
    password: '',
    status: 'ACTIVE',
  });
  dialogVisible.value = true;
}

function handleEdit(row: any) {
  isEdit.value = true;
  Object.assign(form, row);
  dialogVisible.value = true;
}

async function handleSave() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  if (isEdit.value) {
    const index = tableData.value.findIndex(a => a.id === form.id);
    if (index > -1) {
      tableData.value[index] = { ...tableData.value[index], ...form };
    }
  } else {
    tableData.value.unshift({
      ...form,
      id: Date.now(),
      avatar: '',
      lastLoginAt: '',
      createdAt: new Date().toISOString().split('T')[0],
    });
  }

  ElMessage.success('保存成功');
  dialogVisible.value = false;
}

async function handleDelete(row: any) {
  await ElMessageBox.confirm(`确定要删除管理员「${row.nickname}」吗？`, '警告', {
    type: 'warning',
  });
  tableData.value = tableData.value.filter(a => a.id !== row.id);
  ElMessage.success('删除成功');
}

function handleStatusChange(row: any) {
  const action = row.status === 'ACTIVE' ? '启用' : '禁用';
  ElMessage.success(`管理员已${action}`);
}
</script>

<style scoped lang="scss">
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 24px;

  .header-left {
    .page-title {
      font-family: var(--font-display);
      font-size: 22px;
      font-weight: 400;
      letter-spacing: -0.55px;
      color: var(--cursor-dark);
      margin-bottom: 4px;
    }
  }
}

.admin-info {
  display: flex;
  align-items: center;
  gap: 12px;

  .admin-avatar {
    flex-shrink: 0;
    background: var(--surface-400);
    color: var(--cursor-dark);
  }

  .admin-detail {
    display: flex;
    flex-direction: column;
    gap: 2px;

    .admin-name {
      font-family: var(--font-display);
      font-size: 14px;
      color: var(--cursor-dark);
    }

    .admin-username {
      font-family: var(--font-mono);
      font-size: 12px;
      color: rgba(38, 37, 30, 0.4);
    }
  }
}

.role-pill {
  display: inline-flex;
  padding: 4px 12px;
  border-radius: var(--radius-pill);
  font-family: var(--font-display);
  font-size: 11px;
  background: var(--surface-400);
  color: rgba(38, 37, 30, 0.6);

  &.super-admin {
    background: rgba(245, 78, 0, 0.12);
    color: var(--cursor-orange);
  }

  &.admin {
    background: rgba(74, 125, 191, 0.12);
    color: var(--color-info);
  }

  &.editor {
    background: rgba(31, 138, 101, 0.12);
    color: var(--color-success);
  }
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 4px;
  justify-content: center;
}
</style>
