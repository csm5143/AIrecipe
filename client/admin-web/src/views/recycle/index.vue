<template>
  <div class="page-container">
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">回收站</h2>
        <p class="text-muted">已删除的内容，可在 30 天内还原或永久删除</p>
      </div>
      <div class="header-actions">
        <el-button :icon="Refresh" @click="fetchData">刷新</el-button>
      </div>
    </div>

    <div class="card-container">
      <div class="filter-section">
        <div class="filter-left">
          <el-select v-model="filters.itemType" placeholder="类型" clearable style="width: 120px" @change="handleSearch">
            <el-option label="菜谱" value="recipe" />
            <el-option label="用户" value="user" />
            <el-option label="反馈" value="feedback" />
            <el-option label="食材" value="ingredient" />
            <el-option label="管理员" value="admin" />
          </el-select>
          <el-input
            v-model="filters.keyword"
            placeholder="搜索内容..."
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
            @clear="handleSearch"
          />
        </div>
        <el-button type="primary" @click="handleSearch">
          <el-icon><Search /></el-icon>
          搜索
        </el-button>
      </div>

      <el-table :data="tableData" v-loading="loading" size="small">
        <el-table-column label="类型" width="90" align="center">
          <template #default="{ row }">
            <span class="type-pill" :class="row.itemType">{{ getTypeText(row.itemType) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="内容" min-width="240">
          <template #default="{ row }">
            <div class="item-info">
              <span class="item-title">{{ getItemTitle(row) }}</span>
              <span v-if="row.reason" class="item-reason">原因：{{ row.reason }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作人" width="120" align="center">
          <template #default="{ row }">
            <span class="text-muted">{{ row.adminName }}</span>
          </template>
        </el-table-column>
        <el-table-column label="删除时间" width="160" align="center">
          <template #default="{ row }">
            <span class="text-muted text-small">{{ row.createdAt }}</span>
          </template>
        </el-table-column>
        <el-table-column label="过期时间" width="160" align="center">
          <template #default="{ row }">
            <span v-if="row.expiresAt" class="text-muted text-small">{{ row.expiresAt }}</span>
            <span v-else class="text-muted">永不过期</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right" align="center">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button type="primary" link size="small" @click="handleRestore(row)">
                <el-icon><RefreshLeft /></el-icon>
                还原
              </el-button>
              <el-button type="danger" link size="small" @click="handlePermanentDelete(row)">
                <el-icon><Delete /></el-icon>
                永久删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-footer">
        <span class="total-info">共 {{ pagination.total }} 条记录</span>
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          background
          @current-change="fetchData"
          @size-change="pagination.page = 1; fetchData()"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { Search, Refresh, RefreshLeft, Delete } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { recycleApi, type RecycleItem } from '@/api/recycle';
import { usePreferences } from '@/composables/usePreferences';

const { defaultPageSize } = usePreferences();
const loading = ref(false);

const filters = reactive({
  itemType: '',
  keyword: '',
});

const pagination = reactive({
  page: 1,
  pageSize: defaultPageSize(),
  total: 0,
});

const tableData = ref<RecycleItem[]>([]);

function getTypeText(type: string): string {
  const map: Record<string, string> = {
    recipe: '菜谱',
    user: '用户',
    feedback: '反馈',
    ingredient: '食材',
    admin: '管理员',
  };
  return map[type] || type;
}

function getItemTitle(row: RecycleItem): string {
  const data = row.itemData || {};
  return data.title || data.nickname || data.name || data.content?.slice(0, 50) || `ID: ${row.itemId}`;
}

async function fetchData() {
  loading.value = true;
  try {
    const res = await recycleApi.list({
      page: pagination.page,
      pageSize: pagination.pageSize,
      itemType: filters.itemType || undefined,
      keyword: filters.keyword || undefined,
    });
    tableData.value = res.data?.list || [];
    pagination.total = res.data?.total || 0;
  } catch (error) {
    console.error('获取回收站数据失败:', error);
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  pagination.page = 1;
  fetchData();
}

async function handleRestore(row: RecycleItem) {
  await ElMessageBox.confirm(`确定要还原「${getItemTitle(row)}」吗？`, '还原确认', { type: 'info' });
  await recycleApi.restore(row.id);
  ElMessage.success('还原成功');
  fetchData();
}

async function handlePermanentDelete(row: RecycleItem) {
  await ElMessageBox.confirm(`确定永久删除「${getItemTitle(row)}」吗？此操作不可恢复！`, '危险操作', {
    type: 'error',
    confirmButtonText: '永久删除',
    cancelButtonText: '取消',
  });
  await recycleApi.permanentDelete(row.id);
  ElMessage.success('永久删除成功');
  fetchData();
}

onMounted(() => {
  fetchData();
});
</script>

<style scoped lang="scss">
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 24px;

  .header-left {
    .page-title {
      font-family: var(--font-display);
      font-size: 22px;
      font-weight: 400;
      letter-spacing: -0.55px;
      color: var(--cursor-dark);
      margin-bottom: 4px;
    }
  }

  .header-actions {
    display: flex;
    gap: 12px;
  }
}

.filter-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--border-primary);

  .filter-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }
}

.type-pill {
  display: inline-flex;
  padding: 3px 10px;
  border-radius: var(--radius-pill);
  font-family: var(--font-display);
  font-size: 11px;

  &.recipe {
    background: rgba(245, 78, 0, 0.1);
    color: var(--cursor-orange);
  }

  &.user {
    background: rgba(74, 125, 191, 0.1);
    color: var(--color-info);
  }

  &.feedback {
    background: rgba(212, 136, 14, 0.1);
    color: var(--color-warning);
  }

  &.ingredient {
    background: rgba(31, 138, 101, 0.1);
    color: var(--color-success);
  }

  &.admin {
    background: rgba(245, 78, 0, 0.1);
    color: var(--cursor-orange);
  }
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 2px;

  .item-title {
    font-family: var(--font-display);
    font-size: 13px;
    color: var(--cursor-dark);
  }

  .item-reason {
    font-family: var(--font-serif);
    font-size: 11px;
    color: rgba(38, 37, 30, 0.5);
  }
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 4px;
  justify-content: center;
}

.table-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--border-primary);

  .total-info {
    font-family: var(--font-serif);
    font-size: 13px;
    color: rgba(38, 37, 30, 0.6);
  }
}
</style>
