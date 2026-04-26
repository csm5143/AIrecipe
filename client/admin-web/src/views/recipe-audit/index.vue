<template>
  <div class="page-container">
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">菜谱审核</h2>
        <p class="text-muted">审核用户上传的菜谱，通过后将在社区展示</p>
      </div>
      <div class="header-actions">
        <el-button :icon="Refresh" @click="fetchRecipes">刷新</el-button>
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
          <div class="stat-label">待审核</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon approved">
          <el-icon><CircleCheck /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.approved }}</div>
          <div class="stat-label">已通过</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon rejected">
          <el-icon><CloseBold /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.rejected }}</div>
          <div class="stat-label">已拒绝</div>
        </div>
      </div>
    </div>

    <div class="card-container">
      <!-- 筛选区域 -->
      <div class="filter-section">
        <div class="filter-left">
          <el-select v-model="filters.status" placeholder="审核状态" clearable style="width: 140px" @change="handleSearch">
            <el-option label="全部状态" value="" />
            <el-option label="待审核" value="pending" />
            <el-option label="已通过" value="approved" />
            <el-option label="已拒绝" value="rejected" />
          </el-select>
          <el-input
            v-model="filters.keyword"
            placeholder="搜索标题、作者..."
            clearable
            style="width: 240px"
            :prefix-icon="Search"
            @keyup.enter="handleSearch"
          />
        </div>
        <div class="filter-right">
          <el-button @click="handleReset">重置</el-button>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
        </div>
      </div>

      <!-- 菜谱列表 -->
      <el-table
        v-loading="loading"
        :data="tableData"
        row-key="recipeId"
        @row-click="handleRowClick"
        class="recipe-table"
      >
        <el-table-column label="菜谱信息" min-width="280">
          <template #default="{ row }">
            <div class="recipe-info-cell">
              <el-image
                :src="row.coverImage"
                fit="cover"
                class="recipe-cover"
                :preview-src-list="[row.coverImage]"
              />
              <div class="recipe-detail">
                <div class="recipe-title">{{ row.title }}</div>
                <div class="recipe-meta">
                  <span>{{ getDifficultyText(row.difficulty) }}</span>
                  <span>{{ row.cookingTime }}分钟</span>
                  <span>{{ row.servings }}人份</span>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="作者" min-width="120">
          <template #default="{ row }">
            <div class="author-cell">
              <el-avatar :size="32" :src="row.avatar">{{ row.nickname?.charAt(0) }}</el-avatar>
              <span class="author-name">{{ row.nickname }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="数据" width="120">
          <template #default="{ row }">
            <div class="data-cell">
              <span><el-icon><View /></el-icon> {{ row.viewCount || 0 }}</span>
              <span><el-icon><Star /></el-icon> {{ row.likeCount || 0 }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="提交时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <div class="action-cell">
              <el-button link type="primary" size="small" @click.stop="handleViewDetail(row)">
                查看
              </el-button>
              <el-button
                v-if="row.status === 'pending'"
                link
                type="success"
                size="small"
                @click.stop="handleApprove(row)"
              >
                通过
              </el-button>
              <el-button
                v-if="row.status === 'pending'"
                link
                type="danger"
                size="small"
                @click.stop="handleReject(row)"
              >
                拒绝
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 详情弹窗 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="菜谱详情"
      width="800px"
      class="detail-dialog"
    >
      <div v-if="currentRecipe" class="recipe-detail-content">
        <!-- 基本信息 -->
        <div class="detail-section">
          <h4>基本信息</h4>
          <div class="detail-row">
            <span class="label">标题：</span>
            <span>{{ currentRecipe.title }}</span>
          </div>
          <div class="detail-row">
            <span class="label">作者：</span>
            <span>{{ currentRecipe.nickname }}</span>
          </div>
          <div class="detail-row">
            <span class="label">难度：</span>
            <span>{{ getDifficultyText(currentRecipe.difficulty) }}</span>
          </div>
          <div class="detail-row">
            <span class="label">时间/份量：</span>
            <span>{{ currentRecipe.cookingTime }}分钟 / {{ currentRecipe.servings }}人份</span>
          </div>
          <div class="detail-row">
            <span class="label">标签：</span>
            <el-tag v-for="tag in currentRecipe.tags" :key="tag" size="small" style="margin-right: 8px">
              {{ tag }}
            </el-tag>
          </div>
          <div class="detail-row">
            <span class="label">简介：</span>
            <span>{{ currentRecipe.description || '无' }}</span>
          </div>
        </div>

        <!-- 封面 -->
        <div class="detail-section">
          <h4>封面图片</h4>
          <el-image
            :src="currentRecipe.coverImage"
            fit="cover"
            class="detail-cover"
            :preview-src-list="[currentRecipe.coverImage]"
          />
        </div>

        <!-- 食材 -->
        <div class="detail-section">
          <h4>食材清单 ({{ currentRecipe.ingredients?.length || 0 }})</h4>
          <div class="ingredient-list">
            <div v-for="(ing, idx) in currentRecipe.ingredients" :key="idx" class="ingredient-item">
              <span>{{ ing.name }}</span>
              <span class="amount">{{ ing.amount }}</span>
            </div>
          </div>
        </div>

        <!-- 步骤 -->
        <div class="detail-section">
          <h4>制作步骤 ({{ currentRecipe.steps?.length || 0 }})</h4>
          <div class="step-list">
            <div v-for="(step, idx) in currentRecipe.steps" :key="idx" class="step-item">
              <span class="step-num">{{ idx + 1 }}</span>
              <span class="step-desc">{{ step.description }}</span>
            </div>
          </div>
        </div>

        <!-- 小技巧 -->
        <div v-if="currentRecipe.tips" class="detail-section">
          <h4>小技巧</h4>
          <div class="tips-content">{{ currentRecipe.tips }}</div>
        </div>

        <!-- 拒绝原因 -->
        <div v-if="currentRecipe.status === 'rejected' && currentRecipe.rejectReason" class="detail-section">
          <h4>拒绝原因</h4>
          <div class="reject-reason">{{ currentRecipe.rejectReason }}</div>
        </div>

        <!-- 审核历史 -->
        <div v-if="currentRecipe.auditHistory?.length" class="detail-section">
          <h4>审核记录</h4>
          <el-timeline>
            <el-timeline-item
              v-for="(audit, idx) in currentRecipe.auditHistory"
              :key="idx"
              :timestamp="formatDate(audit.createdAt)"
              :type="audit.action === 'approve' ? 'success' : 'danger'"
            >
              <p>{{ audit.action === 'approve' ? '审核通过' : '审核拒绝' }}</p>
              <p v-if="audit.reason">原因：{{ audit.reason }}</p>
              <p>审核人：{{ audit.auditorName }}</p>
            </el-timeline-item>
          </el-timeline>
        </div>
      </div>

      <template #footer>
        <div v-if="currentRecipe?.status === 'pending'" class="dialog-footer">
          <el-button @click="detailDialogVisible = false">取消</el-button>
          <el-button type="danger" @click="handleRejectFromDialog">拒绝</el-button>
          <el-button type="success" @click="handleApproveFromDialog">通过</el-button>
        </div>
        <div v-else>
          <el-button @click="detailDialogVisible = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 拒绝原因弹窗 -->
    <el-dialog
      v-model="rejectDialogVisible"
      title="拒绝原因"
      width="500px"
    >
      <el-input
        v-model="rejectReason"
        type="textarea"
        :rows="4"
        placeholder="请输入拒绝原因（必填）"
      />
      <template #footer>
        <el-button @click="rejectDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="actionLoading" @click="confirmReject">
          确认拒绝
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Refresh, Search, View, Star } from '@element-plus/icons-vue';
import { recipeAuditApi, type UserRecipeItem } from '@/api/recipe-audit';

const loading = ref(false);
const actionLoading = ref(false);
const tableData = ref<UserRecipeItem[]>([]);
const detailDialogVisible = ref(false);
const rejectDialogVisible = ref(false);
const currentRecipe = ref<UserRecipeItem | null>(null);
const rejectReason = ref('');
const pendingRecipeForReject = ref<UserRecipeItem | null>(null);

const filters = reactive({
  status: 'pending',
  keyword: ''
});

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
});

const stats = reactive({
  pending: 0,
  approved: 0,
  rejected: 0
});

// 初始化
onMounted(() => {
  fetchRecipes();
  fetchStats();
});

// 获取列表
async function fetchRecipes() {
  loading.value = true;
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      status: filters.status || undefined
    };
    
    let res;
    if (filters.status === 'pending' || !filters.status) {
      res = await recipeAuditApi.getPendingRecipes(params);
    } else {
      res = await recipeAuditApi.getProcessedRecipes({ ...params, status: filters.status as any });
    }
    
    let data = res.data.data || [];
    
    // 客户端筛选关键字
    if (filters.keyword) {
      const kw = filters.keyword.toLowerCase();
      data = data.filter((item: UserRecipeItem) =>
        item.title.toLowerCase().includes(kw) ||
        item.nickname.toLowerCase().includes(kw)
      );
    }
    
    tableData.value = data;
    pagination.total = res.data.total || data.length;
  } catch (error) {
    console.error('获取菜谱列表失败', error);
    ElMessage.error('获取列表失败');
  } finally {
    loading.value = false;
  }
}

// 获取统计数据
async function fetchStats() {
  try {
    const [pendingRes, approvedRes, rejectedRes] = await Promise.all([
      recipeAuditApi.getPendingRecipes({ pageSize: 1 }),
      recipeAuditApi.getProcessedRecipes({ status: 'approved', pageSize: 1 }),
      recipeAuditApi.getProcessedRecipes({ status: 'rejected', pageSize: 1 })
    ]);
    
    stats.pending = pendingRes.data.total || 0;
    stats.approved = approvedRes.data.total || 0;
    stats.rejected = rejectedRes.data.total || 0;
  } catch (error) {
    console.error('获取统计数据失败', error);
  }
}

// 查看详情
async function handleViewDetail(row: UserRecipeItem) {
  try {
    const res = await recipeAuditApi.getRecipeDetail(row.recipeId);
    currentRecipe.value = res.data.data;
    detailDialogVisible.value = true;
  } catch (error) {
    console.error('获取详情失败', error);
    ElMessage.error('获取详情失败');
  }
}

// 通过
async function handleApprove(row: UserRecipeItem) {
  try {
    await ElMessageBox.confirm(
      `确定通过菜谱"${row.title}"吗？通过后将展示在社区。`,
      '审核确认',
      { type: 'success' }
    );
    
    actionLoading.value = true;
    await recipeAuditApi.auditRecipe(row.recipeId, { action: 'approve' });
    
    ElMessage.success('审核通过');
    fetchRecipes();
    fetchStats();
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('审核失败', error);
      ElMessage.error('操作失败');
    }
  } finally {
    actionLoading.value = false;
  }
}

async function handleApproveFromDialog() {
  if (currentRecipe.value) {
    await handleApprove(currentRecipe.value);
    detailDialogVisible.value = false;
  }
}

// 拒绝
function handleReject(row: UserRecipeItem) {
  pendingRecipeForReject.value = row;
  rejectReason.value = '';
  rejectDialogVisible.value = true;
}

function handleRejectFromDialog() {
  if (currentRecipe.value) {
    pendingRecipeForReject.value = currentRecipe.value;
    rejectReason.value = '';
    rejectDialogVisible.value = true;
    detailDialogVisible.value = false;
  }
}

async function confirmReject() {
  if (!rejectReason.value.trim()) {
    ElMessage.warning('请输入拒绝原因');
    return;
  }

  if (!pendingRecipeForReject.value) return;

  try {
    actionLoading.value = true;
    await recipeAuditApi.auditRecipe(pendingRecipeForReject.value.recipeId, {
      action: 'reject',
      reason: rejectReason.value.trim()
    });
    
    ElMessage.success('已拒绝');
    rejectDialogVisible.value = false;
    fetchRecipes();
    fetchStats();
  } catch (error) {
    console.error('拒绝失败', error);
    ElMessage.error('操作失败');
  } finally {
    actionLoading.value = false;
    pendingRecipeForReject.value = null;
  }
}

// 行点击
function handleRowClick(row: UserRecipeItem) {
  handleViewDetail(row);
}

// 搜索
function handleSearch() {
  pagination.page = 1;
  fetchRecipes();
}

// 重置
function handleReset() {
  filters.status = 'pending';
  filters.keyword = '';
  pagination.page = 1;
  fetchRecipes();
}

// 分页
function handleSizeChange() {
  pagination.page = 1;
  fetchRecipes();
}

function handleCurrentChange() {
  fetchRecipes();
}

// 工具函数
function getStatusText(status: string): string {
  const map: Record<string, string> = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝'
  };
  return map[status] || status;
}

function getStatusType(status: string): string {
  const map: Record<string, string> = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger'
  };
  return map[status] || 'info';
}

function getDifficultyText(difficulty: string): string {
  const map: Record<string, string> = {
    easy: '简单',
    normal: '中等',
    hard: '困难'
  };
  return map[difficulty] || '中等';
}

function formatDate(timestamp: number): string {
  if (!timestamp) return '-';
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}`;
}
</script>

<style scoped>
.page-container {
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.page-title {
  margin: 0 0 8px;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.text-muted {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

/* 统计卡片 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin-right: 16px;
}

.stat-icon.pending {
  background: #fef0e6;
  color: #e6a23c;
}

.stat-icon.approved {
  background: #e8f8f0;
  color: #67c23a;
}

.stat-icon.rejected {
  background: #fef0f0;
  color: #f56c6c;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

/* 卡片容器 */
.card-container {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

/* 筛选区域 */
.filter-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #ebeef5;
}

.filter-left {
  display: flex;
  gap: 12px;
}

.filter-right {
  display: flex;
  gap: 12px;
}

/* 表格 */
.recipe-table {
  cursor: pointer;
}

.recipe-info-cell {
  display: flex;
  align-items: center;
}

.recipe-cover {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  margin-right: 12px;
  flex-shrink: 0;
}

.recipe-detail {
  flex: 1;
  min-width: 0;
}

.recipe-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recipe-meta {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.recipe-meta span {
  margin-right: 12px;
}

.author-cell {
  display: flex;
  align-items: center;
}

.author-name {
  margin-left: 8px;
  font-size: 14px;
  color: #606266;
}

.data-cell {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #909399;
}

.data-cell span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.action-cell {
  display: flex;
  gap: 8px;
}

/* 分页 */
.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

/* 详情弹窗 */
.recipe-detail-content {
  max-height: 60vh;
  overflow-y: auto;
}

.detail-section {
  margin-bottom: 24px;
}

.detail-section h4 {
  margin: 0 0 12px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  padding-bottom: 8px;
  border-bottom: 1px solid #ebeef5;
}

.detail-row {
  display: flex;
  margin-bottom: 8px;
  font-size: 14px;
  color: #606266;
}

.detail-row .label {
  width: 80px;
  color: #909399;
  flex-shrink: 0;
}

.detail-cover {
  width: 200px;
  height: 150px;
  border-radius: 8px;
}

.ingredient-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.ingredient-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 4px;
  font-size: 14px;
}

.ingredient-item .amount {
  color: #909399;
}

.step-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.step-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.step-num {
  width: 24px;
  height: 24px;
  background: linear-gradient(135deg, #e2a650, #f7c948);
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.step-desc {
  flex: 1;
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
}

.tips-content {
  padding: 12px;
  background: #fdf6ec;
  border-radius: 4px;
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
}

.reject-reason {
  padding: 12px;
  background: #fef0f0;
  border-radius: 4px;
  font-size: 14px;
  color: #f56c6c;
  line-height: 1.6;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
