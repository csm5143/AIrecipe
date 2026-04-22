<template>
  <div class="page-container">
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">收藏管理</h2>
        <p class="text-muted">管理用户的收藏夹和收藏内容</p>
      </div>
      <div class="header-actions">
        <el-button :icon="Refresh" @click="fetchCollections">刷新</el-button>
      </div>
    </div>

    <div class="card-container">
      <div class="filter-section">
        <div class="filter-left">
          <el-input
            v-model="filters.keyword"
            placeholder="搜索收藏夹名称..."
            clearable
            style="width: 240px"
            :prefix-icon="Search"
          />
          <el-select v-model="filters.isPublic" placeholder="可见性" clearable style="width: 120px">
            <el-option label="全部" value="" />
            <el-option label="公开" value="true" />
            <el-option label="私有" value="false" />
          </el-select>
        </div>
        <el-button type="primary" @click="fetchCollections">
          <el-icon><Search /></el-icon>
          搜索
        </el-button>
      </div>

      <el-table
        v-loading="loading"
        :data="tableData"
        row-key="id"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="收藏夹" min-width="200">
          <template #default="{ row }">
            <div class="collection-info" @click="handleDetail(row)">
              <div class="collection-icon">
                <el-icon><Collection /></el-icon>
              </div>
              <div class="collection-detail">
                <span class="collection-name">{{ row.name }}</span>
                <span class="collection-desc">{{ row.description || '暂无描述' }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="userId" label="用户ID" width="100" align="center">
          <template #default="{ row }">
            <span class="text-mono">{{ row.userId }}</span>
          </template>
        </el-table-column>
        <el-table-column label="收藏数" width="100" align="center">
          <template #default="{ row }">
            <el-tag type="info" size="small">{{ row.itemCount }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="可见性" width="90" align="center">
          <template #default="{ row }">
            <span
              class="visibility-pill"
              :class="{ public: row.isPublic }"
            >
              <el-icon v-if="row.isPublic"><View /></el-icon>
              <el-icon v-else><Lock /></el-icon>
              {{ row.isPublic ? '公开' : '私有' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="更新时间" width="140" align="center">
          <template #default="{ row }">
            <span class="text-muted text-small">{{ row.updatedAt }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right" align="center">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button type="primary" link @click="handleDetail(row)">
                <el-icon><View /></el-icon>
                详情
              </el-button>
              <el-button type="danger" link @click="handleDelete(row)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-footer">
        <span class="total-info">共 {{ pagination.total }} 条</span>
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="sizes, prev, pager, next"
          background
        />
      </div>
    </div>

    <!-- 收藏夹详情对话框 -->
    <el-dialog v-model="detailVisible" :title="`收藏夹：${currentCollection?.name}`" width="700px">
      <div v-if="currentCollection" class="collection-detail-modal">
        <div class="detail-header">
          <div class="detail-stats">
            <div class="stat-item">
              <span class="stat-value">{{ currentCollection.itemCount }}</span>
              <span class="stat-label">收藏数</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ currentCollection.isPublic ? '公开' : '私有' }}</span>
              <span class="stat-label">可见性</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ currentCollection.userId }}</span>
              <span class="stat-label">用户ID</span>
            </div>
          </div>
        </div>

        <el-divider />

        <div class="detail-section">
          <h4>收藏内容</h4>
          <div v-if="currentCollection.items && currentCollection.items.length > 0" class="items-grid">
            <div v-for="item in currentCollection.items" :key="item.id" class="item-card">
              <el-image :src="item.cover" class="item-cover" fit="cover">
                <template #error>
                  <div class="cover-placeholder">
                    <el-icon><Picture /></el-icon>
                  </div>
                </template>
              </el-image>
              <div class="item-info">
                <span class="item-title">{{ item.title }}</span>
                <span class="item-meta">{{ item.category }} · {{ item.cookingTime }}分钟</span>
              </div>
              <el-button type="danger" size="small" text @click="handleRemoveItem(item)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>
          <el-empty v-else description="暂无收藏内容" />
        </div>
      </div>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import {
  Search,
  Refresh,
  View,
  Delete,
  Collection,
  Lock,
  Picture
} from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';

const loading = ref(false);
const detailVisible = ref(false);
const currentCollection = ref<any>(null);

const filters = reactive({
  keyword: '',
  isPublic: '',
});

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
});

const tableData = ref([
  {
    id: 1,
    name: '我的健身餐',
    description: '减脂期间的健康饮食计划',
    userId: 1001,
    itemCount: 15,
    isPublic: true,
    updatedAt: '2024-01-20 14:30',
    items: [
      { id: 1, title: '鸡胸肉沙拉', cover: 'https://picsum.photos/seed/item1/200/150', category: '健身餐', cookingTime: 25 },
      { id: 2, title: '藜麦牛油果碗', cover: 'https://picsum.photos/seed/item2/200/150', category: '健身餐', cookingTime: 20 },
      { id: 3, title: '清蒸西兰花', cover: '', category: '健身餐', cookingTime: 10 },
    ],
  },
  {
    id: 2,
    name: '家常菜谱',
    description: '日常烹饪的好帮手',
    userId: 1002,
    itemCount: 28,
    isPublic: true,
    updatedAt: '2024-01-19 10:15',
    items: [
      { id: 4, title: '番茄炒蛋', cover: 'https://picsum.photos/seed/item4/200/150', category: '家常菜', cookingTime: 15 },
      { id: 5, title: '红烧肉', cover: 'https://picsum.photos/seed/item5/200/150', category: '家常菜', cookingTime: 90 },
    ],
  },
  {
    id: 3,
    name: '宝宝辅食',
    description: '给孩子的营养餐',
    userId: 1003,
    itemCount: 8,
    isPublic: false,
    updatedAt: '2024-01-18 16:45',
    items: [],
  },
  {
    id: 4,
    name: '甜点烘焙',
    description: '',
    userId: 1004,
    itemCount: 12,
    isPublic: true,
    updatedAt: '2024-01-17 09:20',
    items: [
      { id: 6, title: '提拉米苏', cover: 'https://picsum.photos/seed/item6/200/150', category: '甜点', cookingTime: 60 },
    ],
  },
]);

async function fetchCollections() {
  loading.value = true;
  try {
    // TODO: 调用 API
    pagination.total = tableData.value.length;
  } finally {
    loading.value = false;
  }
}

function handleDetail(row: any) {
  currentCollection.value = row;
  detailVisible.value = true;
}

function handleRemoveItem(item: any) {
  ElMessage.success('已从收藏夹移除');
}

async function handleDelete(row: any) {
  await ElMessageBox.confirm(`确定要删除收藏夹「${row.name}」吗？`, '提示', {
    type: 'warning',
  });
  ElMessage.success('删除成功');
  fetchCollections();
}

onMounted(() => {
  fetchCollections();
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
}

.collection-info {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  padding: 8px;
  margin: -8px;
  border-radius: var(--radius-md);
  transition: background var(--transition-fast);

  &:hover {
    background: var(--surface-300);
  }

  .collection-icon {
    width: 44px;
    height: 44px;
    border-radius: var(--radius-md);
    background: rgba(245, 78, 0, 0.1);
    color: var(--cursor-orange);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    .el-icon {
      font-size: 22px;
    }
  }

  .collection-detail {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;

    .collection-name {
      font-family: var(--font-display);
      font-size: 14px;
      color: var(--cursor-dark);
    }

    .collection-desc {
      font-family: var(--font-serif);
      font-size: 12px;
      color: rgba(38, 37, 30, 0.5);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
}

.visibility-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: var(--radius-pill);
  font-family: var(--font-display);
  font-size: 11px;
  background: var(--surface-400);
  color: rgba(38, 37, 30, 0.6);

  .el-icon {
    font-size: 12px;
  }

  &.public {
    background: rgba(31, 138, 101, 0.12);
    color: var(--color-success);
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

.collection-detail-modal {
  .detail-header {
    margin-bottom: 16px;
  }

  .detail-stats {
    display: flex;
    gap: 32px;

    .stat-item {
      display: flex;
      flex-direction: column;
      gap: 4px;

      .stat-value {
        font-family: var(--font-display);
        font-size: 20px;
        color: var(--cursor-dark);
      }

      .stat-label {
        font-family: var(--font-serif);
        font-size: 12px;
        color: rgba(38, 37, 30, 0.5);
      }
    }
  }

  .detail-section {
    h4 {
      font-family: var(--font-display);
      font-size: 14px;
      color: var(--cursor-dark);
      margin-bottom: 16px;
    }
  }

  .items-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .item-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: var(--surface-300);
    border-radius: var(--radius-md);
    transition: background var(--transition-fast);

    &:hover {
      background: var(--surface-400);
    }

    .item-cover {
      width: 60px;
      height: 45px;
      border-radius: var(--radius-sm);
      overflow: hidden;
      flex-shrink: 0;
    }

    .cover-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--surface-400);
      color: rgba(38, 37, 30, 0.3);

      .el-icon {
        font-size: 20px;
      }
    }

    .item-info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 2px;

      .item-title {
        font-family: var(--font-display);
        font-size: 13px;
        color: var(--cursor-dark);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .item-meta {
        font-family: var(--font-mono);
        font-size: 11px;
        color: rgba(38, 37, 30, 0.5);
      }
    }
  }
}
</style>
