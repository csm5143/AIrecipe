<template>
  <div class="page-container">
    <div class="page-header">
      <div class="header-left">
        <el-button text @click="router.back()">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <h2 class="page-title">编辑菜谱</h2>
        <el-tag :type="getStatusType(form.status)" size="small">{{ getStatusText(form.status) }}</el-tag>
      </div>
      <div class="header-actions">
        <el-button @click="handleSave">保存</el-button>
        <el-dropdown trigger="click" @command="handlePublish">
          <el-button type="primary">
            发布
            <el-icon><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="PUBLISHED">立即发布</el-dropdown-item>
              <el-dropdown-item command="DRAFT">存为草稿</el-dropdown-item>
              <el-dropdown-item command="OFFLINE">下线</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <div class="form-layout">
      <div class="form-main">
        <!-- 基本信息 -->
        <div class="card-container">
          <h3 class="section-title">基本信息</h3>
          <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
            <el-form-item label="菜谱标题" prop="title">
              <el-input
                v-model="form.title"
                placeholder="给菜谱起个吸引人的名字"
                maxlength="100"
                show-word-limit
              />
            </el-form-item>

            <el-form-item label="简介" prop="description">
              <el-input
                v-model="form.description"
                type="textarea"
                :rows="3"
                placeholder="简要描述这道菜的特点和烹饪要点"
                maxlength="500"
                show-word-limit
              />
            </el-form-item>

            <el-row :gutter="20">
              <el-col :span="8">
                <el-form-item label="菜品类型" prop="dishType">
                  <el-select v-model="form.dishType" placeholder="选择菜品类型" style="width: 100%">
                    <el-option v-for="opt in DISH_TYPE_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="难度">
                  <el-radio-group v-model="form.difficulty">
                    <el-radio v-for="opt in DIFFICULTY_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</el-radio>
                  </el-radio-group>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="烹饪时间（分钟）">
                  <el-input-number v-model="form.cookingTime" :min="1" :max="999" />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="8">
                <el-form-item label="用餐时段">
                  <el-select v-model="form.mealTimes" multiple placeholder="选择用餐时段" style="width: 100%">
                    <el-option v-for="opt in MEAL_TIME_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="适宜人群">
                  <el-checkbox v-model="form.fitnessMeal">健身餐</el-checkbox>
                  <el-checkbox v-model="form.childrenMeal">儿童餐</el-checkbox>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="年龄段" v-if="form.childrenMeal">
                  <el-select v-model="form.ageBand" placeholder="选择年龄段" style="width: 100%">
                    <el-option v-for="opt in AGE_BAND_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20" v-if="form.fitnessMeal">
              <el-col :span="12">
                <el-form-item label="健身分类">
                  <el-select v-model="form.fitnessCategory" placeholder="选择健身分类" style="width: 100%">
                    <el-option v-for="opt in FITNESS_CATEGORY_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="健身目标">
                  <el-select v-model="form.goal" placeholder="选择健身目标" style="width: 100%">
                    <el-option v-for="opt in GOAL_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </div>

        <!-- 封面图 -->
        <div class="card-container">
          <h3 class="section-title">封面图</h3>
          <el-form-item label="上传封面">
            <el-upload
              action="#"
              :auto-upload="false"
              :show-file-list="false"
              accept="image/*"
              class="cover-uploader"
              @change="handleCoverChange"
            >
              <img v-if="coverPreview || form.coverImage" :src="coverPreview || form.coverImage" class="cover-preview" />
              <div v-else class="upload-placeholder">
                <el-icon class="upload-icon"><Plus /></el-icon>
                <span class="upload-text">点击上传封面图</span>
                <span class="upload-hint">建议尺寸 800x600，支持 JPG、PNG</span>
              </div>
            </el-upload>
          </el-form-item>
        </div>

        <!-- 食材清单 -->
        <div class="card-container">
          <h3 class="section-title">食材清单</h3>
          <el-table :data="form.ingredients" border style="width: 100%">
            <el-table-column label="食材名称" min-width="200">
              <template #default="{ row }">
                <el-input v-model="row.name" placeholder="食材名称" />
              </template>
            </el-table-column>
            <el-table-column label="用量" width="150">
              <template #default="{ row }">
                <el-input v-model="row.amount" placeholder="如：100g" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80" align="center">
              <template #default="{ $index }">
                <el-button
                  type="danger"
                  :icon="Delete"
                  circle
                  @click="removeIngredient($index)"
                  :disabled="form.ingredients.length <= 1"
                />
              </template>
            </el-table-column>
          </el-table>
          <el-button type="default" class="mt-md" @click="addIngredient">
            <el-icon><Plus /></el-icon>
            添加食材
          </el-button>
        </div>

        <!-- 烹饪步骤 -->
        <div class="card-container">
          <h3 class="section-title">烹饪步骤</h3>
          <div class="steps-list">
            <div v-for="(step, index) in form.steps" :key="index" class="step-item">
              <div class="step-header">
                <div class="step-number">{{ index + 1 }}</div>
                <span class="step-label">步骤 {{ index + 1 }}</span>
                <el-button
                  type="danger"
                  :icon="Delete"
                  text
                  @click="removeStep(index)"
                  :disabled="form.steps.length <= 1"
                >
                  删除
                </el-button>
              </div>
              <el-input
                v-model="step.content"
                type="textarea"
                :rows="3"
                :placeholder="`描述第 ${index + 1} 步的操作`"
              />
              <div class="step-footer">
                <el-upload
                  action="#"
                  :auto-upload="false"
                  :show-file-list="false"
                  accept="image/*"
                  @change="(e: any) => handleStepImageChange(e, index)"
                >
                  <el-button text>
                    <el-icon><Picture /></el-icon>
                    {{ step.image ? '更换图片' : '添加步骤图' }}
                  </el-button>
                </el-upload>
                <img v-if="step.image" :src="step.image" class="step-image-preview" />
              </div>
            </div>
            <el-button type="default" @click="addStep">
              <el-icon><Plus /></el-icon>
              添加步骤
            </el-button>
          </div>
        </div>

        <!-- 小贴士 -->
        <div class="card-container">
          <h3 class="section-title">小贴士</h3>
          <el-form-item>
            <el-input
              v-model="form.tips"
              type="textarea"
              :rows="3"
              placeholder="分享一些烹饪小技巧或注意事项"
              maxlength="500"
              show-word-limit
            />
          </el-form-item>
        </div>
      </div>

      <!-- 侧边栏 -->
      <div class="form-sidebar">
        <div class="card-container">
          <h3 class="section-title">发布设置</h3>
          <div class="publish-status">
            <div class="status-item">
              <span class="status-label">当前状态</span>
              <el-tag :type="getStatusType(form.status)">{{ getStatusText(form.status) }}</el-tag>
            </div>
            <div class="status-item">
              <span class="status-label">创建时间</span>
              <span class="status-value">{{ form.createdAt }}</span>
            </div>
            <div class="status-item">
              <span class="status-label">更新时间</span>
              <span class="status-value">{{ form.updatedAt }}</span>
            </div>
            <div class="status-item">
              <span class="status-label">浏览量</span>
              <span class="status-value">{{ form.viewCount }}</span>
            </div>
            <div class="status-item">
              <span class="status-label">收藏量</span>
              <span class="status-value">{{ form.collectCount }}</span>
            </div>
          </div>

          <el-divider />

          <div class="tags-section">
            <span class="tags-label">标签</span>
            <div class="tags-list">
              <el-tag
                v-for="tag in form.tags"
                :key="tag"
                closable
                @close="removeTag(tag)"
              >
                {{ tag }}
              </el-tag>
              <el-input
                v-if="showTagInput"
                ref="tagInputRef"
                v-model="newTag"
                size="small"
                class="tag-input"
                @keyup.enter="addTag"
                @blur="addTag"
              />
              <el-button v-else size="small" text @click="showTagInput = true">
                <el-icon><Plus /></el-icon>
                添加
              </el-button>
            </div>
          </div>
        </div>

        <div class="card-container">
          <h3 class="section-title">营养信息</h3>
          <el-form label-position="top">
            <el-form-item label="热量 (kcal)">
              <el-input-number v-model="form.nutrition.calories" :min="0" size="small" />
            </el-form-item>
            <el-form-item label="蛋白质 (g)">
              <el-input-number v-model="form.nutrition.protein" :min="0" size="small" />
            </el-form-item>
            <el-form-item label="脂肪 (g)">
              <el-input-number v-model="form.nutrition.fat" :min="0" size="small" />
            </el-form-item>
            <el-form-item label="碳水 (g)">
              <el-input-number v-model="form.nutrition.carbs" :min="0" size="small" />
            </el-form-item>
          </el-form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { Plus, Delete, Picture, ArrowLeft, ArrowDown } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import {
  DISH_TYPE_OPTIONS, MEAL_TIME_OPTIONS, DIFFICULTY_OPTIONS,
  AGE_BAND_OPTIONS, FITNESS_CATEGORY_OPTIONS, GOAL_OPTIONS, STATUS_OPTIONS,
} from './data';

const router = useRouter();
const route = useRoute();
const formRef = ref();
const coverPreview = ref('');
const showTagInput = ref(false);
const newTag = ref('');
const tagInputRef = ref();

const form = reactive({
  id: 0,
  title: '',
  description: '',
  dishType: '',
  difficulty: 'EASY',
  cookingTime: 30,
  coverImage: '',
  ingredients: [{ name: '', amount: '' }] as { name: string; amount: string }[],
  steps: [{ content: '', image: '' }] as { content: string; image: string }[],
  tags: [] as string[],
  tips: '',
  status: 'DRAFT',
  mealTimes: [] as string[],
  fitnessMeal: false,
  fitnessCategory: '',
  goal: '',
  ageBand: '',
  childrenMeal: false,
  createdAt: '',
  updatedAt: '',
  viewCount: 0,
  collectCount: 0,
  nutrition: {
    calories: 0,
    protein: 0,
    fat: 0,
    carbs: 0,
    fiber: 0,
    sodium: 0,
  },
});

const rules = {
  title: [{ required: true, message: '请输入菜谱标题', trigger: 'blur' }],
  dishType: [{ required: true, message: '请选择菜品类型', trigger: 'change' }],
};

function getStatusType(status: string) {
  const map: Record<string, any> = {
    PUBLISHED: 'success',
    DRAFT: 'info',
    OFFLINE: 'warning',
  };
  return map[status] || 'info';
}

function getStatusText(status: string) {
  return STATUS_OPTIONS.find(o => o.value === status)?.label || status;
}

function handleCoverChange(file: any) {
  coverPreview.value = URL.createObjectURL(file.raw);
  form.coverImage = file.raw;
}

function addIngredient() {
  form.ingredients.push({ name: '', amount: '' });
}

function removeIngredient(index: number) {
  form.ingredients.splice(index, 1);
}

function addStep() {
  form.steps.push({ content: '', image: '' });
}

function removeStep(index: number) {
  form.steps.splice(index, 1);
}

function handleStepImageChange(file: any, index: number) {
  form.steps[index].image = URL.createObjectURL(file.raw);
}

async function addTag() {
  const tag = newTag.value.trim();
  if (tag && !form.tags.includes(tag)) {
    form.tags.push(tag);
  }
  newTag.value = '';
  showTagInput.value = false;
}

function removeTag(tag: string) {
  form.tags.splice(form.tags.indexOf(tag), 1);
}

async function handleSave() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  form.updatedAt = new Date().toISOString().split('T')[0];
  ElMessage.success('保存成功');
}

async function handlePublish(command: string) {
  form.status = command;
  ElMessage.success(`状态已更新为：${getStatusText(command)}`);
  await handleSave();
}

onMounted(async () => {
  const id = Number(route.params.id);
  if (!id) return;

  const res = await fetch('/data/recipes.json');
  const data = await res.json();
  const recipe = data.find((r: any) => String(r.id) === String(id)) as any;
  if (!recipe) {
    ElMessage.error('菜谱不存在');
    router.push('/recipes');
    return;
  }

  form.id = Number(recipe.id);
  form.title = recipe.name || recipe.title || '';
  form.description = recipe.description || '';
  form.coverImage = recipe.coverImage || '';
  form.cookingTime = recipe.timeCost || 30;
  form.status = 'PUBLISHED';
  form.mealTimes = recipe.mealTimes || [];
  form.fitnessMeal = recipe.fitnessMeal || false;
  form.fitnessCategory = recipe.fitnessCategory || '';
  form.goal = recipe.goal || '';
  form.ageBand = recipe.ageBand || '';
  form.childrenMeal = recipe.childrenMeal || false;
  form.viewCount = recipe.viewCount || Math.floor(Math.random() * 5000);
  form.collectCount = recipe.collectCount || Math.floor(Math.random() * 500);
  form.createdAt = new Date(Date.now() - Math.random() * 90 * 86400000).toISOString().split('T')[0];
  form.updatedAt = new Date().toISOString().split('T')[0];
  form.tags = (recipe.dishTypes || []).map((t: string) => {
    const opt = DISH_TYPE_OPTIONS.find(o => o.value === t);
    return opt?.label || t;
  });

  form.ingredients = Object.entries(recipe.usage || {}).map(([name, amount]) => ({
    name,
    amount: String(amount),
  }));
  if (form.ingredients.length === 0) {
    form.ingredients = (recipe.ingredients || []).map((name: string) => ({ name, amount: '' }));
  }

  form.steps = (recipe.steps || []).map((content: string) => ({ content, image: '' }));

  const diffMap: Record<string, string> = { easy: 'EASY', normal: 'MEDIUM', medium: 'MEDIUM', hard: 'HARD' };
  form.difficulty = diffMap[recipe.difficulty] || 'EASY';

  const typeMap: Record<string, string> = {};
  DISH_TYPE_OPTIONS.forEach(opt => { typeMap[opt.value] = opt.value; });
  form.dishType = recipe.dishTypes?.[0] || '';
});
</script>

<style scoped lang="scss">
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;

  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;

    .page-title {
      font-family: var(--font-display);
      font-size: 22px;
      font-weight: 400;
      letter-spacing: -0.55px;
      color: var(--cursor-dark);
    }
  }

  .header-actions {
    display: flex;
    gap: 12px;
  }
}

.form-layout {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 24px;
  align-items: start;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
}

.form-main {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-sidebar {
  display: flex;
  flex-direction: column;
  gap: 24px;
  position: sticky;
  top: 24px;
}

.section-title {
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 400;
  color: var(--cursor-dark);
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-primary);
}

.cover-uploader {
  width: 100%;

  :deep(.el-upload) {
    width: 100%;
    border: 2px dashed var(--border-medium);
    border-radius: var(--radius-lg);
    cursor: pointer;
    overflow: hidden;
    transition: all var(--transition-fast);

    &:hover {
      border-color: var(--cursor-orange);
    }
  }

  .cover-preview {
    width: 100%;
    height: 200px;
    object-fit: cover;
    display: block;
  }

  .upload-placeholder {
    height: 200px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background: var(--surface-300);

    .upload-icon {
      font-size: 48px;
      color: rgba(38, 37, 30, 0.3);
    }

    .upload-text {
      font-family: var(--font-display);
      font-size: 14px;
      color: rgba(38, 37, 30, 0.6);
    }

    .upload-hint {
      font-family: var(--font-mono);
      font-size: 11px;
      color: rgba(38, 37, 30, 0.4);
    }
  }
}

.steps-list {
  display: flex;
  flex-direction: column;
  gap: 16px;

  .step-item {
    padding: 16px;
    background: var(--surface-300);
    border-radius: var(--radius-md);
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .step-header {
    display: flex;
    align-items: center;
    gap: 12px;

    .step-number {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: var(--cursor-dark);
      color: var(--cursor-cream);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: var(--font-display);
      font-size: 13px;
      flex-shrink: 0;
    }

    .step-label {
      font-family: var(--font-display);
      font-size: 13px;
      color: rgba(38, 37, 30, 0.7);
      flex: 1;
    }
  }

  .step-footer {
    display: flex;
    align-items: center;
    gap: 12px;

    .step-image-preview {
      width: 60px;
      height: 60px;
      object-fit: cover;
      border-radius: var(--radius-sm);
    }
  }
}

.publish-status {
  display: flex;
  flex-direction: column;
  gap: 12px;

  .status-item {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .status-label {
      font-family: var(--font-serif);
      font-size: 13px;
      color: rgba(38, 37, 30, 0.5);
    }

    .status-value {
      font-family: var(--font-mono);
      font-size: 12px;
      color: var(--cursor-dark);
    }
  }
}

.tags-section {
  .tags-label {
    display: block;
    font-family: var(--font-display);
    font-size: 13px;
    color: rgba(38, 37, 30, 0.7);
    margin-bottom: 8px;
  }

  .tags-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;

    :deep(.el-tag) {
      border-radius: var(--radius-pill);
      background: var(--surface-400);
      border: none;
      color: var(--cursor-dark);
    }

    .tag-input {
      width: 80px;
    }
  }
}
</style>
