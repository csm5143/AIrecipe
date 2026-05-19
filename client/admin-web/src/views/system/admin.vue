<template>
  <div class="page-container">
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">管理员</h2>
        <p class="text-muted">管理后台管理员账号</p>
      </div>
      <el-button v-if="isSuperAdmin" type="primary" @click="handleAddAdmin">
        <el-icon><Plus /></el-icon>
        添加管理员
      </el-button>
    </div>

    <div class="card-container">
      <div class="filter-section">
        <div class="filter-left">
          <el-input
            v-model="filters.keyword"
            placeholder="搜索用户名/昵称..."
            clearable
            style="width: 240px"
            :prefix-icon="Search"
            @keyup.enter="handleSearch"
            @clear="handleSearch"
          />
        </div>
        <el-button type="primary" @click="handleSearch">
          <el-icon><Search /></el-icon>
          搜索
        </el-button>
      </div>

      <el-table :data="tableData" v-loading="loading" row-key="id">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="管理员" min-width="200">
          <template #default="{ row }">
            <div class="admin-info">
              <el-avatar :size="40" :src="row.avatar" class="admin-avatar">
                {{ row.nickname?.charAt(0) || row.username?.charAt(0) }}
              </el-avatar>
              <div class="admin-detail">
                <span class="admin-name">{{ row.nickname || row.username }}</span>
                <span class="admin-username">@{{ row.username }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="role" label="角色" width="120" align="center">
          <template #default="{ row }">
            <span class="role-pill" :class="getRoleClass(row.role)">
              {{ getRoleText(row.role) }}
            </span>
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
            <span class="text-muted text-small">{{ row.lastLoginAt ? formatTime(row.lastLoginAt) : '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="120" align="center">
          <template #default="{ row }">
            <span class="text-muted text-small">{{ formatDate(row.createdAt) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button type="primary" link @click="handleEdit(row)">
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>
              <el-button type="warning" link @click="handleResetPassword(row)">
                <el-icon><Key /></el-icon>
                重置密码
              </el-button>
              <el-button
                type="danger"
                link
                @click="handleDelete(row)"
                :disabled="row.role === 'SUPER_ADMIN' || row.id === userStore.profile?.id || !isSuperAdmin"
              >
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-footer">
        <span class="total-info">共 {{ pagination.total }} 条</span>
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50]"
          layout="sizes, prev, pager, next"
          background
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
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
        <el-form-item label="角色" prop="role">
          <el-select v-model="form.role" placeholder="选择角色" style="width: 100%">
            <el-option label="超级管理员" value="SUPER_ADMIN" />
            <el-option label="管理员" value="ADMIN" />
            <el-option label="编辑" value="EDITOR" />
            <el-option label="审核员" value="AUDITOR" />
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
        <el-form-item label="头像">
          <div class="admin-avatar-upload">
            <el-upload
              action="#"
              :auto-upload="true"
              :show-file-list="false"
              accept="image/*"
              :before-upload="(file: File) => { handleAvatarChange(file); return false; }"
            >
              <img v-if="form.avatar" :src="form.avatar" class="avatar-preview" />
              <div v-else class="avatar-placeholder">
                <el-icon><Upload /></el-icon>
                <span>上传头像</span>
              </div>
            </el-upload>
            <div v-if="avatarUploading" class="upload-mask">
              <el-icon class="is-loading"><Upload /></el-icon>
              <span>上传中...</span>
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>

    <!-- 重置密码对话框 -->
    <el-dialog v-model="resetPasswordVisible" title="重置密码" width="400px">
      <el-form ref="resetFormRef" :model="resetForm" :rules="resetRules" label-position="top">
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="resetForm.newPassword" type="password" placeholder="请输入新密码（至少6位）" show-password />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="resetForm.confirmPassword" type="password" placeholder="请再次输入新密码" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="resetPasswordVisible = false">取消</el-button>
        <el-button type="primary" :loading="resetSaving" @click="handleDoResetPassword">确认重置</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { Plus, Edit, Delete, Key, Search, Upload } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { adminApi } from '@/api/admin';
import { useUserStore } from '@/store/modules/user';
import { usePermission } from '@/composables/usePermission';
import { uploadAdminAvatar } from '@/api/upload';
import { usePreferences } from '@/composables/usePreferences';

const { defaultPageSize, formatDateTime } = usePreferences();
const router = useRouter();
const userStore = useUserStore();
const { isSuperAdmin } = usePermission();

const loading = ref(false);
const dialogVisible = ref(false);
const resetPasswordVisible = ref(false);
const saving = ref(false);
const resetSaving = ref(false);
const isEdit = ref(false);
const formRef = ref();
const resetFormRef = ref();
const currentAdminId = ref<number>(0);
const avatarUploading = ref(false);

const filters = reactive({ keyword: '' });

const pagination = reactive({ page: 1, pageSize: defaultPageSize(), total: 0 });
const tableData = ref<any[]>([]);

const form = reactive({
  id: 0 as number,
  username: '',
  nickname: '',
  role: 'ADMIN',
  password: '',
  status: 'ACTIVE',
  avatar: '',
});

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度 3-20 个字符', trigger: 'blur' },
  ],
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入初始密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' },
  ],
};

const resetForm = reactive({
  newPassword: '',
  confirmPassword: '',
});

const resetRules = {
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (_: any, value: string, callback: any) => {
        if (value !== resetForm.newPassword) {
          callback(new Error('两次输入的密码不一致'));
        } else {
          callback();
        }
      },
      trigger: 'blur',
    },
  ],
};

function formatDate(iso: string) {
  return formatDateTime(iso);
}

function getRoleText(role: string) {
  const map: Record<string, string> = {
    SUPER_ADMIN: '超级管理员',
    ADMIN: '管理员',
    EDITOR: '编辑',
    AUDITOR: '审核员',
  };
  return map[role] || role;
}

function getRoleClass(role: string) {
  return role.toLowerCase().replace('_', '-');
}

async function fetchAdmins() {
  loading.value = true;
  try {
    const res = await adminApi.list({
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: filters.keyword || undefined,
    });
    tableData.value = res.data?.list || [];
    pagination.total = res.data?.total || 0;
  } catch {
    ElMessage.error('加载管理员列表失败');
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  pagination.page = 1;
  fetchAdmins();
}

function handlePageChange(page: number) {
  pagination.page = page;
  fetchAdmins();
}

function handleSizeChange(size: number) {
  pagination.pageSize = size;
  pagination.page = 1;
  fetchAdmins();
}

function handleAddAdmin() {
  if (!isSuperAdmin.value) return;
  isEdit.value = false;
  Object.assign(form, {
    id: 0,
    username: '',
    nickname: '',
    role: 'ADMIN',
    password: '',
    status: 'ACTIVE',
  });
  dialogVisible.value = true;
}

function handleEdit(row: any) {
  if (!isSuperAdmin.value) return;
  isEdit.value = true;
  Object.assign(form, {
    id: row.id,
    username: row.username,
    nickname: row.nickname || '',
    role: row.role,
    password: '',
    status: row.status,
    avatar: row.avatar || '',
  });
  dialogVisible.value = true;
}

async function handleAvatarChange(file: File) {
  avatarUploading.value = true;
  try {
    const result = await uploadAdminAvatar(file as any);
    const uploadData = (result as any).data;
    const avatarUrl: string = uploadData?.url || '';
    if (!avatarUrl) {
      throw new Error('头像上传响应中未找到 URL');
    }
    form.avatar = avatarUrl;
    // 同步更新列表中的头像
    const row = tableData.value.find(r => r.id === form.id);
    if (row) (row as any).avatar = avatarUrl;
    ElMessage.success('头像更新成功');
  } catch {
    ElMessage.error('头像上传失败');
  } finally {
    avatarUploading.value = false;
  }
}

async function handleSave() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  saving.value = true;
  try {
    if (isEdit.value) {
      await adminApi.update(form.id, {
        nickname: form.nickname,
        role: form.role,
        status: form.status,
        avatar: form.avatar || undefined,
      });
      ElMessage.success('更新成功');
    } else {
      await adminApi.create({
        username: form.username,
        password: form.password,
        nickname: form.nickname,
        role: form.role,
        status: form.status,
      });
      ElMessage.success('添加成功');
    }
    dialogVisible.value = false;
    fetchAdmins();
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '操作失败');
  } finally {
    saving.value = false;
  }
}

async function handleStatusChange(row: any) {
  try {
    await adminApi.update(row.id, { status: row.status });
    const action = row.status === 'ACTIVE' ? '启用' : '禁用';
    ElMessage.success(`管理员已${action}`);
  } catch {
    ElMessage.error('状态更新失败');
    row.status = row.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
  }
}

function handleResetPassword(row: any) {
  currentAdminId.value = row.id;
  resetForm.newPassword = '';
  resetForm.confirmPassword = '';
  resetPasswordVisible.value = true;
}

async function handleDoResetPassword() {
  const valid = await resetFormRef.value?.validate().catch(() => false);
  if (!valid) return;

  resetSaving.value = true;
  try {
    await adminApi.resetPassword(currentAdminId.value, resetForm.newPassword);
    ElMessage.success('密码重置成功');
    resetPasswordVisible.value = false;
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '重置失败');
  } finally {
    resetSaving.value = false;
  }
}

async function handleDelete(row: any) {
  if (!isSuperAdmin.value || row.role === 'SUPER_ADMIN') return;
  if (row.id === userStore.profile?.id) {
    ElMessage.warning('不能删除自己的账号');
    return;
  }
  await ElMessageBox.confirm(
    `确定要删除管理员「${row.nickname || row.username}」吗？删除后将进入回收站。`,
    '警告',
    { type: 'warning' }
  );
  try {
    await adminApi.delete(row.id);
    ElMessage.success('删除成功');
    fetchAdmins();
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '删除失败');
  }
}

onMounted(async () => {
  // 防御性鉴权：页面虽被路由守卫保护，但 token 刷新期间 profile 可能还未加载
  if (!isSuperAdmin.value) {
    const profile = userStore.profile || await userStore.fetchProfile().catch(() => null);
    if (!profile || profile.role !== 'SUPER_ADMIN') {
      ElMessage.error('此页面仅超级管理员可访问');
      router.push({ name: 'Dashboard' });
      return;
    }
  }
  fetchAdmins();
});
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

.filter-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--border-primary);

  .filter-left {
    display: flex;
    align-items: center;
    gap: 12px;
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

  &.auditor {
    background: rgba(212, 136, 14, 0.12);
    color: var(--color-warning);
  }
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 4px;
  justify-content: center;
}

.admin-avatar-upload {
  position: relative;
  width: 80px;

  .upload-mask {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    background: rgba(255,255,255,0.85);
    border-radius: var(--radius-md);
    font-family: var(--font-display);
    font-size: 11px;
    color: var(--cursor-orange);
    z-index: 1;
  }

  .avatar-preview {
    width: 80px;
    height: 80px;
    object-fit: cover;
    border-radius: var(--radius-md);
    cursor: pointer;
    border: 2px dashed var(--border-medium);
  }

  .avatar-placeholder {
    width: 80px;
    height: 80px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    background: var(--surface-300);
    border: 2px dashed var(--border-medium);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: border-color var(--transition-fast);

    &:hover { border-color: var(--cursor-orange); }

    .el-icon {
      font-size: 20px;
      color: rgba(38, 37, 30, 0.3);
    }

    span {
      font-family: var(--font-display);
      font-size: 11px;
      color: rgba(38, 37, 30, 0.5);
    }
  }
}

.table-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--border-primary);

  .total-info {
    font-family: var(--font-serif);
    font-size: 13px;
    color: rgba(38, 37, 30, 0.6);
  }
}
</style>
