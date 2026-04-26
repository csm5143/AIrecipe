<template>
  <div class="page-container">
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">反馈管理</h2>
        <p class="text-muted">处理用户提交的问题反馈和建议</p>
      </div>
      <div class="header-actions">
        <el-button :icon="Refresh" @click="fetchFeedbacks">刷新</el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon pending">
          <el-icon><Clock /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.pending }}</div>
          <div class="stat-label">待处理</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon processing">
          <el-icon><Loading /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.processing }}</div>
          <div class="stat-label">处理中</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon resolved">
          <el-icon><CircleCheck /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.resolved }}</div>
          <div class="stat-label">已解决</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon total">
          <el-icon><ChatDotRound /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.total }}</div>
          <div class="stat-label">总计</div>
        </div>
      </div>
    </div>

    <div class="card-container">
      <!-- 筛选区域 -->
      <div class="filter-section">
        <div class="filter-left">
          <el-input
            v-model="filters.keyword"
            placeholder="搜索反馈内容、用户..."
            clearable
            style="width: 240px"
            :prefix-icon="Search"
            @keyup.enter="handleSearch"
          />
          <el-select v-model="filters.type" placeholder="反馈类型" clearable style="width: 130px">
            <el-option label="全部类型" value="" />
            <el-option label="Bug反馈" value="bug" />
            <el-option label="功能建议" value="suggest" />
            <el-option label="内容纠错" value="error" />
            <el-option label="其他问题" value="other" />
          </el-select>
          <el-select v-model="filters.status" placeholder="处理状态" clearable style="width: 130px">
            <el-option label="全部状态" value="" />
            <el-option label="待处理" value="pending" />
            <el-option label="处理中" value="processing" />
            <el-option label="已解决" value="resolved" />
            <el-option label="已驳回" value="rejected" />
          </el-select>
          <el-select v-model="filters.userType" placeholder="用户类型" clearable style="width: 120px">
            <el-option label="全部用户" value="" />
            <el-option label="正式用户" value="user" />
          </el-select>
        </div>
        <div class="filter-right">
          <el-button @click="handleReset">重置</el-button>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
        </div>
      </div>

      <!-- 反馈列表 -->
      <el-table
        v-loading="loading"
        :data="tableData"
        row-key="id"
        @row-click="handleRowClick"
        class="feedback-table"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="type" label="类型" width="110" align="center">
          <template #default="{ row }">
            <span class="type-pill" :class="row.type">
              <el-icon><component :is="getTypeIcon(row.type)" /></el-icon>
              {{ getTypeText(row.type) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="userInfo" label="用户信息" width="160">
          <template #default="{ row }">
            <div class="user-cell">
              <el-avatar :size="32" :src="row.avatar">
                {{ row.nickname?.charAt(0) || '游' }}
              </el-avatar>
              <div class="user-info">
                <span class="user-name">{{ row.nickname || '匿名用户' }}</span>
                <span class="user-type" :class="row.userType">{{ getUserTypeText(row.userType) }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="content" label="反馈内容" min-width="280">
          <template #default="{ row }">
            <div class="content-cell">
              <span class="content-text">{{ row.content }}</span>
              <div class="content-meta">
                <span v-if="row.images?.length" class="meta-item">
                  <el-icon><Picture /></el-icon>
                  {{ row.images.length }}张图
                </span>
                <span v-if="row.contact" class="meta-item">
                  <el-icon><Message /></el-icon>
                  {{ row.contact }}
                </span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <span class="status-pill" :class="row.status">
              {{ getStatusText(row.status) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="deviceInfo" label="设备" width="140">
          <template #default="{ row }">
            <div class="device-cell">
              <span class="device-model">{{ row.phoneModel || '-' }}</span>
              <span class="device-version" v-if="row.appVersion">v{{ row.appVersion }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="时间" width="140" align="center">
          <template #default="{ row }">
            <div class="time-cell">
              <span class="time-date">{{ formatDate(row.createTime) }}</span>
              <span class="time-hour">{{ formatTime(row.createTime) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link @click.stop="handleViewDetail(row)">
              <el-icon><View /></el-icon>
              查看
            </el-button>
            <el-dropdown trigger="click" @command="(cmd: string) => handleAction(cmd, row)">
              <el-button type="primary" link>
                <el-icon><MoreFilled /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="reply">
                    <el-icon><ChatDotRound /></el-icon>
                    回复反馈
                  </el-dropdown-item>
                  <el-dropdown-item command="process" v-if="row.status === 'pending'">
                    <el-icon><Loading /></el-icon>
                    标记处理中
                  </el-dropdown-item>
                  <el-dropdown-item command="resolve">
                    <el-icon><CircleCheck /></el-icon>
                    标记已解决
                  </el-dropdown-item>
                  <el-dropdown-item command="reject" v-if="row.status !== 'rejected'">
                    <el-icon><Close /></el-icon>
                    驳回
                  </el-dropdown-item>
                  <el-dropdown-item command="delete" divided>
                    <el-icon><Delete /></el-icon>
                    删除
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="table-footer">
        <span class="total-text">共 {{ pagination.total }} 条反馈</span>
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50]"
          layout="sizes, prev, pager, next"
          background
        />
      </div>
    </div>

    <!-- 反馈详情对话框 -->
    <el-dialog
      v-model="detailVisible"
      :title="`反馈详情 #${currentFeedback?.id}`"
      width="700px"
      class="detail-dialog"
    >
      <div v-if="currentFeedback" class="detail-content">
        <!-- 基本信息 -->
        <div class="detail-section">
          <div class="section-header">
            <span class="section-title">基本信息</span>
            <span class="type-pill" :class="currentFeedback.type">
              <el-icon><component :is="getTypeIcon(currentFeedback.type)" /></el-icon>
              {{ getTypeText(currentFeedback.type) }}
            </span>
          </div>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">用户昵称</span>
              <span class="info-value">{{ currentFeedback.nickname || '匿名用户' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">用户类型</span>
              <span class="info-value user-type" :class="currentFeedback.userType">
                {{ getUserTypeText(currentFeedback.userType) }}
              </span>
            </div>
            <div class="info-item">
              <span class="info-label">用户标识</span>
              <span class="info-value text-mono">{{ currentFeedback.userIdentifier || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">联系方式</span>
              <span class="info-value">{{ currentFeedback.contact || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">提交时间</span>
              <span class="info-value">{{ formatDateTime(currentFeedback.createTime) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">当前状态</span>
              <span class="status-pill" :class="currentFeedback.status">
                {{ getStatusText(currentFeedback.status) }}
              </span>
            </div>
          </div>
        </div>

        <!-- 设备信息 -->
        <div class="detail-section">
          <div class="section-header">
            <span class="section-title">设备信息</span>
          </div>
          <div class="info-grid">
            <div class="info-item full">
              <span class="info-label">手机型号</span>
              <span class="info-value">{{ currentFeedback.phoneModel || '-' }}</span>
            </div>
            <div class="info-item full">
              <span class="info-label">系统版本</span>
              <span class="info-value">{{ currentFeedback.systemInfo || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">App版本</span>
              <span class="info-value">{{ currentFeedback.appVersion || '-' }}</span>
            </div>
          </div>
        </div>

        <!-- 反馈内容 -->
        <div class="detail-section">
          <div class="section-header">
            <span class="section-title">反馈内容</span>
          </div>
          <div class="feedback-content-box">
            {{ currentFeedback.content }}
          </div>
          <!-- 图片 -->
          <div v-if="currentFeedback.images?.length" class="feedback-images">
            <el-image
              v-for="(img, index) in (currentFeedback.cloudImageUrls?.length ? currentFeedback.cloudImageUrls : currentFeedback.images)"
              :key="index"
              :src="img"
              :preview-src-list="currentFeedback.cloudImageUrls?.length ? currentFeedback.cloudImageUrls : currentFeedback.images"
              fit="cover"
              class="feedback-image"
            />
          </div>
        </div>

        <!-- 回复历史 -->
        <div class="detail-section" v-if="currentFeedback.reply?.length">
          <div class="section-header">
            <span class="section-title">回复历史</span>
            <span class="reply-count">{{ currentFeedback.reply.length }}条回复</span>
          </div>
          <div class="reply-list">
            <div v-for="reply in currentFeedback.reply" :key="reply.id" class="reply-item">
              <div class="reply-header">
                <div class="reply-admin">
                  <el-avatar :size="28" class="admin-avatar">
                    {{ reply.adminName?.charAt(0) || '管' }}
                  </el-avatar>
                  <span class="admin-name">{{ reply.adminName }}</span>
                </div>
                <span class="reply-time">{{ formatDateTime(reply.createTime) }}</span>
              </div>
              <div class="reply-content">{{ reply.content }}</div>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <div class="footer-left">
            <el-select v-model="quickAction" style="width: 140px">
              <el-option label="标记处理中" value="processing" />
              <el-option label="标记已解决" value="resolved" />
              <el-option label="驳回" value="rejected" />
            </el-select>
            <el-button @click="handleQuickAction">应用</el-button>
          </div>
          <div class="footer-right">
            <el-button @click="detailVisible = false">关闭</el-button>
            <el-button type="primary" @click="handleReply">回复反馈</el-button>
          </div>
        </div>
      </template>
    </el-dialog>

    <!-- 回复对话框 -->
    <el-dialog
      v-model="replyVisible"
      title="回复反馈"
      width="500px"
    >
      <el-form ref="replyFormRef" :model="replyForm" :rules="replyRules" label-position="top">
        <el-form-item label="回复内容" prop="content">
          <el-input
            v-model="replyForm.content"
            type="textarea"
            :rows="5"
            placeholder="请输入回复内容..."
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="处理方式">
          <el-radio-group v-model="replyForm.action">
            <el-radio value="reply">仅回复</el-radio>
            <el-radio value="resolve">回复并标记已解决</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="replyVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitReply" :loading="submitting">发送回复</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue';
import {
  Search,
  Refresh,
  Picture,
  ChatDotRound,
  Message,
  View,
  MoreFilled,
  Delete,
  Close,
  CircleCheck,
  Clock,
  Loading,
  CircleCloseFilled,
  QuestionFilled,
  Plus,
  Edit,
} from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  type FeedbackItem,
  type FeedbackType,
  type FeedbackStatus,
  FEEDBACK_TYPE_MAP,
  FEEDBACK_STATUS_MAP,
} from '@/api/feedback';

const loading = ref(false);
const submitting = ref(false);
const detailVisible = ref(false);
const replyVisible = ref(false);
const currentFeedback = ref<FeedbackItem | null>(null);
const replyFormRef = ref();
const quickAction = ref<FeedbackStatus>('resolved');
const rawData = ref<FeedbackItem[]>([]);

const filters = reactive({
  keyword: '',
  type: '' as FeedbackType | '',
  status: '' as FeedbackStatus | '',
  userType: '',
});

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
});

const replyForm = reactive({
  content: '',
  action: 'reply',
});

const replyRules = {
  content: [
    { required: true, message: '请输入回复内容', trigger: 'blur' },
    { min: 5, message: '回复内容至少5个字符', trigger: 'blur' },
  ],
};

const tableData = ref<FeedbackItem[]>([]);

const stats = computed(() => {
  const pending = tableData.value.filter(f => f.status === 'pending').length;
  const processing = tableData.value.filter(f => f.status === 'processing').length;
  const resolved = tableData.value.filter(f => f.status === 'resolved').length;
  return {
    pending,
    processing,
    resolved,
    total: pagination.total,
  };
});

function getTypeIcon(type: string) {
  const map: Record<string, any> = {
    bug: CircleCloseFilled,
    suggest: Plus,
    error: QuestionFilled,
    other: Edit,
  };
  return map[type] || Edit;
}

function getTypeText(type: string) {
  return FEEDBACK_TYPE_MAP[type as FeedbackType] || type;
}

function getStatusText(status: string) {
  return FEEDBACK_STATUS_MAP[status as FeedbackStatus] || status;
}

function getUserTypeText(userType: string) {
  const map: Record<string, string> = {
    user: '正式用户',
  };
  return map[userType] || userType;
}

function formatDate(timestamp: number) {
  if (!timestamp) return '-';
  const date = new Date(timestamp);
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

function formatTime(timestamp: number) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function formatDateTime(timestamp: number) {
  if (!timestamp) return '-';
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

async function fetchFeedbacks() {
  loading.value = true;
  try {
    if (rawData.value.length === 0) {
      const res = await fetch('/data/feedbacks.json');
      const data = await res.json();
      rawData.value = data as FeedbackItem[];
    }
    // 本地过滤（实际项目中应由后端处理）
    let filtered = [...rawData.value];
    if (filters.keyword) {
      const kw = filters.keyword.toLowerCase();
      filtered = filtered.filter(f =>
        f.content.toLowerCase().includes(kw) ||
        f.nickname?.toLowerCase().includes(kw)
      );
    }
    if (filters.type) {
      filtered = filtered.filter(f => f.type === filters.type);
    }
    if (filters.status) {
      filtered = filtered.filter(f => f.status === filters.status);
    }
    if (filters.userType) {
      filtered = filtered.filter(f => f.userType === filters.userType);
    }

    // 分页
    const start = (pagination.page - 1) * pagination.pageSize;
    tableData.value = filtered.slice(start, start + pagination.pageSize);
    pagination.total = filtered.length;
  } catch (error) {
    console.error('获取反馈列表失败:', error);
    ElMessage.error('获取反馈列表失败');
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  pagination.page = 1;
  fetchFeedbacks();
}

function handleReset() {
  filters.keyword = '';
  filters.type = '';
  filters.status = '';
  filters.userType = '';
  pagination.page = 1;
  fetchFeedbacks();
}

function handleRowClick(row: FeedbackItem) {
  handleViewDetail(row);
}

function handleViewDetail(row: FeedbackItem) {
  currentFeedback.value = row;
  detailVisible.value = true;
}

async function handleAction(command: string, row: FeedbackItem) {
  switch (command) {
    case 'reply':
      handleViewDetail(row);
      replyVisible.value = true;
      break;
    case 'process':
      await updateStatus(row, 'processing');
      break;
    case 'resolve':
      await updateStatus(row, 'resolved');
      break;
    case 'reject':
      await updateStatus(row, 'rejected');
      break;
    case 'delete':
      await handleDelete(row);
      break;
  }
}

async function updateStatus(row: FeedbackItem, status: FeedbackStatus) {
  row.status = status;
  ElMessage.success('状态更新成功');
}

async function handleQuickAction() {
  if (!currentFeedback.value) return;
  await updateStatus(currentFeedback.value, quickAction.value);
}

function handleReply() {
  replyForm.content = '';
  replyForm.action = 'reply';
  replyVisible.value = true;
}

async function handleSubmitReply() {
  const valid = await replyFormRef.value?.validate().catch(() => false);
  if (!valid) return;

  if (!currentFeedback.value) return;

  submitting.value = true;
  try {
    // 本地模拟回复
    const newReply = {
      id: Date.now(),
      adminId: 1,
      adminName: '管理员',
      content: replyForm.content,
      createTime: Date.now(),
    };
    if (!currentFeedback.value.reply) {
      currentFeedback.value.reply = [];
    }
    currentFeedback.value.reply.push(newReply);
    if (replyForm.action === 'resolve') {
      currentFeedback.value.status = 'resolved';
    }
    ElMessage.success('回复发送成功');
    replyVisible.value = false;
    fetchFeedbacks();
  } catch (error) {
    ElMessage.error('回复发送失败');
  } finally {
    submitting.value = false;
  }
}

async function handleDelete(row: FeedbackItem) {
  try {
    await ElMessageBox.confirm('确定要删除这条反馈吗？删除后无法恢复。', '删除确认', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    });
    rawData.value = rawData.value.filter(f => f.id !== row.id);
    ElMessage.success('删除成功');
    fetchFeedbacks();
  } catch {
    // 用户取消
  }
}

watch(
  () => [pagination.page, pagination.pageSize],
  () => {
    fetchFeedbacks();
  }
);

onMounted(() => {
  fetchFeedbacks();
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

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  background: var(--surface-200);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);

  .stat-icon {
    width: 48px;
    height: 48px;
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;

    .el-icon {
      font-size: 24px;
    }

    &.pending {
      background: rgba(212, 136, 14, 0.1);
      color: var(--color-warning);
    }

    &.processing {
      background: rgba(74, 125, 191, 0.1);
      color: var(--color-info);
    }

    &.resolved {
      background: rgba(31, 138, 101, 0.1);
      color: var(--color-success);
    }

    &.total {
      background: var(--surface-300);
      color: rgba(38, 37, 30, 0.5);
    }
  }

  .stat-info {
    .stat-value {
      font-family: var(--font-display);
      font-size: 28px;
      font-weight: 400;
      letter-spacing: -0.5px;
      color: var(--cursor-dark);
      line-height: 1.2;
    }

    .stat-label {
      font-family: var(--font-serif);
      font-size: 13px;
      color: rgba(38, 37, 30, 0.5);
      margin-top: 4px;
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

  .filter-right {
    display: flex;
    gap: 8px;
  }
}

.feedback-table {
  :deep(.el-table__row) {
    cursor: pointer;
  }
}

.type-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: var(--radius-pill);
  font-family: var(--font-display);
  font-size: 11px;
  background: var(--surface-400);
  color: rgba(38, 37, 30, 0.6);

  .el-icon {
    font-size: 12px;
  }

  &.bug {
    background: rgba(207, 45, 86, 0.1);
    color: var(--color-error);
  }

  &.suggest {
    background: rgba(74, 125, 191, 0.1);
    color: var(--color-info);
  }

  &.error {
    background: rgba(212, 136, 14, 0.1);
    color: var(--color-warning);
  }

  &.other {
    background: var(--surface-400);
    color: rgba(38, 37, 30, 0.6);
  }
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 10px;

  .user-info {
    display: flex;
    flex-direction: column;
    gap: 2px;

    .user-name {
      font-family: var(--font-display);
      font-size: 13px;
      color: var(--cursor-dark);
    }

    .user-type {
      font-family: var(--font-mono);
      font-size: 10px;
      padding: 1px 6px;
      border-radius: var(--radius-pill);

      &.user {
        background: rgba(31, 138, 101, 0.1);
        color: var(--color-success);
      }

      &.visitor {
        background: rgba(74, 125, 191, 0.1);
        color: var(--color-info);
      }

      &.guest {
        background: var(--surface-400);
        color: rgba(38, 37, 30, 0.5);
      }
    }
  }
}

.content-cell {
  .content-text {
    font-family: var(--font-serif);
    font-size: 13px;
    color: rgba(38, 37, 30, 0.8);
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .content-meta {
    display: flex;
    gap: 12px;
    margin-top: 4px;

    .meta-item {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-family: var(--font-mono);
      font-size: 11px;
      color: rgba(38, 37, 30, 0.4);

      .el-icon {
        font-size: 12px;
      }
    }
  }
}

.status-pill {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: var(--radius-pill);
  font-family: var(--font-display);
  font-size: 11px;

  &.pending {
    background: rgba(212, 136, 14, 0.1);
    color: var(--color-warning);
  }

  &.processing {
    background: rgba(74, 125, 191, 0.1);
    color: var(--color-info);
  }

  &.resolved {
    background: rgba(31, 138, 101, 0.1);
    color: var(--color-success);
  }

  &.rejected {
    background: rgba(207, 45, 86, 0.1);
    color: var(--color-error);
  }
}

.device-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;

  .device-model {
    font-family: var(--font-display);
    font-size: 12px;
    color: var(--cursor-dark);
  }

  .device-version {
    font-family: var(--font-mono);
    font-size: 10px;
    color: rgba(38, 37, 30, 0.4);
  }
}

.time-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: center;

  .time-date {
    font-family: var(--font-display);
    font-size: 12px;
    color: var(--cursor-dark);
  }

  .time-hour {
    font-family: var(--font-mono);
    font-size: 11px;
    color: rgba(38, 37, 30, 0.4);
  }
}

.table-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--border-primary);

  .total-text {
    font-family: var(--font-serif);
    font-size: 13px;
    color: rgba(38, 37, 30, 0.6);
  }
}

.detail-content {
  .detail-section {
    margin-bottom: 24px;

    &:last-child {
      margin-bottom: 0;
    }

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;

      .section-title {
        font-family: var(--font-display);
        font-size: 14px;
        font-weight: 500;
        color: var(--cursor-dark);
      }

      .reply-count {
        font-family: var(--font-mono);
        font-size: 11px;
        color: rgba(38, 37, 30, 0.4);
      }
    }
  }

  .info-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;

    .info-item {
      &.full {
        grid-column: span 2;
      }

      .info-label {
        display: block;
        font-family: var(--font-mono);
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: rgba(38, 37, 30, 0.4);
        margin-bottom: 4px;
      }

      .info-value {
        font-family: var(--font-display);
        font-size: 13px;
        color: var(--cursor-dark);
      }
    }
  }

  .feedback-content-box {
    padding: 16px;
    background: var(--surface-300);
    border-radius: var(--radius-md);
    font-family: var(--font-serif);
    font-size: 14px;
    color: var(--cursor-dark);
    line-height: 1.7;
  }

  .feedback-images {
    display: flex;
    gap: 8px;
    margin-top: 12px;
    flex-wrap: wrap;

    .feedback-image {
      width: 80px;
      height: 80px;
      border-radius: var(--radius-sm);
      cursor: pointer;
    }
  }

  .reply-list {
    .reply-item {
      padding: 16px;
      background: rgba(31, 138, 101, 0.05);
      border-radius: var(--radius-md);
      margin-bottom: 12px;

      &:last-child {
        margin-bottom: 0;
      }

      .reply-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 8px;

        .reply-admin {
          display: flex;
          align-items: center;
          gap: 8px;

          .admin-avatar {
            background: var(--color-success);
            color: #fff;
            font-family: var(--font-display);
            font-size: 12px;
          }

          .admin-name {
            font-family: var(--font-display);
            font-size: 13px;
            color: var(--color-success);
          }
        }

        .reply-time {
          font-family: var(--font-mono);
          font-size: 11px;
          color: rgba(38, 37, 30, 0.4);
        }
      }

      .reply-content {
        font-family: var(--font-serif);
        font-size: 13px;
        color: rgba(38, 37, 30, 0.8);
        line-height: 1.6;
      }
    }
  }
}

.dialog-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;

  .footer-left,
  .footer-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }
}
</style>
