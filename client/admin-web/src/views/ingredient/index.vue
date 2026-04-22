<template>
  <div class="page-container">
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">食材管理</h2>
        <p class="text-muted">管理食材库和营养信息</p>
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
        <div class="filter-left">
          <el-input
            v-model="filters.keyword"
            placeholder="搜索食材名称..."
            clearable
            style="width: 240px"
            :prefix-icon="Search"
            @keyup.enter="handleSearch"
          />
          <el-select v-model="filters.category" placeholder="分类" clearable style="width: 140px" @change="handleSearch">
            <el-option label="全部" value="" />
            <el-option label="蔬菜" value="vegetable" />
            <el-option label="水果" value="fruit" />
            <el-option label="肉类" value="meat" />
            <el-option label="水产" value="seafood" />
            <el-option label="蛋奶" value="dairy" />
            <el-option label="谷物" value="grain" />
            <el-option label="调料" value="seasoning" />
            <el-option label="豆制品" value="soy" />
            <el-option label="菌菇" value="fungus" />
            <el-option label="坚果" value="nut" />
            <el-option label="其他" value="other" />
          </el-select>
          <el-select v-model="filters.status" placeholder="状态" clearable style="width: 100px" @change="handleSearch">
            <el-option label="全部" value="" />
            <el-option label="启用" value="ACTIVE" />
            <el-option label="禁用" value="INACTIVE" />
          </el-select>
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
        stripe
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="食材" min-width="200">
          <template #default="{ row }">
            <div class="ingredient-info">
              <div class="ingredient-icon" :style="{ background: getCategoryColor(row.category) }">
                {{ row.name?.charAt(0) }}
              </div>
              <div class="ingredient-detail">
                <span class="ingredient-name">{{ row.name }}</span>
                <span class="ingredient-alias">{{ row.alias || '—' }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="分类" width="120" align="center">
          <template #default="{ row }">
            <span class="cursor-pill">{{ getCategoryText(row.category) }}</span>
            <div v-if="row.subCategory" class="sub-category">{{ row.subCategory }}</div>
          </template>
        </el-table-column>
        <el-table-column label="热量" width="100" align="center">
          <template #default="{ row }">
            <span class="nutrition-value">{{ row.calories ?? '—' }}</span>
            <span v-if="row.calories != null" class="nutrition-unit">kcal</span>
          </template>
        </el-table-column>
        <el-table-column label="营养成分（每100g）" width="260" align="center">
          <template #default="{ row }">
            <div class="nutrition-bars">
              <div class="nutrition-item">
                <span class="nutrition-label">蛋白</span>
                <div class="nutrition-bar">
                  <div class="bar-fill protein" :style="{ width: `${Math.min((row.protein ?? 0) / 50 * 100, 100)}%` }"></div>
                </div>
                <span class="nutrition-num">{{ row.protein ?? 0 }}g</span>
              </div>
              <div class="nutrition-item">
                <span class="nutrition-label">脂肪</span>
                <div class="nutrition-bar">
                  <div class="bar-fill fat" :style="{ width: `${Math.min((row.fat ?? 0) / 50 * 100, 100)}%` }"></div>
                </div>
                <span class="nutrition-num">{{ row.fat ?? 0 }}g</span>
              </div>
              <div class="nutrition-item">
                <span class="nutrition-label">碳水</span>
                <div class="nutrition-bar">
                  <div class="bar-fill carbs" :style="{ width: `${Math.min((row.carbs ?? 0) / 100 * 100, 100)}%` }"></div>
                </div>
                <span class="nutrition-num">{{ row.carbs ?? 0 }}g</span>
              </div>
            </div>
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
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <!-- 添加/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑食材' : '添加食材'"
      width="600px"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="食材名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入食材名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="别名">
              <el-input v-model="form.alias" placeholder="如：番茄的别名是西红柿" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="分类" prop="category">
              <el-select v-model="form.category" placeholder="选择分类" style="width: 100%">
                <el-option label="蔬菜" value="vegetable" />
                <el-option label="水果" value="fruit" />
                <el-option label="肉类" value="meat" />
                <el-option label="水产" value="seafood" />
                <el-option label="蛋奶" value="dairy" />
                <el-option label="谷物" value="grain" />
                <el-option label="调料" value="seasoning" />
                <el-option label="豆制品" value="soy" />
                <el-option label="菌菇" value="fungus" />
                <el-option label="坚果" value="nut" />
                <el-option label="其他" value="other" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="子类">
              <el-input v-model="form.subCategory" placeholder="如：叶菜、虾蟹、鱼类" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="状态">
              <el-radio-group v-model="form.status">
                <el-radio value="ACTIVE">启用</el-radio>
                <el-radio value="INACTIVE">禁用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">营养成分（每 100g）</el-divider>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="热量 (kcal)">
              <el-input-number v-model="form.calories" :min="0" :max="9999" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="蛋白质 (g)">
              <el-input-number v-model="form.protein" :min="0" :max="999" :precision="1" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="脂肪 (g)">
              <el-input-number v-model="form.fat" :min="0" :max="999" :precision="1" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="碳水化合物 (g)">
              <el-input-number v-model="form.carbs" :min="0" :max="999" :precision="1" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="膳食纤维 (g)">
              <el-input-number v-model="form.fiber" :min="0" :max="999" :precision="1" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="钠 (mg)">
              <el-input-number v-model="form.sodium" :min="0" :max="99999" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="请输入备注信息" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saveLoading" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>

    <!-- 导入对话框 -->
    <el-dialog
      v-model="importDialogVisible"
      title="导入食材"
      width="480px"
    >
      <div class="import-section">
        <div class="import-desc">
          请选择 JSON 文件导入食材数据。文件格式需为数组，每个元素包含 <code>name</code> 和 <code>category</code> 字段。
        </div>
        <div class="import-template">
          <div class="template-label">JSON 格式示例：</div>
          <pre class="template-code">{{ importTemplate }}</pre>
        </div>
        <el-upload
          ref="uploadRef"
          class="import-upload"
          drag
          accept=".json"
          :auto-upload="false"
          :limit="1"
          :on-change="handleFileChange"
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
import { Search, Plus, Edit, Delete, Upload, Download } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ingredientApi, type IngredientRow, type IngredientFormData } from '@/api/ingredient';

const loading = ref(false);
const saveLoading = ref(false);
const importLoading = ref(false);
const dialogVisible = ref(false);
const importDialogVisible = ref(false);
const isEdit = ref(false);
const formRef = ref();
const uploadRef = ref();
const selectedFile = ref<File | null>(null);

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

const form = reactive<IngredientFormData>({
  id: undefined,
  name: '',
  alias: '',
  category: 'vegetable',
  subCategory: '',
  status: 'ACTIVE',
  calories: 0,
  protein: 0,
  fat: 0,
  carbs: 0,
  fiber: 0,
  sodium: 0,
  remark: '',
});

const rules = {
  name: [{ required: true, message: '请输入食材名称', trigger: 'blur' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }],
};

const tableData = ref<IngredientRow[]>([]);

const importTemplate = JSON.stringify([
  {
    name: '牛肉',
    category: 'meat',
    subCategory: '牛肉',
    alias: '',
    calories: 125,
    protein: 19.8,
    fat: 5.3,
    carbs: 0,
    fiber: 0,
    sodium: 32,
  }
], null, 2);

function getCategoryText(category: string) {
  const map: Record<string, string> = {
    vegetable: '蔬菜',
    fruit: '水果',
    meat: '肉类',
    seafood: '水产',
    dairy: '蛋奶',
    grain: '谷物',
    seasoning: '调料',
    soy: '豆制品',
    fungus: '菌菇',
    nut: '坚果',
    other: '其他',
  };
  return map[category] || category;
}

function getCategoryColor(category: string) {
  const map: Record<string, string> = {
    vegetable: 'rgba(31, 138, 101, 0.15)',
    fruit: 'rgba(212, 136, 14, 0.15)',
    meat: 'rgba(207, 45, 86, 0.15)',
    seafood: 'rgba(74, 125, 191, 0.15)',
    dairy: 'rgba(192, 135, 221, 0.15)',
    grain: 'rgba(245, 78, 0, 0.15)',
    seasoning: 'rgba(38, 37, 30, 0.1)',
    soy: 'rgba(171, 121, 46, 0.15)',
    fungus: 'rgba(128, 90, 213, 0.15)',
    nut: 'rgba(200, 130, 60, 0.15)',
    other: 'rgba(120, 120, 120, 0.1)',
  };
  return map[category] || 'rgba(38, 37, 30, 0.1)';
}

async function fetchData() {
  loading.value = true;
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: filters.keyword || undefined,
      category: filters.category || undefined,
      status: filters.status || undefined,
    };
    const res = await ingredientApi.list(params);
    const resp = res.data as any;
    tableData.value = resp.data?.list || [];
    if (resp.pagination) {
      pagination.total = resp.pagination.total;
    } else if (resp.data?.total != null) {
      pagination.total = resp.data.total;
    }
  } catch {
    ElMessage.error('加载食材数据失败');
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  pagination.page = 1;
  fetchData();
}

function handleSizeChange() {
  pagination.page = 1;
  fetchData();
}

function handlePageChange() {
  fetchData();
}

function resetForm() {
  Object.assign(form, {
    id: undefined,
    name: '',
    alias: '',
    category: 'vegetable',
    subCategory: '',
    status: 'ACTIVE',
    calories: 0,
    protein: 0,
    fat: 0,
    carbs: 0,
    fiber: 0,
    sodium: 0,
    remark: '',
  });
}

function handleCreate() {
  isEdit.value = false;
  resetForm();
  dialogVisible.value = true;
}

function handleEdit(row: IngredientRow) {
  isEdit.value = true;
  Object.assign(form, {
    id: row.id,
    name: row.name,
    alias: row.alias || '',
    category: row.category,
    subCategory: row.subCategory || '',
    status: row.status,
    calories: row.calories,
    protein: row.protein,
    fat: row.fat,
    carbs: row.carbs,
    fiber: row.fiber,
    sodium: row.sodium,
    remark: row.remark || '',
  });
  dialogVisible.value = true;
}

async function handleSave() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  saveLoading.value = true;
  try {
    if (isEdit.value && form.id) {
      await ingredientApi.update(form.id, form);
      ElMessage.success('更新成功');
    } else {
      await ingredientApi.create(form);
      ElMessage.success('创建成功');
    }
    dialogVisible.value = false;
    fetchData();
  } catch {
    ElMessage.error(isEdit.value ? '更新失败' : '创建失败');
  } finally {
    saveLoading.value = false;
  }
}

async function handleDelete(row: IngredientRow) {
  await ElMessageBox.confirm(`确定要删除食材「${row.name}」吗？`, '提示', {
    type: 'warning',
  });
  try {
    await ingredientApi.delete(row.id);
    ElMessage.success('删除成功');
    fetchData();
  } catch {
    ElMessage.error('删除失败');
  }
}

function handleStatusChange(row: IngredientRow) {
  const action = row.status === 'ACTIVE' ? '启用' : '禁用';
  ElMessage.success(`食材已${action}`);
}

function handleFileChange(file: any) {
  selectedFile.value = file.raw;
}

async function handleImport() {
  if (!selectedFile.value) return;

  importLoading.value = true;
  try {
    const text = await selectedFile.value.text();
    const data = JSON.parse(text);

    if (!Array.isArray(data)) {
      ElMessage.error('JSON 文件格式错误：根元素必须是数组');
      return;
    }

    const res = await ingredientApi.batchImport(data);
    const resp = res.data as any;
    const d = resp.data || {};
    ElMessage.success(`导入完成：新增 ${d.imported ?? 0} 条，跳过 ${d.skipped ?? 0} 条`);
    importDialogVisible.value = false;
    selectedFile.value = null;
    uploadRef.value?.clearFiles();
    fetchData();
  } catch (e: any) {
    if (e?.name === 'SyntaxError') {
      ElMessage.error('JSON 解析失败，请检查文件格式');
    } else {
      ElMessage.error('导入失败');
    }
  } finally {
    importLoading.value = false;
  }
}

async function handleExport() {
  loading.value = true;
  try {
    const res = await ingredientApi.export();
    const resp = res.data as any;
    const list: IngredientRow[] = resp.data?.list || resp.data || [];

    const exportData = list.map(item => ({
      name: item.name,
      alias: item.alias || '',
      category: item.category,
      subCategory: item.subCategory || '',
      calories: item.calories ?? 0,
      protein: item.protein ?? 0,
      fat: item.fat ?? 0,
      carbs: item.carbs ?? 0,
      fiber: item.fiber ?? 0,
      sodium: item.sodium ?? 0,
      status: item.status,
      remark: item.remark || '',
    }));

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ingredients_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    ElMessage.success(`已导出 ${exportData.length} 条食材数据`);
  } catch {
    ElMessage.error('导出失败');
  } finally {
    loading.value = false;
  }
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

.sub-category {
  font-size: 11px;
  color: rgba(38, 37, 30, 0.4);
  margin-top: 2px;
}

.nutrition-value {
  font-family: var(--font-display);
  font-size: 14px;
  color: var(--cursor-dark);
}

.nutrition-unit {
  font-family: var(--font-mono);
  font-size: 10px;
  color: rgba(38, 37, 30, 0.4);
  margin-left: 2px;
}

.nutrition-bars {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
}

.nutrition-item {
  display: grid;
  grid-template-columns: 32px 60px 1fr 36px;
  align-items: center;
  gap: 6px;
  font-size: 11px;

  .nutrition-label {
    font-family: var(--font-serif);
    color: rgba(38, 37, 30, 0.5);
  }

  .nutrition-bar {
    height: 4px;
    background: var(--surface-400);
    border-radius: 2px;
    overflow: hidden;

    .bar-fill {
      height: 100%;
      border-radius: 2px;
      transition: width 0.3s ease;

      &.protein { background: var(--color-info); }
      &.fat { background: var(--color-warning); }
      &.carbs { background: var(--cursor-orange); }
    }
  }

  .nutrition-num {
    font-family: var(--font-mono);
    color: rgba(38, 37, 30, 0.6);
    text-align: right;
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

// 导入对话框样式
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

  .import-template {
    margin-bottom: 16px;

    .template-label {
      font-size: 12px;
      color: rgba(38, 37, 30, 0.5);
      margin-bottom: 6px;
    }

    .template-code {
      background: #f7f7f8;
      border: 1px solid var(--border-primary);
      border-radius: var(--radius-md);
      padding: 12px;
      font-family: var(--font-mono);
      font-size: 11px;
      color: var(--cursor-dark);
      overflow: auto;
      max-height: 160px;
      margin: 0;
    }
  }
}

.import-upload {
  width: 100%;

  :deep(.el-upload-dragger) {
    padding: 24px;
    border-radius: var(--radius-md);
  }

  .upload-icon {
    font-size: 28px;
    color: rgba(38, 37, 30, 0.3);
    margin-bottom: 8px;
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
