<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">食谱管理</h2>
      <el-button type="primary" @click="router.push('/recipes/create')">创建食谱</el-button>
    </div>
    <div class="card-container">
      <div class="filter-bar">
        <el-input v-model="filters.keyword" placeholder="搜索食谱" clearable style="width: 200px" />
        <el-select v-model="filters.status" placeholder="状态" clearable style="width: 120px">
          <el-option label="全部" value="" />
          <el-option label="草稿" value="DRAFT" />
          <el-option label="已发布" value="PUBLISHED" />
          <el-option label="已下线" value="OFFLINE" />
        </el-select>
        <el-button type="primary" @click="fetchRecipes">搜索</el-button>
      </div>
      <el-table v-loading="loading" :data="tableData">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="title" label="标题" min-width="200" />
        <el-table-column prop="category" label="分类" width="100" />
        <el-table-column prop="difficulty" label="难度" width="80" />
        <el-table-column prop="viewCount" label="浏览" width="80" />
        <el-table-column prop="collectCount" label="收藏" width="80" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="router.push(`/recipes/${row.id}/edit`)">编辑</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        style="margin-top: 16px; justify-content: flex-end"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';

const router = useRouter();
const loading = ref(false);
const tableData = ref<any[]>([]);
const filters = reactive({ keyword: '', status: '' });
const pagination = reactive({ page: 1, pageSize: 20, total: 0 });

function getStatusType(status: string) {
  const map: Record<string, any> = { PUBLISHED: 'success', DRAFT: 'info', OFFLINE: 'warning' };
  return map[status] || 'info';
}

function getStatusText(status: string) {
  const map: Record<string, string> = { PUBLISHED: '已发布', DRAFT: '草稿', OFFLINE: '已下线' };
  return map[status] || status;
}

async function fetchRecipes() {
  loading.value = true;
  // TODO: 调用 API
  loading.value = false;
}

async function handleDelete(row: any) {
  await ElMessageBox.confirm('确定删除该食谱？', '提示', { type: 'warning' });
  ElMessage.success('删除成功');
  fetchRecipes();
}
</script>

<style scoped lang="scss">
.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  align-items: center;
}
</style>
