<template>
  <div class="page-container">
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">菜谱管理</h2>
        <p class="page-subtitle">共 {{ pagination.total }} 道菜谱</p>
      </div>
      <div class="header-right">
        <el-button @click="handleImport">
          <el-icon><Upload /></el-icon>
          导入
        </el-button>
        <el-button type="primary" @click="router.push('/recipes/create')">
          <el-icon><Plus /></el-icon>
          创建菜谱
        </el-button>
      </div>
    </div>

    <div class="card-container">
      <div class="filter-section">
        <div class="filter-group">
          <el-input
            v-model="filters.keyword"
            placeholder="搜索菜谱名称..."
            clearable
            style="width: 240px"
            @keyup.enter="fetchRecipes"
            @clear="fetchRecipes"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>

          <el-select v-model="filters.dishType" placeholder="菜品类型" clearable style="width: 140px" @change="fetchRecipes">
            <el-option v-for="opt in DISH_TYPE_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>

          <el-select v-model="filters.difficulty" placeholder="难度" clearable style="width: 120px" @change="fetchRecipes">
            <el-option v-for="opt in DIFFICULTY_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>

          <el-select v-model="filters.mealTime" placeholder="用餐时段" clearable style="width: 140px" @change="fetchRecipes">
            <el-option v-for="opt in MEAL_TIME_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>

          <el-select v-model="filters.status" placeholder="状态" clearable style="width: 120px" @change="fetchRecipes">
            <el-option v-for="opt in STATUS_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </div>

        <div class="filter-group">
          <el-checkbox v-model="filters.fitnessMeal" @change="fetchRecipes">健身餐</el-checkbox>
          <el-checkbox v-model="filters.childrenMeal" @change="fetchRecipes">儿童餐</el-checkbox>
          <el-button text @click="handleReset">
            <el-icon><RefreshLeft /></el-icon>
            重置
          </el-button>
        </div>
      </div>

      <el-table
        v-loading="loading"
        :data="tableData"
        row-key="id"
        :header-cell-style="{ background: 'var(--surface-300)', color: 'var(--cursor-dark)' }"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="50" />
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column label="菜谱信息" min-width="280">
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
                  <span v-if="row.dishTypes?.length" class="cursor-pill info">
                    {{ normalizeDishType(row.dishTypes[0]) }}
                  </span>
                  <span class="cursor-pill">
                    {{ normalizeDifficulty(row.difficulty) }}
                  </span>
                  <span v-if="row.fitnessMeal" class="cursor-pill fitness">健身</span>
                  <span v-if="row.childrenMeal" class="cursor-pill children">儿童</span>
                </span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="用餐" width="100" align="center">
          <template #default="{ row }">
            <div class="meal-tags">
              <span v-for="mt in (row.mealTimes || []).slice(0, 2)" :key="mt" class="meal-tag">
                {{ normalizeMealTime(mt) }}
              </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="timeCost" label="时长" width="80" align="center">
          <template #default="{ row }">
            <span class="text-mono">{{ row.timeCost }}分钟</span>
          </template>
        </el-table-column>
        <el-table-column label="数据" width="120" align="center">
          <template #default="{ row }">
            <div class="data-stats">
              <span class="stat-item">
                <el-icon><View /></el-icon>
                {{ formatCount(row.viewCount) }}
              </span>
              <span class="stat-item">
                <el-icon><Star /></el-icon>
                {{ formatCount(row.collectCount) }}
              </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="标签" min-width="140">
          <template #default="{ row }">
            <div class="tag-list">
              <el-tag
                v-for="tag in (row.dishTypes || []).slice(0, 3)"
                :key="tag"
                size="small"
                class="dish-type-tag"
              >
                {{ normalizeDishType(tag) }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90" align="center">
          <template #default="{ row }">
            <span class="status-pill" :class="(row.status || 'PUBLISHED').toLowerCase()">
              {{ getStatusText(row.status) }}
            </span>
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
                    <el-dropdown-item :command="row.status === 'PUBLISHED' ? 'offline' : 'publish'">
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
          @size-change="fetchRecipes"
          @current-change="fetchRecipes"
        />
      </div>
    </div>

    <el-dialog v-model="importDialogVisible" title="导入菜谱" width="480px">
      <p style="color: rgba(38,37,30,0.6); font-size: 13px; margin-bottom: 16px;">
        请上传 miniprogram/data/recipes.json 文件，将导入全部菜谱数据
      </p>
      <el-upload
        ref="uploadRef"
        drag
        accept=".json"
        :auto-upload="false"
        :limit="1"
        @change="handleFileChange"
      >
        <el-icon class="upload-icon"><UploadFilled /></el-icon>
        <div>将文件拖到此处，或<em>点击上传</em></div>
        <template #tip>
          <div class="upload-tip">仅支持 .json 文件</div>
        </template>
      </el-upload>
      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="importing" :disabled="!importFile" @click="confirmImport">
          确认导入
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { UploadFile } from 'element-plus';
import {
  Plus, Search, RefreshLeft, Picture, View, Star, Edit,
  MoreFilled, Check, Close, Delete, Upload, UploadFilled,
} from '@element-plus/icons-vue';
import {
  DISH_TYPE_OPTIONS, MEAL_TIME_OPTIONS, DIFFICULTY_OPTIONS,
  STATUS_OPTIONS, normalizeDishType, normalizeMealTime, normalizeDifficulty,
  type RecipeRow,
} from './data';

const router = useRouter();
const loading = ref(false);
const selectedRows = ref<any[]>([]);
const importDialogVisible = ref(false);
const importFile = ref<UploadFile | null>(null);
const importing = ref(false);
const uploadRef = ref();

const rawData = ref<RecipeRow[]>([]);

const filters = reactive({
  keyword: '',
  dishType: '',
  difficulty: '',
  mealTime: '',
  status: '',
  fitnessMeal: false,
  childrenMeal: false,
});

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
});

const tableData = ref<any[]>([]);

function formatCount(num: number): string {
  if (num >= 10000) return (num / 10000).toFixed(1) + 'w';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
  return String(num);
}

function getStatusText(status: string): string {
  return STATUS_OPTIONS.find(o => o.value === status)?.label || '已发布';
}

function filterData() {
  let data = [...rawData.value];

  if (filters.keyword) {
    const kw = filters.keyword.toLowerCase();
    data = data.filter(r => r.title.toLowerCase().includes(kw));
  }
  if (filters.dishType) {
    data = data.filter(r => r.dishTypes?.includes(filters.dishType));
  }
  if (filters.difficulty) {
    const mapped = filters.difficulty === 'EASY' ? 'easy'
      : filters.difficulty === 'MEDIUM' ? ['normal', 'medium']
      : 'hard';
    data = data.filter(r => {
      if (Array.isArray(mapped)) return mapped.includes(r.difficulty);
      return r.difficulty === mapped;
    });
  }
  if (filters.mealTime) {
    data = data.filter(r => r.mealTimes?.includes(filters.mealTime));
  }
  if (filters.fitnessMeal) {
    data = data.filter(r => r.fitnessMeal);
  }
  if (filters.childrenMeal) {
    data = data.filter(r => r.childrenMeal);
  }

  const start = (pagination.page - 1) * pagination.pageSize;
  tableData.value = data.slice(start, start + pagination.pageSize);
  pagination.total = data.length;
}

async function fetchRecipes() {
  loading.value = true;
  try {
    if (rawData.value.length === 0) {
      const res = await fetch('/data/recipes.json');
      const data = await res.json();
      rawData.value = data as RecipeRow[];
    }
    filterData();
  } finally {
    loading.value = false;
  }
}

function handleReset() {
  Object.assign(filters, {
    keyword: '', dishType: '', difficulty: '',
    mealTime: '', status: '', fitnessMeal: false, childrenMeal: false,
  });
  pagination.page = 1;
  fetchRecipes();
}

function handleSelectionChange(rows: any[]) {
  selectedRows.value = rows;
}

async function handleCommand(command: string, row: any) {
  switch (command) {
    case 'preview':
      ElMessage.info('预览功能开发中');
      break;
    case 'publish':
      row.status = 'PUBLISHED';
      ElMessage.success('发布成功');
      break;
    case 'offline':
      await ElMessageBox.confirm('确定要下线该菜谱吗？', '提示', { type: 'warning' });
      row.status = 'OFFLINE';
      ElMessage.success('下线成功');
      break;
    case 'delete':
      await ElMessageBox.confirm('确定删除该菜谱？删除后无法恢复。', '警告', {
        type: 'warning',
        confirmButtonText: '删除',
        cancelButtonText: '取消',
      });
      rawData.value = rawData.value.filter(r => r.id !== row.id);
      filterData();
      ElMessage.success('删除成功');
      break;
  }
}

async function handleBatchDelete() {
  await ElMessageBox.confirm(`确定删除选中的 ${selectedRows.value.length} 个菜谱吗？`, '警告', {
    type: 'warning',
  });
  const ids = new Set(selectedRows.value.map(r => r.id));
  rawData.value = rawData.value.filter(r => !ids.has(r.id));
  filterData();
  selectedRows.value = [];
  ElMessage.success('批量删除成功');
}

function handleImport() {
  importDialogVisible.value = true;
}

function handleFileChange(file: UploadFile) {
  importFile.value = file;
}

async function confirmImport() {
  if (!importFile.value?.raw) return;
  importing.value = true;
  try {
    const text = await (importFile.value.raw as any).text();
    const data = JSON.parse(text) as RecipeRow[];
    rawData.value = data;
    filterData();
    importDialogVisible.value = false;
    ElMessage.success(`成功导入 ${data.length} 道菜谱`);
  } catch {
    ElMessage.error('文件格式错误，请上传正确的 recipes.json');
  } finally {
    importing.value = false;
  }
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

    .page-subtitle {
      font-family: var(--font-serif);
      font-size: 13px;
      color: rgba(38, 37, 30, 0.5);
    }
  }

  .header-right {
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

  .filter-group {
    display: flex;
    align-items: center;
    gap: 12px;
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

    .el-icon { font-size: 24px; }
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
      flex-wrap: wrap;
    }
  }
}

.meal-tags {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;

  .meal-tag {
    font-family: var(--font-mono);
    font-size: 11px;
    color: rgba(38, 37, 30, 0.6);
  }
}

.data-stats {
  display: flex;
  justify-content: center;
  gap: 12px;

  .stat-item {
    display: flex;
    align-items: center;
    gap: 4px;
    font-family: var(--font-mono);
    font-size: 12px;
    color: rgba(38, 37, 30, 0.6);

    .el-icon { font-size: 14px; }
  }
}

.tag-list {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;

  .dish-type-tag {
    border-radius: var(--radius-pill);
    background: var(--surface-400);
    border: none;
    font-size: 11px;
    color: rgba(38, 37, 30, 0.7);
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

.upload-icon {
  font-size: 48px;
  color: rgba(38, 37, 30, 0.3);
  margin-bottom: 12px;
}

.upload-tip {
  font-size: 12px;
  color: rgba(38, 37, 30, 0.4);
  margin-top: 8px;
}
</style>
