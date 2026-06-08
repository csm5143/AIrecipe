<template>
  <div class="report-page">
    <div class="page-header">
      <div>
        <h2>举报管理</h2>
        <p>集中处理用户提交的内容举报</p>
      </div>
      <el-select v-model="query.status" clearable placeholder="状态筛选" style="width: 160px" @change="loadReports">
        <el-option label="待处理" value="pending" />
        <el-option label="已处理" value="resolved" />
        <el-option label="已关闭" value="closed" />
      </el-select>
    </div>

    <el-table v-loading="loading" :data="reports" border>
      <el-table-column prop="reporterName" label="举报人" min-width="120" />
      <el-table-column prop="targetContentId" label="被举报内容ID" min-width="140" show-overflow-tooltip />
      <el-table-column prop="type" label="类型" width="120" />
      <el-table-column prop="reason" label="原因" min-width="220" show-overflow-tooltip />
      <el-table-column label="状态" width="110">
        <template #default="{ row }">
          <el-tag :type="statusTag(row as ReportItem)">{{ statusText(row as ReportItem) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="时间" width="170">
        <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="230" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDetail(row as ReportItem)">查看详情</el-button>
          <el-button link type="success" :disabled="row.status === 'resolved'" @click="handle(row as ReportItem, 'resolved')">标记已处理</el-button>
          <el-button link type="warning" :disabled="row.status === 'closed'" @click="handle(row as ReportItem, 'closed')">忽略</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pager">
      <el-pagination
        v-model:current-page="query.page"
        v-model:page-size="query.pageSize"
        layout="total, sizes, prev, pager, next"
        :total="total"
        @current-change="loadReports"
        @size-change="loadReports"
      />
    </div>

    <el-dialog v-model="detailVisible" title="举报详情" width="560px">
      <el-descriptions v-if="current" :column="1" border>
        <el-descriptions-item label="举报人">{{ current.reporterName }}</el-descriptions-item>
        <el-descriptions-item label="被举报内容ID">{{ current.targetContentId || '-' }}</el-descriptions-item>
        <el-descriptions-item label="类型">{{ current.type }}</el-descriptions-item>
        <el-descriptions-item label="原因">{{ current.reason }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ REPORT_STATUS_MAP[current.status] }}</el-descriptions-item>
        <el-descriptions-item label="提交时间">{{ formatTime(current.createdAt) }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { reportApi, REPORT_STATUS_MAP, type ReportItem, type ReportStatus } from '@/api/report';

const loading = ref(false);
const reports = ref<ReportItem[]>([]);
const total = ref(0);
const detailVisible = ref(false);
const current = ref<ReportItem | null>(null);

const query = reactive<{ page: number; pageSize: number; status: ReportStatus | '' }>({
  page: 1,
  pageSize: 20,
  status: '',
});

async function loadReports() {
  loading.value = true;
  try {
    const res = await reportApi.getReports(query);
    reports.value = res.data.list;
    total.value = res.data.total;
  } finally {
    loading.value = false;
  }
}

async function openDetail(row: ReportItem) {
  current.value = await reportApi.getReport(row.id).then(res => res.data);
  detailVisible.value = true;
}

async function handle(row: ReportItem, status: 'resolved' | 'closed') {
  await reportApi.handleReport(row.id, status);
  ElMessage.success(status === 'resolved' ? '已标记处理' : '已忽略');
  await loadReports();
}

function statusText(row: ReportItem) {
  return REPORT_STATUS_MAP[row.status] || row.status;
}

function statusTag(row: ReportItem) {
  const status = row.status;
  if (status === 'resolved') return 'success';
  if (status === 'closed') return 'info';
  return 'warning';
}

function formatTime(value: number) {
  return value ? new Date(value).toLocaleString() : '-';
}

onMounted(loadReports);
</script>

<style scoped lang="scss">
.report-page {
  padding: 24px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;

  h2 {
    margin: 0 0 4px;
    font-size: 20px;
  }

  p {
    margin: 0;
    color: var(--text-secondary);
    font-size: 13px;
  }
}

.pager {
  display: flex;
  justify-content: flex-end;
  padding-top: 16px;
}
</style>
