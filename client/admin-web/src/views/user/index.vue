<template>
  <div class="page-container">
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">用户管理</h2>
        <p class="text-muted">管理平台注册用户</p>
      </div>
      <div class="header-actions">
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

    <!-- 用户详情对话框 -->
    <el-dialog v-model="detailVisible" title="用户详情" width="600px">
      <div v-if="currentUser" class="user-detail-modal">
        <div class="detail-header">
          <el-avatar :size="72" :src="currentUser.avatar" class="detail-avatar">
            {{ currentUser.nickname?.charAt(0) }}
          </el-avatar>
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
          <el-descriptions-item label="用户类型">{{ currentUser.userType || '普通用户' }}</el-descriptions-item>
        </el-descriptions>

        <div class="detail-section">
          <h4>健身目标</h4>
          <p class="text-muted">{{ currentUser.fitnessGoal || '未设置' }}</p>
        </div>

        <div class="detail-section">
          <h4>孩子信息</h4>
          <p class="text-muted">{{ currentUser.childInfo || '未设置' }}</p>
        </div>
      </div>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button type="primary" @click="handleEditUser">编辑用户</el-button>
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
  ChatDotRound
} from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';

const loading = ref(false);
const detailVisible = ref(false);
const currentUser = ref<any>(null);
const selectedRows = ref<any[]>([]);

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

const tableData = ref([
  {
    id: 1001,
    nickname: '美食爱好者',
    avatar: 'https://picsum.photos/seed/user1/100/100',
    phone: '138****5678',
    gender: 'male',
    collectionCount: 45,
    feedbackCount: 3,
    status: 'ACTIVE',
    createdAt: '2024-01-15',
    lastLoginAt: '2024-01-20 14:30',
  },
  {
    id: 1002,
    nickname: '健康生活家',
    avatar: 'https://picsum.photos/seed/user2/100/100',
    phone: '139****1234',
    gender: 'female',
    collectionCount: 78,
    feedbackCount: 5,
    status: 'ACTIVE',
    createdAt: '2024-01-10',
    lastLoginAt: '2024-01-20 10:15',
  },
  {
    id: 1003,
    nickname: '健身达人',
    avatar: '',
    phone: '137****9012',
    gender: 'male',
    collectionCount: 156,
    feedbackCount: 1,
    status: 'ACTIVE',
    createdAt: '2024-01-05',
    lastLoginAt: '2024-01-19 20:45',
  },
  {
    id: 1004,
    nickname: '小厨娘',
    avatar: 'https://picsum.photos/seed/user4/100/100',
    phone: '136****3456',
    gender: 'female',
    collectionCount: 89,
    feedbackCount: 8,
    status: 'DISABLED',
    createdAt: '2024-01-01',
    lastLoginAt: '2024-01-15 09:00',
  },
]);

function handleSelectionChange(rows: any[]) {
  selectedRows.value = rows;
}

async function fetchUsers() {
  loading.value = true;
  try {
    // TODO: 调用 API
    pagination.total = tableData.value.length;
  } finally {
    loading.value = false;
  }
}

function handleDetail(row: any) {
  currentUser.value = row;
  detailVisible.value = true;
}

function handleEditUser() {
  ElMessage.info('编辑用户功能开发中');
}

async function handleStatusChange(row: any) {
  const action = row.status === 'ACTIVE' ? '启用' : '禁用';
  ElMessage.success(`用户已${action}`);
}

async function handleDelete(row: any) {
  await ElMessageBox.confirm(`确定要删除用户「${row.nickname}」吗？删除后无法恢复。`, '警告', {
    type: 'warning',
  });
  ElMessage.success('删除成功');
  fetchUsers();
}

function handleExport() {
  ElMessage.success('导出功能开发中');
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

    .detail-avatar {
      flex-shrink: 0;
      background: var(--surface-400);
      color: var(--cursor-dark);
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
</style>
