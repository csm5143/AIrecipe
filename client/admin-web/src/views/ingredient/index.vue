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
            @keyup.enter="applyFilters"
            @clear="applyFilters"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>

          <el-select v-model="filters.category" placeholder="分类" clearable style="width: 140px" @change="applyFilters">
            <el-option v-for="opt in CATEGORY_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>

          <el-select v-model="filters.status" placeholder="状态" clearable style="width: 110px" @change="applyFilters">
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

      <el-table
        v-loading="loading"
        :data="tableData"
        row-key="name"
        :header-cell-style="{ background: 'var(--surface-300)', color: 'var(--cursor-dark)' }"
      >
        <el-table-column prop="name" label="食材" min-width="180">
          <template #default="{ row }">
            <div class="ingredient-info">
              <div class="ingredient-icon" :style="{ background: getCategoryColor(row.category) }">
                {{ row.name?.charAt(0) }}
              </div>
              <div class="ingredient-detail">
                <span class="ingredient-name">{{ row.name }}</span>
                <span v-if="row.subCategory" class="ingredient-alias">{{ row.subCategory }}</span>
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
            <span v-if="row.selected" class="tag-chip selected">已选</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              active-value="ACTIVE"
              inactive-value="INACTIVE"
              @change="handleStatusChange(row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right" align="center">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button type="primary" link @click="handleEdit(row)">
                <el-icon><Edit /></el-icon>
                编辑
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
          :page-sizes="[20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          background
          @size-change="applyFilters"
          @current-change="applyFilters"
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
              <el-input v-model="form.subCategory" placeholder="如：西红柿是番茄的别名" />
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
            <el-form-item label="状态">
              <el-radio-group v-model="form.status">
                <el-radio value="ACTIVE">启用</el-radio>
                <el-radio value="INACTIVE">禁用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="是否常用食材">
              <el-switch v-model="form.isCommon" />
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
    <el-dialog v-model="importDialogVisible" title="导入食材" width="500px">
      <div class="import-section">
        <p class="import-desc">
          上传 <code>miniprogram/data/ingredients.json</code> 文件导入食材数据。
          当前共有 <strong>{{ localData.length }}</strong> 种食材，导入将完全覆盖现有数据。
        </p>
        <el-upload
          ref="uploadRef"
          class="import-upload"
          drag
          accept=".json"
          :auto-upload="false"
          :limit="1"
          @change="handleFileChange"
        >
          <el-icon class="upload-icon"><Upload /></el-icon>
          <div class="upload-text">将 JSON 文件拖到此处，或<em>点击上传</em></div>
          <template #tip>
            <div class="upload-tip">仅支持 .json 文件</div>
          </template>
        </el-upload>
      </div>
      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="importLoading" :disabled="!selectedFile" @click="handleImport">
          开始导入
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { Search, Plus, Edit, Delete, Upload, Download, RefreshLeft } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { UploadFile, FormInstance, FormRules } from 'element-plus';

interface LocalIngredient {
  name: string;
  category: string;
  subCategory?: string;
  selected?: boolean;
  isCommon?: boolean;
  status: 'ACTIVE' | 'INACTIVE';
}

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
const uploadRef = ref();
const selectedFile = ref<File | null>(null);

const localData = ref<LocalIngredient[]>([]);

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

const tableData = ref<LocalIngredient[]>([]);

const form = reactive<LocalIngredient & { name: string; category: string }>({
  name: '',
  category: 'vegetable',
  subCategory: '',
  selected: false,
  isCommon: false,
  status: 'ACTIVE',
});

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

function applyFilters() {
  let data = [...localData.value];

  if (filters.keyword) {
    const kw = filters.keyword.toLowerCase();
    data = data.filter(r =>
      r.name.toLowerCase().includes(kw) ||
      (r.subCategory?.toLowerCase().includes(kw) ?? false)
    );
  }
  if (filters.category) {
    data = data.filter(r => r.category === filters.category);
  }
  if (filters.status) {
    data = data.filter(r => r.status === filters.status);
  }

  pagination.total = data.length;
  const start = (pagination.page - 1) * pagination.pageSize;
  tableData.value = data.slice(start, start + pagination.pageSize);
}

async function fetchData() {
  loading.value = true;
  try {
    const cached = localStorage.getItem('ingredients_data');
    if (cached) {
      localData.value = JSON.parse(cached);
    } else {
      const res = await fetch('/data/ingredients.json');
      const data = await res.json();
      localData.value = (data as any[]).map(item => ({
        name: item.name,
        category: item.category,
        subCategory: item.subCategory || '',
        selected: item.selected || false,
        isCommon: item.isCommon || false,
        status: 'ACTIVE' as const,
      }));
      saveToStorage();
    }
    applyFilters();
  } catch {
    ElMessage.error('加载食材数据失败，请检查网络或重新导入');
  } finally {
    loading.value = false;
  }
}

function saveToStorage() {
  localStorage.setItem('ingredients_data', JSON.stringify(localData.value));
}

function handleReset() {
  Object.assign(filters, { keyword: '', category: '', status: '' });
  pagination.page = 1;
  applyFilters();
}

function handleCreate() {
  isEdit.value = false;
  Object.assign(form, {
    name: '',
    category: 'vegetable',
    subCategory: '',
    selected: false,
    isCommon: false,
    status: 'ACTIVE',
  });
  dialogVisible.value = true;
}

  let editingName = '';

function handleEdit(row: LocalIngredient) {
  isEdit.value = true;
  editingName = row.name;
  Object.assign(form, { ...row });
  dialogVisible.value = true;
}

async function handleSave() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  saveLoading.value = true;
  try {
    if (isEdit.value) {
      const idx = localData.value.findIndex(r => r.name === editingName);
      if (idx !== -1) {
        localData.value[idx] = { ...form };
      }
      ElMessage.success('更新成功');
    } else {
      if (localData.value.some(r => r.name === form.name)) {
        ElMessage.warning('该食材已存在');
        return;
      }
      localData.value.push({ ...form });
      ElMessage.success('添加成功');
    }
    saveToStorage();
    applyFilters();
    dialogVisible.value = false;
  } finally {
    saveLoading.value = false;
  }
}

async function handleDelete(row: LocalIngredient) {
  await ElMessageBox.confirm(`确定要删除食材「${row.name}」吗？`, '提示', { type: 'warning' });
  localData.value = localData.value.filter(r => r.name !== row.name);
  saveToStorage();
  applyFilters();
  ElMessage.success('删除成功');
}

function handleStatusChange(row: LocalIngredient) {
  const action = row.status === 'ACTIVE' ? '启用' : '禁用';
  saveToStorage();
  ElMessage.success(`食材「${row.name}」已${action}`);
}

function handleFileChange(file: UploadFile) {
  selectedFile.value = file.raw as File;
}

async function handleImport() {
  if (!selectedFile.value) return;

  importLoading.value = true;
  try {
    const text = await selectedFile.value.text();
    const data = JSON.parse(text) as any[];

    if (!Array.isArray(data)) {
      ElMessage.error('JSON 文件格式错误：根元素必须是数组');
      return;
    }

    localData.value = data.map(item => ({
      name: item.name || '',
      category: item.category || 'other',
      subCategory: item.subCategory || '',
      selected: item.selected || false,
      isCommon: item.isCommon || false,
      status: 'ACTIVE' as const,
    })).filter(item => item.name);

    saveToStorage();
    applyFilters();
    importDialogVisible.value = false;
    selectedFile.value = null;
    uploadRef.value?.clearFiles();
    ElMessage.success(`成功导入 ${localData.value.length} 种食材`);
  } catch {
    ElMessage.error('JSON 解析失败，请检查文件格式');
  } finally {
    importLoading.value = false;
  }
}

function handleExport() {
  const exportData = localData.value.map(item => ({
    name: item.name,
    category: item.category,
    subCategory: item.subCategory || '',
    selected: item.selected || false,
    isCommon: item.isCommon || false,
  }));

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ingredients_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  ElMessage.success(`已导出 ${exportData.length} 种食材`);
}

onMounted(() => {
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
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--font-display);
    font-size: 16px;
    font-weight: 500;
    color: var(--cursor-dark);
    flex-shrink: 0;
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

  .total-info {
    font-family: var(--font-serif);
    font-size: 13px;
    color: rgba(38, 37, 30, 0.6);
  }
}

.import-section {
  .import-desc {
    font-size: 13px;
    color: rgba(38, 37, 30, 0.7);
    margin-bottom: 16px;
    line-height: 1.6;

    code {
      background: rgba(38, 37, 30, 0.06);
      padding: 1px 5px;
      border-radius: 3px;
      font-family: var(--font-mono);
      font-size: 12px;
      color: var(--cursor-dark);
    }
  }
}

.import-upload {
  width: 100%;

  :deep(.el-upload-dragger) {
    padding: 32px;
    border-radius: var(--radius-md);
  }

  .upload-icon {
    font-size: 32px;
    color: rgba(38, 37, 30, 0.3);
    margin-bottom: 12px;
  }

  .upload-text {
    font-size: 13px;
    color: rgba(38, 37, 30, 0.6);

    em {
      color: var(--el-color-primary);
      font-style: normal;
    }
  }

  .upload-tip {
    font-size: 11px;
    color: rgba(38, 37, 30, 0.4);
    margin-top: 8px;
  }
}
</style>
