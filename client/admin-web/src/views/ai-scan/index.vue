<template>
  <div class="page-container">
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">AI 扫描记录</h2>
        <p class="text-muted">管理用户拍照识别食材的扫描记录</p>
      </div>
      <div class="header-actions">
        <el-button :icon="Refresh" @click="fetchScans">刷新</el-button>
      </div>
    </div>

    <div class="page-content">
      <!-- 统计横条 -->
      <div class="stats-bar">
        <div class="stats-chips">
          <div class="stats-chip total">
            <el-icon><Monitor /></el-icon>
            <span class="chip-label">全部记录</span>
            <span class="chip-value">{{ pagination.total }}</span>
          </div>
          <div class="stats-chip success">
            <el-icon><CircleCheck /></el-icon>
            <span class="chip-label">成功</span>
            <span class="chip-value">{{ stats.success }}</span>
          </div>
          <div class="stats-chip failed">
            <el-icon><CircleClose /></el-icon>
            <span class="chip-label">失败</span>
            <span class="chip-value">{{ stats.failed }}</span>
          </div>
        </div>

        <div class="filter-row">
          <el-input
            v-model="filters.keyword"
            placeholder="搜索用户昵称或手机号..."
            clearable
            style="width: 220px"
            :prefix-icon="Search"
            @keyup.enter="fetchScans"
          />
          <el-select v-model="filters.status" placeholder="处理状态" clearable style="width: 130px">
            <el-option label="全部状态" value="" />
            <el-option label="已完成" value="success" />
            <el-option label="失败" value="failed" />
          </el-select>
          <el-button @click="handleReset">重置</el-button>
          <el-button type="primary" @click="fetchScans">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
        </div>
      </div>

      <!-- 表格 -->
      <div class="table-wrapper">
        <el-table
          v-loading="loading"
          :data="tableData"
          row-key="id"
          stripe
        >
          <el-table-column type="index" label="#" width="50" align="center" />
          <el-table-column label="用户信息" min-width="140">
            <template #default="{ row }">
              <div class="user-cell">
                <el-avatar :size="32" :src="row.avatar">
                  {{ row.nickname?.charAt(0) }}
                </el-avatar>
                <div class="user-text">
                  <span class="user-name">{{ row.nickname || '未知用户' }}</span>
                  <span class="user-phone">{{ row.phone || '—' }}</span>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="图片" width="72" align="center">
            <template #default="{ row }">
              <el-image
                v-if="row.imageUrl"
                :src="getFullImageUrl(row.imageUrl)"
                fit="cover"
                class="scan-thumb"
                :preview-src-list="[getFullImageUrl(row.imageUrl)]"
                preview-teleported
              />
              <span v-else class="text-muted">—</span>
            </template>
          </el-table-column>
          <el-table-column label="识别食材" min-width="140">
            <template #default="{ row }">
              <div v-if="row.result?.ingredients?.length" class="ing-tags">
                <el-tag
                  v-for="(ing, idx) in row.result.ingredients.slice(0, 2)"
                  :key="idx"
                  size="small"
                  type="info"
                >{{ ing }}</el-tag>
                <span v-if="row.result.ingredients.length > 2" class="ing-more">
                  +{{ row.result.ingredients.length - 2 }}
                </span>
              </div>
              <span v-else-if="row.status === 'failed'" class="text-muted text-small">识别失败</span>
              <span v-else class="text-muted text-small">—</span>
            </template>
          </el-table-column>
          <el-table-column label="推荐菜谱" width="90" align="center">
            <template #default="{ row }">
              <span v-if="row.recipes?.length" class="recipes-count">
                {{ row.recipes.length }} 个
              </span>
              <span v-else class="text-muted text-small">—</span>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="76" align="center">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)" size="small" effect="plain">
                {{ row.statusText }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="时间" width="130" align="center">
            <template #default="{ row }">
              <span class="text-muted text-small">{{ formatTime(row.createTime) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80" fixed="right" align="center">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="openDrawer(row)">
                查看详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <div v-if="tableData.length === 0 && !loading" class="empty-state">
          <div class="empty-icon"><el-icon><Monitor /></el-icon></div>
          <div class="empty-title">暂无扫描记录</div>
          <div class="empty-desc">用户拍照识别食材的记录将在此显示</div>
        </div>
      </div>

      <!-- 分页 -->
      <div class="table-footer">
        <span class="page-subtitle">共 {{ pagination.total }} 条</span>
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

    <!-- 详情侧边抽屉 -->
    <el-drawer
      v-model="drawerVisible"
      title="扫描详情"
      direction="rtl"
      size="400px"
    >
      <template v-if="currentScan">
        <!-- 用户信息头 -->
        <div class="drawer-header">
          <div class="drawer-user">
            <el-avatar :size="40" :src="currentScan.avatar">
              {{ currentScan.nickname?.charAt(0) }}
            </el-avatar>
            <div>
              <div class="drawer-name">{{ currentScan.nickname || '未知用户' }}</div>
              <div class="drawer-sub">{{ currentScan.phone || '—' }}</div>
            </div>
          </div>
          <el-tag :type="getStatusType(currentScan.status)" size="small" effect="plain">
            {{ currentScan.statusText }}
          </el-tag>
        </div>

        <div class="drawer-time">{{ formatTime(currentScan.createTime) }}</div>

        <el-divider />

        <!-- 调用信息 -->
        <div class="drawer-section">
          <div class="drawer-section-title">调用信息</div>
          <div class="call-info-card">
            <div class="call-row">
              <span class="call-label">模型</span>
              <span v-if="currentScan.model" class="model-badge">{{ currentScan.model }}</span>
              <span v-else class="text-muted text-small">—</span>
            </div>
            <div class="call-row">
              <span class="call-label">Key</span>
              <span v-if="currentScan.apiKeyName" class="call-value">{{ currentScan.apiKeyName }}</span>
              <span v-else class="text-muted text-small">—</span>
            </div>
            <div class="call-row">
              <span class="call-label">Token</span>
              <span v-if="currentScan.tokensUsed > 0" class="token-badge">
                {{ formatToken(currentScan.tokensUsed) }}
              </span>
              <span v-else class="text-muted text-small">—</span>
            </div>
          </div>
        </div>

        <!-- 扫描图片 -->
        <div class="drawer-section">
          <div class="drawer-section-title">扫描图片</div>
          <el-image
            v-if="currentScan.imageUrl"
            :src="getFullImageUrl(currentScan.imageUrl)"
            fit="contain"
            class="drawer-image"
            :preview-src-list="[getFullImageUrl(currentScan.imageUrl)]"
            preview-teleported
          />
          <span v-else class="text-muted text-small">无图片</span>
        </div>

        <!-- 识别结果 -->
        <div class="drawer-section">
          <div class="drawer-section-title">
            识别食材
            <span v-if="currentScan.result?.ingredients?.length" class="count-badge">
              {{ currentScan.result.ingredients.length }}
            </span>
          </div>
          <div v-if="currentScan.result?.ingredients?.length" class="ing-grid">
            <el-tag
              v-for="(ing, idx) in currentScan.result.ingredients"
              :key="idx"
              type="info"
              size="small"
              effect="plain"
            >{{ ing }}</el-tag>
          </div>
          <div v-else-if="currentScan.errorMsg" class="error-hint">
            识别失败：{{ currentScan.errorMsg }}
          </div>
          <span v-else class="text-muted text-small">无识别结果</span>
        </div>

        <!-- 推荐菜谱 -->
        <div v-if="currentScan.recipes?.length" class="drawer-section">
          <div class="drawer-section-title">
            推荐菜谱
            <span class="count-badge">{{ currentScan.recipes.length }}</span>
          </div>
          <div class="recipe-list">
            <div v-for="r in currentScan.recipes" :key="r.id" class="recipe-item">
              <el-icon class="recipe-icon"><Food /></el-icon>
              <span>{{ r.title || r.name || `菜谱 #${r.id}` }}</span>
            </div>
          </div>
        </div>

        <!-- 错误信息 -->
        <div v-if="currentScan.errorMsg" class="drawer-section">
          <div class="drawer-section-title error-title">错误信息</div>
          <pre class="error-msg">{{ currentScan.errorMsg }}</pre>
        </div>

        <!-- 底部操作 -->
        <div class="drawer-actions">
          <el-button
            v-if="currentScan.status !== 'success'"
            type="success"
            @click="handleMarkSuccess"
          >标记已完成</el-button>
          <el-button
            v-if="currentScan.status !== 'failed'"
            type="danger"
            plain
            @click="handleMarkFailed"
          >标记失败</el-button>
          <el-button type="danger" plain @click="handleDeleteScan">删除记录</el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  Search, Refresh, Loading, CircleCheck,
  CircleClose, Monitor, Food,
} from '@element-plus/icons-vue';
import { aiScanApi, type AiScanItem, type AiScanStatus } from '@/api/ai-scan';

const loading = ref(false);
const drawerVisible = ref(false);
const currentScan = ref<AiScanItem | null>(null);

const filters = reactive({
  keyword: '',
  status: '' as AiScanStatus | '',
});

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
});

const tableData = ref<AiScanItem[]>([]);

const stats = computed(() => ({
  success: tableData.value.filter(s => s.status === 'success').length,
  failed: tableData.value.filter(s => s.status === 'failed').length,
}));

function getStatusType(status: string) {
  return { success: 'success', failed: 'danger' }[status] || 'warning';
}

function formatTime(timestamp: number) {
  if (!timestamp) return '—';
  return new Date(timestamp).toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatToken(num: number) {
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return String(num);
}

function getFullImageUrl(url: string) {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `https://dish-1367781796.cos.ap-guangzhou.myqcloud.com${url.startsWith('/') ? '' : '/'}${url}`;
}

async function fetchScans() {
  loading.value = true;
  try {
    const res = await aiScanApi.getList({
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: filters.keyword || undefined,
      status: (filters.status as AiScanStatus) || undefined,
    });
    tableData.value = res.data?.list || [];
    pagination.total = res.data?.total || 0;
  } catch (error) {
    console.error('获取扫描记录失败:', error);
    ElMessage.error('获取扫描记录失败');
  } finally {
    loading.value = false;
  }
}

function openDrawer(row: AiScanItem) {
  currentScan.value = { ...row };
  drawerVisible.value = true;
}

async function handleMarkSuccess() {
  if (!currentScan.value) return;
  try {
    await aiScanApi.updateStatus(currentScan.value.id, 'success');
    currentScan.value.status = 'success';
    currentScan.value.statusText = '已完成';
    ElMessage.success('已标记为已完成');
    await fetchScans();
  } catch {
    ElMessage.error('标记失败');
  }
}

async function handleMarkFailed() {
  if (!currentScan.value) return;
  try {
    await aiScanApi.updateStatus(currentScan.value.id, 'failed');
    currentScan.value.status = 'failed';
    currentScan.value.statusText = '失败';
    ElMessage.success('已标记为失败');
    await fetchScans();
  } catch {
    ElMessage.error('标记失败');
  }
}

async function handleDeleteScan() {
  if (!currentScan.value) return;
  try {
    await ElMessageBox.confirm('确定删除该扫描记录？', '确认删除', { type: 'warning' });
    await aiScanApi.delete(currentScan.value.id);
    drawerVisible.value = false;
    ElMessage.success('删除成功');
    await fetchScans();
  } catch { /* cancelled */ }
}

function handleReset() {
  filters.keyword = '';
  filters.status = '';
  pagination.page = 1;
  fetchScans();
}

watch([() => filters.status, () => pagination.page, () => pagination.pageSize], () => {
  fetchScans();
});

onMounted(() => {
  fetchScans();
});
</script>

<style scoped lang="scss">
.page-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

// ==================== 统计横条 ====================

.stats-bar {
  background: var(--surface-200);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  padding: 14px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.stats-chips {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stats-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 14px;
  border-radius: 20px;
  border: 1px solid transparent;
  font-family: var(--font-mono);
  font-size: 13px;

  .chip-label {
    color: rgba(38, 37, 30, 0.5);
  }

  .chip-value {
    font-weight: 700;
    font-size: 16px;
    color: var(--cursor-dark);
  }

  .el-icon { font-size: 13px; }

  &.total {
    background: rgba(64, 158, 255, 0.08);
    border-color: rgba(64, 158, 255, 0.2);
    color: #409eff;
  }

  &.success {
    background: rgba(103, 194, 58, 0.08);
    border-color: rgba(103, 194, 58, 0.2);
    color: #67c23a;
  }

  &.failed {
    background: rgba(245, 108, 108, 0.08);
    border-color: rgba(245, 108, 108, 0.2);
    color: #f56c6c;
  }
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

// ==================== 表格 ====================

.table-wrapper {
  background: var(--surface-200);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 8px;

  .user-text {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  .user-name {
    font-family: var(--font-display);
    font-size: 13px;
    color: var(--cursor-dark);
    line-height: 1.3;
  }

  .user-phone {
    font-family: var(--font-mono);
    font-size: 11px;
    color: rgba(38, 37, 30, 0.4);
  }
}

.scan-thumb {
  width: 44px;
  height: 44px;
  border-radius: 6px;
  cursor: pointer;
  object-fit: cover;
}

.ing-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  align-items: center;
}

.ing-more {
  font-family: var(--font-mono);
  font-size: 11px;
  color: rgba(38, 37, 30, 0.4);
}

.recipes-count {
  font-family: var(--font-mono);
  font-size: 12px;
  color: rgba(38, 37, 30, 0.6);
}

// ==================== 空状态 ====================

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;

  .empty-icon {
    font-size: 48px;
    color: rgba(38, 37, 30, 0.15);
    margin-bottom: 12px;
  }

  .empty-title {
    font-family: var(--font-display);
    font-size: 16px;
    color: rgba(38, 37, 30, 0.5);
    margin-bottom: 4px;
  }

  .empty-desc {
    font-family: var(--font-serif);
    font-size: 13px;
    color: rgba(38, 37, 30, 0.35);
  }
}

// ==================== 分页 ====================

.table-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;

  .page-subtitle {
    font-family: var(--font-mono);
    font-size: 12px;
    color: rgba(38, 37, 30, 0.4);
  }
}

// ==================== 侧边抽屉 ====================

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.drawer-user {
  display: flex;
  align-items: center;
  gap: 10px;

  .drawer-name {
    font-family: var(--font-display);
    font-size: 14px;
    font-weight: 500;
    color: var(--cursor-dark);
  }

  .drawer-sub {
    font-family: var(--font-mono);
    font-size: 11px;
    color: rgba(38, 37, 30, 0.4);
    margin-top: 2px;
  }
}

.drawer-time {
  font-family: var(--font-mono);
  font-size: 12px;
  color: rgba(38, 37, 30, 0.4);
  margin-bottom: 4px;
}

.drawer-section {
  margin-bottom: 20px;
}

.drawer-section-title {
  font-family: var(--font-display);
  font-size: 12px;
  font-weight: 500;
  color: rgba(38, 37, 30, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.6px;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  background: rgba(38, 37, 30, 0.08);
  border-radius: 9px;
  font-family: var(--font-mono);
  font-size: 11px;
  color: rgba(38, 37, 30, 0.55);
}

.call-info-card {
  background: var(--surface-300);
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.call-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;

  .call-label {
    font-family: var(--font-mono);
    font-size: 12px;
    color: rgba(38, 37, 30, 0.45);
    flex-shrink: 0;
  }

  .call-value {
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--cursor-dark);
    text-align: right;
  }
}

.model-badge {
  font-family: var(--font-mono);
  font-size: 11px;
  color: rgba(168, 85, 247, 0.9);
  background: rgba(168, 85, 247, 0.08);
  padding: 2px 7px;
  border-radius: 4px;
}

.token-badge {
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 700;
  color: rgba(38, 37, 30, 0.75);
}

.drawer-image {
  width: 100%;
  max-height: 220px;
  border-radius: 8px;
  background: var(--surface-300);
  object-fit: cover;
}

.ing-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.recipe-list {
  display: flex;
  flex-direction: column;
  gap: 6px;

  .recipe-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: var(--surface-300);
    border-radius: 6px;
    font-family: var(--font-display);
    font-size: 13px;
    color: var(--cursor-dark);

    .recipe-icon {
      color: rgba(245, 78, 0, 0.7);
      font-size: 14px;
    }
  }
}

.error-hint {
  font-family: var(--font-serif);
  font-size: 13px;
  color: #f56c6c;
  padding: 8px 12px;
  background: rgba(245, 108, 108, 0.06);
  border-radius: 6px;
}

.error-msg {
  background: var(--surface-300);
  border: 1px solid rgba(245, 108, 108, 0.2);
  border-radius: 6px;
  padding: 12px;
  font-family: var(--font-mono);
  font-size: 12px;
  color: #f56c6c;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 150px;
  overflow: auto;
}

.error-title {
  color: #f56c6c;
}

.drawer-actions {
  display: flex;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--border-primary);
  margin-top: 8px;
  position: sticky;
  bottom: 0;
  background: var(--surface-100);
  padding-bottom: 8px;
}

@media (max-width: 768px) {
  .stats-bar {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
