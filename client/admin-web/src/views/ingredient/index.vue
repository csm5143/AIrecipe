<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">食材管理</h2>
      <el-button type="primary" @click="handleCreate">添加食材</el-button>
    </div>
    <div class="card-container">
      <el-table v-loading="loading" :data="tableData">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="名称" />
        <el-table-column prop="category" label="分类" />
        <el-table-column prop="calories" label="热量(kcal/100g)" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'ACTIVE' ? 'success' : 'info'">
              {{ row.status === 'ACTIVE' ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button type="primary" link>编辑</el-button>
            <el-button type="danger" link>删除</el-button>
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

function handleCreate() {
  ElMessage.info('添加食材');
}
</script>
