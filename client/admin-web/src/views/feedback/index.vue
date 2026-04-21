<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">反馈管理</h2>
    </div>
    <div class="card-container">
      <el-table v-loading="loading" :data="tableData">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="type" label="类型" width="120" />
        <el-table-column prop="content" label="反馈内容" min-width="200" :show-overflow-tooltip="true" />
        <el-table-column prop="contact" label="联系方式" width="150" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="时间" width="180" />
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleReply(row)">回复</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElMessage } from 'element-plus';

const loading = ref(false);
const tableData = ref<any[]>([]);

function getStatusType(status: string) {
  const map: Record<string, any> = { PENDING: 'warning', REPLIED: 'success', RESOLVED: 'info' };
  return map[status] || 'info';
}

function getStatusText(status: string) {
  const map: Record<string, string> = { PENDING: '待处理', REPLIED: '已回复', RESOLVED: '已解决' };
  return map[status] || status;
}

function handleReply(row: any) {
  ElMessage.info('回复功能');
}
</script>
