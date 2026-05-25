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
        <el-button @click="handleExport">
          <el-icon><Download /></el-icon>
          导出
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
            style="width: 200px"
            @keyup.enter="fetchRecipes"
            @clear="fetchRecipes"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>

          <el-select v-model="filters.dishType" placeholder="菜品类型" clearable style="width: 120px" @change="fetchRecipes">
            <el-option v-for="opt in DISH_TYPE_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>

          <el-select v-model="filters.difficulty" placeholder="难度" clearable style="width: 100px" @change="fetchRecipes">
            <el-option v-for="opt in DIFFICULTY_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>

          <el-select v-model="filters.mealTime" placeholder="时段" clearable style="width: 100px" @change="fetchRecipes">
            <el-option v-for="opt in MEAL_TIME_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>

          <el-select v-model="filters.status" placeholder="状态" clearable style="width: 100px" @change="fetchRecipes">
            <el-option v-for="opt in STATUS_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>

          <el-select v-model="filters.source" placeholder="来源" clearable style="width: 110px" @change="fetchRecipes">
            <el-option v-for="opt in SOURCE_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </div>

        <div class="filter-group">
          <el-button text @click="handleReset">
            <el-icon><RefreshLeft /></el-icon>
            重置
          </el-button>
        </div>
      </div>

      <!-- 移动端滑动提示 -->
      <div class="mobile-hint hide-desktop">
        <el-icon><DArrowLeft /></el-icon>
        <span>左右滑动查看更多</span>
        <el-icon><DArrowRight /></el-icon>
      </div>

      <!-- 移动端卡片视图 -->
      <div class="mobile-cards hide-desktop">
        <div v-if="loading" class="mobile-loading">
          <el-icon class="is-loading"><Loading /></el-icon>
          <span>加载中...</span>
        </div>
        <template v-else>
          <div v-if="tableData.length === 0" class="mobile-empty">
            <el-icon><FolderOpened /></el-icon>
            <span>暂无菜谱</span>
          </div>
          <div v-for="row in tableData" :key="row.id" class="mobile-card">
            <div class="mobile-card-header">
              <el-image :src="row.coverImage" class="mobile-cover" fit="cover">
                <template #error>
                  <div class="image-placeholder"><el-icon><Picture /></el-icon></div>
                </template>
              </el-image>
              <div class="mobile-info">
                <div class="mobile-title">{{ row.title || row.name }}</div>
                <div class="mobile-meta">
                  <span class="cursor-pill">{{ normalizeDifficulty(row.difficulty) }}</span>
                  <span class="cursor-pill info" v-if="row.dishTypes?.length">{{ normalizeDishType(row.dishTypes[0]) }}</span>
                </div>
              </div>
              <span class="status-pill" :class="(row.status || 'PUBLISHED').toLowerCase()">
                {{ getStatusText(row.status) }}
              </span>
            </div>
            <div class="mobile-card-footer">
              <div class="mobile-stats">
                <span><el-icon><View /></el-icon> {{ formatCount(row.viewCount) }}</span>
                <span><el-icon><Star /></el-icon> {{ formatCount(row.collectCount) }}</span>
                <span v-if="row.timeCost"><el-icon><Clock /></el-icon> {{ row.timeCost }}分钟</span>
              </div>
              <div class="mobile-actions">
                <el-button size="small" @click="router.push(`/recipes/${row.id}/edit`)">编辑</el-button>
                <el-button size="small" type="primary" @click="handleCommand(row.status === 'PUBLISHED' ? 'offline' : 'publish', row)">
                  {{ row.status === 'PUBLISHED' ? '下线' : '发布' }}
                </el-button>
                <el-button size="small" type="danger" @click="handleMobileDelete(row)">删除</el-button>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- 桌面端表格 -->
      <div class="table-scroll-outer hide-mobile" ref="tableScrollOuterRef">
        <div class="table-container">
          <el-table
              ref="tableRef"
              v-loading="loading"
              :data="tableData"
              row-key="id"
              :header-cell-style="{ background: 'var(--surface-300)', color: 'var(--cursor-dark)' }"
              highlight-current-row
              @selection-change="handleSelectionChange"
              @row-click="handlePreview"
          >
        <el-table-column type="selection" width="45" />
        <el-table-column prop="id" label="ID" width="80" min-width="80" />
        <el-table-column label="菜谱信息" min-width="200">
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
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="用餐" min-width="160" align="center">
          <template #default="{ row }">
            <div class="meal-tags">
              <span
                v-for="mt in (row.mealTimes || []).slice(0, 3)"
                :key="mt"
                class="meal-tag-pill"
              >
                {{ normalizeMealTime(mt) }}
              </span>
              <span v-if="!(row.mealTimes?.length)" class="meal-tag-empty">-</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="timeCost" label="时长" width="80" min-width="80" align="center">
          <template #default="{ row }">
            <span class="text-mono">{{ row.timeCost }}分钟</span>
          </template>
        </el-table-column>
        <el-table-column label="数据" width="100" min-width="100" align="center">
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
        <el-table-column label="菜品类型" min-width="130" align="center">
          <template #default="{ row }">
            <div class="dish-types-list">
              <span
                v-for="dt in (row.dishTypes || []).slice(0, 3)"
                :key="dt"
                class="dish-type-pill"
              >
                {{ normalizeDishType(dt) }}
              </span>
              <span v-if="!row.dishTypes?.length" class="dish-type-empty">-</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90" min-width="90" align="center">
          <template #default="{ row }">
            <span class="status-pill" :class="(row.status || 'PUBLISHED').toLowerCase()">
              {{ getStatusText(row.status) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="精选/热门" min-width="110" align="center">
          <template #default="{ row }">
            <div class="badge-list">
              <el-tag v-if="row.isFeatured" type="warning" size="small" class="badge-tag" title="精选菜谱">
                <el-icon><Star /></el-icon>
                精选
              </el-tag>
              <el-tag v-if="row.isHot" type="danger" size="small" class="badge-tag" title="热门菜谱">
                <el-icon><TrendCharts /></el-icon>
                热门
              </el-tag>
              <span v-if="!row.isFeatured && !row.isHot" class="text-muted">-</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="145" min-width="145" fixed="right" align="center">
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
        </div>
      </div>

      <!-- 自定义横向滚动条（VS Code 风格） -->
      <div
        class="custom-hscroll-bar"
        :class="{ 'is-scrolling': isTableScrolling }"
        ref="customScrollBarRef"
        v-if="tableData.length > 0"
      >
        <div class="custom-hscroll-thumb" ref="customThumbRef"></div>
      </div>

      <!-- 表格分页 -->
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

    <!-- 导出弹窗 -->
    <ExportDialog
      v-model="exportDialogVisible"
      name="菜谱"
      :total="pagination.total"
      :exporting="exporting"
      @confirm="onExportConfirm"
    />

    <!-- 预览抽屉 -->
    <el-drawer
      v-model="previewVisible"
      title="菜谱预览"
      direction="rtl"
      size="680px"
      :show-close="true"
    >
      <div v-if="previewLoading" class="preview-loading">
        <el-icon class="is-loading" :size="32"><Loading /></el-icon>
        <span>加载中...</span>
      </div>
      <div v-else-if="previewData" class="preview-body">
        <!-- 封面 -->
        <div class="preview-cover" v-if="previewData.coverImage">
          <img :src="previewData.coverImage" />
        </div>

        <!-- 标题和简介 -->
        <div class="preview-header">
          <h2 class="preview-title">{{ previewData.title }}</h2>
          <p class="preview-desc" v-if="previewData.description">{{ previewData.description }}</p>
        </div>

        <!-- 元信息 -->
        <div class="preview-meta">
          <span class="preview-meta-item" v-if="previewData.difficulty">
            <el-tag size="small" :type="previewData.difficulty === 'EASY' ? 'success' : previewData.difficulty === 'MEDIUM' ? 'warning' : 'danger'">
              {{ previewData.difficulty === 'EASY' ? '简单' : previewData.difficulty === 'MEDIUM' ? '中等' : '困难' }}
            </el-tag>
          </span>
          <span class="preview-meta-item" v-if="previewData.cookingTime">
            ⏱ {{ previewData.cookingTime }} 分钟
          </span>
          <span class="preview-meta-item" v-if="previewData.calories">
            🔥 {{ previewData.calories }} kcal
          </span>
          <span class="preview-meta-item" v-if="previewData.servings">
            🍽 {{ previewData.servings }} 人份
          </span>
        </div>

        <!-- 标签 -->
        <div class="preview-tags" v-if="previewData.tags && previewData.tags.length">
          <el-tag v-for="tag in previewData.tags" :key="tag" size="small" type="info">{{ tagLabel(tag) }}</el-tag>
        </div>

        <!-- 食材清单 -->
        <div class="preview-section" v-if="previewData.ingredients && previewData.ingredients.length">
          <h3>🥬 食材清单</h3>
          <div class="preview-ingredients">
            <div v-for="ing in previewData.ingredients" :key="ing.name" class="preview-ingredient">
              <span class="ing-name">{{ ing.name }}</span>
              <span class="ing-amount">{{ ing.amount }}</span>
            </div>
          </div>
        </div>

        <!-- 烹饪步骤 -->
        <div class="preview-section" v-if="previewData.steps && previewData.steps.length">
          <h3>📝 烹饪步骤</h3>
          <div class="preview-steps">
            <div v-for="(step, index) in previewData.steps" :key="index" class="preview-step">
              <div class="step-index">{{ index + 1 }}</div>
              <div class="step-body">
                <p class="step-text">{{ typeof step === 'string' ? step : (step.content || step.description || '') }}</p>
                <img v-if="typeof step === 'object' && step.image" :src="step.image" class="step-image" />
              </div>
            </div>
          </div>
        </div>

        <!-- 小贴士 -->
        <div class="preview-section" v-if="previewData.tips">
          <h3>💡 小贴士</h3>
          <p class="preview-tips">{{ previewData.tips }}</p>
        </div>

        <!-- 营养信息 -->
        <div class="preview-section" v-if="previewData.nutrition && (previewData.nutrition.calories || previewData.nutrition.protein)">
          <h3>📊 营养信息</h3>
          <div class="preview-nutrition">
            <div class="nutrition-item" v-if="previewData.nutrition.calories">
              <span class="nutrition-label">热量</span>
              <span class="nutrition-value">{{ previewData.nutrition.calories }} kcal</span>
            </div>
            <div class="nutrition-item" v-if="previewData.nutrition.protein">
              <span class="nutrition-label">蛋白质</span>
              <span class="nutrition-value">{{ previewData.nutrition.protein }}g</span>
            </div>
            <div class="nutrition-item" v-if="previewData.nutrition.fat">
              <span class="nutrition-label">脂肪</span>
              <span class="nutrition-value">{{ previewData.nutrition.fat }}g</span>
            </div>
            <div class="nutrition-item" v-if="previewData.nutrition.carbs">
              <span class="nutrition-label">碳水</span>
              <span class="nutrition-value">{{ previewData.nutrition.carbs }}g</span>
            </div>
            <div class="nutrition-item" v-if="previewData.nutrition.fiber">
              <span class="nutrition-label">纤维</span>
              <span class="nutrition-value">{{ previewData.nutrition.fiber }}g</span>
            </div>
          </div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { UploadFile } from 'element-plus';
import { usePreferences } from '@/composables/usePreferences';
import {
  Plus, Search, RefreshLeft, Picture, View, Star, Edit,
  MoreFilled, Check, Close, Delete, Upload, UploadFilled,
  Loading, Clock, FolderOpened, TrendCharts, Download,
} from '@element-plus/icons-vue';
import {
  DISH_TYPE_OPTIONS, MEAL_TIME_OPTIONS, DIFFICULTY_OPTIONS,
  STATUS_OPTIONS, SOURCE_OPTIONS, normalizeDishType, normalizeMealTime, normalizeDifficulty,
  type RecipeRow,
} from './data';
import { recipeApi } from '@/api/recipe';
import { useExport, downloadFile, type ExportFormat } from '@/composables/useExport';
import ExportDialog from '@/components/common/ExportDialog.vue';

const router = useRouter();
const { defaultPageSize } = usePreferences();
const loading = ref(false);
const selectedRows = ref<any[]>([]);

const { exportDialogVisible, exportFormat, exporting, showExportDialog, handleConfirm } = useExport();
const importDialogVisible = ref(false);
const importFile = ref<UploadFile | null>(null);
const importing = ref(false);
const uploadRef = ref();
const tableRef = ref();
const tableScrollOuterRef = ref<HTMLElement>();
const customScrollBarRef = ref<HTMLElement>();
const customThumbRef = ref<HTMLElement>();
const isTableScrolling = ref(false);
let scrollTimer: ReturnType<typeof setTimeout>;

const filters = reactive({
  keyword: '',
  dishType: '',
  difficulty: '',
  mealTime: '',
  status: '',
  source: '',
});

const pagination = reactive({
  page: 1,
  pageSize: defaultPageSize(),
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

async function fetchRecipes() {
  loading.value = true;
  try {
    const res = await recipeApi.list({
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: filters.keyword || undefined,
      dishType: filters.dishType || undefined,
      difficulty: filters.difficulty || undefined,
      status: filters.status || undefined,
    });
    tableData.value = res.data?.list || [];
    pagination.total = res.data?.total || 0;
    nextTick(() => {
      syncScrollBarPosition();
      cleanupScrollListener?.();
      cleanupScrollListener = initBodyScrollListener();
    });
  } catch (error) {
    console.error('获取菜谱列表失败:', error);
  } finally {
    loading.value = false;
  }
}

function handleReset() {
  Object.assign(filters, {
    keyword: '', dishType: '', difficulty: '',
    mealTime: '', status: '',
  });
  pagination.page = 1;
  fetchRecipes();
}

function handleSelectionChange(rows: any[]) {
  selectedRows.value = rows;
}

const previewVisible = ref(false);
const previewLoading = ref(false);
const previewData = ref<any>(null);

const TAG_LABEL_MAP: Record<string, string> = {
  children: '儿童餐', diet: '减脂餐', noodles: '面食', drink: '饮品',
  breakfast: '早餐', lunch: '午餐', dinner: '晚餐', late_night: '夜宵',
  stir_fry: '小炒菜', soup: '汤品', cold: '凉菜', dessert: '甜品',
  staple: '主食', hotpot: '火锅', bbq: '烧烤', western: '西餐',
  seafood: '海鲜', meat: '肉类', vegetarian: '素食', vegan: '纯素',
  fitness: '健身', quick: '快手', home: '家常', new: '新品',
  solo: '一人食', spicy: '辣味', light: '清淡',
};

function tagLabel(tag: string): string {
  return TAG_LABEL_MAP[tag] || tag;
}

async function handlePreview(row: any) {
  previewVisible.value = true;
  previewLoading.value = true;
  previewData.value = null;
  try {
    const res = await recipeApi.detail(row.id);
    previewData.value = res.data || res;
  } catch {
    ElMessage.error('加载菜谱详情失败');
    previewVisible.value = false;
  } finally {
    previewLoading.value = false;
  }
}

async function handleCommand(command: string, row: any) {
  switch (command) {
    case 'preview':
      handlePreview(row);
      break;
    case 'publish':
      await recipeApi.publish(row.id);
      row.status = 'PUBLISHED';
      ElMessage.success('发布成功');
      break;
    case 'offline':
      await ElMessageBox.confirm('确定要下线该菜谱吗？', '提示', { type: 'warning' });
      await recipeApi.offline(row.id);
      row.status = 'OFFLINE';
      ElMessage.success('下线成功');
      break;
    case 'delete':
      await ElMessageBox.confirm('确定删除该菜谱？删除后可在回收站恢复。', '警告', {
        type: 'warning',
        confirmButtonText: '删除',
        cancelButtonText: '取消',
      });
      await recipeApi.delete(row.id);
      ElMessage.success('删除成功');
      fetchRecipes();
      break;
  }
}

async function handleBatchDelete() {
  await ElMessageBox.confirm(`确定删除选中的 ${selectedRows.value.length} 个菜谱吗？删除后可在回收站恢复。`, '警告', {
    type: 'warning',
  });
  const ids = selectedRows.value.map(r => r.id);
  await recipeApi.batchDelete(ids);
  selectedRows.value = [];
  ElMessage.success('批量删除成功');
  fetchRecipes();
}

async function handleMobileDelete(row: any) {
  await ElMessageBox.confirm('确定删除该菜谱？删除后可在回收站恢复。', '警告', { type: 'warning' });
  await recipeApi.delete(row.id);
  ElMessage.success('删除成功');
  fetchRecipes();
}

function handleImport() {
  importDialogVisible.value = true;
}

function handleExport() {
  const params = {
    keyword: filters.keyword || undefined,
    dishType: filters.dishType || undefined,
    difficulty: filters.difficulty || undefined,
    mealTime: filters.mealTime || undefined,
    status: filters.status || undefined,
    source: filters.source || undefined,
  };
  showExportDialog({
    name: '菜谱',
    total: pagination.total,
    exportFn: (format) => downloadFile('/recipes/export', params, format),
  });
}

function onExportConfirm(format: ExportFormat) {
  exportFormat.value = format;
  handleConfirm();
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
    await recipeApi.import(data);
    importDialogVisible.value = false;
    ElMessage.success(`成功导入 ${data.length} 道菜谱`);
    fetchRecipes();
  } catch {
    ElMessage.error('文件格式错误，请上传正确的 recipes.json');
  } finally {
    importing.value = false;
  }
}

onMounted(() => {
  pagination.pageSize = defaultPageSize();
  fetchRecipes();
  window.addEventListener('resize', syncScrollBarPosition);
});

onUnmounted(() => {
  window.removeEventListener('resize', syncScrollBarPosition);
  cleanupScrollListener?.();
});

function syncScrollBarPosition() {
  const bar = customScrollBarRef.value;
  const outer = tableScrollOuterRef.value;
  if (!bar || !outer) return;
  const rect = outer.getBoundingClientRect();
  bar.style.width = `${outer.clientWidth}px`;
  bar.style.left = `${rect.left}px`;
  bar.style.bottom = `${window.innerHeight - rect.bottom}px`;
}

function initBodyScrollListener() {
  const bodyWrapper = document.querySelector('.el-table__body-wrapper') as HTMLElement;
  if (!bodyWrapper) return;
  bodyWrapper.addEventListener('scroll', onBodyScroll);
  return () => bodyWrapper.removeEventListener('scroll', onBodyScroll);
}

let cleanupScrollListener: (() => void) | undefined;

function onBodyScroll(e: Event) {
  const el = e.target as HTMLElement;
  isTableScrolling.value = true;
  clearTimeout(scrollTimer);
  scrollTimer = setTimeout(() => {
    isTableScrolling.value = false;
  }, 600);
  nextTick(() => {
    const bar = customScrollBarRef.value;
    const thumb = customThumbRef.value;
    const outer = tableScrollOuterRef.value;
    if (!bar || !thumb || !outer) return;
    const rect = outer.getBoundingClientRect();
    bar.style.width = `${outer.clientWidth}px`;
    bar.style.left = `${rect.left}px`;
    bar.style.bottom = `${window.innerHeight - rect.bottom}px`;
    const maxScroll = outer.scrollWidth - outer.clientWidth;
    const ratio = maxScroll > 0 ? el.scrollLeft / maxScroll : 0;
    const trackWidth = outer.clientWidth;
    const thumbWidth = Math.max((outer.clientWidth / outer.scrollWidth) * trackWidth, 40);
    thumb.style.width = `${thumbWidth}px`;
    thumb.style.left = `${ratio * (trackWidth - thumbWidth)}px`;
  });
}
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
  gap: 8px;

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
    min-width: 0;

    .recipe-title {
      font-family: var(--font-display);
      font-size: 13px;
      color: var(--cursor-dark);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      display: block;
      max-width: 140px;
    }
  }
}

.dish-types-list {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  justify-content: center;
  align-items: center;

  .dish-type-pill {
    font-family: var(--font-display);
    font-size: 10px;
    padding: 2px 7px;
    border-radius: var(--radius-pill);
    background: rgba(31, 138, 101, 0.1);
    color: var(--color-success);
    border: 1px solid rgba(31, 138, 101, 0.2);
  }

  .dish-type-empty {
    color: rgba(38, 37, 30, 0.3);
    font-size: 12px;
  }
}

.meal-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: center;

  .meal-tag-pill {
    font-family: var(--font-display);
    font-size: 10px;
    padding: 2px 8px;
    border-radius: var(--radius-pill);
    background: rgba(212, 136, 14, 0.1);
    color: var(--color-warning);
    border: 1px solid rgba(212, 136, 14, 0.2);
  }

  .meal-tag-empty {
    color: rgba(38, 37, 30, 0.3);
    font-size: 12px;
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

/* 外层滚动容器——让 el-table 内部自己滚动，我们在外层监听 */
.table-scroll-outer {
  overflow-x: auto;
  overflow-y: visible;
  position: relative;
  /* 限制宽度让 table(1200px) 产生溢出，激活 fixed 列 */
  width: 100%;
  max-width: 1100px;
}

/* 内层容器 */
.table-container {
  width: 100%;

  :deep(.el-table__row) {
    cursor: pointer;
  }
}

/* 自定义横向滚动条——VS Code 风格（滑动时出现，不滑动时渐隐） */
.custom-hscroll-bar {
  height: 8px;
  position: fixed;
  z-index: 9999;
  pointer-events: none;

  .custom-hscroll-thumb {
    position: absolute;
    top: 0;
    height: 100%;
    min-width: 40px;
    max-width: calc(100% - 8px);
    background: rgba(0, 0, 0, 0.12);
    border-radius: 4px;
    opacity: 0;
    transition: opacity 0.25s ease, background 0.15s ease;
  }

  &:hover .custom-hscroll-thumb,
  &.is-scrolling .custom-hscroll-thumb {
    opacity: 1;
    background: rgba(0, 0, 0, 0.22);
  }

  &.is-scrolling .custom-hscroll-thumb {
    opacity: 1;
    background: rgba(0, 0, 0, 0.30);
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

/* 移动端滑动提示 */
.mobile-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 16px;
  margin-bottom: 12px;
  background: linear-gradient(90deg, transparent, var(--surface-400), transparent);
  border-radius: var(--radius-lg);
  color: rgba(38, 37, 30, 0.5);
  font-size: 12px;
  animation: pulse-hint 2s ease-in-out infinite;

  .el-icon {
    font-size: 14px;
    color: var(--color-primary);
  }
}

@keyframes pulse-hint {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

/* 移动端卡片列表 */
.mobile-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0 16px;

  .mobile-loading,
  .mobile-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 48px 0;
    color: rgba(38, 37, 30, 0.4);
    font-size: 14px;

    .el-icon { font-size: 32px; }
  }

  .mobile-card {
    background: var(--surface-100);
    border: 1px solid var(--border-primary);
    border-radius: var(--radius-lg);
    padding: 12px;
    transition: all 0.2s;

    &:active {
      transform: scale(0.98);
      background: var(--surface-200);
    }
  }

  .mobile-card-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;

    .mobile-cover {
      width: 52px;
      height: 52px;
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

      .el-icon { font-size: 20px; }
    }

    .mobile-info {
      flex: 1;
      min-width: 0;

      .mobile-title {
        font-family: var(--font-display);
        font-size: 14px;
        font-weight: 500;
        color: var(--cursor-dark);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-bottom: 4px;
      }

      .mobile-meta {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;

        .cursor-pill {
          font-size: 10px;
          padding: 2px 6px;
        }
      }
    }
  }

  .mobile-card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 10px;
    border-top: 1px solid var(--border-primary);

    .mobile-stats {
      display: flex;
      gap: 12px;
      font-family: var(--font-mono);
      font-size: 11px;
      color: rgba(38, 37, 30, 0.5);

      span {
        display: flex;
        align-items: center;
        gap: 4px;

        .el-icon { font-size: 13px; }
      }
    }

    .mobile-actions {
      display: flex;
      gap: 6px;

      .el-button {
        font-size: 11px;
        padding: 4px 10px;
      }
    }
  }
}

/* 响应式显示/隐藏 */
@media (min-width: 769px) {
  .hide-desktop { display: none !important; }
}

@media (max-width: 768px) {
  .hide-mobile { display: none !important; }

  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;

    .header-right {
      justify-content: flex-end;
    }
  }

  .filter-section {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;

    .filter-group {
      flex-wrap: wrap;
      justify-content: flex-start;
      gap: 8px;

      .el-input,
      .el-select {
        flex: 1;
        min-width: calc(50% - 4px);
        width: auto !important;
      }

      .el-input {
        width: 100% !important;
      }
    }

    .el-select {
      width: auto !important;
      flex: 1;
      min-width: 80px;
    }
  }

  .table-footer {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;

    .el-pagination {
      justify-content: center;
    }
  }
}

.badge-list {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.badge-tag {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 11px;
  padding: 2px 6px;
  line-height: 1;
}

// ================================================
// 预览抽屉
// ================================================
.preview-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 80px 0;
  color: var(--muted, #7a6a58);
  font-size: 14px;
}

.preview-body {
  padding: 0 4px;
}

.preview-cover {
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 24px;
  img {
    width: 100%;
    max-height: 360px;
    object-fit: cover;
    display: block;
  }
}

.preview-header {
  margin-bottom: 20px;
}

.preview-title {
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 600;
  color: var(--cursor-dark);
  margin: 0 0 10px;
}

.preview-desc {
  font-size: 14px;
  color: var(--muted, #7a6a58);
  line-height: 1.6;
  margin: 0;
}

.preview-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}

.preview-meta-item {
  font-size: 13px;
  color: var(--text, #4a3b2a);
}

.preview-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 24px;
}

.preview-section {
  margin-bottom: 28px;
  h3 {
    font-family: var(--font-display);
    font-size: 16px;
    font-weight: 600;
    color: var(--cursor-dark);
    margin: 0 0 14px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--border-primary);
  }
}

.preview-ingredients {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.preview-ingredient {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  background: var(--surface-200, #f6e8d6);
  border-radius: 8px;
  font-size: 14px;

  .ing-name {
    color: var(--text, #4a3b2a);
    font-weight: 500;
  }

  .ing-amount {
    color: var(--muted, #7a6a58);
    font-family: var(--font-mono);
  }
}

.preview-steps {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.preview-step {
  display: flex;
  gap: 14px;
}

.step-index {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--primary, #e2a650);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
  margin-top: 2px;
}

.step-body {
  flex: 1;
  min-width: 0;
}

.step-text {
  font-size: 14px;
  color: var(--text, #4a3b2a);
  line-height: 1.7;
  margin: 0;
}

.step-image {
  width: 100%;
  max-width: 320px;
  border-radius: 8px;
  margin-top: 8px;
}

.preview-tips {
  font-size: 14px;
  color: var(--text, #4a3b2a);
  line-height: 1.7;
  padding: 12px 16px;
  background: var(--surface-200, #f6e8d6);
  border-radius: 10px;
  margin: 0;
}

.preview-nutrition {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 10px;
}

.nutrition-item {
  display: flex;
  justify-content: space-between;
  padding: 10px 14px;
  background: var(--surface-200, #f6e8d6);
  border-radius: 8px;

  .nutrition-label {
    font-size: 13px;
    color: var(--muted, #7a6a58);
  }

  .nutrition-value {
    font-size: 13px;
    color: var(--text-strong, #2d241b);
    font-weight: 600;
    font-family: var(--font-mono);
  }
}

</style>
