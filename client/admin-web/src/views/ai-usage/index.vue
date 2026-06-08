<template>
  <div class="ai-usage-page">
    <div class="page-header">
      <div>
        <h2>AI使用记录</h2>
        <p>追踪聊天、识图、生图和运营文案的调用明细、Token 与成本。</p>
      </div>
      <el-button :icon="Refresh" :loading="loading" @click="loadData">刷新</el-button>
    </div>

    <div class="summary-grid">
      <div class="summary-card">
        <span class="summary-label">调用次数</span>
        <strong>{{ summary.total.count }}</strong>
        <span class="summary-sub">成功 {{ summary.total.successCount }} / 失败 {{ summary.total.failedCount }}</span>
      </div>
      <div class="summary-card">
        <span class="summary-label">总 Token</span>
        <strong>{{ formatToken(summary.total.totalTokens) }}</strong>
        <span class="summary-sub">输入 {{ formatToken(summary.total.tokensIn) }} / 输出 {{ formatToken(summary.total.tokensOut) }}</span>
      </div>
      <div class="summary-card">
        <span class="summary-label">估算成本</span>
        <strong>{{ formatCost(summary.total.cost) }}</strong>
        <span class="summary-sub">按 AI Key 单价计算</span>
      </div>
      <div class="summary-card usage-breakdown">
        <span class="summary-label">场景分布</span>
        <div class="usage-tags">
          <el-tag v-for="item in summary.byUsage" :key="item.usage" :type="usageTagType(item.usage)" effect="plain">
            {{ item.label }} {{ item.count }}
          </el-tag>
          <span v-if="summary.byUsage.length === 0" class="summary-sub">暂无数据</span>
        </div>
      </div>
    </div>

    <div class="filter-bar">
      <el-input
        v-model="filters.keyword"
        clearable
        :prefix-icon="Search"
        placeholder="搜索模型、Key、用户、输入、输出或错误"
        @keyup.enter="handleSearch"
      />
      <el-select v-model="filters.usage" clearable placeholder="使用场景">
        <el-option label="AI聊天" value="chat" />
        <el-option label="食材识别" value="vision" />
        <el-option label="AI生图" value="image" />
      </el-select>
      <el-select v-model="filters.success" clearable placeholder="调用状态">
        <el-option label="成功" value="true" />
        <el-option label="失败" value="false" />
      </el-select>
      <el-input v-model="filters.userId" clearable placeholder="用户ID" />
      <el-date-picker
        v-model="dateRange"
        type="daterange"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        value-format="YYYY-MM-DD"
      />
      <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
      <el-button @click="resetFilters">重置</el-button>
    </div>

    <el-table v-loading="loading" :data="list" class="usage-table" @row-click="openDetail">
      <el-table-column prop="createdAt" label="时间" width="170" />
      <el-table-column label="场景" width="110">
        <template #default="{ row }">
          <el-tag :type="usageTagType(row.usage)" effect="plain">{{ usageLabel(row.usage) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.success ? 'success' : 'danger'" effect="dark">{{ row.success ? '成功' : '失败' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="用户" width="140">
        <template #default="{ row }">
          <span>{{ row.userName || (row.userId ? `用户${row.userId}` : '系统') }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="purpose" label="用途" width="130" />
      <el-table-column label="模型 / Key" min-width="190">
        <template #default="{ row }">
          <div class="model-cell">
            <strong>{{ row.model }}</strong>
            <span>{{ row.apiKeyName }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="Token" width="150">
        <template #default="{ row }">
          <span>{{ formatToken(row.totalTokens) }}</span>
          <small>入 {{ formatToken(row.tokensIn) }} / 出 {{ formatToken(row.tokensOut) }}</small>
        </template>
      </el-table-column>
      <el-table-column label="成本" width="100">
        <template #default="{ row }">{{ formatCost(row.cost) }}</template>
      </el-table-column>
      <el-table-column label="耗时" width="90">
        <template #default="{ row }">{{ row.duration ? `${row.duration}ms` : '-' }}</template>
      </el-table-column>
      <el-table-column label="输入/输出" min-width="220">
        <template #default="{ row }">
          <el-tooltip placement="top" :content="row.error || row.output || row.input || '-'">
            <span class="ellipsis">{{ row.error || row.output || row.input || '-' }}</span>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="90" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click.stop="openDetail(row)">详情</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-wrap">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="pagination.total"
        @size-change="loadData"
        @current-change="loadData"
      />
    </div>

    <el-dialog v-model="detailVisible" title="调用详情" width="720px">
      <el-descriptions v-if="current" :column="2" border>
        <el-descriptions-item label="时间">{{ current.createdAt }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ current.success ? '成功' : '失败' }}</el-descriptions-item>
        <el-descriptions-item label="场景">{{ usageLabel(current.usage) }}</el-descriptions-item>
        <el-descriptions-item label="用途">{{ current.purpose }}</el-descriptions-item>
        <el-descriptions-item label="模型">{{ current.model }}</el-descriptions-item>
        <el-descriptions-item label="API Key">{{ current.apiKeyName }}</el-descriptions-item>
        <el-descriptions-item label="用户">{{ current.userName || current.userId || '系统' }}</el-descriptions-item>
        <el-descriptions-item label="耗时">{{ current.duration ? `${current.duration}ms` : '-' }}</el-descriptions-item>
        <el-descriptions-item label="Token">{{ current.tokensIn }} + {{ current.tokensOut }} = {{ current.totalTokens }}</el-descriptions-item>
        <el-descriptions-item label="成本">{{ formatCost(current.cost) }}</el-descriptions-item>
      </el-descriptions>
      <div v-if="current" class="detail-block">
        <h4>输入</h4>
        <pre>{{ current.input || '-' }}</pre>
        <h4>输出</h4>
        <pre>{{ current.output || '-' }}</pre>
        <h4 v-if="current.error">错误</h4>
        <pre v-if="current.error" class="error-text">{{ current.error }}</pre>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { Refresh, Search } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { logsApi, type AiUsageLogItem } from '@/api/logs';

const loading = ref(false);
const list = ref<AiUsageLogItem[]>([]);
const dateRange = ref<[string, string] | null>(null);
const detailVisible = ref(false);
const current = ref<AiUsageLogItem | null>(null);

const filters = reactive({
  keyword: '',
  usage: '',
  success: '',
  userId: '',
});

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
});

const summary = reactive({
  total: {
    count: 0,
    successCount: 0,
    failedCount: 0,
    tokensIn: 0,
    tokensOut: 0,
    totalTokens: 0,
    cost: 0,
  },
  byUsage: [] as Array<{
    usage: string;
    label: string;
    count: number;
    successCount: number;
    failedCount: number;
    tokensIn: number;
    tokensOut: number;
    totalTokens: number;
    cost: number;
  }>,
});

function buildParams() {
  return {
    page: pagination.page,
    pageSize: pagination.pageSize,
    keyword: filters.keyword || undefined,
    usage: filters.usage || undefined,
    success: filters.success || undefined,
    userId: filters.userId || undefined,
    startDate: dateRange.value?.[0],
    endDate: dateRange.value?.[1],
  };
}

async function loadData() {
  loading.value = true;
  try {
    const res = await logsApi.aiUsage(buildParams());
    const data = res.data;
    list.value = data.list;
    pagination.total = data.total;
    Object.assign(summary.total, data.summary?.total || {});
    summary.byUsage = data.summary?.byUsage || [];
  } catch {
    ElMessage.error('加载 AI 使用记录失败');
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  pagination.page = 1;
  loadData();
}

function resetFilters() {
  filters.keyword = '';
  filters.usage = '';
  filters.success = '';
  filters.userId = '';
  dateRange.value = null;
  handleSearch();
}

function openDetail(row: unknown) {
  current.value = row as AiUsageLogItem;
  detailVisible.value = true;
}

function usageLabel(usage?: string | null) {
  if (usage === 'chat') return 'AI聊天';
  if (usage === 'vision') return '食材识别';
  if (usage === 'image') return 'AI生图';
  return '通用';
}

function usageTagType(usage?: string | null) {
  if (usage === 'chat') return 'primary';
  if (usage === 'vision') return 'warning';
  if (usage === 'image') return 'success';
  return 'info';
}

function formatToken(num?: number | null) {
  const value = num || 0;
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toLocaleString();
}

function formatCost(cost?: number | null) {
  return `$${(cost || 0).toFixed(4)}`;
}

onMounted(loadData);
</script>

<style scoped lang="scss">
.ai-usage-page {
  padding: 24px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;

  h2 {
    margin: 0 0 6px;
    font-size: 24px;
    color: #1f2937;
  }

  p {
    margin: 0;
    color: #6b7280;
  }
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 18px;
}

.summary-card {
  min-height: 104px;
  padding: 18px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;

  strong {
    font-size: 28px;
    color: #111827;
  }
}

.summary-label {
  color: #6b7280;
  font-size: 13px;
}

.summary-sub {
  color: #9ca3af;
  font-size: 12px;
}

.usage-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.filter-bar {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) 140px 120px 110px 260px auto auto;
  gap: 12px;
  margin-bottom: 16px;
  padding: 16px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.usage-table {
  border: 1px solid #e5e7eb;
  border-radius: 8px;

  small {
    display: block;
    color: #9ca3af;
    margin-top: 2px;
  }
}

.model-cell {
  display: flex;
  flex-direction: column;
  gap: 3px;

  span {
    color: #6b7280;
    font-size: 12px;
  }
}

.ellipsis {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.detail-block {
  margin-top: 18px;

  h4 {
    margin: 16px 0 8px;
    color: #374151;
  }

  pre {
    margin: 0;
    padding: 12px;
    max-height: 180px;
    overflow: auto;
    white-space: pre-wrap;
    word-break: break-word;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    color: #374151;
  }

  .error-text {
    color: #b91c1c;
    background: #fef2f2;
    border-color: #fecaca;
  }
}

@media (max-width: 1200px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .filter-bar {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .ai-usage-page {
    padding: 16px;
  }

  .page-header {
    align-items: flex-start;
    flex-direction: column;
    gap: 12px;
  }

  .summary-grid,
  .filter-bar {
    grid-template-columns: 1fr;
  }
}
</style>
