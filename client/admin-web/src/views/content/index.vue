<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">内容运营</h2>
    </div>
    <el-tabs v-model="activeTab">
      <el-tab-pane label="Banner 管理" name="banners">
        <div class="card-container">
          <div style="margin-bottom: 16px">
            <el-button type="primary" @click="handleAddBanner">添加 Banner</el-button>
          </div>
          <el-table :data="banners">
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="title" label="标题" />
            <el-table-column label="图片" width="120">
              <template #default="{ row }">
                <el-image v-if="row.imageUrl" :src="row.imageUrl" style="width: 60px; height: 30px" fit="cover" />
              </template>
            </el-table-column>
            <el-table-column prop="sortOrder" label="排序" width="80" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === 'ACTIVE' ? 'success' : 'info'">
                  {{ row.status === 'ACTIVE' ? '启用' : '禁用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150">
              <template #default>
                <el-button type="primary" link>编辑</el-button>
                <el-button type="danger" link>删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>
      <el-tab-pane label="公告管理" name="notices">
        <div class="card-container">
          <div style="margin-bottom: 16px">
            <el-button type="primary">发布公告</el-button>
          </div>
          <el-table :data="[]">
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="title" label="标题" />
            <el-table-column prop="type" label="类型" width="100" />
            <el-table-column prop="status" label="状态" width="100" />
            <el-table-column label="操作" width="150">
              <template #default>
                <el-button type="primary" link>编辑</el-button>
                <el-button type="danger" link>删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const activeTab = ref('banners');
const banners = ref<any[]>([]);

function handleAddBanner() {}
</script>
