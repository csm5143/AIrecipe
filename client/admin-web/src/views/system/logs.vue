<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">操作日志</h2>
    </div>
    <div class="card-container">
      <el-table :data="logs" size="small">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="adminId" label="管理员" width="100" />
        <el-table-column prop="action" label="操作" />
        <el-table-column prop="module" label="模块" width="100" />
        <el-table-column prop="detail" label="详情" :show-overflow-tooltip="true" />
        <el-table-column prop="ip" label="IP" width="130" />
        <el-table-column prop="createdAt" label="时间" width="180" />
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const logs = ref<any[]>([]);
</script>
