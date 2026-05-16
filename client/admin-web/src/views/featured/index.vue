<template>
  <div class="page-container">
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">精选菜谱</h2>
        <p class="text-muted">管理平台精选推荐菜谱，支持手动排序</p>
      </div>
      <div class="header-right">
        <el-button @click="fetchList">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
        <el-button type="primary" @click="showAddDialog = true">
          <el-icon><Plus /></el-icon>
          添加精选
        </el-button>
      </div>
    </div>

    <div class="card-container">
      <div class="filter-section">
        <div class="filter-left">
          <el-input
            v-model="filters.keyword"
            placeholder="搜索精选菜谱..."
            clearable
            style="width: 240px"
            :prefix-icon="Search"
            @keyup.enter="handleSearch"
            @clear="handleSearch"
          />
        </div>
        <el-button type="primary" @click="handleSearch">
          <el-icon><Search /></el-icon>
          搜索
        </el-button>
      </div>

      <el-table
        v-loading="loading"
        :data="tableData"
        row-key="id"
        class="featured-table"
      >
        <el-table-column label="菜谱信息" min-width="260">
          <template #default="{ row }">
            <div class="recipe-info" @click="goToEdit(row.recipe.id)">
              <el-image :src="row.recipe.coverImage" class="recipe-cover" fit="cover">
                <template #error>
                  <div class="image-placeholder"><el-icon><Picture /></el-icon></div>
                </template>
              </el-image>
              <div class="recipe-detail">
                <span class="recipe-title">{{ row.recipe.title }}</span>
                <div class="recipe-stats">
                  <span><el-icon><View /></el-icon> {{ row.recipe.viewCount }}</span>
                  <span><el-icon><Star /></el-icon> {{ row.recipe.collectCount }}</span>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="权重" width="140" align="center">
          <template #default="{ row }">
            <el-input-number
              v-model="row.weight"
              :min="0"
              :max="9999"
              size="small"
              :step="10"
              controls-position="right"
              @change="handleWeightChange(row)"
            />
          </template>
        </el-table-column>

        <el-table-column label="备注" min-width="160">
          <template #default="{ row }">
            <el-input
              v-model="row.note"
              placeholder="管理员备注"
              size="small"
              maxlength="100"
              show-word-limit
              @blur="handleNoteChange(row)"
            />
          </template>
        </el-table-column>

        <el-table-column label="添加人" width="100" align="center">
          <template #default="{ row }">
            <span>{{ row.addedBy || '-' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="添加时间" width="160" align="center">
          <template #default="{ row }">
            <span>{{ formatDate(row.createdAt) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="120" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link @click.stop="goToEdit(row.recipe.id)">
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button type="danger" link @click.stop="handleRemove(row)">
              <el-icon><Delete /></el-icon>
              移除
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
    </div>

    <!-- 添加精选对话框 -->
    <el-dialog v-model="showAddDialog" title="添加精选菜谱" width="600px" destroy-on-close>
      <div class="add-dialog-body">
        <el-input
          v-model="searchKeyword"
          placeholder="输入菜谱名称搜索..."
          clearable
          size="large"
          :prefix-icon="Search"
          @input="handleSearchInput"
        >
          <template #append>
            <el-button @click="handleSearchRecipes">搜索</el-button>
          </template>
        </el-input>

        <div v-if="searchResults.length > 0" class="search-results">
          <div
            v-for="recipe in searchResults"
            :key="recipe.id"
            class="search-result-item"
            :class="{ disabled: isAlreadyFeatured(recipe.id) }"
            @click="handleSelectRecipe(recipe)"
          >
            <el-image :src="recipe.coverImage" class="result-cover" fit="cover">
              <template #error>
                <div class="image-placeholder small"><el-icon><Picture /></el-icon></div>
              </template>
            </el-image>
            <div class="result-info">
              <span class="result-title">{{ recipe.title }}</span>
              <div class="result-meta">
                <el-tag v-if="isAlreadyFeatured(recipe.id)" type="info" size="small">已在精选</el-tag>
                <span v-if="recipe.isHot" class="hot-badge">热门</span>
              </div>
            </div>
            <el-icon v-if="isAlreadyFeatured(recipe.id)" class="check-icon disabled"><Check /></el-icon>
            <el-icon v-else class="check-icon"><Plus /></el-icon>
          </div>
        </div>

        <el-empty v-else-if="searched && searchResults.length === 0" description="未找到相关菜谱" />

        <div v-if="selectedRecipe" class="selected-section">
          <div class="selected-label">已选菜谱</div>
          <div class="selected-item">
            <el-image :src="selectedRecipe.coverImage" class="result-cover" fit="cover">
              <template #error>
                <div class="image-placeholder small"><el-icon><Picture /></el-icon></div>
              </template>
            </el-image>
            <span class="result-title">{{ selectedRecipe.title }}</span>
          </div>
          <el-input
            v-model="addNote"
            placeholder="添加备注（可选），如「本周主推」"
            size="default"
            maxlength="100"
            show-word-limit
            style="margin-top: 12px"
          />
        </div>
      </div>

      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" :disabled="!selectedRecipe" :loading="adding" @click="handleAdd">
          确认添加
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Refresh, Plus, Search, Edit, Delete, View, Star, Picture, Check } from '@element-plus/icons-vue';
import { featuredApi, type FeaturedRecipeItem, type RecipeSearchItem } from '@/api/featured';

const router = useRouter();

const loading = ref(false);
const tableData = ref<FeaturedRecipeItem[]>([]);
const showAddDialog = ref(false);
const adding = ref(false);
const searchKeyword = ref('');
const searched = ref(false);
const searchResults = ref<RecipeSearchItem[]>([]);
const selectedRecipe = ref<RecipeSearchItem | null>(null);
const addNote = ref('');

const filters = reactive({ keyword: '' });
const pagination = reactive({ page: 1, pageSize: 20, total: 0 });

let searchTimer: ReturnType<typeof setTimeout>;

onMounted(() => fetchList());

async function fetchList() {
  loading.value = true;
  try {
    const res = await featuredApi.getList({
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: filters.keyword || undefined,
    });
    tableData.value = res.data?.list || [];
    pagination.total = res.data?.total || 0;
  } catch (error: any) {
    ElMessage.error(error?.message || '获取精选列表失败');
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  pagination.page = 1;
  fetchList();
}

function handlePageChange() { fetchList(); }
function handleSizeChange() { pagination.page = 1; fetchList(); }

function formatDate(ts: number) {
  if (!ts) return '-';
  return new Date(ts).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

async function handleWeightChange(row: FeaturedRecipeItem) {
  try {
    await featuredApi.updateWeight(row.id, row.weight);
    ElMessage.success('权重已更新');
  } catch (error: any) {
    ElMessage.error(error?.message || '更新权重失败');
    fetchList();
  }
}

async function handleNoteChange(row: FeaturedRecipeItem) {
  try {
    await featuredApi.updateWeight(row.id, row.weight);
  } catch {
    // silently update note along with weight
  }
}

async function handleRemove(row: FeaturedRecipeItem) {
  try {
    await ElMessageBox.confirm(`确定要将「${row.recipe.title}」从精选移除？`, '移除确认', { type: 'warning' });
    await featuredApi.remove(row.id);
    ElMessage.success('已从精选移除');
    fetchList();
  } catch (error: any) {
    if (error !== 'cancel') ElMessage.error(error?.message || '移除失败');
  }
}

function goToEdit(id: number) {
  router.push(`/recipes/${id}/edit`);
}

function handleSearchInput() {
  clearTimeout(searchTimer);
  if (!searchKeyword.value.trim()) {
    searchResults.value = [];
    searched.value = false;
    return;
  }
  searchTimer = setTimeout(() => handleSearchRecipes(), 300);
}

async function handleSearchRecipes() {
  if (!searchKeyword.value.trim()) return;
  searched.value = true;
  try {
    const res = await featuredApi.search({ keyword: searchKeyword.value.trim() });
    searchResults.value = res.data || [];
  } catch (error: any) {
    ElMessage.error(error?.message || '搜索失败');
  }
}

function isAlreadyFeatured(id: number) {
  return tableData.value.some(f => f.recipe.id === id) || selectedRecipe.value?.id === id;
}

function handleSelectRecipe(recipe: RecipeSearchItem) {
  if (isAlreadyFeatured(recipe.id)) return;
  selectedRecipe.value = recipe;
  addNote.value = '';
}

async function handleAdd() {
  if (!selectedRecipe.value) return;
  adding.value = true;
  try {
    await featuredApi.add(selectedRecipe.value!.id, addNote.value || undefined);
    ElMessage.success('已添加到精选');
    showAddDialog.value = false;
    selectedRecipe.value = null;
    addNote.value = '';
    searchKeyword.value = '';
    searchResults.value = [];
    searched.value = false;
    fetchList();
  } catch (error: any) {
    ElMessage.error(error?.message || '添加失败');
  } finally {
    adding.value = false;
  }
}
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

.filter-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.filter-left { display: flex; align-items: center; gap: 12px; }

.featured-table { width: 100%; }

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

.image-placeholder.small { font-size: 14px; }

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

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

/* Dialog styles */
.add-dialog-body { display: flex; flex-direction: column; gap: 16px; }

.search-results {
  max-height: 320px;
  overflow-y: auto;
  border: 1px solid var(--border-primary, #ebeef5);
  border-radius: 6px;
}

.search-result-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  cursor: pointer;
  border-bottom: 1px solid var(--border-primary, #ebeef5);
  transition: background 0.15s;
}

.search-result-item:last-child { border-bottom: none; }
.search-result-item:hover:not(.disabled) { background: #f5f7fa; }
.search-result-item.disabled { opacity: 0.5; cursor: not-allowed; }

.result-cover {
  width: 48px;
  height: 48px;
  border-radius: 4px;
  flex-shrink: 0;
  overflow: hidden;
  border: 1px solid var(--border-primary, #ebeef5);
}

.result-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.result-title {
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.result-meta { display: flex; align-items: center; gap: 6px; }

.hot-badge {
  background: #fef0f0;
  color: #f56c6c;
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 10px;
}

.check-icon {
  color: var(--primary-color, #409eff);
  font-size: 18px;
  flex-shrink: 0;
}
.check-icon.disabled { color: #c0c4cc; }

.selected-section { padding: 12px; background: #f5f7fa; border-radius: 6px; }

.selected-label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 10px;
}

.selected-item {
  display: flex;
  align-items: center;
  gap: 10px;
}
</style>
