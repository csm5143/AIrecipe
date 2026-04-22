<template>
  <div class="page-container">
    <div class="page-header">
      <div class="header-left">
        <el-button text @click="router.back()">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <h2 class="page-title">创建菜谱</h2>
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
              <img v-if="coverPreview" :src="coverPreview" class="cover-preview" />
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
          <div class="ingredients-list">
            <div class="ingredient-header">
              <span>食材名称</span>
              <span>用量</span>
              <span></span>
            </div>
            <div v-for="(item, index) in form.ingredients" :key="index" class="ingredient-item">
              <el-input v-model="item.name" placeholder="如：鸡胸肉" />
              <el-input v-model="item.amount" placeholder="如：80g" />
              <el-button type="danger" :icon="Delete" circle @click="removeIngredient(index)" />
            </div>
            <el-button type="default" @click="addIngredient">
              <el-icon><Plus /></el-icon>
              添加食材
            </el-button>
          </div>
        </div>

        <!-- 烹饪步骤 -->
        <div class="card-container">
          <h3 class="section-title">烹饪步骤</h3>
          <div class="steps-list">
            <div v-for="(step, index) in form.steps" :key="index" class="step-item">
              <div class="step-number">{{ index + 1 }}</div>
              <el-input
                v-model="step.content"
                type="textarea"
                :rows="3"
                :placeholder="`描述第 ${index + 1} 步的操作`"
              />
              <el-upload
                action="#"
                :auto-upload="false"
                :show-file-list="false"
                accept="image/*"
                class="step-image-uploader"
                @change="(e: any) => handleStepImageChange(e, index)"
              >
                <el-button text>
                  <el-icon><Picture /></el-icon>
                  添加图片
                </el-button>
              </el-upload>
              <el-button
                type="danger"
                :icon="Delete"
                circle
                @click="removeStep(index)"
                :disabled="form.steps.length <= 1"
              />
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
          <el-form label-position="top">
            <el-form-item label="状态">
              <el-radio-group v-model="form.status">
                <el-radio v-for="opt in STATUS_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</el-radio>
              </el-radio-group>
            </el-form-item>

            <el-form-item label="标签">
              <div class="tags-input">
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
                  @keyup.enter="addTag"
                  @blur="addTag"
                />
                <el-button v-else size="small" @click="showTagInput = true">
                  <el-icon><Plus /></el-icon>
                  添加标签
                </el-button>
              </div>
            </el-form-item>
          </el-form>

          <div class="action-buttons">
            <el-button type="primary" size="large" @click="handleSubmit">
              {{ form.status === 'PUBLISHED' ? '发布菜谱' : '保存草稿' }}
            </el-button>
            <el-button size="large" @click="router.back()">取消</el-button>
          </div>
        </div>

        <div class="card-container">
          <h3 class="section-title">营养信息（可选）</h3>
          <el-form label-position="top">
            <el-form-item label="热量 (kcal)">
              <el-input-number v-model="form.nutrition.calories" :min="0" />
            </el-form-item>
            <el-form-item label="蛋白质 (g)">
              <el-input-number v-model="form.nutrition.protein" :min="0" />
            </el-form-item>
            <el-form-item label="脂肪 (g)">
              <el-input-number v-model="form.nutrition.fat" :min="0" />
            </el-form-item>
            <el-form-item label="碳水 (g)">
              <el-input-number v-model="form.nutrition.carbs" :min="0" />
            </el-form-item>
          </el-form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { Plus, Delete, Picture, ArrowLeft } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import {
  DISH_TYPE_OPTIONS, MEAL_TIME_OPTIONS, DIFFICULTY_OPTIONS,
  AGE_BAND_OPTIONS, FITNESS_CATEGORY_OPTIONS, GOAL_OPTIONS, STATUS_OPTIONS,
} from './data';

const router = useRouter();
const formRef = ref();
const coverPreview = ref('');
const showTagInput = ref(false);
const newTag = ref('');
const tagInputRef = ref();

const form = reactive({
  title: '',
  description: '',
  dishType: '',
  difficulty: 'EASY',
  cookingTime: 30,
  coverImage: '',
  ingredients: [{ name: '', amount: '' }],
  steps: [{ content: '', image: '' }],
  tags: [] as string[],
  tips: '',
  status: 'DRAFT',
  mealTimes: [] as string[],
  fitnessMeal: false,
  fitnessCategory: '',
  goal: '',
  ageBand: '',
  childrenMeal: false,
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

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  ElMessage.success(form.status === 'PUBLISHED' ? '发布成功' : '保存成功');
  router.push('/recipes');
}
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
    gap: 16px;

    .page-title {
      font-family: var(--font-display);
      font-size: 22px;
      font-weight: 400;
      letter-spacing: -0.55px;
      color: var(--cursor-dark);
    }
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

.ingredients-list {
  display: flex;
  flex-direction: column;
  gap: 12px;

  .ingredient-header {
    display: grid;
    grid-template-columns: 1fr 120px auto;
    gap: 12px;
    font-family: var(--font-display);
    font-size: 13px;
    color: rgba(38, 37, 30, 0.5);
    padding: 0 4px;
  }

  .ingredient-item {
    display: grid;
    grid-template-columns: 1fr 120px auto;
    gap: 12px;
    align-items: center;
  }
}

.steps-list {
  display: flex;
  flex-direction: column;
  gap: 16px;

  .step-item {
    display: grid;
    grid-template-columns: 36px 1fr auto auto;
    gap: 12px;
    align-items: start;
    padding: 16px;
    background: var(--surface-300);
    border-radius: var(--radius-md);
  }

  .step-number {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: var(--cursor-dark);
    color: var(--cursor-cream);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--font-display);
    font-size: 14px;
    flex-shrink: 0;
  }
}

.tags-input {
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
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 20px;

  .el-button {
    width: 100%;
  }
}
</style>
