<template>
  <div class="page-container">
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">用户管理</h2>
        <p class="text-muted">管理平台注册用户</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" :icon="Plus" @click="showCreateDialog = true">新增用户</el-button>
        <el-button :icon="Download" @click="handleExport">导出</el-button>
        <el-button :icon="Refresh" @click="fetchUsers">刷新</el-button>
      </div>
    </div>

    <div class="card-container">
      <div class="filter-section">
        <div class="filter-left">
          <el-input
            v-model="filters.keyword"
            placeholder="搜索用户昵称或手机号..."
            clearable
            style="width: 260px"
            :prefix-icon="Search"
          />
          <el-select v-model="filters.gender" placeholder="性别" clearable style="width: 100px">
            <el-option label="全部" value="" />
            <el-option label="男" value="male" />
            <el-option label="女" value="female" />
          </el-select>
          <el-select v-model="filters.status" placeholder="状态" clearable style="width: 100px">
            <el-option label="全部" value="" />
            <el-option label="正常" value="ACTIVE" />
            <el-option label="禁用" value="DISABLED" />
          </el-select>
        </div>
        <el-button type="primary" @click="fetchUsers">
          <el-icon><Search /></el-icon>
          搜索
        </el-button>
      </div>

      <el-table
        v-loading="loading"
        :data="tableData"
        row-key="id"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="50" />
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="用户信息" min-width="200">
          <template #default="{ row }">
            <div class="user-info">
              <el-avatar :size="40" :src="row.avatar" class="user-avatar">
                {{ row.nickname?.charAt(0) }}
              </el-avatar>
              <div class="user-detail">
                <span class="user-name">{{ row.nickname || '未设置昵称' }}</span>
                <span class="user-id">ID: {{ row.id }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="手机号" width="130">
          <template #default="{ row }">
            <span class="text-mono">{{ row.phone || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="gender" label="性别" width="70" align="center">
          <template #default="{ row }">
            <span class="cursor-pill" :class="row.gender === 'male' ? 'info' : row.gender === 'female' ? 'success' : ''">
              {{ row.gender === 'male' ? '男' : row.gender === 'female' ? '女' : '-' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="数据统计" width="180" align="center">
          <template #default="{ row }">
            <div class="stats-mini">
              <span title="收藏数">
                <el-icon><Collection /></el-icon>
                {{ row.collectionCount }}
              </span>
              <span title="反馈数">
                <el-icon><ChatDotRound /></el-icon>
                {{ row.feedbackCount }}
              </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              active-value="ACTIVE"
              inactive-value="DISABLED"
              @change="handleStatusChange(row)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="注册时间" width="120" align="center">
          <template #default="{ row }">
            <span class="text-muted text-small">{{ row.createdAt }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right" align="center">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button type="primary" link @click="handleDetail(row)">
                <el-icon><View /></el-icon>
                详情
              </el-button>
              <el-button type="danger" link @click="handleDelete(row)">
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
          :page-sizes="[10, 20, 50, 100]"
          layout="sizes, prev, pager, next"
          background
        />
      </div>
    </div>

    <!-- 新增用户对话框 -->
    <el-dialog v-model="showCreateDialog" title="新增用户" width="520px" destroy-on-close>
      <el-form :model="createForm" :rules="createRules" ref="createFormRef" label-width="80px">
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="createForm.nickname" placeholder="请输入用户昵称" maxlength="30" show-word-limit />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="createForm.phone" placeholder="请输入手机号" maxlength="11" />
        </el-form-item>
        <el-form-item label="登录密码" prop="password">
          <el-input v-model="createForm.password" type="password" placeholder="请输入登录密码（可选）" show-password />
        </el-form-item>
        <el-form-item label="性别" prop="gender">
          <el-select v-model="createForm.gender" placeholder="请选择性别" style="width: 100%">
            <el-option label="未设置" value="" />
            <el-option label="男" value="male" />
            <el-option label="女" value="female" />
          </el-select>
        </el-form-item>
        <el-form-item label="头像 URL" prop="avatar">
          <el-input v-model="createForm.avatar" placeholder="请输入头像图片地址（可选）" />
        </el-form-item>
        <el-form-item label="个人简介" prop="bio">
          <el-input v-model="createForm.bio" type="textarea" placeholder="请输入个人简介（可选）" :rows="3" maxlength="200" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" :loading="creating" @click="handleCreate">确认创建</el-button>
      </template>
    </el-dialog>

    <!-- 用户详情对话框 -->
    <el-dialog v-model="detailVisible" title="用户详情" width="600px">
      <div v-if="currentUser" class="user-detail-modal">
        <div class="detail-header">
          <el-upload
            action="#"
            :auto-upload="true"
            :show-file-list="false"
            accept="image/*"
            :before-upload="(file: File) => { handleAvatarChange(file); return false; }"
          >
            <el-avatar :size="72" :src="currentUser.avatar" class="detail-avatar uploadable-avatar">
              {{ currentUser.nickname?.charAt(0) }}
            </el-avatar>
            <div v-if="avatarUploading" class="avatar-upload-mask">
              <el-icon class="is-loading"><Upload /></el-icon>
            </div>
          </el-upload>
          <div class="detail-info">
            <h3>{{ currentUser.nickname || '未设置昵称' }}</h3>
            <p class="text-muted">ID: {{ currentUser.id }}</p>
          </div>
        </div>

        <el-descriptions :column="2" border class="detail-descriptions">
          <el-descriptions-item label="手机号">{{ currentUser.phone || '-' }}</el-descriptions-item>
          <el-descriptions-item label="性别">{{ currentUser.gender === 'male' ? '男' : currentUser.gender === 'female' ? '女' : '-' }}</el-descriptions-item>
          <el-descriptions-item label="注册时间">{{ currentUser.createdAt }}</el-descriptions-item>
          <el-descriptions-item label="最后登录">{{ currentUser.lastLoginAt || '-' }}</el-descriptions-item>
          <el-descriptions-item label="收藏数">{{ currentUser.collectionCount }}</el-descriptions-item>
          <el-descriptions-item label="反馈数">{{ currentUser.feedbackCount }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="currentUser.status === 'ACTIVE' ? 'success' : 'danger'" size="small">
              {{ currentUser.status === 'ACTIVE' ? '正常' : '禁用' }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <div class="detail-section">
          <h4>个人简介</h4>
          <p class="text-muted">{{ currentUser.bio || '未设置' }}</p>
        </div>
      </div>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button type="primary" @click="handleEditUser">编辑用户</el-button>
      </template>
    </el-dialog>

    <!-- 导出弹窗 -->
    <el-dialog v-model="exportDialogVisible" title="导出用户" width="480px" :close-on-click-modal="false">
      <div class="export-dialog-body">
        <p class="export-tip">
          共 <strong>{{ pagination.total }}</strong> 条用户数据，将按照当前筛选条件导出
        </p>
        <div class="export-format-list">
          <label
            class="export-format-item"
            :class="{ active: exportFormat === 'xlsx' }"
            @click="exportFormat = 'xlsx'"
          >
            <input type="radio" name="exportFormat" value="xlsx" v-model="exportFormat" hidden />
            <div class="format-icon xlsx-icon"><span>Excel</span></div>
            <div class="format-info">
              <span class="format-name">Excel 格式</span>
              <span class="format-ext">.xlsx</span>
              <span class="format-desc">支持公式、筛选，适合数据分析</span>
            </div>
            <div class="format-check" v-if="exportFormat === 'xlsx'"><el-icon><Check /></el-icon></div>
          </label>

          <label
            class="export-format-item"
            :class="{ active: exportFormat === 'csv' }"
            @click="exportFormat = 'csv'"
          >
            <input type="radio" name="exportFormat" value="csv" v-model="exportFormat" hidden />
            <div class="format-icon csv-icon"><span>CSV</span></div>
            <div class="format-info">
              <span class="format-name">CSV 格式</span>
              <span class="format-ext">.csv</span>
              <span class="format-desc">体积更小，兼容所有编辑器</span>
            </div>
            <div class="format-check" v-if="exportFormat === 'csv'"><el-icon><Check /></el-icon></div>
          </label>

          <label
            class="export-format-item"
            :class="{ active: exportFormat === 'json' }"
            @click="exportFormat = 'json'"
          >
            <input type="radio" name="exportFormat" value="json" v-model="exportFormat" hidden />
            <div class="format-icon json-icon"><span>JSON</span></div>
            <div class="format-info">
              <span class="format-name">JSON 数据</span>
              <span class="format-ext">.json</span>
              <span class="format-desc">保留完整结构，适合程序导入</span>
            </div>
            <div class="format-check" v-if="exportFormat === 'json'"><el-icon><Check /></el-icon></div>
          </label>
        </div>
      </div>
      <template #footer>
        <el-button @click="exportDialogVisible = false" :disabled="exporting">取消</el-button>
        <el-button type="primary" :loading="exporting" @click="handleConfirm">
          确认导出
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import {
  Search,
  Refresh,
  Download,
  View,
  Delete,
  Collection,
  ChatDotRound,
  Plus,
  Upload,
  Check,
} from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { userApi, type UserRow } from '@/api/user';
import { uploadAvatar } from '@/api/upload';
import { useExport, downloadFile } from '@/composables/useExport';

const loading = ref(false);
const detailVisible = ref(false);
const showCreateDialog = ref(false);
const creating = ref(false);
const currentUser = ref<UserRow | null>(null);
const selectedRows = ref<any[]>([]);
const avatarUploading = ref(false);
const { exportDialogVisible, exportFormat, exporting, showExportDialog, handleConfirm } = useExport();

const createForm = reactive({
  nickname: '',
  phone: '',
  password: '',
  gender: '' as '' | 'male' | 'female',
  avatar: '',
  bio: '',
});

const createRules = {
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' },
  ],
};

const createFormRef = ref<any>(null);

const filters = reactive({
  keyword: '',
  gender: '',
  status: '',
});

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
});

const tableData = ref<UserRow[]>([]);

function handleSelectionChange(rows: any[]) {
  selectedRows.value = rows;
}

async function fetchUsers() {
  loading.value = true;
  try {
    const res = await userApi.list({
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: filters.keyword || undefined,
      gender: filters.gender || undefined,
      status: filters.status || undefined,
    });
    tableData.value = res.data?.list || [];
    pagination.total = res.data?.total || 0;
  } catch (error) {
    console.error('获取用户列表失败:', error);
  } finally {
    loading.value = false;
  }
}

async function handleAvatarChange(file: File) {
  if (!currentUser.value) return;
  avatarUploading.value = true;
  try {
    const result = await uploadAvatar(file as any, String(currentUser.value.id));
    const avatarUrl = result.url || (result.data as any)?.url || '';
    currentUser.value.avatar = avatarUrl;
    // 同步更新列表中的头像
    const row = tableData.value.find(r => r.id === currentUser.value!.id);
    if (row) row.avatar = avatarUrl;
    ElMessage.success('头像更新成功');
  } catch {
    ElMessage.error('头像上传失败');
  } finally {
    avatarUploading.value = false;
  }
}

function handleDetail(row: any) {
  currentUser.value = row;
  detailVisible.value = true;
}

function handleEditUser() {
  ElMessage.info('编辑用户功能开发中');
}

async function handleStatusChange(row: UserRow) {
  try {
    await userApi.updateStatus(row.id, row.status);
    const action = row.status === 'ACTIVE' ? '启用' : '禁用';
    ElMessage.success(`用户已${action}`);
  } catch {
    // revert UI
    row.status = row.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
  }
}

async function handleDelete(row: UserRow) {
  await ElMessageBox.confirm(`确定要删除用户「${row.nickname}」吗？删除后无法恢复。`, '警告', {
    type: 'warning',
  });
  await userApi.delete(row.id);
  ElMessage.success('删除成功');
  fetchUsers();
}

function handleExport() {
  const params = {
    keyword: filters.keyword || undefined,
    gender: filters.gender || undefined,
    status: filters.status || undefined,
  };
  showExportDialog({
    name: '用户',
    total: pagination.total,
    exportFn: (format) => downloadFile('/users/export', params, format),
  });
}

async function handleCreate() {
  if (!createForm.nickname && !createForm.phone) {
    ElMessage.warning('手机号或昵称至少填写一项');
    return;
  }
  try {
    await createFormRef.value.validate();
  } catch {
    return;
  }
  creating.value = true;
  try {
    const payload: any = {};
    if (createForm.nickname) payload.nickname = createForm.nickname;
    if (createForm.phone) payload.phone = createForm.phone;
    if (createForm.password) payload.password = createForm.password;
    if (createForm.gender) payload.gender = createForm.gender.toUpperCase();
    if (createForm.avatar) payload.avatar = createForm.avatar;
    if (createForm.bio) payload.bio = createForm.bio;

    await userApi.create(payload);
    ElMessage.success('用户创建成功');
    showCreateDialog.value = false;
    Object.assign(createForm, { nickname: '', phone: '', password: '', gender: '', avatar: '', bio: '' });
    fetchUsers();
  } catch (error: any) {
    ElMessage.error(error?.message || '创建失败');
  } finally {
    creating.value = false;
  }
}

onMounted(() => {
  fetchUsers();
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

  .header-actions {
    display: flex;
    gap: 12px;
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

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;

  .user-avatar {
    flex-shrink: 0;
    background: var(--surface-400);
    color: var(--cursor-dark);
  }

  .user-detail {
    display: flex;
    flex-direction: column;
    gap: 2px;

    .user-name {
      font-family: var(--font-display);
      font-size: 14px;
      color: var(--cursor-dark);
    }

    .user-id {
      font-family: var(--font-mono);
      font-size: 11px;
      color: rgba(38, 37, 30, 0.4);
    }
  }
}

.stats-mini {
  display: flex;
  justify-content: center;
  gap: 16px;

  span {
    display: flex;
    align-items: center;
    gap: 4px;
    font-family: var(--font-mono);
    font-size: 12px;
    color: rgba(38, 37, 30, 0.6);

    .el-icon {
      font-size: 14px;
    }
  }
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 4px;
  justify-content: center;
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

.user-detail-modal {
  .detail-header {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 24px;
    padding-bottom: 24px;
    border-bottom: 1px solid var(--border-primary);
    position: relative;

    .detail-avatar {
      flex-shrink: 0;
      background: var(--surface-400);
      color: var(--cursor-dark);
    }

    .uploadable-avatar {
      cursor: pointer;
      transition: opacity var(--transition-fast);
      &:hover { opacity: 0.8; }
    }

    .avatar-upload-mask {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      background: rgba(0,0,0,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
    }

    .detail-info {
      h3 {
        font-family: var(--font-display);
        font-size: 20px;
        font-weight: 400;
        color: var(--cursor-dark);
        margin-bottom: 4px;
      }
    }
  }

  .detail-descriptions {
    margin-bottom: 20px;
  }

  .detail-section {
    padding: 16px;
    background: var(--surface-300);
    border-radius: var(--radius-md);
    margin-top: 16px;

    h4 {
      font-family: var(--font-display);
      font-size: 13px;
      color: rgba(38, 37, 30, 0.7);
      margin-bottom: 8px;
    }

    p {
      font-family: var(--font-serif);
      font-size: 14px;
    }
  }
}

// 导出弹窗
.export-dialog-body {
  padding: 8px 4px;
}

.export-tip {
  color: rgba(38, 37, 30, 0.6);
  font-size: 13px;
  margin-bottom: 20px;

  strong {
    color: var(--cursor-orange);
    font-weight: 600;
  }
}

.export-format-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.export-format-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border: 1.5px solid var(--border-primary);
  border-radius: 10px;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
  user-select: none;

  &:hover {
    border-color: var(--cursor-orange);
    background: rgba(245, 111, 32, 0.04);
  }

  &.active {
    border-color: var(--cursor-orange);
    background: rgba(245, 111, 32, 0.06);

    .format-icon {
      opacity: 1;
    }
  }
}

.format-icon {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 13px;
  flex-shrink: 0;
  opacity: 0.7;
  transition: opacity 0.2s;
  color: #fff;

  &.xlsx-icon { background: #1d7a3d; }
  &.csv-icon { background: #3a6e38; }
  &.json-icon { background: #c47f17; }
}

.format-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.format-name {
  font-weight: 600;
  font-size: 14px;
  color: var(--cursor-dark);
  font-family: var(--font-display);
}

.format-ext {
  font-size: 11px;
  color: rgba(38, 37, 30, 0.4);
  font-family: monospace;
}

.format-desc {
  font-size: 12px;
  color: rgba(38, 37, 30, 0.5);
  margin-top: 2px;
}

.format-check {
  color: var(--cursor-orange);
  font-size: 18px;
  flex-shrink: 0;
}
</style>
