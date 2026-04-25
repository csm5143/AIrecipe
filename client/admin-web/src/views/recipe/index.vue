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
                <el-button size="small" type="danger" @click="handleCommand('delete', row)">删除</el-button>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- 桌面端表格 -->
      <div class="table-container hide-mobile">
        <el-table
            ref="tableRef"
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
      </div>

      <!-- 横向滚动状态条 - 固定在页面底部 -->
      <Teleport to="body">
        <div 
          class="scroll-indicator-fixed"
          :class="{ 'is-active': isScrolling }"
        >
          <div class="scroll-indicator-inner">
            <div class="scroll-arrow">
              <el-icon><DArrowLeft /></el-icon>
            </div>
            <div 
              class="scroll-bar-container" 
              ref="scrollBarRef"
              @mousedown="handleScrollBarMouseDown"
            >
              <div 
                class="scroll-thumb" 
                :style="{ 
                  width: thumbWidth + 'px',
                  left: thumbOffset + 'px'
                }"
              ></div>
            </div>
            <div class="scroll-arrow">
              <el-icon><DArrowRight /></el-icon>
            </div>
          </div>
        </div>
      </Teleport>

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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { UploadFile } from 'element-plus';
import {
  Plus, Search, RefreshLeft, Picture, View, Star, Edit,
  MoreFilled, Check, Close, Delete, Upload, UploadFilled,
  DArrowLeft, DArrowRight, Loading, Clock, FolderOpened,
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
const tableRef = ref();
const scrollBarRef = ref();
const isScrolling = ref(false);
const canScrollLeft = ref(false);
const canScrollRight = ref(false);
let scrollTimer: ReturnType<typeof setTimeout> | null = null;

// 横向滚动指示器计算
const CONTAINER_WIDTH = 200;

const thumbWidth = computed(() => {
  const tableEl = tableRef.value?.$el;
  if (!tableEl) return CONTAINER_WIDTH;
  const bodyWrapper = tableEl.querySelector('.el-table__body-wrapper') as HTMLElement;
  if (!bodyWrapper || bodyWrapper.scrollWidth === 0) return CONTAINER_WIDTH;
  const ratio = bodyWrapper.clientWidth / bodyWrapper.scrollWidth;
  return Math.max(40, Math.min(160, CONTAINER_WIDTH * ratio));
});

const thumbOffset = computed(() => {
  const tableEl = tableRef.value?.$el;
  if (!tableEl) return 0;
  const bodyWrapper = tableEl.querySelector('.el-table__body-wrapper') as HTMLElement;
  if (!bodyWrapper || bodyWrapper.scrollWidth <= bodyWrapper.clientWidth) return 0;
  const ratio = bodyWrapper.scrollLeft / (bodyWrapper.scrollWidth - bodyWrapper.clientWidth);
  const maxOffset = 200 - thumbWidth.value; // 容器宽度200px
  return Math.max(0, ratio * maxOffset);
});

// 表格滚动控制
function updateScrollState() {
  const tableEl = tableRef.value?.$el;
  if (!tableEl) return;
  
  // 获取 el-table 内部的滚动容器
  const bodyWrapper = tableEl.querySelector('.el-table__body-wrapper') as HTMLElement;
  if (!bodyWrapper) return;
  
  const { scrollLeft, scrollWidth, clientWidth } = bodyWrapper;
  canScrollLeft.value = scrollLeft > 0;
  canScrollRight.value = scrollLeft + clientWidth < scrollWidth - 1;
  
  // 拖动滚动条时激活状态
  isScrolling.value = true;
  if (scrollTimer) clearTimeout(scrollTimer);
  scrollTimer = setTimeout(() => {
    isScrolling.value = false;
  }, 1500);
}

function scrollTable(distance: number) {
  const tableEl = tableRef.value?.$el;
  if (!tableEl) return;
  
  // 获取 el-table 内部的滚动容器
  const bodyWrapper = tableEl.querySelector('.el-table__body-wrapper') as HTMLElement;
  if (!bodyWrapper) return;
  
  // 激活滚动状态
  isScrolling.value = true;
  if (scrollTimer) clearTimeout(scrollTimer);
  scrollTimer = setTimeout(() => {
    isScrolling.value = false;
  }, 1000);
  
  bodyWrapper.scrollBy({ left: distance, behavior: 'smooth' });
  setTimeout(updateScrollState, 300);
}

// 表格滚动事件处理
function handleTableScroll({ scrollLeft, scrollWidth, clientWidth }: { scrollLeft: number; scrollWidth: number; clientWidth: number }) {
  canScrollLeft.value = scrollLeft > 0;
  canScrollRight.value = scrollLeft + clientWidth < scrollWidth - 1;
  
  // 上下滚动时也激活状态条
  isScrolling.value = true;
  if (scrollTimer) clearTimeout(scrollTimer);
  scrollTimer = setTimeout(() => {
    isScrolling.value = false;
  }, 1500);
}

// 滚动条拖动功能
function handleScrollBarMouseDown(e: MouseEvent) {
  e.preventDefault();
  const tableEl = tableRef.value?.$el;
  if (!tableEl) return;
  
  const bodyWrapper = tableEl.querySelector('.el-table__body-wrapper') as HTMLElement;
  if (!bodyWrapper) return;
  
  const startX = e.clientX;
  const startScrollLeft = bodyWrapper.scrollLeft;
  
  isScrolling.value = true;
  if (scrollTimer) clearTimeout(scrollTimer);
  
  function onMouseMove(e: MouseEvent) {
    const deltaX = e.clientX - startX;
    const ratio = bodyWrapper.scrollWidth / bodyWrapper.clientWidth;
    bodyWrapper.scrollLeft = startScrollLeft + deltaX * ratio;
  }
  
  function onMouseUp() {
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    isScrolling.value = false;
    scrollTimer = setTimeout(() => {
      isScrolling.value = false;
    }, 1500);
    updateScrollState();
  }
  
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
}

const filters = reactive({
  keyword: '',
  dishType: '',
  difficulty: '',
  mealTime: '',
  status: '',
});

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
});

const tableData = ref<any[]>([]);
const rawData = ref<RecipeRow[]>([]);

function formatCount(num: number): string {
  if (num >= 10000) return (num / 10000).toFixed(1) + 'w';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
  return String(num);
}

function getStatusText(status: string): string {
  return STATUS_OPTIONS.find(o => o.value === status)?.label || '已发布';
}

function filterData() {
  let data = [...rawData.value].map(r => ({
    ...r,
    title: r.title || r.name || '',
    viewCount: r.viewCount ?? Math.floor(Math.random() * 5000),
    collectCount: r.collectCount ?? Math.floor(Math.random() * 500),
  }));

  if (filters.keyword) {
    const kw = filters.keyword.toLowerCase();
    data = data.filter(r => {
      const id = String(r.id);
      return r.title.toLowerCase().includes(kw) || id.includes(kw);
    });
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
    mealTime: '', status: '',
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
  // 监听表格滚动状态
  nextTick(() => {
    const tableEl = tableRef.value?.$el;
    if (!tableEl) return;
    
    const bodyWrapper = tableEl.querySelector('.el-table__body-wrapper');
    if (bodyWrapper) {
      bodyWrapper.addEventListener('scroll', updateScrollState);
      // 初始检查
      setTimeout(updateScrollState, 100);
    }
    window.addEventListener('resize', updateScrollState);
  });
  
  // 监听页面滚动 - 上下滚动时显示指示器
  let lastScrollTop = 0;
  function handlePageScroll() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const hasMoved = Math.abs(scrollTop - lastScrollTop) > 5;
    lastScrollTop = scrollTop;
    
    if (hasMoved) {
      isScrolling.value = true;
      if (scrollTimer) clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        isScrolling.value = false;
      }, 1500);
    }
  }
  
  window.addEventListener('scroll', handlePageScroll, { passive: true });
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

/* 表格容器 */
.table-container {
  position: relative;
}

/* 表格包装器 - 支持水平滚动 */
.table-wrapper {
  overflow-x: auto;
  overflow-y: visible;
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    height: 0; // 隐藏原生滚动条，使用自定义指示器
    display: none;
  }
}

/* 固定在底部的横向滚动指示器 */
.scroll-indicator-fixed {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 12px 0 16px;
  background: linear-gradient(transparent, rgba(38, 37, 30, 0.08));
  opacity: 0;
  transform: translateY(10px);
  transition: opacity 0.4s ease, transform 0.4s ease;
  pointer-events: none;

  &.is-active {
    opacity: 1;
    transform: translateY(0);
    pointer-events: auto;

    .scroll-thumb {
      background: var(--cursor-orange);
    }
  }
}

.scroll-indicator-inner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background: var(--cursor-white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-elevated);
}

.scroll-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(38, 37, 30, 0.4);
  font-size: 16px;
  transition: color 0.2s ease;

  .is-active & {
    color: var(--cursor-orange);
  }
}

/* 滚动条容器 */
.scroll-bar-container {
  width: 200px;
  height: 8px;
  background: var(--surface-400);
  border-radius: 4px;
  cursor: pointer;
  position: relative;
  overflow: visible;
}

/* 滚动滑块 */
.scroll-thumb {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  min-width: 40px;
  max-width: 160px;
  background: var(--surface-600);
  border-radius: 4px;
  transition: background 0.2s ease;
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
</style>
