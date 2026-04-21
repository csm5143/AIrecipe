<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">管理员</h2>
      <el-button type="primary">添加管理员</el-button>
    </div>
    <div class="card-container">
      <el-table :data="admins">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="用户名" />
        <el-table-column prop="nickname" label="昵称" />
        <el-table-column prop="role" label="角色" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'ACTIVE' ? 'success' : 'danger'">
              {{ row.status === 'ACTIVE' ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lastLoginAt" label="最后登录" width="180" />
        <el-table-column label="操作" width="150">
          <template #default>
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

const admins = ref<any[]>([
  { id: 1, username: 'admin', nickname: '管理员', role: 'SUPER_ADMIN', status: 'ACTIVE', lastLoginAt: '2024-01-01 10:00:00' },
]);
</script>
