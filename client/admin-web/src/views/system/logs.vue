<template>
  <div class="page-container">
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">操作日志</h2>
        <p class="text-muted">查看所有管理员的操作记录</p>
      </div>
      <div class="header-actions">
        <el-button :icon="Download" @click="handleExport">导出</el-button>
        <el-button :icon="Refresh" @click="fetchLogs">刷新</el-button>
      </div>
    </div>

    <div class="card-container">
      <div class="filter-section">
        <div class="filter-left">
          <el-select v-model="filters.adminId" placeholder="选择管理员" clearable style="width: 140px">
            <el-option label="全部" value="" />
            <el-option label="超级管理员" value="1" />
            <el-option label="内容编辑" value="2" />
            <el-option label="运营经理" value="3" />
          </el-select>
          <el-select v-model="filters.module" placeholder="模块" clearable style="width: 120px">
            <el-option label="全部" value="" />
            <el-option label="用户" value="user" />
            <el-option label="食谱" value="recipe" />
            <el-option label="食材" value="ingredient" />
            <el-option label="收藏" value="collection" />
            <el-option label="内容" value="content" />
            <el-option label="系统" value="system" />
          </el-select>
          <el-date-picker
            v-model="filters.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 260px"
          />
        </div>
        <el-button type="primary" @click="fetchLogs">
          <el-icon><Search /></el-icon>
          搜索
        </el-button>
      </div>

      <el-table :data="tableData" v-loading="loading" size="small">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="管理员" width="150">
          <template #default="{ row }">
            <div class="admin-cell">
              <el-avatar :size="28" class="admin-avatar">
                {{ row.adminName?.charAt(0) }}
              </el-avatar>
              <span class="admin-name">{{ row.adminName }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="action" label="操作" width="120">
          <template #default="{ row }">
            <span class="action-pill" :class="getActionClass(row.action)">
              {{ getActionText(row.action) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="module" label="模块" width="100" align="center">
          <template #default="{ row }">
            <span class="cursor-pill info">{{ getModuleText(row.module) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="target" label="操作对象" min-width="200">
          <template #default="{ row }">
            <span class="target-text">{{ row.target }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="detail" label="详情" min-width="200" :show-overflow-tooltip="true">
          <template #default="{ row }">
            <span class="detail-text">{{ row.detail }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="ip" label="IP" width="130">
          <template #default="{ row }">
            <span class="text-mono text-small">{{ row.ip }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="时间" width="160" align="center">
          <template #default="{ row }">
            <span class="text-muted text-small">{{ row.createdAt }}</span>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-footer">
        <span class="total-info">共 {{ pagination.total }} 条记录</span>
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[20, 50, 100]"
          layout="sizes, prev, pager, next"
          background
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { Search, Refresh, Download } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

const loading = ref(false);

const filters = reactive({
  adminId: '',
  module: '',
  dateRange: null as [Date, Date] | null,
});

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
});

const tableData = ref([
  {
    id: 1001,
    adminId: 1,
    adminName: '超级管理员',
    action: 'create',
    module: 'recipe',
    target: '食谱：香煎牛排',
    detail: '创建了新食谱，分类：西餐，难度：中等',
    ip: '192.168.1.100',
    createdAt: '2024-01-20 14:30:25',
  },
  {
    id: 1002,
    adminId: 2,
    adminName: '内容编辑',
    action: 'update',
    module: 'content',
    target: 'Banner：春季养生食谱',
    detail: '修改了 Banner 图片和标题',
    ip: '192.168.1.101',
    createdAt: '2024-01-20 11:20:10',
  },
  {
    id: 1003,
    adminId: 1,
    adminName: '超级管理员',
    action: 'delete',
    module: 'user',
    target: '用户 ID: 1024',
    detail: '删除了违规用户',
    ip: '192.168.1.100',
    createdAt: '2024-01-20 10:15:33',
  },
  {
    id: 1004,
    adminId: 3,
    adminName: '运营经理',
    action: 'publish',
    module: 'content',
    target: '公告：新功能上线',
    detail: '发布了重要公告',
    ip: '192.168.1.102',
    createdAt: '2024-01-19 16:45:00',
  },
  {
    id: 1005,
    adminId: 2,
    adminName: '内容编辑',
    action: 'update',
    module: 'ingredient',
    target: '食材：番茄',
    detail: '更新了食材营养信息，热量：18kcal/100g',
    ip: '192.168.1.101',
    createdAt: '2024-01-19 14:30:22',
  },
  {
    id: 1006,
    adminId: 1,
    adminName: '超级管理员',
    action: 'login',
    module: 'system',
    target: '系统登录',
    detail: '管理员登录成功',
    ip: '192.168.1.100',
    createdAt: '2024-01-19 09:00:05',
  },
  {
    id: 1007,
    adminId: 3,
    adminName: '运营经理',
    action: 'update',
    module: 'recipe',
    target: '食谱：番茄炒蛋',
    detail: '审核通过，食谱已发布',
    ip: '192.168.1.102',
    createdAt: '2024-01-18 17:20:45',
  },
  {
    id: 1008,
    adminId: 2,
    adminName: '内容编辑',
    action: 'create',
    module: 'collection',
    target: '专题：减脂餐合集',
    detail: '创建了新的收藏专题',
    ip: '192.168.1.101',
    createdAt: '2024-01-18 15:10:30',
  },
]);

function getActionText(action: string) {
  const map: Record<string, string> = {
    create: '创建',
    update: '修改',
    delete: '删除',
    publish: '发布',
    offline: '下线',
    login: '登录',
    logout: '登出',
  };
  return map[action] || action;
}

function getActionClass(action: string) {
  const map: Record<string, string> = {
    create: 'success',
    update: 'info',
    delete: 'danger',
    publish: 'success',
    offline: 'warning',
    login: 'default',
    logout: 'default',
  };
  return map[action] || 'default';
}

function getModuleText(module: string) {
  const map: Record<string, string> = {
    user: '用户',
    recipe: '食谱',
    ingredient: '食材',
    collection: '收藏',
    feedback: '反馈',
    content: '内容',
    system: '系统',
  };
  return map[module] || module;
}

function fetchLogs() {
  loading.value = true;
  setTimeout(() => {
    pagination.total = tableData.value.length;
    loading.value = false;
  }, 500);
}

function handleExport() {
  ElMessage.success('导出功能开发中');
}

onMounted(() => {
  fetchLogs();
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

.admin-cell {
  display: flex;
  align-items: center;
  gap: 8px;

  .admin-avatar {
    flex-shrink: 0;
    background: var(--surface-400);
    color: var(--cursor-dark);
  }

  .admin-name {
    font-family: var(--font-display);
    font-size: 13px;
    color: var(--cursor-dark);
  }
}

.action-pill {
  display: inline-flex;
  padding: 3px 10px;
  border-radius: var(--radius-pill);
  font-family: var(--font-display);
  font-size: 11px;
  background: var(--surface-400);
  color: rgba(38, 37, 30, 0.6);

  &.success {
    background: rgba(31, 138, 101, 0.12);
    color: var(--color-success);
  }

  &.info {
    background: rgba(74, 125, 191, 0.12);
    color: var(--color-info);
  }

  &.warning {
    background: rgba(212, 136, 14, 0.12);
    color: var(--color-warning);
  }

  &.danger {
    background: rgba(207, 45, 86, 0.12);
    color: var(--color-error);
  }
}

.target-text {
  font-family: var(--font-display);
  font-size: 13px;
  color: var(--cursor-dark);
}

.detail-text {
  font-family: var(--font-serif);
  font-size: 12px;
  color: rgba(38, 37, 30, 0.6);
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
