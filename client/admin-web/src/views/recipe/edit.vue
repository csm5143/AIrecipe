<template>
  <div class="page-container">
    <div class="page-header">
      <div class="header-left">
        <el-button text @click="router.back()">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <h2 class="page-title">编辑食谱</h2>
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
            <el-form-item label="食谱标题" prop="title">
              <el-input
                v-model="form.title"
                placeholder="给食谱起个吸引人的名字"
                maxlength="100"
                show-word-limit
              />
            </el-form-item>

            <el-form-item label="简介" prop="description">
              <el-input
                v-model="form.description"
                type="textarea"
                :rows="3"
                placeholder="简要描述这道菜的特点"
                maxlength="500"
                show-word-limit
              />
            </el-form-item>

            <el-row :gutter="20">
              <el-col :span="8">
                <el-form-item label="分类" prop="category">
                  <el-select v-model="form.category" placeholder="选择分类" style="width: 100%">
                    <el-option label="家常菜" value="home" />
                    <el-option label="健身餐" value="fitness" />
                    <el-option label="儿童餐" value="kids" />
                    <el-option label="甜点" value="dessert" />
                    <el-option label="饮品" value="drink" />
                    <el-option label="早餐" value="breakfast" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="难度">
                  <el-radio-group v-model="form.difficulty">
                    <el-radio value="EASY">简单</el-radio>
                    <el-radio value="MEDIUM">中等</el-radio>
                    <el-radio value="HARD">困难</el-radio>
                  </el-radio-group>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="烹饪时间（分钟）">
                  <el-input-number v-model="form.cookingTime" :min="1" :max="999" />
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
import { ref, reactive, onMounted, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { Plus, Delete, Picture, ArrowLeft, ArrowDown } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

const router = useRouter();
const route = useRoute();
const formRef = ref();
const coverPreview = ref('');
const showTagInput = ref(false);
const newTag = ref('');
const tagInputRef = ref();

const form = reactive({
  id: 0,
  title: '番茄炒蛋',
  description: '一道简单美味的家常菜，色香味俱全，营养丰富。',
  category: 'home',
  difficulty: 'EASY',
  cookingTime: 15,
  coverImage: 'https://picsum.photos/seed/recipe1/400/300',
  ingredients: [
    { name: '番茄', amount: '2个' },
    { name: '鸡蛋', amount: '3个' },
    { name: '葱花', amount: '适量' },
    { name: '盐', amount: '少许' },
  ],
  steps: [
    { content: '番茄洗净切块，鸡蛋打散备用。', image: '' },
    { content: '热锅凉油，倒入蛋液炒至凝固后盛出。', image: '' },
    { content: '锅中加少许油，放入番茄块翻炒出汁。', image: '' },
    { content: '加入炒好的鸡蛋，调入盐翻炒均匀即可。', image: '' },
  ],
  tags: ['家常菜', '快手菜', '下饭'],
  status: 'PUBLISHED',
  createdAt: '2024-01-15 10:30:00',
  updatedAt: '2024-01-16 14:20:00',
  viewCount: 12580,
  collectCount: 3421,
  nutrition: {
    calories: 156,
    protein: 12,
    fat: 9,
    carbs: 5,
  },
});

const rules = {
  title: [{ required: true, message: '请输入食谱标题', trigger: 'blur' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }],
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
  const map: Record<string, string> = {
    PUBLISHED: '已发布',
    DRAFT: '草稿',
    OFFLINE: '已下线',
  };
  return map[status] || status;
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

  ElMessage.success('保存成功');
}

async function handlePublish(command: string) {
  form.status = command;
  ElMessage.success(`状态已更新为：${getStatusText(command)}`);
  await handleSave();
}

onMounted(() => {
  const id = route.params.id;
  // TODO: 根据 ID 加载食谱详情
  console.log('Loading recipe:', id);
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
