<template>
  <div class="image-workbench">
    <header class="workbench-header">
      <div>
        <h2>图片创作</h2>
        <p>单图接口稳定编排：文生图、图生图、批量和整套图都按任务队列逐张生成。</p>
      </div>
      <div class="model-bar">
        <el-button :icon="Refresh" size="small" @click="loadModels">刷新模型</el-button>
        <el-select v-model="gen.keyId" size="small" class="model-select" placeholder="选择 gpt-image2 中转站">
          <el-option
            v-for="model in models"
            :key="model.id"
            :label="`${model.name} / ${model.model}`"
            :value="model.id"
          />
        </el-select>
      </div>
    </header>

    <div v-if="!models.length" class="setup-tip">
      请先在「系统设置 / API Key 管理」中创建并启用图片或多模态模型。
    </div>

    <nav class="mode-tabs" aria-label="图片创作模式">
      <button v-for="item in tabs" :key="item" :class="{ active: tab === item }" @click="onTabChange(item)">
        {{ item }}
      </button>
    </nav>

    <main class="workbench-grid">
      <aside class="settings-panel">
        <section class="panel-section">
          <div class="section-title">尺寸</div>
          <div class="size-grid">
            <button
              v-for="option in sizeGrid"
              :key="`${option.k}-${option.r}`"
              :class="{ active: gen.sizeK === option.k && gen.ratio === option.r }"
              @click="setSize(option.k, option.r)"
            >
              <strong>{{ option.k }}</strong>
              <span>{{ option.r }}</span>
              <small>{{ option.px }}</small>
            </button>
          </div>
        </section>

        <section class="panel-section">
          <div class="section-title">输出</div>
          <el-form label-position="top" size="small">
            <el-form-item label="背景">
              <el-radio-group v-model="gen.bg">
                <el-radio-button label="opaque">不透明</el-radio-button>
                <el-radio-button label="transparent">透明</el-radio-button>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="格式">
              <el-select v-model="gen.format">
                <el-option label="PNG" value="PNG" />
                <el-option label="JPG" value="JPG" />
                <el-option label="WebP" value="WebP" />
              </el-select>
            </el-form-item>
            <el-form-item label="单次数量" v-if="tab === '文生图' || tab === '图生图'">
              <el-input-number v-model="gen.count" :min="1" :max="4" />
            </el-form-item>
          </el-form>
        </section>

        <section class="panel-section queue-summary">
          <div>
            <span>排队</span>
            <strong>{{ pendingCount }}</strong>
          </div>
          <div>
            <span>生成中</span>
            <strong>{{ runningCount }}</strong>
          </div>
          <div>
            <span>完成</span>
            <strong>{{ doneCount }}</strong>
          </div>
        </section>
      </aside>

      <section class="creator-panel">
        <div class="panel-heading">
          <div>
            <h3>{{ tab }}</h3>
            <p>{{ modeDescription }}</p>
          </div>
          <el-tag v-if="queueRunning" type="warning" effect="plain">队列运行中</el-tag>
        </div>

        <template v-if="tab === '文生图'">
          <section class="panel-section">
            <div class="section-title">生成目标</div>
            <el-select v-model="targetType" size="small" class="full" placeholder="选择目标类型" @change="onTargetTypeChange">
              <el-option label="菜谱封面" value="recipe-cover" />
              <el-option label="菜谱步骤图" value="recipe-step" />
              <el-option label="轮播 Banner" value="banner" />
              <el-option label="定制卡片" value="card" />
              <el-option label="图标" value="icon" />
              <el-option label="宣传图" value="promo" />
              <el-option label="自由创作" value="" />
            </el-select>

            <template v-if="targetType === 'recipe-cover' || targetType === 'recipe-step'">
              <el-select
                v-model="targetId"
                filterable
                clearable
                size="small"
                class="full stacked"
                placeholder="搜索菜谱"
                @change="onRecipeChange"
              >
                <el-option
                  v-for="recipe in allRecipes"
                  :key="recipe.id"
                  :label="`${recipe.coverImage ? '已有封面' : '缺封面'} / ${recipe.title}`"
                  :value="recipe.id"
                />
              </el-select>

              <div v-if="selectedRecipe" class="recipe-context">
                <strong>{{ selectedRecipe.title }}</strong>
                <span v-if="recipeIngNames">{{ recipeIngNames }}</span>
              </div>

              <div v-if="targetType === 'recipe-step' && targetRecipeSteps.length" class="step-list">
                <button
                  v-for="(step, index) in targetRecipeSteps"
                  :key="index"
                  :class="{ active: targetStepIndex === index }"
                  @click="targetStepIndex = index"
                >
                  <b>{{ index + 1 }}</b>
                  <span>{{ truncate(getStepContent(step, index), 48) }}</span>
                </button>
              </div>
            </template>
          </section>

          <prompt-editor
            :template-id="gen.tid"
            :templates="tpls"
            :prompt="gen.prompt"
            :auto-context="autoCtx"
            @update:template-id="gen.tid = $event"
            @update:prompt="gen.prompt = $event"
            @select-template="onTplSelect"
            @save-template="saveTemplate"
          />

          <el-button type="primary" size="large" :icon="MagicStick" @click="doGenerate">
            加入生成队列
          </el-button>
        </template>

        <template v-else-if="tab === '图生图'">
          <section class="panel-section">
            <div class="section-title">参考图</div>
            <el-upload
              action="#"
              :auto-upload="false"
              :show-file-list="true"
              :limit="1"
              accept="image/*"
              @change="onRefUpload"
              @remove="refImage = ''"
            >
              <el-button :icon="Upload" size="small">选择图片</el-button>
            </el-upload>
            <img v-if="refImage" :src="refImage" class="reference-preview" alt="参考图预览" />
          </section>

          <section class="panel-section">
            <div class="section-title">变化描述</div>
            <el-input
              v-model="gen.prompt"
              type="textarea"
              :rows="5"
              placeholder="描述要保留或改变的内容，例如：保持菜品主体，换成自然光、木桌背景、浅景深。"
            />
          </section>

          <el-button type="primary" size="large" :icon="MagicStick" @click="doGenerate">
            加入生成队列
          </el-button>
        </template>

        <template v-else-if="tab === '批量任务'">
          <section class="panel-section">
            <div class="section-title row-title">
              <span>批量类型</span>
              <el-radio-group v-model="batchMode" size="small" @change="resetBatchSelection">
                <el-radio-button label="cover">缺封面</el-radio-button>
                <el-radio-button label="step">缺步骤图</el-radio-button>
              </el-radio-group>
            </div>

            <template v-if="batchMode === 'cover'">
              <div class="batch-toolbar">
                <span>{{ missingCovers.length }} 道菜缺封面，已选 {{ batchTargets.length }} 道</span>
                <div>
                  <el-button size="small" @click="batchTargets = missingCovers.slice(0, 20).map((recipe) => recipe.id)">选前 20</el-button>
                  <el-button size="small" @click="batchTargets = []">清空</el-button>
                </div>
              </div>
              <div class="batch-list">
                <button
                  v-for="recipe in missingCovers"
                  :key="recipe.id"
                  :class="{ active: batchTargets.includes(recipe.id) }"
                  @click="toggleBatch(recipe.id)"
                >
                  <span>{{ recipe.title }}</span>
                  <small>缺封面</small>
                </button>
              </div>
            </template>

            <template v-else>
              <el-select
                v-model="batchStepRecipeId"
                filterable
                clearable
                size="small"
                class="full"
                placeholder="选择一道有缺图步骤的菜谱"
                @change="batchStepTargets = []"
              >
                <el-option
                  v-for="recipe in missingSteps"
                  :key="recipe.id"
                  :label="`${recipe.title} / ${recipe.missingStepCount} 步缺图`"
                  :value="recipe.id"
                />
              </el-select>

              <div v-if="batchStepRecipeId" class="batch-toolbar stacked">
                <span>已选 {{ batchStepTargets.length }} 个步骤</span>
                <div>
                  <el-button size="small" @click="selectMissingSteps">全选缺图</el-button>
                  <el-button size="small" @click="batchStepTargets = []">清空</el-button>
                </div>
              </div>
              <div v-if="batchStepRecipeId" class="batch-list">
                <button
                  v-for="step in batchStepOptions"
                  :key="step.index"
                  :class="{ active: batchStepTargets.includes(step.index), muted: step.hasImage }"
                  @click="toggleStepTarget(step.index)"
                >
                  <span><b>{{ step.index + 1 }}.</b> {{ truncate(step.desc, 50) }}</span>
                  <small>{{ step.hasImage ? '已有图' : '缺图' }}</small>
                </button>
              </div>
            </template>
          </section>

          <prompt-editor
            :template-id="gen.tid"
            :templates="tpls"
            :prompt="gen.prompt"
            auto-context=""
            @update:template-id="gen.tid = $event"
            @update:prompt="gen.prompt = $event"
            @select-template="onTplSelect"
            @save-template="saveTemplate"
          />

          <el-button type="primary" size="large" :icon="MagicStick" @click="doGenerate">
            批量加入队列
          </el-button>
        </template>

        <template v-else>
          <section class="panel-section">
            <div class="section-title row-title">
              <span>菜谱</span>
              <el-switch v-model="setOverwrite" size="small" active-text="覆盖已有图" inactive-text="只补缺图" />
            </div>
            <el-select
              v-model="setRecipeId"
              filterable
              clearable
              size="small"
              class="full"
              placeholder="搜索需要生成整套图的菜谱"
            >
              <el-option
                v-for="recipe in recipesNeedingImages"
                :key="recipe.id"
                :label="`${recipe.title} / ${recipe.steps?.length || 0} 步`"
                :value="recipe.id"
              />
            </el-select>
            <div v-if="setRecipe" class="set-preview">
              <div><b>封面</b><span>{{ setRecipe.coverImage ? '已有' : '缺失' }}</span></div>
              <div v-for="(step, index) in setRecipe.steps || []" :key="index">
                <b>步骤 {{ index + 1 }}</b>
                <span>{{ hasStepImage(step) ? '已有' : '缺失' }}</span>
                <small>{{ truncate(getStepContent(step, index), 38) }}</small>
              </div>
            </div>
          </section>

          <section class="panel-section">
            <div class="section-title">整套图风格</div>
            <el-select v-model="setTplId" size="small" class="full" clearable placeholder="选择模板" @change="onSetTplSelect">
              <el-option label="自由创作" :value="0" />
              <el-option v-for="item in tpls" :key="item.id" :label="item.name" :value="item.id" />
            </el-select>
            <el-input
              v-model="setPrompt"
              class="stacked"
              type="textarea"
              :rows="5"
              placeholder="补充统一的视觉风格、光线、镜头和摆盘要求，菜名和步骤会自动注入。"
            />
            <div v-if="!setTplId && setPrompt.trim()" class="template-save">
              <el-input v-model="setTplName" size="small" placeholder="模板名称" />
              <el-button size="small" type="primary" @click="saveSetTemplate">保存模板</el-button>
            </div>
          </section>

          <el-button type="primary" size="large" :icon="MagicStick" :loading="setGenerating" @click="doGenerateSet">
            生成整套图
          </el-button>
        </template>
      </section>

      <aside class="queue-panel">
        <div class="queue-heading">
          <div>
            <h3>任务队列</h3>
            <p>{{ tasks.length ? `共 ${tasks.length} 个任务` : '结果和错误都会保留在这里' }}</p>
          </div>
          <div class="queue-actions">
            <el-button :icon="Check" size="small" text @click="batchAdopt" :disabled="!adoptableTasks.length">应用可用</el-button>
            <el-button :icon="Delete" size="small" text @click="clearFinished" :disabled="!finishedTasks.length">清理</el-button>
          </div>
        </div>

        <div class="task-list" v-if="tasks.length">
          <article v-for="task in tasks" :key="task.id" class="task-card" :class="`task-${task.status}`">
            <div class="task-media" v-if="task.url">
              <img :src="task.url" :alt="task.label" @click="previewImage(task)" />
            </div>
            <div v-else class="task-placeholder">
              <el-icon v-if="task.status === 'running'" class="spinning"><Timer /></el-icon>
              <el-icon v-else-if="task.status === 'error'"><Warning /></el-icon>
              <el-icon v-else><Picture /></el-icon>
            </div>

            <div class="task-content">
              <div class="task-title">
                <span>{{ task.label }}</span>
                <el-tag :type="statusMeta(task.status).type" size="small" effect="plain">
                  {{ statusMeta(task.status).label }}
                </el-tag>
              </div>
              <p v-if="task.error" class="task-error">{{ task.error }}</p>
              <p v-else class="task-detail">{{ task.mode }} / {{ task.size || currentPixelSize }}</p>
              <div class="task-foot">
                <span>{{ formatTime(task.elapsed) }}</span>
                <div>
                  <el-button v-if="task.status === 'error'" :icon="RefreshRight" size="small" text @click="retryTask(task)">重试</el-button>
                  <el-button v-if="canAdopt(task)" :icon="Check" size="small" text type="success" @click="adoptTask(task)">应用</el-button>
                  <el-button v-if="task.url" :icon="Download" size="small" text @click="downloadImage(task)" />
                  <el-button :icon="Close" size="small" text @click="removeTask(task.id)" />
                </div>
              </div>
            </div>
          </article>
        </div>

        <div v-else class="empty-state">
          <el-icon><Picture /></el-icon>
          <span>还没有任务</span>
        </div>
      </aside>
    </main>

    <el-dialog v-model="previewVisible" title="预览" width="680px" :close-on-click-modal="true">
      <img v-if="previewUrl" :src="previewUrl" class="preview-image" alt="图片预览" />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onMounted, onUnmounted, reactive, ref, resolveComponent } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  Check,
  Close,
  Delete,
  Download,
  MagicStick,
  Picture,
  Refresh,
  RefreshRight,
  Timer,
  Upload,
  Warning,
} from '@element-plus/icons-vue';
import request from '@/api/request';

type Mode = '文生图' | '图生图' | '批量任务' | '整套图';
type BatchMode = 'cover' | 'step';
type TaskStatus = 'pending' | 'running' | 'done' | 'error' | 'applied';

interface RecipeStep {
  order?: number;
  content?: string;
  description?: string;
  image?: string;
  imageUrl?: string;
}

interface Recipe {
  id: number;
  title: string;
  category?: string;
  coverImage?: string;
  ingredients?: Array<{ name?: string } | string>;
  steps?: Array<RecipeStep | string>;
}

interface TemplateItem {
  id: number;
  name: string;
  template: string;
  size?: string;
}

interface ImageTask {
  id: number;
  batchId?: string;
  mode: Mode;
  label: string;
  prompt: string;
  size: string;
  templateId: number | string;
  aiKeyId: number;
  targetType: string;
  targetId: number;
  targetStepIndex: number;
  recipeTitle: string;
  refImage?: string;
  status: TaskStatus;
  url?: string;
  error?: string;
  elapsed: number;
  startTime: number;
  createdAt: number;
  retryCount: number;
}

const PromptEditor = defineComponent({
  name: 'PromptEditor',
  props: {
    templateId: { type: [Number, String], required: true },
    templates: { type: Array as () => TemplateItem[], required: true },
    prompt: { type: String, required: true },
    autoContext: { type: String, default: '' },
  },
  emits: ['update:template-id', 'update:prompt', 'select-template', 'save-template'],
  setup(props, { emit }) {
    const ElButton = resolveComponent('ElButton');
    const ElInput = resolveComponent('ElInput');
    const ElOption = resolveComponent('ElOption');
    const ElSelect = resolveComponent('ElSelect');

    return () => h('section', { class: 'panel-section' }, [
      h('div', { class: 'section-title row-title' }, [
        h('span', '提示词'),
        props.autoContext ? h('small', '已自动注入菜品上下文') : null,
      ]),
      props.autoContext ? h('div', { class: 'auto-context' }, props.autoContext) : null,
      h('div', { class: 'template-row' }, [
        h(
          ElSelect,
          {
            modelValue: props.templateId,
            size: 'small',
            clearable: true,
            placeholder: '选择模板',
            'onUpdate:modelValue': (value: number | string) => emit('update:template-id', value || 0),
            onChange: () => emit('select-template'),
          },
          () => [
            h(ElOption, { label: '自由创作', value: 0 }),
            ...props.templates.map((item) => h(ElOption, { key: item.id, label: item.name, value: item.id })),
          ],
        ),
        props.prompt.trim() && !props.templateId
          ? h(ElButton, { size: 'small', text: true, type: 'primary', onClick: () => emit('save-template') }, () => '保存模板')
          : null,
      ]),
      h(ElInput, {
        modelValue: props.prompt,
        type: 'textarea',
        rows: 5,
        placeholder: props.autoContext
          ? '补充视觉风格、摆盘、光线等描述，菜品信息已自动填入。'
          : '描述你想生成的图片。',
        'onUpdate:modelValue': (value: string) => emit('update:prompt', value),
      }),
    ]);
  },
});

const tab = ref<Mode>('文生图');
const tabs: Mode[] = ['文生图', '图生图', '批量任务', '整套图'];

const models = ref<any[]>([]);
const tpls = ref<TemplateItem[]>([]);
const allRecipes = ref<Recipe[]>([]);

const gen = reactive({
  keyId: 0,
  tid: 0 as number | string,
  prompt: '',
  count: 1,
  sizeK: '1K',
  ratio: '1:1',
  bg: 'opaque',
  format: 'PNG',
});

const SIZE_MAP: Record<string, Record<string, string>> = {
  '1K': { '1:1': '1024x1024', '16:9': '1024x576', '9:16': '576x1024' },
  '2K': { '1:1': '2048x2048', '16:9': '2048x1152', '9:16': '1152x2048' },
  '4K': { '1:1': '3840x3840', '16:9': '3840x2160', '9:16': '2160x3840' },
};

const currentPixelSize = computed(() => SIZE_MAP[gen.sizeK]?.[gen.ratio] || '1024x1024');
const sizeGrid = computed(() => Object.entries(SIZE_MAP).flatMap(([k, ratios]) =>
  Object.entries(ratios).map(([r, px]) => ({ k, r, px })),
));

const targetType = ref('');
const targetId = ref<number | undefined>();
const targetStepIndex = ref(0);
const refImage = ref('');

const batchMode = ref<BatchMode>('cover');
const missingCovers = ref<Recipe[]>([]);
const missingSteps = ref<Array<Recipe & { missingStepCount: number }>>([]);
const batchTargets = ref<number[]>([]);
const batchStepRecipeId = ref<number | undefined>();
const batchStepTargets = ref<number[]>([]);

const setRecipeId = ref<number | undefined>();
const setPrompt = ref('');
const setTplId = ref<number>(0);
const setTplName = ref('');
const setOverwrite = ref(true);
const setGenerating = ref(false);

const HISTORY_KEY = 'airecipe_img_tasks_v2';
const tasks = ref<ImageTask[]>(loadHistory());
const queueRunning = ref(false);
const previewVisible = ref(false);
const previewUrl = ref('');
let taskIdSeq = Date.now();
let elapsedTimer: number | undefined;

const selectedRecipe = computed(() => allRecipes.value.find((recipe) => recipe.id === targetId.value));
const setRecipe = computed(() => allRecipes.value.find((recipe) => recipe.id === setRecipeId.value));
const targetRecipeSteps = computed(() => selectedRecipe.value?.steps || []);
const recipeIngNames = computed(() => getIngredientNames(selectedRecipe.value).slice(0, 4).join('、'));

const batchStepOptions = computed(() => {
  const recipe = allRecipes.value.find((item) => item.id === batchStepRecipeId.value);
  return (recipe?.steps || []).map((step, index) => ({
    index,
    desc: getStepContent(step, index),
    hasImage: hasStepImage(step),
  }));
});

const recipesNeedingImages = computed(() => allRecipes.value.filter((recipe) => {
  const steps = recipe.steps || [];
  const hasCover = hasCoverImage(recipe);
  const allStepsHaveImages = steps.length > 0 && steps.every(hasStepImage);
  return !hasCover || !allStepsHaveImages;
}));

const autoCtx = computed(() => {
  const recipe = selectedRecipe.value;
  if (!recipe) return '';
  if (targetType.value === 'recipe-cover') {
    const ingredients = getIngredientNames(recipe).slice(0, 5).join(', ');
    return `food photo of ${recipe.title}${ingredients ? `, with ${ingredients}` : ''}`;
  }
  if (targetType.value === 'recipe-step') {
    const step = recipe.steps?.[targetStepIndex.value];
    return step ? `cooking process photo of ${recipe.title}, ${getStepContent(step, targetStepIndex.value)}` : '';
  }
  return '';
});

const modeDescription = computed(() => ({
  文生图: '适合单张封面、步骤图、Banner 和自由创作。',
  图生图: '参考图会转为 data URL 发送，避免 blob 地址在后端失效。',
  批量任务: '批量会拆成多个单图任务，队列逐张执行，失败可重试。',
  整套图: '封面和每个步骤按流式进度返回，适合保持一套图的统一风格。',
}[tab.value]));

const pendingCount = computed(() => tasks.value.filter((task) => task.status === 'pending').length);
const runningCount = computed(() => tasks.value.filter((task) => task.status === 'running').length);
const doneCount = computed(() => tasks.value.filter((task) => task.status === 'done' || task.status === 'applied').length);
const finishedTasks = computed(() => tasks.value.filter((task) => ['done', 'error', 'applied'].includes(task.status)));
const adoptableTasks = computed(() => tasks.value.filter(canAdopt));

function setSize(k: string, r: string) {
  gen.sizeK = k;
  gen.ratio = r;
}

function onTabChange(next: Mode) {
  tab.value = next;
  if (next === '批量任务' || next === '整套图') loadRecipes();
  if (next === '图生图') refImage.value = '';
}

function onTargetTypeChange() {
  targetId.value = undefined;
  targetStepIndex.value = 0;
}

function onRecipeChange() {
  targetStepIndex.value = 0;
}

function resetBatchSelection() {
  batchTargets.value = [];
  batchStepTargets.value = [];
  batchStepRecipeId.value = undefined;
}

function toggleBatch(id: number) {
  const index = batchTargets.value.indexOf(id);
  if (index >= 0) batchTargets.value.splice(index, 1);
  else batchTargets.value.push(id);
}

function toggleStepTarget(index: number) {
  const found = batchStepTargets.value.indexOf(index);
  if (found >= 0) batchStepTargets.value.splice(found, 1);
  else batchStepTargets.value.push(index);
}

function selectMissingSteps() {
  batchStepTargets.value = batchStepOptions.value.filter((item) => !item.hasImage).map((item) => item.index);
}

function onTplSelect() {
  const template = tpls.value.find((item) => item.id === Number(gen.tid));
  if (template) gen.prompt = template.template || '';
}

function onSetTplSelect() {
  const template = tpls.value.find((item) => item.id === Number(setTplId.value));
  setPrompt.value = template?.template || '';
}

function onRefUpload(file: any) {
  const raw = file?.raw;
  if (!raw) return;
  const reader = new FileReader();
  reader.onload = () => {
    refImage.value = String(reader.result || '');
  };
  reader.onerror = () => ElMessage.error('读取参考图失败');
  reader.readAsDataURL(raw);
}

async function saveTemplate() {
  if (!gen.prompt.trim()) return;
  try {
    const { value } = await ElMessageBox.prompt('请输入模板名称', '保存提示词模板', {
      confirmButtonText: '保存',
      cancelButtonText: '取消',
      inputPattern: /\S+/,
      inputErrorMessage: '请输入模板名称',
    });
    await request.post('/ai/templates', {
      name: String(value).trim(),
      template: gen.prompt.trim(),
      scene: targetType.value || 'image',
      size: currentPixelSize.value,
    });
    ElMessage.success('模板已保存');
    await loadTpls();
  } catch (error: any) {
    if (error === 'cancel' || error === 'close') return;
    ElMessage.error(error?.message || '保存模板失败');
  }
}

async function saveSetTemplate() {
  if (!setTplName.value.trim() || !setPrompt.value.trim()) {
    ElMessage.warning('请输入模板名称和提示词');
    return;
  }
  try {
    await request.post('/ai/templates', {
      name: setTplName.value.trim(),
      template: setPrompt.value.trim(),
      scene: 'set',
      size: currentPixelSize.value,
    });
    ElMessage.success('模板已保存');
    setTplName.value = '';
    await loadTpls();
  } catch (error: any) {
    ElMessage.error(error?.message || '保存模板失败');
  }
}

async function doGenerate() {
  if (!gen.keyId) {
    ElMessage.warning('请选择模型');
    return;
  }

  const drafts = buildTasksForCurrentMode();
  if (!drafts.length) return;

  tasks.value = [...drafts, ...tasks.value].slice(0, 80);
  saveHistory();
  ElMessage.success(`已加入 ${drafts.length} 个任务`);
  void processQueue();
}

function buildTasksForCurrentMode(): ImageTask[] {
  if (tab.value === '图生图') {
    if (!refImage.value) {
      ElMessage.warning('请上传参考图');
      return [];
    }
    return Array.from({ length: gen.count }, (_, index) => createImageTask({
      mode: '图生图',
      label: gen.count > 1 ? `参考图变化 ${index + 1}` : '参考图变化',
      prompt: gen.prompt.trim() || '保持主体，提升为高质量美食摄影',
      targetType: '',
      targetId: 0,
      targetStepIndex: 0,
      recipeTitle: '参考图变化',
      refImage: refImage.value,
    }));
  }

  if (tab.value === '批量任务') {
    if (batchMode.value === 'cover') {
      if (!batchTargets.value.length) {
        ElMessage.warning('请选择菜谱');
        return [];
      }
      return batchTargets.value.slice(0, 20).map((id) => {
        const recipe = allRecipes.value.find((item) => item.id === id);
        return createRecipeCoverTask(recipe);
      }).filter(Boolean) as ImageTask[];
    }

    const recipe = allRecipes.value.find((item) => item.id === batchStepRecipeId.value);
    if (!recipe || !batchStepTargets.value.length) {
      ElMessage.warning('请选择菜谱和步骤');
      return [];
    }
    return batchStepTargets.value.slice(0, 20).map((stepIndex) => createRecipeStepTask(recipe, stepIndex));
  }

  const hasPrompt = gen.prompt.trim() || autoCtx.value;
  if (!hasPrompt) {
    ElMessage.warning('请输入提示词或选择菜谱作为目标');
    return [];
  }

  return Array.from({ length: gen.count }, (_, index) => {
    const recipe = selectedRecipe.value;
    const label = recipe
      ? targetType.value === 'recipe-step'
        ? `${recipe.title} / 步骤 ${targetStepIndex.value + 1}`
        : recipe.title
      : gen.count > 1 ? `自由创作 ${index + 1}` : '自由创作';
    const prompt = joinPrompt(autoCtx.value, gen.prompt.trim()) || 'delicious food photo';
    return createImageTask({
      mode: '文生图',
      label,
      prompt,
      targetType: targetType.value,
      targetId: recipe?.id || 0,
      targetStepIndex: targetType.value === 'recipe-step' ? targetStepIndex.value : 0,
      recipeTitle: recipe?.title || label,
    });
  });
}

function createRecipeCoverTask(recipe?: Recipe): ImageTask | null {
  if (!recipe) return null;
  const ctx = `food photo of ${recipe.title}${getIngredientNames(recipe).length ? `, with ${getIngredientNames(recipe).slice(0, 5).join(', ')}` : ''}`;
  return createImageTask({
    mode: '批量任务',
    label: `${recipe.title} / 封面`,
    prompt: joinPrompt(ctx, gen.prompt.trim()) || ctx,
    targetType: 'recipe-cover',
    targetId: recipe.id,
    targetStepIndex: 0,
    recipeTitle: recipe.title,
  });
}

function createRecipeStepTask(recipe: Recipe, stepIndex: number): ImageTask {
  const step = recipe.steps?.[stepIndex];
  const ctx = `cooking process photo of ${recipe.title}, ${step ? getStepContent(step, stepIndex) : `步骤 ${stepIndex + 1}`}`;
  return createImageTask({
    mode: '批量任务',
    label: `${recipe.title} / 步骤 ${stepIndex + 1}`,
    prompt: joinPrompt(ctx, gen.prompt.trim()) || ctx,
    targetType: 'recipe-step',
    targetId: recipe.id,
    targetStepIndex: stepIndex,
    recipeTitle: recipe.title,
  });
}

function createImageTask(input: Partial<ImageTask> & Pick<ImageTask, 'mode' | 'label' | 'prompt' | 'targetType' | 'targetId' | 'targetStepIndex' | 'recipeTitle'>): ImageTask {
  const now = Date.now();
  return {
    id: nextTaskId(),
    status: 'pending',
    elapsed: 0,
    startTime: 0,
    createdAt: now,
    retryCount: 0,
    size: currentPixelSize.value,
    templateId: gen.tid || 0,
    aiKeyId: gen.keyId,
    ...input,
  };
}

async function processQueue() {
  if (queueRunning.value) return;
  queueRunning.value = true;
  try {
    while (true) {
      const task = tasks.value
        .filter((item) => item.status === 'pending')
        .sort((a, b) => a.createdAt - b.createdAt)[0];
      if (!task) break;
      await runImageTask(task);
    }
  } finally {
    queueRunning.value = false;
    saveHistory();
  }
}

async function runImageTask(task: ImageTask) {
  task.status = 'running';
  task.error = '';
  task.startTime = Date.now();
  task.elapsed = 0;

  try {
    const response: any = await request.post('/ai/generate-image', {
      templateId: task.templateId || 0,
      prompt: task.prompt,
      dishName: task.recipeTitle || '',
      ingredients: getRecipeIngredients(task.targetId),
      stepDescription: task.targetType === 'recipe-step' ? getRecipeStepDescription(task.targetId, task.targetStepIndex) : '',
      size: task.size,
      aiKeyId: task.aiKeyId,
      refImage: task.refImage,
      outputFormat: gen.format,
      background: gen.bg,
    });

    task.elapsed = Date.now() - task.startTime;
    const url = response?.data?.url;
    if (!url) throw new Error(response?.message || 'AI 未返回图片');
    task.status = 'done';
    task.url = url;
  } catch (error: any) {
    task.elapsed = Date.now() - task.startTime;
    task.status = 'error';
    task.error = formatError(error);
  } finally {
    saveHistory();
  }
}

async function retryTask(task: ImageTask) {
  if (task.targetType === 'recipe-set-cover' || task.targetType === 'recipe-set-step') {
    await retrySetImageTask(task);
    return;
  }

  task.retryCount += 1;
  task.status = 'pending';
  task.error = '';
  task.elapsed = 0;
  task.createdAt = Date.now();
  saveHistory();
  await processQueue();
}

async function retrySetImageTask(task: ImageTask) {
  task.retryCount += 1;
  task.status = 'running';
  task.error = '';
  task.startTime = Date.now();
  task.elapsed = 0;
  try {
    const response: any = await request.post('/ai/retry-set-image', {
      recipeId: task.targetId,
      stepIndex: task.targetStepIndex,
      templateId: task.templateId || 0,
      styleNotes: task.prompt || setPrompt.value.trim() || undefined,
      aiKeyId: task.aiKeyId || gen.keyId,
    });
    const result = response?.data;
    if (!result?.success || !result?.cosUrl) {
      throw new Error(result?.error || '重试失败');
    }
    task.status = 'done';
    task.url = result.cosUrl;
    task.elapsed = Date.now() - task.startTime;
    saveHistory();
  } catch (error: any) {
    task.status = 'error';
    task.error = formatError(error);
    task.elapsed = Date.now() - task.startTime;
    saveHistory();
  }
}

async function doGenerateSet() {
  if (!gen.keyId) {
    ElMessage.warning('请选择模型');
    return;
  }
  const recipe = setRecipe.value;
  if (!recipe) {
    ElMessage.warning('请先选择菜谱');
    return;
  }

  const batchId = `set-${Date.now()}`;
  const setTasks = createSetTasks(recipe, batchId);
  if (!setTasks.length) {
    ElMessage.info('这道菜没有需要补的图片');
    return;
  }
  tasks.value = [...setTasks, ...tasks.value].slice(0, 80);
  setGenerating.value = true;
  saveHistory();

  try {
    const response = await fetch(apiUrl('/ai/recipe-image-set-stream'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
      },
      body: JSON.stringify({
        recipeId: recipe.id,
        templateId: setTplId.value || 0,
        overwrite: setOverwrite.value,
        styleNotes: setPrompt.value.trim() || undefined,
        aiKeyId: gen.keyId,
      }),
    });

    if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`);
    await readSetStream(response, batchId);
    ElMessage.success('整套图生成完成');
    await loadRecipes();
  } catch (error: any) {
    tasks.value
      .filter((task) => task.batchId === batchId && ['pending', 'running'].includes(task.status))
      .forEach((task) => {
        task.status = 'error';
        task.error = formatError(error);
      });
    ElMessage.error(error?.message || '整套图生成失败');
  } finally {
    setGenerating.value = false;
    saveHistory();
  }
}

function createSetTasks(recipe: Recipe, batchId: string): ImageTask[] {
  const now = Date.now();
  const base: Omit<ImageTask, 'id' | 'label' | 'targetType' | 'targetStepIndex' | 'prompt'> = {
    batchId,
    mode: '整套图',
    size: currentPixelSize.value,
    templateId: setTplId.value || 0,
    aiKeyId: gen.keyId,
    targetId: recipe.id,
    recipeTitle: recipe.title,
    status: 'pending',
    elapsed: 0,
    startTime: 0,
    createdAt: now,
    retryCount: 0,
  };

  const result: ImageTask[] = [];
  if (setOverwrite.value || !hasCoverImage(recipe)) {
    result.push({
      ...base,
      id: nextTaskId(),
      label: `${recipe.title} / 封面`,
      prompt: setPrompt.value,
      targetType: 'recipe-set-cover',
      targetStepIndex: -1,
    });
  }

  (recipe.steps || []).forEach((step, index) => {
    if (!setOverwrite.value && hasStepImage(step)) return;
    result.push({
      ...base,
      id: nextTaskId(),
      label: `${recipe.title} / 步骤 ${index + 1}`,
      prompt: setPrompt.value,
      targetType: 'recipe-set-step',
      targetStepIndex: index,
    });
  });
  return result;
}

async function readSetStream(response: Response, batchId: string) {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      try {
        const event = JSON.parse(line.slice(6));
        handleSetEvent(event, batchId);
      } catch {
        // Ignore malformed heartbeat or partial event lines.
      }
    }
  }
}

function handleSetEvent(event: any, batchId: string) {
  if (event.type === 'done') return;
  if (event.type === 'error') {
    ElMessage.error(event.error || '整套图生成失败');
    return;
  }
  const task = tasks.value.find((item) => item.batchId === batchId && item.targetStepIndex === Number(event.stepIndex));
  if (!task) return;

  if (event.type === 'start') {
    task.status = 'running';
    task.startTime = Date.now();
    task.elapsed = 0;
    if (event.label) task.label = event.label;
  } else if (event.type === 'retry') {
    task.retryCount = Number(event.attempt || task.retryCount + 1);
    task.status = 'running';
  } else if (event.type === 'result') {
    task.elapsed = Date.now() - task.startTime;
    task.status = event.success ? 'done' : 'error';
    task.url = event.imageUrl || '';
    task.error = event.error || '';
    if (event.label) task.label = event.label;
  }
  saveHistory();
}

async function adoptTask(task: ImageTask) {
  if (task.targetType === 'recipe-set-cover' || task.targetType === 'recipe-set-step') {
    await adoptSet(task);
  } else {
    await adoptResult(task);
  }
}

async function adoptResult(task: ImageTask) {
  if (!task.url) return;
  try {
    const response: any = await request.post('/ai/adopt-image', {
      sourceUrl: task.url,
      targetType: task.targetType,
      recipeId: task.targetId,
      recipeTitle: task.recipeTitle,
      stepIndex: task.targetStepIndex,
    });
    task.url = response?.data?.url || task.url;
    task.status = 'applied';
    saveHistory();
    ElMessage.success('图片已应用');
    if (task.targetType === 'recipe-cover' || task.targetType === 'recipe-step') await loadRecipes();
  } catch (error: any) {
    ElMessage.error(error?.message || '应用失败');
  }
}

async function adoptSet(task: ImageTask) {
  const batchId = task.batchId;
  const sameBatch = tasks.value.filter((item) => item.batchId === batchId && item.status === 'done' && item.url);
  if (!sameBatch.length) {
    ElMessage.warning('没有可应用的整套图');
    return;
  }
  const recipeId = sameBatch[0].targetId;
  try {
    await request.post('/ai/adopt-image-set', {
      recipeId,
      coverUrl: sameBatch.find((item) => item.targetStepIndex === -1)?.url || '',
      stepImages: sameBatch
        .filter((item) => item.targetStepIndex >= 0)
        .map((item) => ({ stepIndex: item.targetStepIndex, imageUrl: item.url })),
    });
    sameBatch.forEach((item) => { item.status = 'applied'; });
    saveHistory();
    ElMessage.success('整套图已应用');
    await loadRecipes();
  } catch (error: any) {
    ElMessage.error(error?.message || '应用整套图失败');
  }
}

async function batchAdopt() {
  const queue = [...adoptableTasks.value];
  for (const task of queue) {
    await adoptTask(task);
  }
}

function canAdopt(task: ImageTask) {
  return task.status === 'done' && !!task.url && ['recipe-cover', 'recipe-step', 'recipe-set-cover', 'recipe-set-step'].includes(task.targetType);
}

function clearFinished() {
  tasks.value = tasks.value.filter((task) => !['done', 'error', 'applied'].includes(task.status));
  saveHistory();
}

function removeTask(id: number) {
  tasks.value = tasks.value.filter((task) => task.id !== id);
  saveHistory();
}

function previewImage(task: ImageTask) {
  if (!task.url) return;
  previewUrl.value = task.url;
  previewVisible.value = true;
}

function downloadImage(task: ImageTask) {
  if (!task.url) return;
  const link = document.createElement('a');
  link.href = task.url;
  link.download = `${task.label}.png`;
  link.target = '_blank';
  link.click();
}

async function loadModels() {
  try {
    const response: any = await request.get('/ai-keys');
    models.value = (response.data || []).filter((item: any) =>
      item.keyType === 'image' || item.keyType === 'multimodal',
    );
    if (models.value.length && !gen.keyId) gen.keyId = models.value[0].id;
  } catch (error: any) {
    ElMessage.warning(error?.message || '加载模型失败');
  }
}

async function loadTpls() {
  try {
    const response: any = await request.get('/ai/templates');
    tpls.value = response.data || [];
  } catch {
    ElMessage.warning('加载模板失败');
  }
}

async function loadRecipes() {
  try {
    const response: any = await request.get('/recipes', { params: { page: 1, pageSize: 500 } });
    const list: Recipe[] = response.data?.list || [];
    allRecipes.value = list;
    missingCovers.value = list.filter((recipe) => !hasCoverImage(recipe));
    missingSteps.value = list
      .map((recipe) => {
        const missingStepCount = (recipe.steps || []).filter((step) => !hasStepImage(step)).length;
        return missingStepCount ? { ...recipe, missingStepCount } : null;
      })
      .filter(Boolean) as Array<Recipe & { missingStepCount: number }>;
  } catch {
    // Keep old recipe list when refresh fails.
  }
}

function loadHistory(): ImageTask[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ImageTask[];
    return parsed.slice(0, 50).map((task) => ({
      ...task,
      status: task.status === 'running' || task.status === 'pending' ? 'error' : task.status,
      error: task.status === 'running' || task.status === 'pending' ? '页面刷新后任务已中断，请重试' : task.error,
      elapsed: task.elapsed || 0,
    }));
  } catch {
    return [];
  }
}

function saveHistory() {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(tasks.value.slice(0, 50)));
  } catch {
    // localStorage quota errors should not block generation.
  }
}

function nextTaskId() {
  taskIdSeq += 1;
  return taskIdSeq;
}

function getIngredientNames(recipe?: Recipe) {
  return (recipe?.ingredients || [])
    .map((item) => typeof item === 'string' ? item : item.name)
    .filter(Boolean) as string[];
}

function getRecipeIngredients(recipeId: number) {
  const recipe = allRecipes.value.find((item) => item.id === recipeId);
  return getIngredientNames(recipe).slice(0, 5).join('、');
}

function getRecipeStepDescription(recipeId: number, stepIndex: number) {
  const recipe = allRecipes.value.find((item) => item.id === recipeId);
  const step = recipe?.steps?.[stepIndex];
  return step ? getStepContent(step, stepIndex) : '';
}

function getStepContent(step: RecipeStep | string, index: number) {
  if (typeof step === 'string') return step;
  return step.content || step.description || `步骤 ${index + 1}`;
}

function hasCoverImage(recipe: Recipe) {
  return !!recipe.coverImage && !recipe.coverImage.includes('dummyimage');
}

function hasStepImage(step: RecipeStep | string) {
  return typeof step !== 'string' && !!(step.image || step.imageUrl);
}

function joinPrompt(context: string, prompt: string) {
  return [context, prompt].filter(Boolean).join(', ');
}

function truncate(value: string, max: number) {
  return value.length > max ? `${value.slice(0, max)}...` : value;
}

function formatTime(ms: number) {
  if (!ms) return '0秒';
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}秒`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}分${seconds % 60}秒`;
}

function formatError(error: any) {
  const message = error?.message || String(error || '生成失败');
  if (message.includes('timeout') || message.includes('超时') || message.includes('ECONNABORTED') || message.includes('abort')) {
    return '请求超时，图片可能仍在中转站处理中。请稍后重试，或换成更小尺寸。';
  }
  if (message.includes('401') || message.includes('认证')) return '认证过期，请刷新页面后重新登录';
  return message.length > 140 ? `${message.slice(0, 140)}...` : message;
}

function statusMeta(status: TaskStatus): { label: string; type: 'info' | 'warning' | 'success' | 'danger' } {
  if (status === 'pending') return { label: '排队中', type: 'info' };
  if (status === 'running') return { label: '生成中', type: 'warning' };
  if (status === 'done') return { label: '完成', type: 'success' };
  if (status === 'applied') return { label: '已应用', type: 'success' };
  return { label: '失败', type: 'danger' };
}

function apiUrl(path: string) {
  const base = import.meta.env.VITE_API_BASE_URL || '/v1';
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (/^https?:\/\//i.test(base)) return `${base.replace(/\/$/, '')}${cleanPath}`;
  return `${base.replace(/\/$/, '')}${cleanPath}`;
}

onMounted(() => {
  void loadModels();
  void loadTpls();
  void loadRecipes();
  elapsedTimer = window.setInterval(() => {
    tasks.value.forEach((task) => {
      if (task.status === 'running' && task.startTime) task.elapsed = Date.now() - task.startTime;
    });
  }, 500);
});

onUnmounted(() => {
  if (elapsedTimer) window.clearInterval(elapsedTimer);
});
</script>

<style scoped lang="scss">
.image-workbench {
  min-height: calc(100vh - 64px);
  background: #f6f8fb;
  color: #1f2937;
  display: flex;
  flex-direction: column;
}

.workbench-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 18px 24px 14px;
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;

  h2 {
    margin: 0;
    font-size: 20px;
    line-height: 1.3;
  }

  p {
    margin: 4px 0 0;
    color: #6b7280;
    font-size: 13px;
  }
}

.model-bar {
  display: flex;
  align-items: center;
  gap: 10px;
}

.model-select {
  width: 260px;
}

.setup-tip {
  margin: 12px 24px 0;
  padding: 10px 12px;
  border: 1px solid #f4c56f;
  background: #fff8e6;
  color: #8a5a00;
  border-radius: 6px;
  font-size: 13px;
}

.mode-tabs {
  display: flex;
  gap: 6px;
  padding: 12px 24px;
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;

  button {
    border: 1px solid #d1d5db;
    background: #ffffff;
    color: #4b5563;
    border-radius: 6px;
    padding: 8px 14px;
    cursor: pointer;
    transition: 0.16s ease;

    &.active,
    &:hover {
      border-color: #0f766e;
      color: #0f766e;
      background: #ecfdf5;
    }
  }
}

.workbench-grid {
  display: grid;
  grid-template-columns: 248px minmax(440px, 1fr) 360px;
  gap: 16px;
  padding: 16px 24px 24px;
  min-height: 0;
  flex: 1;
}

.settings-panel,
.creator-panel,
.queue-panel {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  min-width: 0;
}

.settings-panel,
.queue-panel {
  align-self: start;
  max-height: calc(100vh - 180px);
  overflow: auto;
}

.creator-panel {
  padding: 18px;
}

.settings-panel {
  padding: 14px;
}

.queue-panel {
  padding: 14px;
}

.panel-heading,
.queue-heading {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 14px;

  h3 {
    margin: 0;
    font-size: 17px;
  }

  p {
    margin: 4px 0 0;
    color: #6b7280;
    font-size: 12px;
  }
}

.queue-actions {
  display: flex;
  gap: 2px;
  flex-shrink: 0;
}

.panel-section {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
  background: #ffffff;
}

.section-title {
  font-size: 13px;
  font-weight: 700;
  color: #374151;
  margin-bottom: 10px;
}

.row-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;

  small {
    color: #0f766e;
    font-weight: 500;
  }
}

.size-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;

  button {
    height: 72px;
    border: 1px solid #d1d5db;
    background: #ffffff;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 2px;

    strong {
      color: #0f766e;
      font-size: 14px;
    }

    span,
    small {
      color: #6b7280;
      font-size: 10px;
      white-space: nowrap;
    }

    &.active {
      border-color: #0f766e;
      background: #ecfdf5;
    }
  }
}

.queue-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;

  div {
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    padding: 8px;
    text-align: center;
  }

  span {
    display: block;
    color: #6b7280;
    font-size: 11px;
  }

  strong {
    font-size: 18px;
    color: #111827;
  }
}

.full {
  width: 100%;
}

.stacked {
  margin-top: 10px;
}

.recipe-context,
.auto-context {
  margin-top: 10px;
  padding: 9px 10px;
  background: #f0fdfa;
  border: 1px solid #ccfbf1;
  border-radius: 6px;
  color: #0f766e;
  font-size: 12px;
}

.recipe-context {
  display: flex;
  flex-direction: column;
  gap: 3px;

  span {
    color: #64748b;
  }
}

.step-list,
.batch-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 10px;
  max-height: 260px;
  overflow: auto;

  button {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    border: 1px solid #e5e7eb;
    background: #ffffff;
    border-radius: 6px;
    padding: 8px 10px;
    cursor: pointer;
    text-align: left;
    color: #374151;

    b {
      color: #0f766e;
    }

    small {
      color: #9ca3af;
      flex-shrink: 0;
    }

    &.active {
      border-color: #0f766e;
      background: #ecfdf5;
    }

    &.muted {
      opacity: 0.68;
    }
  }
}

.step-list button {
  justify-content: flex-start;
}

.template-row,
.template-save,
.batch-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.template-row .el-select {
  flex: 1;
}

.template-save .el-input {
  flex: 1;
}

.batch-toolbar {
  color: #6b7280;
  font-size: 12px;
}

.reference-preview {
  display: block;
  width: 100%;
  max-height: 300px;
  object-fit: contain;
  margin-top: 12px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
}

.set-preview {
  margin-top: 12px;
  display: grid;
  gap: 6px;

  div {
    display: grid;
    grid-template-columns: 68px 44px minmax(0, 1fr);
    align-items: center;
    gap: 8px;
    padding: 7px 9px;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    font-size: 12px;
  }

  span {
    color: #0f766e;
  }

  small {
    color: #6b7280;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.task-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  background: #ffffff;

  &.task-running {
    border-color: #f59e0b;
  }

  &.task-error {
    border-color: #ef4444;
  }

  &.task-applied {
    border-color: #10b981;
  }
}

.task-media img {
  width: 100%;
  display: block;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  cursor: zoom-in;
}

.task-placeholder {
  height: 132px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f9fafb;
  color: #9ca3af;
  font-size: 28px;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.task-content {
  padding: 10px;
}

.task-title,
.task-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.task-title span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 700;
  font-size: 13px;
}

.task-detail,
.task-error {
  margin: 6px 0 0;
  font-size: 12px;
  line-height: 1.45;
}

.task-detail {
  color: #6b7280;
}

.task-error {
  color: #dc2626;
  word-break: break-word;
}

.task-foot {
  margin-top: 8px;

  > span {
    color: #9ca3af;
    font-size: 11px;
  }

  > div {
    display: flex;
    gap: 2px;
  }
}

.empty-state {
  min-height: 320px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #9ca3af;
  border: 1px dashed #d1d5db;
  border-radius: 8px;

  .el-icon {
    font-size: 32px;
  }
}

.preview-image {
  width: 100%;
  display: block;
  border-radius: 8px;
}

@media (max-width: 1280px) {
  .workbench-grid {
    grid-template-columns: 220px minmax(380px, 1fr) 320px;
  }
}

@media (max-width: 980px) {
  .workbench-header,
  .model-bar,
  .template-row,
  .batch-toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .model-select {
    width: 100%;
  }

  .workbench-grid {
    grid-template-columns: 1fr;
  }

  .settings-panel,
  .queue-panel {
    max-height: none;
  }
}
</style>
