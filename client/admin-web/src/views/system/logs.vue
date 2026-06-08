<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <h2 class="page-title">日志管理</h2>
        <p class="page-subtitle">统一查看管理员操作与用户活动</p>
      </div>
      <div class="header-actions">
        <el-button :icon="Download" @click="handleExport">导出 Excel</el-button>
        <el-button :icon="Refresh" @click="fetchLogs">刷新</el-button>
      </div>
    </div>

    <div class="stat-grid">
      <div class="stat-card">
        <span>今日操作总数</span>
        <strong>{{ todayStats.total }}</strong>
      </div>
      <div class="stat-card">
        <span>管理员操作数</span>
        <strong>{{ todayStats.admin }}</strong>
      </div>
      <div class="stat-card">
        <span>用户活动数</span>
        <strong>{{ todayStats.user }}</strong>
      </div>
    </div>

    <div class="card-container">
      <el-tabs v-model="activeType" @tab-change="handleTypeChange">
        <el-tab-pane label="全部日志" name="all" />
        <el-tab-pane label="管理员操作" name="admin" />
        <el-tab-pane label="用户活动" name="user" />
        <el-tab-pane label="邮件日志" name="email" />
        <el-tab-pane label="验证码记录" name="verification" />
      </el-tabs>

      <!-- 统一日志筛选 -->
      <div v-if="!isSubTab" class="filter-section">
        <div class="filter-left">
          <el-input
            v-model="filters.keyword"
            clearable
            placeholder="搜索操作者、动作、模块、目标、详情或 IP"
            style="width: 320px"
            @keyup.enter="fetchLogs"
            @clear="fetchLogs"
          >
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
          <el-select v-model="filters.action" clearable placeholder="操作类型" style="width: 160px" @change="fetchLogs">
            <el-option v-for="action in actionOptions" :key="action" :label="actionText(action)" :value="action" />
          </el-select>
          <el-date-picker
            v-model="filters.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 280px"
            @change="fetchLogs"
          />
        </div>
        <el-button type="primary" @click="fetchLogs">查询</el-button>
      </div>

      <!-- 邮件日志筛选 -->
      <div v-if="activeType === 'email'" class="filter-section">
        <div class="filter-left">
          <el-input
            v-model="emailFilters.keyword"
            clearable
            placeholder="搜索收件人或主题"
            style="width: 280px"
            @keyup.enter="fetchEmailLogs"
            @clear="fetchEmailLogs"
          >
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
          <el-select v-model="emailFilters.status" clearable placeholder="发送状态" style="width: 120px" @change="fetchEmailLogs">
            <el-option label="发送成功" value="sent" />
            <el-option label="发送失败" value="failed" />
          </el-select>
          <el-select v-model="emailFilters.type" clearable placeholder="邮件类型" style="width: 140px" @change="fetchEmailLogs">
            <el-option label="注册验证码" value="REGISTER" />
            <el-option label="重置密码" value="RESETPASSWORD" />
            <el-option label="邮箱绑定" value="BIND" />
            <el-option label="管理员重置" value="ADMIN_RESET" />
            <el-option label="测试" value="TEST" />
            <el-option label="审核通知" value="RECIPE_AUDIT" />
            <el-option label="安全告警" value="SECURITY_ALERT" />
            <el-option label="管理员创建" value="ADMIN_CREATED" />
          </el-select>
        </div>
        <el-button type="primary" @click="fetchEmailLogs">查询</el-button>
      </div>

      <!-- 验证码记录筛选 -->
      <div v-if="activeType === 'verification'" class="filter-section">
        <div class="filter-left">
          <el-input
            v-model="veriFilters.keyword"
            clearable
            placeholder="搜索邮箱或手机号"
            style="width: 280px"
            @keyup.enter="fetchVerificationTokens"
            @clear="fetchVerificationTokens"
          >
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
          <el-select v-model="veriFilters.type" clearable placeholder="验证码类型" style="width: 140px" @change="fetchVerificationTokens">
            <el-option label="注册" value="REGISTER" />
            <el-option label="重置密码" value="RESETPASSWORD" />
            <el-option label="邮箱绑定" value="BIND" />
            <el-option label="管理员重置" value="ADMIN_RESET" />
          </el-select>
          <el-select v-model="veriFilters.used" clearable placeholder="使用状态" style="width: 120px" @change="fetchVerificationTokens">
            <el-option label="未使用" value="false" />
            <el-option label="已使用" value="true" />
          </el-select>
        </div>
        <el-button type="primary" @click="fetchVerificationTokens">查询</el-button>
      </div>

      <!-- 统一日志表 -->
      <el-table v-if="!isSubTab" v-loading="loading" :data="tableData" size="small">
        <el-table-column prop="createdAt" label="时间" width="170" />
        <el-table-column label="操作者" min-width="180">
          <template #default="{ row }">
            <div class="actor-cell">
              <el-avatar :size="30">{{ row.actorName?.charAt(0) || '?' }}</el-avatar>
              <div>
                <div class="actor-name">{{ row.actorName }}</div>
                <el-tag size="small" :type="row.actorType === 'admin' ? 'primary' : 'success'">
                  {{ row.actorType === 'admin' ? '管理员' : '用户' }}
                </el-tag>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="动作" width="130">
          <template #default="{ row }">
            <el-tag :type="actionTag(row.action)">{{ actionText(row.action) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="module" label="模块" width="130">
          <template #default="{ row }">{{ moduleText(row.module) }}</template>
        </el-table-column>
        <el-table-column prop="target" label="目标" min-width="150" show-overflow-tooltip />
        <el-table-column label="详情" min-width="240">
          <template #default="{ row }">
            <el-tooltip :content="row.detail || '-'" placement="top" :show-after="300">
              <span class="detail-text">{{ row.detail || '-' }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="ip" label="IP" width="140" />
      </el-table>

      <!-- 邮件日志表 -->
      <el-table v-if="activeType === 'email'" v-loading="loading" :data="tableData" size="small">
        <el-table-column prop="createdAt" label="时间" width="170" sortable />
        <el-table-column prop="toEmail" label="收件人" min-width="200" show-overflow-tooltip />
        <el-table-column prop="subject" label="主题" min-width="200" show-overflow-tooltip />
        <el-table-column label="类型" width="120">
          <template #default="{ row }">{{ emailTypeText(row.type) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 'sent' ? 'success' : 'danger'" size="small">
              {{ row.status === 'sent' ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="error" label="错误信息" min-width="220" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="error-text">{{ row.error || '-' }}</span>
          </template>
        </el-table-column>
      </el-table>

      <!-- 验证码记录表 -->
      <el-table v-if="activeType === 'verification'" v-loading="loading" :data="tableData" size="small">
        <el-table-column prop="createdAt" label="发送时间" width="170" sortable />
        <el-table-column label="目标" min-width="200">
          <template #default="{ row }">{{ row.email || row.phone || '-' }}</template>
        </el-table-column>
        <el-table-column label="类型" width="110">
          <template #default="{ row }">{{ emailTypeText(row.type) }}</template>
        </el-table-column>
        <el-table-column prop="attempts" label="尝试次数" width="100" align="center" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <template v-if="row.usedAt">
              <el-tag type="success" size="small">已使用</el-tag>
            </template>
            <template v-else-if="new Date(row.expiresAt) < new Date()">
              <el-tag type="info" size="small">已过期</el-tag>
            </template>
            <template v-else>
              <el-tag type="warning" size="small">待使用</el-tag>
            </template>
          </template>
        </el-table-column>
        <el-table-column prop="expiresAt" label="过期时间" width="170" />
      </el-table>

      <div class="table-footer">
        <span class="page-subtitle">共 {{ pagination.total }} 条记录</span>
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[20, 50, 100]"
          layout="sizes, prev, pager, next"
          background
          @current-change="onPageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { Download, Refresh, Search } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { logsApi, type LogItem } from '@/api/logs';
import { downloadClient } from '@/api/request';
import { usePreferences } from '@/composables/usePreferences';

type LogType = 'all' | 'admin' | 'user' | 'email' | 'verification';
type UnifiedLogType = Extract<LogType, 'all' | 'admin' | 'user'>;

const { defaultPageSize } = usePreferences();
const activeType = ref<LogType>('all');
const loading = ref(false);
const tableData = ref<any[]>([]);
const allLoadedRows = ref<LogItem[]>([]);

const isSubTab = computed(() => activeType.value === 'email' || activeType.value === 'verification');

const filters = reactive({
  keyword: '',
  action: '',
  dateRange: null as [Date, Date] | null,
});

const emailFilters = reactive({
  keyword: '',
  status: '',
  type: '',
});

const veriFilters = reactive({
  keyword: '',
  type: '',
  used: '',
});

const pagination = reactive({
  page: 1,
  pageSize: defaultPageSize(),
  total: 0,
});

const todayStats = computed(() => {
  const today = new Date().toISOString().slice(0, 10);
  const rows = allLoadedRows.value.filter(row => row.createdAt.startsWith(today));
  return {
    total: rows.length,
    admin: rows.filter(row => row.actorType === 'admin').length,
    user: rows.filter(row => row.actorType === 'user').length,
  };
});

const actionOptions = computed(() =>
  Array.from(new Set(allLoadedRows.value.map(row => row.action).filter(Boolean))).sort(),
);

function queryParams(extra: Record<string, unknown> = {}) {
  const [startDate, endDate] = filters.dateRange || [undefined, undefined];
  return {
    type: activeType.value as UnifiedLogType,
    page: pagination.page,
    pageSize: pagination.pageSize,
    keyword: filters.keyword || undefined,
    action: filters.action || undefined,
    startDate: startDate ? startDate.toISOString().slice(0, 10) : undefined,
    endDate: endDate ? endDate.toISOString().slice(0, 10) : undefined,
    ...extra,
  };
}

async function fetchLogs() {
  if (activeType.value === 'email') { await fetchEmailLogs(); return; }
  if (activeType.value === 'verification') { await fetchVerificationTokens(); return; }

  loading.value = true;
  try {
    const res = await logsApi.unified(queryParams());
    const data = res.data || {};
    tableData.value = data.list || [];
    pagination.total = data.total || 0;
    await fetchStatsSeed();
  } catch (error: any) {
    ElMessage.error(error?.message || '获取日志失败');
  } finally {
    loading.value = false;
  }
}

async function fetchEmailLogs() {
  loading.value = true;
  try {
    const res = await logsApi.getEmailLogs({
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: emailFilters.keyword || undefined,
      status: emailFilters.status || undefined,
      type: emailFilters.type || undefined,
    });
    const data = res.data || {};
    tableData.value = data.list || [];
    pagination.total = data.total || 0;
  } catch (error: any) {
    ElMessage.error(error?.message || '获取邮件日志失败');
    tableData.value = [];
  } finally {
    loading.value = false;
  }
}

async function fetchVerificationTokens() {
  loading.value = true;
  try {
    const res = await logsApi.getVerificationTokens({
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: veriFilters.keyword || undefined,
      type: veriFilters.type || undefined,
      used: veriFilters.used || undefined,
    });
    const data = res.data || {};
    tableData.value = data.list || [];
    pagination.total = data.total || 0;
  } catch (error: any) {
    ElMessage.error(error?.message || '获取验证码记录失败');
    tableData.value = [];
  } finally {
    loading.value = false;
  }
}

async function fetchStatsSeed() {
  const res = await logsApi.unified(queryParams({ type: 'all' as UnifiedLogType, page: 1, pageSize: 100, action: undefined }));
  allLoadedRows.value = res.data?.list || [];
}

function onPageChange() {
  if (activeType.value === 'email') fetchEmailLogs();
  else if (activeType.value === 'verification') fetchVerificationTokens();
  else fetchLogs();
}

function handleTypeChange() {
  pagination.page = 1;
  filters.action = '';
  if (activeType.value === 'email') fetchEmailLogs();
  else if (activeType.value === 'verification') fetchVerificationTokens();
  else fetchLogs();
}

function handleSizeChange() {
  pagination.page = 1;
  if (activeType.value === 'email') fetchEmailLogs();
  else if (activeType.value === 'verification') fetchVerificationTokens();
  else fetchLogs();
}

function emailTypeText(type: string) {
  const map: Record<string, string> = {
    REGISTER: '注册验证码',
    RESETPASSWORD: '重置密码',
    BIND: '邮箱绑定',
    ADMIN_RESET: '管理员重置',
    TEST: '测试',
    RECIPE_AUDIT: '审核通知',
    SECURITY_ALERT: '安全告警',
    ADMIN_CREATED: '管理员创建',
    GENERAL: '通用',
  };
  return map[type] || type;
}

function actionText(action: string) {
  const map: Record<string, string> = {
    create: '创建',
    update: '修改',
    delete: '删除',
    publish: '发布',
    offline: '下线',
    login: '登录',
    logout: '登出',
    register: '注册',
    sendVerifyCode: '发送验证码',
    sendVerifyCode_failed: '发码失败',
    resetPassword: '重置密码',
    changePassword: '修改密码',
    bindEmail: '绑定邮箱',
    browse: '浏览',
    like: '点赞',
    follow: '关注',
    ai_scan: 'AI 扫描',
    ai_chat: 'AI 对话',
    upload_recipe: '上传菜谱',
    create_recipe: '创建菜谱',
  };
  return map[action] || action;
}

function actionTag(action: string) {
  if (['create', 'publish', 'register', 'upload_recipe', 'create_recipe', 'sendVerifyCode'].includes(action)) return 'success';
  if (['delete', 'offline', 'sendVerifyCode_failed'].includes(action)) return 'danger';
  if (['update', 'ai_scan', 'ai_chat', 'resetPassword', 'changePassword', 'bindEmail'].includes(action)) return 'warning';
  return 'info';
}

function moduleText(module: string) {
  const map: Record<string, string> = {
    user: '用户',
    recipe: '菜谱',
    ingredient: '食材',
    collection: '收藏',
    feedback: '反馈',
    content: '内容',
    system: '系统',
    user_activity: '用户活动',
  };
  return map[module] || module;
}

async function handleExport() {
  try {
    const response = await downloadClient.get('/logs/unified/export', {
      params: queryParams({ page: undefined, pageSize: undefined }),
      responseType: 'blob',
    });
    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `日志_${Date.now()}.xlsx`;
    link.click();
    URL.revokeObjectURL(link.href);
    ElMessage.success('导出成功');
  } catch (error: any) {
    ElMessage.error(error?.message || '导出失败');
  }
}
onMounted(fetchLogs);
</script>

<style scoped lang="scss">
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.stat-card {
  padding: 16px;
  background: var(--surface-100);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);

  span {
    display: block;
    color: rgba(38, 37, 30, 0.58);
    font-size: 13px;
    margin-bottom: 8px;
  }

  strong {
    color: var(--cursor-dark);
    font-size: 26px;
    font-family: var(--font-display);
  }
}

.filter-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.filter-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.actor-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.actor-name {
  font-size: 13px;
  color: var(--cursor-dark);
  margin-bottom: 3px;
}

.detail-text {
  display: inline-block;
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.table-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 18px;
  padding-top: 18px;
  border-top: 1px solid var(--border-primary);
}

.error-text {
  color: #e74c3c;
  font-size: 12px;
}
</style>
