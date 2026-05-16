<template>
  <div class="page-container">
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">热门菜谱</h2>
        <p class="text-muted">管理平台热门推荐菜谱，按浏览量自动排序</p>
      </div>
      <div class="header-right">
        <el-button @click="fetchList">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <div class="card-container">
      <el-tabs v-model="activeTab" class="hot-tabs">
        <!-- Tab 1: 已设为热门 -->
        <el-tab-pane label="已设为热门" name="hot">
          <div class="filter-section">
            <div class="filter-left">
              <el-input
                v-model="filters.keyword"
                placeholder="搜索热门菜谱..."
                clearable
                style="width: 240px"
                :prefix-icon="Search"
                @keyup.enter="handleSearch"
                @clear="handleSearch"
              />
            </div>
            <div class="filter-right">
              <el-button type="primary" @click="handleSearch">
                <el-icon><Search /></el-icon>
                搜索
              </el-button>
              <el-button @click="handleSetHot">
                <el-icon><Plus /></el-icon>
                设置热门
              </el-button>
            </div>
          </div>

          <div v-if="selectedIds.length > 0" class="batch-bar">
            <span>已选 {{ selectedIds.length }} 项</span>
            <el-button type="danger" size="small" @click="handleBatchCancelHot">批量取消热门</el-button>
          </div>

          <el-table
            v-loading="loading"
            :data="tableData"
            row-key="id"
            @selection-change="handleSelectionChange"
            class="hot-table"
          >
            <el-table-column type="selection" width="50" />
            <el-table-column label="菜谱信息" min-width="260">
              <template #default="{ row }">
                <div class="recipe-info" @click="goToEdit(row.id)">
                  <el-image :src="row.coverImage" class="recipe-cover" fit="cover">
                    <template #error>
                      <div class="image-placeholder"><el-icon><Picture /></el-icon></div>
                    </template>
                  </el-image>
                  <div class="recipe-detail">
                    <span class="recipe-title">{{ row.title }}</span>
                    <div class="recipe-stats">
                      <span><el-icon><View /></el-icon> {{ row.viewCount }}</span>
                      <span><el-icon><Star /></el-icon> {{ row.collectCount }}</span>
                    </div>
                  </div>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="浏览量" width="110" align="center">
              <template #default="{ row }">
                <span class="view-count">{{ row.viewCount.toLocaleString() }}</span>
              </template>
            </el-table-column>

            <el-table-column label="收藏量" width="100" align="center">
              <template #default="{ row }">
                <span>{{ row.collectCount.toLocaleString() }}</span>
              </template>
            </el-table-column>

            <el-table-column label="状态" width="100" align="center">
              <template #default="{ row }">
                <span class="status-pill" :class="row.status.toLowerCase()">
                  {{ getStatusText(row.status) }}
                </span>
              </template>
            </el-table-column>

            <el-table-column label="精选" width="80" align="center">
              <template #default="{ row }">
                <el-tag v-if="row.isFeatured" type="warning" size="small">精选</el-tag>
                <span v-else class="text-muted">-</span>
              </template>
            </el-table-column>

            <el-table-column label="操作" width="140" fixed="right" align="center">
              <template #default="{ row }">
                <el-button type="primary" link @click.stop="goToEdit(row.id)">
                  <el-icon><Edit /></el-icon>
                  编辑
                </el-button>
                <el-button type="danger" link @click.stop="handleCancelHot(row)">
                  <el-icon><Close /></el-icon>
                  取消热门
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination-wrap">
            <el-pagination
              v-model:current-page="pagination.page"
              v-model:page-size="pagination.pageSize"
              :total="pagination.total"
              :page-sizes="[10, 20, 50]"
              layout="total, sizes, prev, pager, next"
              @size-change="handleSizeChange"
              @current-change="handlePageChange"
            />
          </div>
        </el-tab-pane>

        <!-- Tab 2: 设置热门 -->
        <el-tab-pane label="设置热门" name="set">
          <div class="filter-section">
            <div class="filter-left">
              <el-input
                v-model="setFilters.keyword"
                placeholder="搜索菜谱名称..."
                clearable
                style="width: 280px"
                :prefix-icon="Search"
                @keyup.enter="fetchSetList"
                @clear="fetchSetList"
              />
            </div>
            <el-button type="primary" @click="fetchSetList">
              <el-icon><Search /></el-icon>
              搜索
            </el-button>
          </div>

          <div v-if="setSelectedIds.length > 0" class="batch-bar">
            <span>已选 {{ setSelectedIds.length }} 项</span>
            <el-button type="warning" size="small" @click="handleBatchSetHot">批量设为热门</el-button>
          </div>

          <el-table
            v-loading="setLoading"
            :data="setTableData"
            row-key="id"
            @selection-change="handleSetSelectionChange"
            class="hot-table"
          >
            <el-table-column type="selection" width="50" />
            <el-table-column label="菜谱信息" min-width="260">
              <template #default="{ row }">
                <div class="recipe-info" @click="goToEdit(row.id)">
                  <el-image :src="row.coverImage" class="recipe-cover" fit="cover">
                    <template #error>
                      <div class="image-placeholder"><el-icon><Picture /></el-icon></div>
                    </template>
                  </el-image>
                  <div class="recipe-detail">
                    <span class="recipe-title">{{ row.title }}</span>
                    <div class="recipe-stats">
                      <span><el-icon><View /></el-icon> {{ row.viewCount }}</span>
                      <span><el-icon><Star /></el-icon> {{ row.collectCount }}</span>
                    </div>
                  </div>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="浏览量" width="110" align="center">
              <template #default="{ row }">
                <span class="view-count">{{ row.viewCount.toLocaleString() }}</span>
              </template>
            </el-table-column>

            <el-table-column label="收藏量" width="100" align="center">
              <template #default="{ row }">
                <span>{{ row.collectCount.toLocaleString() }}</span>
              </template>
            </el-table-column>

            <el-table-column label="当前状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag v-if="row.isHot" type="danger" size="small">热门</el-tag>
                <span v-else class="text-muted">普通</span>
              </template>
            </el-table-column>

            <el-table-column label="操作" width="100" fixed="right" align="center">
              <template #default="{ row }">
                <el-button
                  v-if="!row.isHot"
                  type="warning"
                  link
                  @click.stop="handleSingleSetHot(row)"
                >
                  <el-icon><Select /></el-icon>
                  设为热门
                </el-button>
                <el-button
                  v-else
                  type="danger"
                  link
                  @click.stop="handleSingleCancelHot(row)"
                >
                  <el-icon><Close /></el-icon>
                  取消热门
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination-wrap">
            <el-pagination
              v-model:current-page="setPagination.page"
              v-model:page-size="setPagination.pageSize"
              :total="setPagination.total"
              :page-sizes="[10, 20, 50]"
              layout="total, sizes, prev, pager, next"
              @size-change="handleSetSizeChange"
              @current-change="handleSetPageChange"
            />
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Refresh, Search, Edit, View, Star, Picture, Plus, Close, Select } from '@element-plus/icons-vue';
import { hotRecipesApi, type HotRecipeItem } from '@/api/featured';

const router = useRouter();

const activeTab = ref('hot');
const loading = ref(false);
const setLoading = ref(false);
const tableData = ref<HotRecipeItem[]>([]);
const setTableData = ref<HotRecipeItem[]>([]);
const selectedIds = ref<number[]>([]);
const setSelectedIds = ref<number[]>([]);

const filters = reactive({ keyword: '' });
const setFilters = reactive({ keyword: '' });
const pagination = reactive({ page: 1, pageSize: 20, total: 0 });
const setPagination = reactive({ page: 1, pageSize: 20, total: 0 });

const statusMap: Record<string, string> = {
  PUBLISHED: '已发布', DRAFT: '草稿', OFFLINE: '已下架', PENDING: '待审核', REJECTED: '已驳回',
};

function getStatusText(s: string) { return statusMap[s] || s; }

onMounted(() => fetchList());

async function fetchList() {
  loading.value = true;
  try {
    const res = await hotRecipesApi.getList({
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: filters.keyword || undefined,
    });
    tableData.value = res.data?.list || [];
    pagination.total = res.data?.total || 0;
  } catch (error: any) {
    ElMessage.error(error?.message || '获取热门列表失败');
  } finally {
    loading.value = false;
  }
}

async function fetchSetList() {
  setLoading.value = true;
  try {
    const res = await hotRecipesApi.getAll({
      page: setPagination.page,
      pageSize: setPagination.pageSize,
      keyword: setFilters.keyword || undefined,
    });
    setTableData.value = res.data?.list || [];
    setPagination.total = res.data?.total || 0;
  } catch (error: any) {
    ElMessage.error(error?.message || '获取列表失败');
  } finally {
    setLoading.value = false;
  }
}

function handleSearch() { pagination.page = 1; fetchList(); }
function handlePageChange() { fetchList(); }
function handleSizeChange() { pagination.page = 1; fetchList(); }
function handleSetPageChange() { fetchSetList(); }
function handleSetSizeChange() { setPagination.page = 1; fetchSetList(); }

function handleSelectionChange(rows: HotRecipeItem[]) {
  selectedIds.value = rows.map(r => r.id);
}

function handleSetSelectionChange(rows: HotRecipeItem[]) {
  setSelectedIds.value = rows.map(r => r.id);
}

function handleSetHot() { activeTab.value = 'set'; fetchSetList(); }

async function handleCancelHot(row: HotRecipeItem) {
  try {
    await ElMessageBox.confirm(`确定取消「${row.title}」的热门状态？`, '确认', { type: 'warning' });
    await hotRecipesApi.toggle(row.id, false);
    ElMessage.success('已取消热门');
    fetchList();
  } catch (error: any) {
    if (error !== 'cancel') ElMessage.error(error?.message || '操作失败');
  }
}

async function handleSingleSetHot(row: HotRecipeItem) {
  try {
    await hotRecipesApi.toggle(row.id, true);
    ElMessage.success('已设为热门');
    fetchSetList();
  } catch (error: any) {
    ElMessage.error(error?.message || '操作失败');
  }
}

async function handleSingleCancelHot(row: HotRecipeItem) {
  try {
    await hotRecipesApi.toggle(row.id, false);
    ElMessage.success('已取消热门');
    fetchSetList();
  } catch (error: any) {
    ElMessage.error(error?.message || '操作失败');
  }
}

async function handleBatchCancelHot() {
  if (selectedIds.value.length === 0) return;
  try {
    await ElMessageBox.confirm(`确定取消 ${selectedIds.value.length} 道菜的热门状态？`, '批量确认', { type: 'warning' });
    await hotRecipesApi.batchToggle(selectedIds.value, false);
    ElMessage.success('已批量取消热门');
    selectedIds.value = [];
    fetchList();
  } catch (error: any) {
    if (error !== 'cancel') ElMessage.error(error?.message || '操作失败');
  }
}

async function handleBatchSetHot() {
  if (setSelectedIds.value.length === 0) return;
  try {
    await ElMessageBox.confirm(`确定将 ${setSelectedIds.value.length} 道菜设为热门？`, '批量确认', { type: 'warning' });
    await hotRecipesApi.batchToggle(setSelectedIds.value, true);
    ElMessage.success('已批量设为热门');
    setSelectedIds.value = [];
    fetchSetList();
  } catch (error: any) {
    if (error !== 'cancel') ElMessage.error(error?.message || '操作失败');
  }
}

function goToEdit(id: number) { router.push(`/recipes/${id}/edit`); }
</script>

<style scoped>
.page-container { padding: 24px; }

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.page-title { font-size: 20px; font-weight: 600; margin: 0 0 4px; }
.text-muted { color: var(--text-secondary, #909399); font-size: 13px; margin: 0; }

.card-container {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid var(--border-primary, #ebeef5);
}

.hot-tabs :deep(.el-tabs__header) { margin-bottom: 16px; }

.filter-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.filter-left { display: flex; align-items: center; gap: 12px; }
.filter-right { display: flex; align-items: center; gap: 8px; }

.batch-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: #ecf5ff;
  border: 1px solid #d9ecff;
  border-radius: 6px;
  margin-bottom: 12px;
  font-size: 13px;
  color: #409eff;
}

.hot-table { width: 100%; }

.recipe-info {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.recipe-info:hover .recipe-title { color: var(--primary-color, #409eff); }

.recipe-cover {
  width: 56px;
  height: 56px;
  border-radius: 6px;
  flex-shrink: 0;
  overflow: hidden;
  border: 1px solid var(--border-primary, #ebeef5);
}

.image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  color: #c0c4cc;
  font-size: 18px;
}

.recipe-detail { display: flex; flex-direction: column; gap: 4px; }

.recipe-title {
  font-weight: 500;
  color: var(--text-primary, #303133);
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recipe-stats {
  display: flex;
  gap: 10px;
  font-size: 12px;
  color: #909399;
}

.recipe-stats span { display: flex; align-items: center; gap: 3px; }

.view-count { font-weight: 600; color: #f56c6c; }

.status-pill {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
}

.status-pill.published { background: #f0f9eb; color: #67c23a; }
.status-pill.draft { background: #f4f4f5; color: #909399; }
.status-pill.offline { background: #fdf6ec; color: #e6a23c; }
.status-pill.pending { background: #ecf5ff; color: #409eff; }
.status-pill.rejected { background: #fef0f0; color: #f56c6c; }

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
