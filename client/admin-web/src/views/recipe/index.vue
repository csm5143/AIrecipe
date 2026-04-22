<template>
  <div class="page-container">
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">食谱管理</h2>
        <p class="text-muted">管理平台所有食谱内容</p>
      </div>
      <el-button type="primary" @click="router.push('/recipes/create')">
        <el-icon><Plus /></el-icon>
        创建食谱
      </el-button>
    </div>

    <div class="card-container">
      <div class="filter-section">
        <div class="filter-left">
          <el-input
            v-model="filters.keyword"
            placeholder="搜索食谱名称..."
            clearable
            style="width: 280px"
            :prefix-icon="Search"
          />
          <el-select v-model="filters.category" placeholder="分类" clearable style="width: 140px">
            <el-option label="全部" value="" />
            <el-option label="家常菜" value="home" />
            <el-option label="健身餐" value="fitness" />
            <el-option label="儿童餐" value="kids" />
            <el-option label="甜点" value="dessert" />
          </el-select>
          <el-select v-model="filters.status" placeholder="状态" clearable style="width: 140px">
            <el-option label="全部" value="" />
            <el-option label="已发布" value="PUBLISHED" />
            <el-option label="草稿" value="DRAFT" />
            <el-option label="已下线" value="OFFLINE" />
          </el-select>
        </div>
        <div class="filter-right">
          <el-button text @click="handleReset">
            <el-icon><RefreshLeft /></el-icon>
            重置
          </el-button>
          <el-button type="primary" @click="fetchRecipes">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
        </div>
      </div>

      <el-table
        v-loading="loading"
        :data="tableData"
        row-key="id"
        :header-cell-style="{ background: 'var(--surface-300)', color: 'var(--cursor-dark)' }"
      >
        <el-table-column type="selection" width="50" />
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="食谱信息" min-width="280">
          <template #default="{ row }">
            <div class="recipe-info">
              <el-image :src="row.coverImage" class="recipe-cover" fit="cover">
                <template #error>
                  <div class="image-placeholder">
                    <el-icon><Picture /></el-icon>
                  </div>
                </template>
              </el-image>
              <div class="recipe-detail">
                <span class="recipe-title">{{ row.title }}</span>
                <span class="recipe-meta">
                  <span class="cursor-pill info">{{ row.categoryText }}</span>
                  <span class="cursor-pill">{{ row.difficultyText }}</span>
                </span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="cookingTime" label="时长" width="100" align="center">
          <template #default="{ row }">
            <span class="text-mono">{{ row.cookingTime }}分钟</span>
          </template>
        </el-table-column>
        <el-table-column label="数据" width="140" align="center">
          <template #default="{ row }">
            <div class="data-stats">
              <span class="stat-item" title="浏览量">
                <el-icon><View /></el-icon>
                {{ formatCount(row.viewCount) }}
              </span>
              <span class="stat-item" title="收藏量">
                <el-icon><Star /></el-icon>
                {{ formatCount(row.collectCount) }}
              </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <span
              class="status-pill"
              :class="row.status.toLowerCase()"
            >
              {{ getStatusText(row.status) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="120" align="center">
          <template #default="{ row }">
            <span class="text-muted text-small">{{ row.createdAt }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right" align="center">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button type="primary" link @click="router.push(`/recipes/${row.id}/edit`)">
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>
              <el-dropdown trigger="click" @command="(cmd: string) => handleCommand(cmd, row)">
                <el-button type="primary" link>
                  <el-icon><MoreFilled /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="preview">
                      <el-icon><View /></el-icon>
                      预览
                    </el-dropdown-item>
                    <el-dropdown-item command="duplicate">
                      <el-icon><CopyDocument /></el-icon>
                      复制
                    </el-dropdown-item>
                    <el-dropdown-item
                      :command="row.status === 'PUBLISHED' ? 'offline' : 'publish'"
                    >
                      <el-icon v-if="row.status === 'PUBLISHED'"><Close /></el-icon>
                      <el-icon v-else><Check /></el-icon>
                      {{ row.status === 'PUBLISHED' ? '下线' : '发布' }}
                    </el-dropdown-item>
                    <el-dropdown-item command="delete" divided>
                      <el-icon><Delete /></el-icon>
                      删除
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-footer">
        <div class="footer-left">
          <span class="selection-info">已选择 {{ selectedRows.length }} 项</span>
          <el-button
            v-if="selectedRows.length > 0"
            type="danger"
            size="small"
            @click="handleBatchDelete"
          >
            批量删除
          </el-button>
        </div>
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          background
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  Plus,
  Search,
  RefreshLeft,
  Picture,
  View,
  Star,
  Edit,
  MoreFilled,
  CopyDocument,
  Check,
  Close,
  Delete
} from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';

const router = useRouter();
const loading = ref(false);
const selectedRows = ref<any[]>([]);

const filters = reactive({
  keyword: '',
  category: '',
  status: '',
});

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
});

const tableData = ref([
  {
    id: 1,
    title: '番茄炒蛋',
    coverImage: 'https://picsum.photos/seed/recipe1/80/80',
    category: 'home',
    categoryText: '家常菜',
    difficulty: 'EASY',
    difficultyText: '简单',
    cookingTime: 15,
    viewCount: 12580,
    collectCount: 3421,
    status: 'PUBLISHED',
    createdAt: '2024-01-15',
  },
  {
    id: 2,
    title: '鸡胸肉沙拉',
    coverImage: 'https://picsum.photos/seed/recipe2/80/80',
    category: 'fitness',
    categoryText: '健身餐',
    difficulty: 'MEDIUM',
    difficultyText: '中等',
    cookingTime: 25,
    viewCount: 8960,
    collectCount: 2156,
    status: 'PUBLISHED',
    createdAt: '2024-01-18',
  },
  {
    id: 3,
    title: '南瓜小米粥',
    coverImage: 'https://picsum.photos/seed/recipe3/80/80',
    category: 'kids',
    categoryText: '儿童餐',
    difficulty: 'EASY',
    difficultyText: '简单',
    cookingTime: 40,
    viewCount: 6540,
    collectCount: 1890,
    status: 'PUBLISHED',
    createdAt: '2024-01-20',
  },
  {
    id: 4,
    title: '提拉米苏',
    coverImage: '',
    category: 'dessert',
    categoryText: '甜点',
    difficulty: 'HARD',
    difficultyText: '困难',
    cookingTime: 60,
    viewCount: 4320,
    collectCount: 987,
    status: 'DRAFT',
    createdAt: '2024-01-22',
  },
  {
    id: 5,
    title: '红烧肉',
    coverImage: 'https://picsum.photos/seed/recipe5/80/80',
    category: 'home',
    categoryText: '家常菜',
    difficulty: 'MEDIUM',
    difficultyText: '中等',
    cookingTime: 90,
    viewCount: 15800,
    collectCount: 4567,
    status: 'OFFLINE',
    createdAt: '2024-01-10',
  },
]);

function formatCount(num: number): string {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
}

function getStatusText(status: string): string {
  const map: Record<string, string> = {
    PUBLISHED: '已发布',
    DRAFT: '草稿',
    OFFLINE: '已下线',
  };
  return map[status] || status;
}

function handleReset() {
  filters.keyword = '';
  filters.category = '';
  filters.status = '';
  fetchRecipes();
}

async function fetchRecipes() {
  loading.value = true;
  try {
    // TODO: 调用 API
    pagination.total = tableData.value.length;
  } finally {
    loading.value = false;
  }
}

async function handleCommand(command: string, row: any) {
  switch (command) {
    case 'preview':
      ElMessage.info('预览功能开发中');
      break;
    case 'duplicate':
      ElMessage.success('复制成功');
      break;
    case 'publish':
      ElMessage.success('发布成功');
      break;
    case 'offline':
      await ElMessageBox.confirm('确定要下线该食谱吗？', '提示', { type: 'warning' });
      ElMessage.success('下线成功');
      break;
    case 'delete':
      await ElMessageBox.confirm('确定删除该食谱？删除后无法恢复。', '警告', {
        type: 'warning',
        confirmButtonText: '删除',
        cancelButtonText: '取消',
      });
      ElMessage.success('删除成功');
      fetchRecipes();
      break;
  }
}

async function handleBatchDelete() {
  await ElMessageBox.confirm(`确定删除选中的 ${selectedRows.value.length} 个食谱吗？`, '警告', {
    type: 'warning',
  });
  ElMessage.success('批量删除成功');
  fetchRecipes();
}

onMounted(() => {
  fetchRecipes();
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

  .filter-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }
}

.recipe-info {
  display: flex;
  align-items: center;
  gap: 12px;

  .recipe-cover {
    width: 56px;
    height: 56px;
    border-radius: var(--radius-md);
    overflow: hidden;
    flex-shrink: 0;
    background: var(--surface-400);
  }

  .image-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--surface-400);
    color: rgba(38, 37, 30, 0.3);

    .el-icon {
      font-size: 24px;
    }
  }

  .recipe-detail {
    display: flex;
    flex-direction: column;
    gap: 6px;

    .recipe-title {
      font-family: var(--font-display);
      font-size: 14px;
      color: var(--cursor-dark);
    }

    .recipe-meta {
      display: flex;
      gap: 6px;
    }
  }
}

.data-stats {
  display: flex;
  justify-content: center;
  gap: 16px;

  .stat-item {
    display: flex;
    align-items: center;
    gap: 4px;
    font-family: var(--font-mono);
    font-size: 12px;
    color: rgba(38, 37, 30, 0.6);

    .el-icon {
      font-size: 14px;
    }
  }
}

.status-pill {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: var(--radius-pill);
  font-family: var(--font-display);
  font-size: 11px;

  &.published {
    background: rgba(31, 138, 101, 0.12);
    color: var(--color-success);
  }

  &.draft {
    background: var(--surface-400);
    color: rgba(38, 37, 30, 0.6);
  }

  &.offline {
    background: rgba(212, 136, 14, 0.12);
    color: var(--color-warning);
  }
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 4px;
  justify-content: center;

  .el-button {
    display: flex;
    align-items: center;
    gap: 4px;
    font-family: var(--font-display);
    font-size: 12px;
  }
}

.table-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--border-primary);

  .footer-left {
    display: flex;
    align-items: center;
    gap: 12px;

    .selection-info {
      font-family: var(--font-serif);
      font-size: 13px;
      color: rgba(38, 37, 30, 0.6);
    }
  }
}
</style>
