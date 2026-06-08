<template>
  <div class="page-container">
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">食材管理</h2>
        <p class="page-subtitle">共 {{ pagination.total }} 种食材</p>
      </div>
      <div class="header-actions">
        <el-button @click="handleExport">
          <el-icon><Download /></el-icon>
          导出
        </el-button>
        <el-button @click="importDialogVisible = true">
          <el-icon><Upload /></el-icon>
          导入
        </el-button>
        <el-button
          type="danger"
          :disabled="!selectedRows?.length"
          @click="handleBatchDelete"
        >
          <el-icon><Delete /></el-icon>
          批量删除{{ selectedRows?.length ? ` (${selectedRows.length})` : '' }}
        </el-button>
        <el-button type="primary" @click="handleCreate">
          <el-icon><Plus /></el-icon>
          添加食材
        </el-button>
      </div>
    </div>

    <div class="card-container">
      <div class="filter-section">
        <div class="filter-group">
          <el-input
            v-model="filters.keyword"
            placeholder="搜索食材名称..."
            clearable
            style="width: 240px"
            @keyup.enter="fetchData"
            @clear="fetchData"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>

          <el-select v-model="filters.category" placeholder="分类" clearable style="width: 140px" @change="fetchData">
            <el-option v-for="opt in CATEGORY_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>

          <el-select v-model="filters.status" placeholder="状态" clearable style="width: 110px" @change="fetchData">
            <el-option label="启用" value="ACTIVE" />
            <el-option label="禁用" value="INACTIVE" />
          </el-select>
        </div>

        <div class="filter-group">
          <el-button text @click="handleReset">
            <el-icon><RefreshLeft /></el-icon>
            重置
          </el-button>
        </div>
      </div>

      <div class="mobile-hint"><el-icon><DArrowLeft /></el-icon><span>左右滑动查看更多</span><el-icon><DArrowRight /></el-icon></div>
      <div class="hide-mobile">
      <el-table
        v-loading="loading"
        :data="tableData"
        row-key="id"
        :header-cell-style="{ background: 'var(--surface-300)', color: 'var(--cursor-dark)' }"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="40" fixed />
        <el-table-column prop="name" label="食材" min-width="180">
          <template #default="{ row }">
            <div class="ingredient-info">
              <div class="ingredient-icon">
                <img v-if="row.coverImage" :src="row.coverImage" class="ingredient-cover" />
                <div v-else :style="{ background: getCategoryColor(row.category) }">
                  {{ row.name?.charAt(0) }}
                </div>
              </div>
              <div class="ingredient-detail">
                <span class="ingredient-name">{{ row.name }}</span>
                <span v-if="row.alias" class="ingredient-alias">{{ row.alias }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="分类" width="130" align="center">
          <template #default="{ row }">
            <span class="cursor-pill">{{ getCategoryText(row.category) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="标签" width="120" align="center">
          <template #default="{ row }">
            <span v-if="row.isCommon" class="tag-chip common">常用</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              active-value="ACTIVE"
              inactive-value="INACTIVE"
              @change="handleStatusChange(row as IngredientRow)"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right" align="center">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button type="primary" link @click="handleEdit(row as IngredientRow)">
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>
              <el-button type="danger" link @click="handleDelete(row as IngredientRow)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
      </div><!-- /hide-mobile -->

      <div v-if="tableData.length === 0 && !loading" class="empty-state">
        <div class="empty-icon"><el-icon><FolderOpened /></el-icon></div>
        <div class="empty-title">暂无食材</div>
        <div class="empty-desc">点击下方按钮添加第一个食材</div>
        <el-button type="primary" @click="handleCreate">添加食材</el-button>
      </div>

      <div class="table-footer">
        <span class="page-subtitle">共 {{ pagination.total }} 条</span>
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          background
          @size-change="fetchData"
          @current-change="fetchData"
        />
      </div>
    </div>

    <!-- 添加/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑食材' : '添加食材'" width="560px">
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="食材名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入食材名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="别名">
              <el-input v-model="form.alias" placeholder="如：西红柿是番茄的别名" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="分类" prop="category">
              <el-select v-model="form.category" placeholder="选择分类" style="width: 100%">
                <el-option v-for="opt in CATEGORY_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="子分类">
              <el-input v-model="form.subCategory" placeholder="如：叶菜、根茎、瓜果" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="状态">
              <el-radio-group v-model="form.status">
                <el-radio value="ACTIVE">启用</el-radio>
                <el-radio value="INACTIVE">禁用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="是否常用食材">
              <el-switch v-model="form.isCommon" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="食材图片">
              <div class="ingredient-upload-area">
                <el-upload
                  action="#"
                  :auto-upload="false"
                  :show-file-list="false"
                  accept="image/*"
                  :on-change="handleIngredientImageChange"
                >
                  <img v-if="ingredientPreview || form.coverImage" :src="ingredientPreview || form.coverImage" class="ingredient-image-preview" />
                  <div v-else class="upload-placeholder">
                    <el-icon><Upload /></el-icon>
                    <span>点击上传图片</span>
                  </div>
                </el-upload>
                <div v-if="ingredientUploading" class="upload-mask">
                  <el-icon class="is-loading"><RefreshLeft /></el-icon>
                  <span>上传中...</span>
                </div>
              </div>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saveLoading" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>

    <!-- 导入对话框 -->
    <el-dialog v-model="importDialogVisible" title="导入食材" width="560px" :close-on-click-modal="false">
      <!-- 步骤一：上传文件 -->
      <div v-if="!importPreviewData" class="import-section">
        <div class="step-badge">步骤 1 / 2</div>

        <label class="upload-card" for="import-file-input">
          <div class="upload-card-inner">
            <div class="upload-icon-circle">
              <el-icon class="upload-lg-icon"><Upload /></el-icon>
            </div>
            <div class="upload-card-text">
              <span class="upload-card-title">选择 JSON 文件</span>
              <span class="upload-card-sub">拖拽文件到此处，或<span class="link">点击选择</span></span>
            </div>
          </div>
        </label>
        <input
          id="import-file-input"
          ref="fileInputRef"
          type="file"
          accept=".json"
          class="import-file-input"
          @change="handleFileInputChange"
        />

        <div v-if="selectedFile" class="file-badge">
          <el-icon class="file-badge-icon"><Document /></el-icon>
          <span class="file-badge-name">{{ selectedFile.name }}</span>
          <span class="file-badge-size">{{ (selectedFile.size / 1024).toFixed(1) }} KB</span>
          <span class="file-badge-divider"></span>
          <button class="file-badge-remove" @click="handleClearFile">移除</button>
        </div>

        <div class="import-note">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5.5" stroke="#9c8b7e" stroke-width="1"/><path d="M6 5.5v3M6 4h.01" stroke="#9c8b7e" stroke-width="1" stroke-linecap="round"/></svg>
          <span>支持 <code>miniprogram/data/ingredients.json</code>，当前库含 <strong>{{ pagination.total }}</strong> 种食材</span>
        </div>
      </div>

      <!-- 步骤二：预览结果 -->
      <div v-else class="import-preview-section">
        <div class="step-badge">步骤 2 / 2</div>

        <div class="stat-row">
          <div class="stat-card accent">
            <span class="stat-value">{{ importPreviewData.total }}</span>
            <span class="stat-label">待导入</span>
          </div>
          <div class="stat-card" :class="importPreviewData.duplicateCount > 0 ? 'warn' : 'green'">
            <span class="stat-value">{{ importPreviewData.duplicateCount }}</span>
            <span class="stat-label">已存在</span>
          </div>
        </div>

        <!-- 有重复时 -->
        <div v-if="importPreviewData.duplicateCount > 0" class="dup-block">
          <div class="dup-header">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style="flex-shrink:0">
              <path d="M7 0.5L8.65 5.25L13.5 5.65L10 8.75L11.2 13.5L7 11L2.8 13.5L4 8.75L0.5 5.65L5.35 5.25L7 0.5Z" fill="#e6a23c"/>
            </svg>
            <span>{{ importPreviewData.duplicateCount }} 条食材已存在</span>
          </div>
          <div class="dup-list-wrap">
            <span class="dup-list-label">重复食材</span>
            <span class="dup-list-names">{{ importPreviewData.duplicates.map((d: any) => d.name).join('、') }}</span>
          </div>
          <div class="dup-actions">
            <el-radio-group v-model="importOverwriteMode">
              <el-radio value="skip" class="dup-radio">
                <span class="dup-radio-title">保留现有</span>
              </el-radio>
              <el-radio value="overwrite" class="dup-radio">
                <span class="dup-radio-title">覆盖更新</span>
              </el-radio>
            </el-radio-group>
          </div>
        </div>

        <!-- 无重复时 -->
        <div v-else class="ok-block">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="#67c23a" stroke-width="1.5"/><path d="M5 8l2 2 4-4" stroke="#67c23a" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <span>全部新增，无重复数据</span>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer-bar">
          <el-button text size="small" @click="handleBackToUpload" v-if="importPreviewData">重新选择</el-button>
          <div class="footer-btn-group">
            <el-button size="small" @click="handleImportCancel">取消</el-button>
            <el-button
              v-if="!importPreviewData"
              type="primary"
              size="small"
              :disabled="!selectedFile || importLoading"
              :loading="importLoading"
              @click="handlePreviewImport"
            >
              开始分析
            </el-button>
            <el-button
              v-else
              type="primary"
              size="small"
              :loading="importLoading"
              @click="handleConfirmImport"
            >
              确认导入
            </el-button>
          </div>
        </div>
      </template>
    </el-dialog>

    <!-- 导出弹窗 -->
    <ExportDialog
      v-model="exportDialogVisible"
      name="食材"
      :total="pagination.total"
      :exporting="exporting"
      @confirm="onExportConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { Search, Plus, Edit, Delete, Upload, Download, RefreshLeft, Document } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { UploadFile, FormInstance, FormRules } from 'element-plus';
import { ingredientApi, type IngredientRow, type IngredientFormData } from '@/api/ingredient';
import { uploadIngredient } from '@/api/upload';
import { useExport, downloadFile, type ExportFormat } from '@/composables/useExport';
import ExportDialog from '@/components/common/ExportDialog.vue';
import { usePreferences } from '@/composables/usePreferences';

const { defaultPageSize } = usePreferences();

const { exportDialogVisible, exportFormat, exporting, showExportDialog, handleConfirm } = useExport();

const CATEGORY_OPTIONS = [
  { value: 'vegetable', label: '蔬菜' },
  { value: 'fruit', label: '水果' },
  { value: 'meat', label: '肉类' },
  { value: 'seafood', label: '水产' },
  { value: 'egg_dairy', label: '蛋奶' },
  { value: 'staple', label: '主食' },
  { value: 'seasoning', label: '调料' },
  { value: 'soy', label: '豆制品' },
  { value: 'fungus', label: '菌菇' },
  { value: 'nut', label: '坚果' },
  { value: 'medicinal', label: '药食' },
  { value: 'other', label: '其他' },
];

const loading = ref(false);
const saveLoading = ref(false);
const importLoading = ref(false);
const dialogVisible = ref(false);
const importDialogVisible = ref(false);
const isEdit = ref(false);
const formRef = ref<FormInstance>();
const fileInputRef = ref<HTMLInputElement | null>(null);
const selectedFile = ref<File | null>(null);
const importPreviewData = ref<{ total: number; duplicateCount: number; duplicates: { name: string; existingId: number }[] } | null>(null);
const importOverwriteMode = ref<'skip' | 'overwrite'>('skip');
const pendingImportItems = ref<any[]>([]);

const filters = reactive({
  keyword: '',
  category: '',
  status: '',
});

const pagination = reactive({
  page: 1,
  pageSize: 0,
  total: 0,
});

const tableData = ref<IngredientRow[]>([]);
const selectedRows = ref<IngredientRow[]>([]);

const form = reactive<IngredientFormData & { coverImage?: string }>({
  name: '',
  category: 'vegetable',
  subCategory: '',
  alias: '',
  isCommon: false,
  status: 'ACTIVE',
  coverImage: '',
});

const ingredientUploading = ref(false);
const ingredientPreview = ref('');

const rules: FormRules = {
  name: [{ required: true, message: '请输入食材名称', trigger: 'blur' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }],
};

function getCategoryText(category: string): string {
  return CATEGORY_OPTIONS.find(o => o.value === category)?.label || category;
}

function getCategoryColor(category: string): string {
  const map: Record<string, string> = {
    vegetable: 'rgba(31, 138, 101, 0.15)',
    fruit: 'rgba(212, 136, 14, 0.15)',
    meat: 'rgba(207, 45, 86, 0.15)',
    seafood: 'rgba(74, 125, 191, 0.15)',
    egg_dairy: 'rgba(192, 135, 221, 0.15)',
    staple: 'rgba(245, 78, 0, 0.15)',
    seasoning: 'rgba(38, 37, 30, 0.1)',
    soy: 'rgba(171, 121, 46, 0.15)',
    fungus: 'rgba(128, 90, 213, 0.15)',
    nut: 'rgba(200, 130, 60, 0.15)',
    medicinal: 'rgba(200, 80, 80, 0.15)',
    other: 'rgba(120, 120, 120, 0.1)',
  };
  return map[category] || 'rgba(38, 37, 30, 0.1)';
}

async function fetchData() {
  loading.value = true;
  try {
    const res = await ingredientApi.list({
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: filters.keyword || undefined,
      category: filters.category || undefined,
      status: filters.status || undefined,
    });
    // #endregion
    tableData.value = res.data?.list || [];
    pagination.total = res.data?.total || 0;
    selectedRows.value = [];
  } catch (error) {
    // 错误已在 request 拦截器中处理（显示 timeout 或网络错误提示）
    console.error('获取食材列表失败:', error);
  } finally {
    loading.value = false;
  }
}

function handleReset() {
  Object.assign(filters, { keyword: '', category: '', status: '' });
  pagination.page = 1;
  fetchData();
}

function handleSelectionChange(rows: IngredientRow[]) {
  selectedRows.value = rows;
}

async function handleBatchDelete() {
  if (selectedRows.value.length === 0) return;
  const count = selectedRows.value.length;
  const names = selectedRows.value.slice(0, 3).map(r => r.name).join('、');
  const suffix = count > 3 ? `等 ${count} 种` : count > 1 ? `等 ${count} 种` : '';
  const msg = count === 1
    ? `确定要删除食材「${selectedRows.value[0].name}」吗？`
    : `确定要删除选中的 ${count} 种食材吗？（${names}${suffix}）`;
  await ElMessageBox.confirm(msg, '批量删除', { type: 'warning', confirmButtonText: '删除' });
  await ingredientApi.batchDelete(selectedRows.value.map(r => r.id));
  ElMessage.success(`成功删除 ${count} 种食材`);
  selectedRows.value = [];
  fetchData();
}

function handleCreate() {
  isEdit.value = false;
  Object.assign(form, {
    name: '',
    category: 'vegetable',
    subCategory: '',
    alias: '',
    isCommon: false,
    status: 'ACTIVE',
    coverImage: '',
  });
  ingredientPreview.value = '';
  dialogVisible.value = true;
}

async function handleIngredientImageChange(file: UploadFile) {
  const raw = file.raw as File;
  if (!raw) return;
  ingredientUploading.value = true;
  ingredientPreview.value = URL.createObjectURL(raw);
  try {
    const result = await uploadIngredient(raw);
    form.coverImage = result.url || '';
    ElMessage.success('图片上传成功');
  } catch {
    ElMessage.error('图片上传失败');
    ingredientPreview.value = '';
  } finally {
    ingredientUploading.value = false;
  }
}

function handleEdit(row: IngredientRow) {
  isEdit.value = true;
  Object.assign(form, { ...row });
  ingredientPreview.value = '';
  dialogVisible.value = true;
}

async function handleSave() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  saveLoading.value = true;
  try {
    const data: IngredientFormData & { coverImage?: string } = {
      name: form.name,
      category: form.category,
      subCategory: form.subCategory || undefined,
      alias: form.alias,
      isCommon: form.isCommon,
      status: form.status,
    };
    if (form.coverImage) {
      data.coverImage = form.coverImage;
    }

    if (isEdit.value && form.id) {
      await ingredientApi.update(form.id, data);
      ElMessage.success('更新成功');
    } else {
      await ingredientApi.create(data);
      ElMessage.success('添加成功');
    }
    fetchData();
    dialogVisible.value = false;
  } catch (error: any) {
    const status = error?.response?.status;
    if (status === 409) {
      const msg = error?.response?.data?.message || '食材已存在';
      ElMessage.warning(msg);
    } else {
      ElMessage.error('保存失败，请重试');
    }
  } finally {
    saveLoading.value = false;
  }
}

async function handleDelete(row: IngredientRow) {
  await ElMessageBox.confirm(`确定要删除食材「${row.name}」吗？`, '提示', { type: 'warning' });
  await ingredientApi.delete(row.id);
  ElMessage.success('删除成功');
  fetchData();
}

async function handleStatusChange(row: IngredientRow) {
  const action = row.status === 'ACTIVE' ? '启用' : '禁用';
  await ingredientApi.update(row.id, { ...row, status: row.status });
  ElMessage.success(`食材「${row.name}」已${action}`);
}

function handleFileInputChange(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) {
    selectedFile.value = file;
    importPreviewData.value = null;
    pendingImportItems.value = [];
  }
}

function handleClearFile() {
  selectedFile.value = null;
  importPreviewData.value = null;
  pendingImportItems.value = [];
  if (fileInputRef.value) {
    fileInputRef.value.value = '';
  }
}

function handleImportCancel() {
  importDialogVisible.value = false;
  handleClearFile();
}

function handleBackToUpload() {
  importPreviewData.value = null;
  pendingImportItems.value = [];
}

// 步骤一：上传文件后点击"开始分析" -> 调用 preview 接口
async function handlePreviewImport() {
  if (!selectedFile.value) return;

  importLoading.value = true;
  try {
    const text = await selectedFile.value.text();
    const data = JSON.parse(text) as any[];

    if (!Array.isArray(data)) {
      ElMessage.error('JSON 文件格式错误：根元素必须是数组');
      return;
    }

    const items = data.map(item => ({
      name: item.name || '',
      category: item.category || 'other',
      alias: Array.isArray(item.aliases) ? item.aliases.join(',') : (item.alias || ''),
      isCommon: item.isCommon || false,
    })).filter((item: any) => item.name);

    pendingImportItems.value = items;
    const res = await ingredientApi.previewImport(items) as any;
    // 接口返回格式：{ code, message, data: { total, duplicateCount, duplicates } }
    importPreviewData.value = res?.data ?? null;
  } catch {
    ElMessage.error('预览失败，请检查 JSON 文件格式');
  } finally {
    importLoading.value = false;
  }
}

// 步骤二：点击"确认导入"
async function handleConfirmImport() {
  if (!pendingImportItems.value.length) return;

  importLoading.value = true;
  try {
    const overwrite = importOverwriteMode.value === 'overwrite';
    const res = await ingredientApi.batchImport(pendingImportItems.value, overwrite);
    const { imported = 0, updated = 0 } = (res as any).data ?? {};

    importDialogVisible.value = false;
    handleClearFile();
    fetchData();

    if (overwrite) {
      ElMessage.success(`导入完成：新增 ${imported} 条，覆盖 ${updated} 条`);
    } else {
      ElMessage.success(`导入完成：新增 ${imported} 条`);
    }
  } catch {
    ElMessage.error('导入失败，请重试');
  } finally {
    importLoading.value = false;
  }
}

async function handleExport() {
  const params = {
    keyword: filters.keyword || undefined,
    category: filters.category || undefined,
    status: filters.status || undefined,
  };
  showExportDialog({
    name: '食材',
    total: pagination.total,
    exportFn: (format) => downloadFile('/ingredients/export', params, format),
  });
}

function onExportConfirm(format: ExportFormat) {
  exportFormat.value = format;
  handleConfirm();
}

onMounted(() => {
  pagination.pageSize = defaultPageSize();
  fetchData();
});
</script>

<style scoped lang="scss">
.header-actions {
  display: flex;
  gap: 8px;
}

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

.ingredient-info {
  display: flex;
  align-items: center;
  gap: 12px;

  .ingredient-icon {
    width: 40px;
    height: 40px;
    border-radius: var(--radius-md);
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--font-display);
    font-size: 16px;
    font-weight: 500;
    color: var(--cursor-dark);
    flex-shrink: 0;

    .ingredient-cover {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .ingredient-detail {
    display: flex;
    flex-direction: column;
    gap: 2px;

    .ingredient-name {
      font-family: var(--font-display);
      font-size: 14px;
      color: var(--cursor-dark);
    }

    .ingredient-alias {
      font-family: var(--font-serif);
      font-size: 12px;
      color: rgba(38, 37, 30, 0.5);
    }
  }
}

.tag-chip {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: var(--radius-pill);
  font-family: var(--font-display);
  font-size: 11px;

  &.common {
    background: rgba(31, 138, 101, 0.12);
    color: var(--color-success);
  }

  &.selected {
    background: rgba(245, 78, 0, 0.12);
    color: var(--cursor-orange);
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
}

// ============================================================
// 导入弹窗 — 温暖编辑风
// ============================================================

$accent: #f56e2d;
$accent-light: #fff4ee;
$accent-border: #f8c9a8;
$accent-mid: #fa8c55;
$green: #3d8c6d;
$green-light: #edf7f3;
$warn: #e6a23c;
$warn-light: #fdf6ec;
$bg: #fffdfb;
$border: #f0ebe5;
$text: #3d2b1f;
$muted: #9c8b7e;
$radius: 8px;

.import-section {
  background: $bg;
  border-radius: $radius + 4;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.step-badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  background: rgba(245, 110, 45, 0.1);
  color: $accent-mid;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.3px;
  width: fit-content;
}

.upload-card {
  border: 1.5px dashed $border;
  border-radius: $radius + 2;
  padding: 36px 24px;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
  background: $bg;

  &:hover {
    border-color: $accent;
    background: $accent-light;

    .upload-icon-circle {
      background: $accent;
      .upload-lg-icon { color: #fff; }
    }
  }
}

.upload-card-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.upload-icon-circle {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: $border;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.upload-lg-icon {
  font-size: 22px;
  color: $muted;
  transition: color 0.2s;
}

.upload-card-text {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.upload-card-title {
  font-size: 15px;
  font-weight: 600;
  color: $text;
}

.upload-card-sub {
  font-size: 12px;
  color: $muted;

  .link {
    color: $accent;
    cursor: pointer;
  }
}

.file-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: $green-light;
  border: 1px solid rgba(61, 140, 109, 0.2);
  border-radius: $radius;
  font-size: 12px;
  color: $text;
}

.file-badge-icon { color: $green; flex-shrink: 0; font-size: 14px; }
.file-badge-name { font-weight: 500; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.file-badge-size { color: $muted; flex-shrink: 0; font-family: monospace; font-size: 11px; }
.file-badge-divider { width: 1px; height: 12px; background: rgba(61,140,109,0.25); flex-shrink: 0; }
.file-badge-remove {
  background: none;
  border: none;
  padding: 0;
  color: #e64a4a;
  font-size: 12px;
  cursor: pointer;
  font-family: inherit;
  flex-shrink: 0;
  &:hover { opacity: 0.7; }
}

.import-note {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 11px;
  color: $muted;
  text-align: left;
  justify-content: flex-start;
  line-height: 1.6;
  padding: 0 2px;

  strong { color: $accent; font-weight: 600; }
  code {
    font-family: monospace;
    font-size: 10.5px;
    background: rgba(61,44,31,0.07);
    padding: 1px 4px;
    border-radius: 3px;
    color: $text;
    white-space: nowrap;
    flex-shrink: 0;
  }
}

.import-file-input {
  display: none;
}

// ============================================================
// 步骤二：预览
// ============================================================

.import-preview-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stat-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px 12px;
  border-radius: $radius;
  border: 1.5px solid transparent;
  gap: 4px;

  .stat-value {
    font-family: var(--font-display, 'Georgia', serif);
    font-size: 26px;
    font-weight: 600;
    line-height: 1;
    color: $text;
    font-variant-numeric: tabular-nums;
  }

  .stat-label {
    font-size: 11px;
    color: $muted;
    letter-spacing: 0.2px;
  }

  &.accent {
    border-color: $accent-border;
    background: $accent-light;
    .stat-value { color: $accent; }
  }

  &.warn {
    border-color: rgba(230, 162, 60, 0.4);
    background: $warn-light;
    .stat-value { color: $warn; }
  }

  &.green {
    border-color: rgba(61, 140, 109, 0.3);
    background: $green-light;
    .stat-value { color: $green; }
  }
}

.dup-block {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px;
  background: $warn-light;
  border: 1px solid rgba(230, 162, 60, 0.3);
  border-radius: $radius + 2;
}

.dup-header {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 13px;
  font-weight: 600;
  color: $warn;
  line-height: 1;
}

.dup-list-wrap {
  padding: 8px 12px;
  background: #fff;
  border: 1px solid rgba(230, 162, 60, 0.2);
  border-radius: $radius;
  display: flex;
  flex-direction: column;
  gap: 3px;
  overflow: hidden;
}

.dup-list-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: $muted;
  flex-shrink: 0;
}

.dup-list-names {
  font-size: 12px;
  color: $text;
  line-height: 1.6;
  max-height: 64px;
  overflow-y: auto;
  word-break: break-all;
  overflow-wrap: anywhere;
}

.dup-actions {
  .el-radio-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
}

.dup-radio {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 12px;
  border: 1.5px solid $border;
  border-radius: $radius;
  background: $bg;
  width: 100%;
  margin-right: 0;
  transition: border-color 0.18s, background 0.18s;

  &:has(.el-radio__input.is-checked) {
    border-color: $accent;
    background: $accent-light;
  }
}

.dup-radio-title {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: $text;
  line-height: 1.4;
  padding-left: 2px;
}

.ok-block {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background: $green-light;
  border: 1px solid rgba(61, 140, 109, 0.25);
  border-radius: $radius + 2;
  font-size: 13px;
  color: $green;
  font-weight: 500;
}

.dialog-footer-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;

  .footer-btn-group {
    display: flex;
    align-items: center;
    gap: 8px;
  }
}

// 强制覆盖 el-dialog 的 footer flex 方向，让按钮组居中
:deep(.el-dialog__footer) {
  text-align: center !important;

  .dialog-footer-bar {
    justify-content: center;
  }
}

.ingredient-upload-area {
  position: relative;

  .upload-mask {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    background: rgba(255, 255, 255, 0.85);
    border-radius: var(--radius-md);
    font-family: var(--font-display);
    font-size: 12px;
    color: var(--cursor-orange);
    z-index: 1;
  }

  .ingredient-image-preview {
    width: 80px;
    height: 80px;
    object-fit: cover;
    border-radius: var(--radius-md);
    cursor: pointer;
    border: 2px dashed var(--border-medium);
  }

  .upload-placeholder {
    width: 80px;
    height: 80px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    background: var(--surface-300);
    border: 2px dashed var(--border-medium);
    border-radius: var(--radius-md);
    cursor: pointer;

    .el-icon {
      font-size: 20px;
      color: rgba(38, 37, 30, 0.3);
    }

    span {
      font-family: var(--font-display);
      font-size: 11px;
      color: rgba(38, 37, 30, 0.5);
    }
  }
}

</style>
