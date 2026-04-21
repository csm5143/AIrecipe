<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">收藏管理</h2>
    </div>
    <div class="card-container">
      <el-table v-loading="loading" :data="tableData">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="收藏夹名称" />
        <el-table-column prop="userId" label="用户ID" width="100" />
        <el-table-column prop="itemCount" label="收藏数" width="100" />
        <el-table-column prop="isPublic" label="公开" width="80">
          <template #default="{ row }">
            <el-tag :type="row.isPublic ? 'success' : 'info'">
              {{ row.isPublic ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180" />
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const loading = ref(false);
const tableData = ref<any[]>([]);
</script>
