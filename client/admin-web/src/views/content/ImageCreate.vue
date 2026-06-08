<template>
  <div class="ig-root">
    <!-- 顶部 Bar -->
    <div class="ig-top">
      <div class="ig-top-l">
        <el-button size="small" text @click="loadModels">刷新模型</el-button>
        <el-select v-model="gen.keyId" size="small" style="width:200px" placeholder="选择模型">
          <el-option v-for="m in models" :key="m.id" :label="m.name + ' · ' + m.model" :value="m.id"/>
        </el-select>
        <span class="ig-tip" v-if="!models.length">提示：请先在「系统设置 → API Key 管理」创建并激活生图密钥</span>
      </div>
    </div>

    <!-- Tabs -->
    <div class="ig-tabs">
      <button v-for="t in tabs" :key="t" :class="{on:tab===t}" @click="onTabChange(t)">{{ t }}</button>
    </div>

    <!-- 主体三栏 -->
    <div class="ig-body">
      <!-- 左栏：参数 -->
      <div class="ig-left">
        <div class="ig-card"><div class="ig-card-hd">尺寸和质量</div>
          <div class="ig-9grid">
            <button v-for="o in sizeGrid" :key="o.k+o.r"
              :class="{on:gen.sizeK===o.k && gen.ratio===o.r}"
              @click="gen.sizeK=o.k; gen.ratio=o.r">
              <span class="ig9-k">{{ o.k }}</span>
              <span class="ig9-px">{{ o.px }}</span>
              <span class="ig9-r">{{ o.r }}</span>
            </button>
          </div>
        </div>
        <div class="ig-card"><div class="ig-card-hd">背景</div>
          <el-radio-group v-model="gen.bg" size="small">
            <el-radio value="opaque">不透明</el-radio><el-radio value="transparent">透明</el-radio>
          </el-radio-group>
        </div>
        <div class="ig-card"><div class="ig-card-hd">格式</div>
          <el-select v-model="gen.format" size="small" style="width:100%">
            <el-option value="PNG" label="PNG"/><el-option value="JPG" label="JPG"/><el-option value="WebP" label="WebP"/>
          </el-select>
        </div>
      </div>

      <!-- 中栏：Prompt + 生成 -->
      <div class="ig-mid">
        <template v-if="tab==='文生图' || tab==='批量任务'">
          <!-- 目标选择 -->
          <div class="ig-card" v-if="tab==='文生图'">
            <div class="ig-card-hd">生成目标</div>
            <el-select v-model="targetType" size="small" style="width:100%;margin-bottom:6px" placeholder="选择目标类型" @change="onTargetTypeChange">
              <el-option label="菜谱封面" value="recipe-cover"/>
              <el-option label="菜谱步骤图" value="recipe-step"/>
              <el-option label="轮播 Banner" value="banner"/>
              <el-option label="定制卡片" value="card"/>
              <el-option label="图标" value="icon"/>
              <el-option label="宣传图" value="promo"/>
              <el-option label="无特定目标" value=""/>
            </el-select>
            <template v-if="targetType==='recipe-cover'||targetType==='recipe-step'">
              <el-select v-model="targetId" filterable size="small" style="width:100%" placeholder="搜索菜谱..." @change="onRecipeChange">
                <el-option v-for="r in allRecipes" :key="r.id" :label="(r.coverImage ? '✅ ' : '⬜ ') + r.title" :value="r.id"/>
              </el-select>
              <div class="ig-recipe-info" v-if="selectedRecipe">
                <span class="ig-ri-name">{{ selectedRecipe.title }}</span>
                <span class="ig-ri-ing" v-if="recipeIngNames">{{ recipeIngNames }}</span>
              </div>
              <template v-if="targetType==='recipe-step'&&targetId">
                <div class="ig-step-pick">
                  <div v-for="(s,i) in targetRecipeSteps" :key="i" class="ig-step-it" :class="{on:targetStepIndex===i}" @click="targetStepIndex=i">
                    <span class="ig-step-n">{{ i+1 }}</span><span>{{ truncate(s.content||s.description||s,40) }}</span>
                  </div>
                </div>
              </template>
            </template>
          </div>

          <!-- 提示词：拆分上下文 + 视觉描述 -->
          <div class="ig-card">
            <div class="ig-card-hd">
              提示词
              <span v-if="autoCtx && tab==='文生图'" class="ig-ctx-tag">已自动填充菜品信息</span>
            </div>
            <div v-if="autoCtx && tab==='文生图'" class="ig-ctx-box">
              <span class="ig-ctx-label">自动上下文：</span>{{ autoCtx }}
            </div>
            <el-input v-model="gen.prompt" type="textarea" :rows="4" size="small"
              :placeholder="autoCtx && tab==='文生图' ? '补充视觉风格、摆盘、光线等描述（菜品信息已自动填入，无需重复）' : '描述你想生成的图片...'"/>
          </div>

          <div class="ig-row">
            <span class="ig-row-label">模板</span>
            <el-select v-model="gen.tid" size="small" style="width:200px" @change="onTplSelect">
              <el-option label="不使用模板（自由创作）" :value="0"/>
              <el-option v-for="t in tpls" :key="t.id" :label="t.name" :value="t.id"/>
            </el-select>
            <el-button v-if="!gen.tid && gen.prompt.trim()" size="small" text type="primary" @click="showSaveTpl=true" style="flex-shrink:0">💾 保存为模板</el-button>
            <span v-if="tab!=='批量任务'" class="ig-row-label">数量</span>
            <el-input-number v-if="tab!=='批量任务'" v-model="gen.count" size="small" :min="1" :max="4"/>
          </div>

          <!-- 保存模板弹窗 -->
          <div v-if="showSaveTpl" class="ig-save-tpl">
            <el-input v-model="tplName" size="small" placeholder="模板名称（如：中式俯拍暖光）" style="margin-bottom:6px"/>
            <div style="display:flex;gap:6px">
              <el-button size="small" type="primary" @click="saveTemplate">保存</el-button>
              <el-button size="small" @click="showSaveTpl=false;tplName=''">取消</el-button>
            </div>
          </div>
          <el-button type="primary" size="large" :loading="generating" @click="doGenerate" style="width:100%;margin-top:12px">
            {{ generating ? '生成中...' : tab==='批量任务' ? '开始批量生成' : '开始生成' }}
          </el-button>
        </template>

        <!-- 批量任务：选菜谱 -->
        <div class="ig-card" v-if="tab==='批量任务'" style="margin-top:12px">
          <div class="ig-card-hd" style="display:flex;align-items:center;justify-content:space-between">
            <span>批量生成</span>
            <el-select v-model="batchMode" size="small" style="width:140px" @change="batchTargets=[];batchStepTargets=[];batchStepRecipeId=0">
              <el-option :label="'缺封面（' + missingCovers.length + ' 道）'" value="cover"/>
              <el-option :label="'缺步骤图（' + missingSteps.length + ' 道）'" value="step"/>
            </el-select>
          </div>
          <!-- 封面模式 -->
          <template v-if="batchMode==='cover'">
            <div class="ig-batch-list">
              <div v-for="r in missingCovers" :key="r.id" class="ig-batch-item" :class="{on:batchTargets.includes(r.id)}" @click="toggleBatch(r.id)">
                <span>{{ r.title }}</span><span class="ig-batch-badge">缺封面</span>
              </div>
            </div>
            <div class="ig-batch-acts">
              <el-button size="small" @click="batchTargets=missingCovers.map((r:any)=>r.id)">全选</el-button>
              <el-button size="small" @click="batchTargets=[]">清空</el-button>
            </div>
          </template>
          <!-- 步骤图模式 -->
          <template v-else>
            <el-select v-model="batchStepRecipeId" filterable size="small" style="width:100%;margin-bottom:8px" placeholder="选择一道菜谱查看缺图的步骤..." @change="batchStepTargets=[]" clearable>
              <el-option v-for="r in missingSteps" :key="r.id" :label="r.title + ' · ' + r.missingStepCount + ' 步缺图'" :value="r.id"/>
            </el-select>
            <div class="ig-batch-list" v-if="batchStepRecipeId">
              <div v-for="s in batchStepOptions" :key="s.index" class="ig-batch-item" :class="{on:batchStepTargets.includes(s.index)}" @click="toggleStepTarget(s.index)">
                <span class="ig-step-n">{{ s.index+1 }}</span><span>{{ truncate(s.desc,30) }}</span>
                <span class="ig-batch-badge" v-if="!s.hasImage">缺图</span>
              </div>
            </div>
            <div class="ig-batch-acts" v-if="batchStepRecipeId">
              <el-button size="small" @click="batchStepTargets=batchStepOptions.filter(s=>!s.hasImage).map(s=>s.index)">全选缺图</el-button>
              <el-button size="small" @click="batchStepTargets=[]">清空</el-button>
            </div>
          </template>
        </div>

        <!-- 图生图 -->
        <template v-if="tab==='图生图'">
          <div class="ig-card"><div class="ig-card-hd">上传参考图</div>
            <el-upload action="#" :auto-upload="false" :show-file-list="true" accept="image/*" @change="onRefUpload" :limit="1">
              <el-button size="small">📁 选择图片</el-button>
            </el-upload>
            <img v-if="refImage" :src="refImage" class="ig-ref-img" />
          </div>
          <div class="ig-card"><div class="ig-card-hd">描述（选填）</div>
            <el-input v-model="gen.prompt" type="textarea" :rows="3" size="small" placeholder="补充描述..." />
          </div>
          <el-button type="primary" size="large" :loading="generating" @click="doGenerate" style="width:100%">开始生成</el-button>
        </template>
      </div>

      <!-- 右栏：任务面板 -->
      <div class="ig-right">
        <div class="ig-card" style="flex:1;display:flex;flex-direction:column;overflow:hidden">
          <div class="ig-card-hd" style="flex-shrink:0;display:flex;align-items:center;justify-content:space-between">
            <div class="ig-task-tabs">
              <button :class="{on:taskTab==='current'}" @click="taskTab='current'">生成中（{{ runningCount }}）</button>
              <button :class="{on:taskTab==='history'}" @click="taskTab='history'">历史记录（{{ historyTasks.length }}）</button>
            </div>
            <div style="display:flex;gap:4px;flex-shrink:0" v-if="taskTab==='history' && historyTasks.length">
              <el-button size="small" type="success" text @click="batchAdopt" :disabled="!historyTasks.some(t=>t.status==='done')">一键应用</el-button>
              <el-button size="small" text @click="clearHistory">清空</el-button>
            </div>
          </div>
          <!-- 当前任务 -->
          <div class="ig-task-list" v-if="taskTab==='current' && activeTasks.length">
            <div v-for="t in activeTasks" :key="t.id" class="ig-task" :class="'ig-task--'+t.status">
              <!-- 生成中 -->
              <template v-if="t.status==='running'">
                <div class="ig-task-body">
                  <el-icon class="is-loading ig-task-spin"><svg viewBox="0 0 1024 1024"><path d="M512 64a448 448 0 1 1 0 896 448 448 0 0 1 0-896z" fill="none" stroke="currentColor" stroke-width="64"/><path d="M512 64a448 448 0 0 1 384 704" fill="none" stroke="var(--el-color-primary)" stroke-width="64" stroke-linecap="round"/></svg></el-icon>
                  <div class="ig-task-info">
                    <span class="ig-task-target">{{ t.label }}</span>
                    <span class="ig-task-time">{{ formatTime(t.elapsed) }}</span>
                  </div>
                </div>
              </template>
              <!-- 成功（生成中 tab） -->
              <template v-else-if="t.status==='done'">
                <img v-if="t.url" :src="t.url" class="ig-task-img" @click="previewImage(t)" @error="(e:any) => e.target.style.display='none'" />
                <div class="ig-task-foot">
                  <span class="ig-task-time">{{ formatTime(t.elapsed) }}</span>
                  <div class="ig-task-acts">
                    <el-button size="small" type="success" @click="adoptResult(t)">应用</el-button>
                    <el-button size="small" @click="downloadImage(t)" class="ig-btn-icon" title="下载">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    </el-button>
                    <el-button size="small" @click="tasks.splice(tasks.indexOf(t),1)" class="ig-btn-icon" title="删除">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                    </el-button>
                  </div>
                </div>
              </template>
              <!-- 失败 -->
              <template v-else>
                <div class="ig-task-err">
                  <span class="ig-err-icon">!</span>
                  <div class="ig-task-info">
                    <span class="ig-task-target">{{ t.label }}</span>
                    <span class="ig-err-msg">{{ t.error }}</span>
                  </div>
                  <el-button size="small" text @click="tasks.splice(tasks.indexOf(t),1)">✕</el-button>
                </div>
              </template>
            </div>
          </div>
          <!-- 历史记录 -->
          <div class="ig-task-list" v-if="taskTab==='history'">
            <div v-if="!historyTasks.length" class="ig-empty" style="flex:0;padding:30px 0">暂无历史记录</div>
            <div v-for="t in historyTasks" :key="t.id" class="ig-task" :class="'ig-task--'+t.status">
              <template v-if="t.status==='done'||t.status==='applied'">
                <img v-if="t.url" :src="t.url" class="ig-task-img" @click="previewImage(t)" @error="(e:any) => e.target.style.display='none'" />
                <div class="ig-task-foot">
                  <span class="ig-task-time">{{ t.label }} · {{ formatTime(t.elapsed) }}</span>
                  <span v-if="t.status==='applied'" class="ig-applied-badge">已应用</span>
                </div>
                <div class="ig-task-acts" style="padding:0 6px 6px;justify-content:flex-end">
                  <el-button v-if="t.status==='done'" size="small" type="success" @click="adoptResult(t)">应用</el-button>
                  <el-button size="small" @click="downloadImage(t)" class="ig-btn-icon" title="下载">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  </el-button>
                  <el-button size="small" @click="removeHistory(t.id)" class="ig-btn-icon" title="删除">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                  </el-button>
                </div>
              </template>
              <template v-else>
                <div class="ig-task-err">
                  <span class="ig-err-icon">!</span>
                  <div class="ig-task-info">
                    <span class="ig-task-target">{{ t.label }}</span>
                    <span class="ig-err-msg">{{ t.error }}</span>
                  </div>
                  <el-button size="small" text @click="removeHistory(t.id)">✕</el-button>
                </div>
              </template>
            </div>
          </div>
          <div v-if="taskTab==='current' && !activeTasks.length" class="ig-empty">生成结果将在这里显示</div>
        </div>
      </div>
    </div>

    <!-- 预览大图 -->
    <el-dialog :model-value="!!previewUrl" @update:model-value="previewUrl=''" title="预览" width="600px" :close-on-click-modal="true">
      <img :src="previewUrl" style="width:100%;border-radius:8px" v-if="previewUrl" />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import request from '@/api/request';

const tab = ref('文生图');
const tabs = ['文生图', '图生图', '批量任务'];

// 模型
const models = ref<any[]>([]);
const gen = reactive({
  keyId: 0, tid: 0 as string | number, prompt: '', count: 1,
  sizeK: '1K', ratio: '1:1', bg: 'opaque', format: 'PNG',
});
const showSaveTpl = ref(false);
const tplName = ref('');
const SIZE_MAP: Record<string, Record<string, string>> = {
  '1K': { '1:1': '1024x1024', '16:9': '1024x576', '9:16': '576x1024' },
  '2K': { '1:1': '2048x2048', '16:9': '2048x1152', '9:16': '1152x2048' },
  '4K': { '1:1': '3840x3840', '16:9': '3840x2160', '9:16': '2160x3840' },
};
const currentPixelSize = computed(() => SIZE_MAP[gen.sizeK]?.[gen.ratio] || '1024x1024');
const sizeGrid = computed(() => {
  const items: { k: string; r: string; px: string }[] = [];
  for (const k of ['1K','2K','4K']) {
    for (const r of ['1:1','16:9','9:16']) {
      items.push({ k, r, px: SIZE_MAP[k]?.[r] || '' });
    }
  }
  return items;
});

// 模板
const tpls = ref<any[]>([]);
function onTplSelect() {
  if (!gen.tid || gen.tid === 0) return; // 自由创作，不清空 prompt
  const t = tpls.value.find(t => t.id == gen.tid);
  if (t) gen.prompt = t.template || '';
}
async function saveTemplate() {
  if (!tplName.value.trim() || !gen.prompt.trim()) {
    ElMessage.warning('请输入模板名称和提示词');
    return;
  }
  try {
    await request.post('/ai/templates', {
      name: tplName.value.trim(),
      template: gen.prompt.trim(),
      scene: targetType.value === 'recipe-cover' ? 'cover'
        : targetType.value === 'recipe-step' ? 'step'
        : targetType.value === 'banner' ? 'banner'
        : targetType.value === 'card' ? 'card'
        : targetType.value === 'icon' ? 'icon'
        : 'cover',
      size: currentPixelSize.value,
    });
    ElMessage.success('模板已保存');
    showSaveTpl.value = false;
    tplName.value = '';
    loadTpls();
  } catch (e: any) { ElMessage.error(e?.message || '保存失败'); }
}

// 目标选择
const targetType = ref('');
const targetId = ref(0);
const targetStepIndex = ref(0);
const allRecipes = ref<any[]>([]);

const selectedRecipe = computed(() => allRecipes.value.find(r => r.id === targetId.value));
const recipeIngNames = computed(() => {
  const r = selectedRecipe.value as any;
  const ings = r?.ingredients;
  if (!ings || !ings.length) return '';
  return (ings as any[]).slice(0, 4).map((i: any) => i.name).join('、');
});
const targetRecipeSteps = computed(() => {
  const r = selectedRecipe.value as any;
  return r?.steps || [];
});

// 自动生成的菜品上下文（拼在 prompt 前面发给 AI）
const autoCtx = computed(() => {
  if (!selectedRecipe.value) return '';
  const r = selectedRecipe.value as any;
  const parts: string[] = [];
  if (targetType.value === 'recipe-cover') {
    parts.push(`food photo of ${r.title || ''}`);
    if (recipeIngNames.value) parts.push(`with ${recipeIngNames.value}`);
  } else if (targetType.value === 'recipe-step') {
    const steps = r?.steps || [];
    const si = targetStepIndex.value;
    if (steps[si]) {
      const s = steps[si];
      const desc = typeof s === 'string' ? s : (s.content || s.description || '');
      parts.push(`cooking step: ${desc}`);
    }
  }
  return parts.join(', ');
});

function onTargetTypeChange() {
  targetId.value = 0;
  targetStepIndex.value = 0;
}
function onRecipeChange() {
  targetStepIndex.value = 0;
}
function truncate(s: string, n: number) { return (s || '').slice(0, n) + ((s || '').length > n ? '...' : ''); }

// 图生图
const refImage = ref('');
function onRefUpload(file: any) { const raw = file?.raw; if (raw) { const u = URL.createObjectURL(raw); refImage.value = u; } }

// 切换 tab 时清理状态
function onTabChange(t: string) {
  tab.value = t;
  if (t === '批量任务') loadRecipes();
  if (t === '图生图') { refImage.value = ''; }
}

// 批量
const batchMode = ref('cover');
const missingCovers = ref<any[]>([]);
const batchTargets = ref<number[]>([]);
function toggleBatch(id: number) { const i = batchTargets.value.indexOf(id); if (i>=0) batchTargets.value.splice(i,1); else batchTargets.value.push(id); }

// 批量步骤图
const batchStepRecipeId = ref(0);
const batchStepTargets = ref<number[]>([]);
const missingSteps = ref<any[]>([]);
const batchStepOptions = computed(() => {
  const r = allRecipes.value.find(r => r.id === batchStepRecipeId.value) as any;
  if (!r?.steps) return [];
  return (r.steps as any[]).map((s: any, i: number) => ({
    index: i,
    desc: typeof s === 'string' ? s : (s.content || s.description || `步骤${i+1}`),
    hasImage: !!(typeof s !== 'string' && s.image),
  }));
});
function toggleStepTarget(idx: number) {
  const i = batchStepTargets.value.indexOf(idx);
  if (i >= 0) batchStepTargets.value.splice(i, 1);
  else batchStepTargets.value.push(idx);
}

// 预览
const previewUrl = ref('');

function previewImage(task: Task) {
  if (task.url) previewUrl.value = task.url;
}

// 任务标签
const taskTab = ref('current');
const historyTasks = computed(() => tasks.value.filter(t => t.status === 'done' || t.status === 'error' || t.status === 'applied'));
// 当前标签：运行中 + 刚完成的（未应用）+ 错误
const activeTasks = computed(() => tasks.value.filter(t => t.status !== 'applied'));
const runningCount = computed(() => tasks.value.filter(t => t.status === 'running').length);
function clearHistory() {
  tasks.value = tasks.value.filter(t => t.status === 'running');
  taskIdSeq = runningCount.value;
  saveHistory();
}
async function batchAdopt() {
  const pending = historyTasks.value.filter(t => t.status === 'done' && t.targetType === 'recipe-cover');
  if (!pending.length) { ElMessage.warning('没有可应用的图片'); return; }
  for (const t of pending) {
    try { await adoptResult(t); } catch (_) {}
  }
  ElMessage.success(`已应用 ${pending.length} 张图片`);
}
function removeHistory(id: number) {
  tasks.value = tasks.value.filter(t => t.id !== id);
  saveHistory();
}

// ============ 任务面板 ============
interface Task {
  id: number;
  label: string;
  status: 'running' | 'done' | 'error' | 'applied';
  url?: string;
  error?: string;
  elapsed: number;
  startTime: number;
  targetType: string;
  targetId: number;
  targetStepIndex: number;
  recipeTitle: string;
}
const HISTORY_KEY = 'airecipe_img_tasks';
function loadHistory(): Task[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (raw) return JSON.parse(raw) as Task[];
  } catch (_) {}
  return [];
}
function saveHistory() {
  const toSave = tasks.value.filter(t => t.status !== 'running').slice(0, 30);
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(toSave)); } catch (_) {}
}
const tasks = ref<Task[]>(loadHistory());
const generating = computed(() => tasks.value.some(t => t.status === 'running'));
let taskIdSeq = 0;

function formatTime(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}秒`;
  const m = Math.floor(s / 60);
  const rs = s % 60;
  return `${m}分${rs}秒`;
}

// 通过 ID 从响应式数组中取任务（确保计时器和结果写入能被 Vue 跟踪）
function findTask(id: number): Task | undefined {
  return tasks.value.find(t => t.id === id);
}

// ============ 生成 ============
async function doGenerate() {
  if (!gen.keyId) { ElMessage.warning('请选择模型'); return; }
  const hasPrompt = gen.prompt.trim() || autoCtx.value;
  if (!hasPrompt && tab.value !== '图生图') { ElMessage.warning('请输入提示词或选择菜谱作为目标'); return; }
  if (tab.value === '图生图' && !refImage.value) { ElMessage.warning('请上传参考图'); return; }
  if (tab.value === '批量任务' && batchMode.value === 'cover' && !batchTargets.value.length) { ElMessage.warning('请选择菜谱'); return; }
  if (tab.value === '批量任务' && batchMode.value === 'step' && (!batchStepRecipeId.value || !batchStepTargets.value.length)) { ElMessage.warning('请选择菜谱和步骤'); return; }

  const count = tab.value === '批量任务'
    ? (batchMode.value === 'cover' ? Math.min(batchTargets.value.length || 1, 10) : Math.min(batchStepTargets.value.length, 10))
    : gen.count;

  // 批量封面
  const batchIds = tab.value === '批量任务' && batchMode.value === 'cover' ? [...batchTargets.value.slice(0, 10)] : [];
  // 批量步骤图
  const stepRecipeId = tab.value === '批量任务' && batchMode.value === 'step' ? batchStepRecipeId.value : 0;
  const stepIndices = tab.value === '批量任务' && batchMode.value === 'step' ? [...batchStepTargets.value.slice(0, 10)] : [];

  const generateOne = async (recipeId?: number, recipeTitle?: string, stepIndex?: number) => {
    const tid = ++taskIdSeq;
    const rid = recipeId || targetId.value;
    const recipe = rid ? allRecipes.value.find(r => r.id === rid) as any : null;
    const isStep = stepIndex !== undefined && stepIndex >= 0;
    const label = isStep
      ? `${recipeTitle || recipe?.title || '菜谱'} · 步骤${stepIndex+1}`
      : (recipeTitle || (recipe ? recipe.title : `第${tid}张`));
    // 批量模式自动设为对应类型
    const ttype = recipeId ? (isStep ? 'recipe-step' : 'recipe-cover') : targetType.value;
    const sidx = isStep ? stepIndex : targetStepIndex.value;
    const startTime = Date.now();

    tasks.value.unshift({
      id: tid, label, status: 'running', elapsed: 0, startTime,
      targetType: ttype, targetId: rid, targetStepIndex: sidx,
      recipeTitle: label,
    });

    // 计时器：通过 ID 从响应式数组中找到任务并更新 elapsed
    const timer = setInterval(() => {
      const t = findTask(tid);
      if (t) t.elapsed = Date.now() - t.startTime;
    }, 200);

    try {
      let ctx: string;
      if (isStep && recipe) {
        const steps = recipe.steps || [];
        const s = steps[stepIndex!];
        const desc = typeof s === 'string' ? s : (s?.content || s?.description || `步骤${stepIndex!+1}`);
        ctx = `cooking process photo of ${recipe.title}, ${desc}`;
      } else if (recipe) {
        ctx = `food photo of ${recipe.title}${recipe.ingredients?.length ? ' with ' + recipe.ingredients.slice(0,4).map((i:any)=>i.name).join(', ') : ''}`;
      } else {
        ctx = autoCtx.value;
      }
      const fullPrompt = ctx && gen.prompt
        ? `${ctx}, ${gen.prompt}`
        : (gen.prompt || ctx || 'delicious food');

      const r: any = await request.post('/ai/generate-image', {
        templateId: gen.tid || 0, prompt: fullPrompt,
        dishName: recipe?.title || selectedRecipe.value?.title || '',
        ingredients: recipe?.ingredients?.slice(0,5).map((i:any)=>i.name).join('、') || recipeIngNames.value || '',
        size: currentPixelSize.value, aiKeyId: gen.keyId,
        refImage: tab.value === '图生图' ? refImage.value : undefined,
      });

      clearInterval(timer);
      const t = findTask(tid);
      if (!t) return;
      t.elapsed = Date.now() - t.startTime;

      if (r.data?.url) {
        t.status = 'done';
        t.url = r.data.url;
        saveHistory();
      } else {
        t.status = 'error';
        t.error = r.message || 'AI 未返回图片';
        saveHistory();
      }
    } catch (e: any) {
      clearInterval(timer);
      const t = findTask(tid);
      if (!t) return;
      t.elapsed = Date.now() - t.startTime;
      t.status = 'error';
      const msg = e?.message || '生成失败';
      if (msg.includes('401') || msg.includes('认证')) {
        t.error = '认证过期，请刷新页面重新登录';
      } else if (msg.includes('timeout') || msg.includes('超时') || msg.includes('ECONNABORTED') || msg.includes('abort')) {
        t.error = '请求超时（3分钟），图片生成仍在处理中，请重试或使用更小尺寸';
      } else {
        t.error = msg.length > 120 ? msg.slice(0, 120) + '...' : msg;
      }
      saveHistory();
    }
  };

  if (tab.value === '批量任务' && batchMode.value === 'cover' && batchIds.length) {
    for (const id of batchIds) {
      const r = allRecipes.value.find(r => r.id === id) as any;
      await generateOne(id, r?.title);
    }
    batchTargets.value = batchTargets.value.filter(id => !batchIds.includes(id));
    loadRecipes();
  } else if (tab.value === '批量任务' && batchMode.value === 'step' && stepIndices.length) {
    const r = allRecipes.value.find(r => r.id === stepRecipeId) as any;
    for (const si of stepIndices) {
      await generateOne(stepRecipeId, r?.title, si);
    }
    batchStepTargets.value = batchStepTargets.value.filter(si => !stepIndices.includes(si));
    loadRecipes();
  } else {
    for (let i = 0; i < count; i++) await generateOne();
  }
}

// ============ 应用结果 ============
async function adoptResult(t: Task) {
  if (!t.url) return;
  try {
    // 调用后端重新上传到对应 COS 文件夹并更新菜谱
    const r: any = await request.post('/ai/adopt-image', {
      sourceUrl: t.url,
      targetType: t.targetType,
      recipeId: t.targetId,
      recipeTitle: t.recipeTitle,
      stepIndex: t.targetStepIndex,
    });
    t.url = r.data?.url || t.url;
    ElMessage.success(t.targetType === 'recipe-cover'
      ? `「${t.recipeTitle}」封面已应用 → recipes/`
      : t.targetType === 'recipe-step'
        ? `「${t.recipeTitle}」步骤${t.targetStepIndex+1} 图已应用 → recipes/steps/`
        : '图片已应用');
    if (t.targetType === 'recipe-cover' || t.targetType === 'recipe-step') loadRecipes();
    t.status = 'applied';
    saveHistory();
  } catch (e: any) { ElMessage.error(e?.message || '应用失败'); }
}

function downloadImage(t: Task) {
  if (!t.url) return;
  // 将 COS 图片下载到本地
  const a = document.createElement('a');
  a.href = t.url;
  a.download = t.label + '.png';
  a.target = '_blank';
  a.click();
}

// ============ 加载 ============
async function loadModels() {
  try {
    const r: any = await request.get('/ai-keys');
    models.value = (r.data || []).filter((m:any) =>
      m.keyType === 'image' || m.keyType === 'multimodal'
    );
    if (models.value.length && !gen.keyId) gen.keyId = models.value[0].id;
  } catch (e: any) {
    ElMessage.warning('加载 AI Key 失败');
  }
}
async function loadTpls() {
  try {
    const r: any = await request.get('/ai/templates');
    tpls.value = r.data || [];
  } catch(e){ ElMessage.warning('加载模板失败'); }
}
async function loadRecipes() {
  try {
    const r: any = await request.get('/recipes', { params: { page: 1, pageSize: 200 } });
    const list = r.data?.list || [];
    allRecipes.value = list;
    missingCovers.value = list.filter((r:any) => !r.coverImage || r.coverImage.includes('dummyimage'));
    missingSteps.value = list.map((r:any) => {
      const steps = r.steps || [];
      const missing = steps.filter((s:any) => typeof s !== 'string' && !s.image);
      return missing.length ? { id: r.id, title: r.title, missingStepCount: missing.length } : null;
    }).filter(Boolean);
  } catch(e: any){}
}

onMounted(() => { loadModels(); loadTpls(); loadRecipes(); });
</script>

<style scoped lang="scss">
.ig-root { height: calc(100vh - 64px); display: flex; flex-direction: column; overflow: hidden; background: #fff; }
.ig-top { display: flex; align-items: center; justify-content: space-between; padding: 10px 20px; border-bottom: 1px solid #eee; flex-shrink: 0; }
.ig-top-l { display: flex; align-items: center; gap: 10px; }
.ig-tip { font-size: 11px; color: #e2a650; }

.ig-tabs { display: flex; gap: 0; padding: 0 20px; border-bottom: 1px solid #eee; flex-shrink: 0; }
.ig-tabs button { padding: 10px 20px; border: none; background: none; font-size: 13px; color: #666; cursor: pointer; border-bottom: 2px solid transparent; transition: .15s; }
.ig-tabs button.on { color: #e2a650; border-bottom-color: #e2a650; font-weight: 600; }
.ig-tabs button:hover { color: #333; }

.ig-body { display: flex; flex: 1; overflow: hidden; }

.ig-left { width: 210px; flex-shrink: 0; border-right: 1px solid #eee; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 8px; }
.ig-mid { flex: 1; padding: 12px 16px; overflow-y: auto; display: flex; flex-direction: column; }
.ig-right { width: 280px; flex-shrink: 0; border-left: 1px solid #eee; overflow: hidden; padding: 12px; display: flex; flex-direction: column; }

.ig-card { background: #fafafa; border: 1px solid #eee; border-radius: 6px; padding: 10px; margin-bottom: 8px; }
.ig-card-hd { font-size: 12px; font-weight: 600; color: #666; margin-bottom: 8px; }

.ig-9grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 4px; }
.ig-9grid button { display: flex; flex-direction: column; align-items: center; padding: 8px 4px; border: 1px solid #ddd; border-radius: 4px; background: #fff; cursor: pointer; transition: .12s; }
.ig-9grid button:hover { border-color: #ccc; }
.ig-9grid button.on { border-color: #e2a650; background: rgba(226,165,80,.08); }
.ig9-k { font-size: 13px; font-weight: 700; color: #e2a650; }
.ig9-px { font-size: 10px; font-weight: 600; color: #333; margin-top: 2px; white-space: nowrap; }
.ig9-r { font-size: 9px; color: #999; margin-top: 1px; }

.ig-row { display: flex; align-items: center; gap: 8px; margin-top: 8px; }
.ig-row-label { font-size: 12px; color: #666; flex-shrink: 0; }

// 菜谱信息提示
.ig-recipe-info { display: flex; flex-direction: column; gap: 2px; margin-top: 6px; padding: 6px 8px; background: rgba(226,165,80,.06); border-radius: 4px; }
.ig-ri-name { font-size: 13px; font-weight: 600; color: #333; }
.ig-ri-ing { font-size: 11px; color: #999; }

// 自动上下文
.ig-ctx-tag { font-size: 10px; font-weight: 400; color: #e2a650; margin-left: 6px; }
.ig-ctx-box { font-size: 11px; color: #999; background: #f9f9f9; padding: 6px 8px; border-radius: 4px; margin-bottom: 8px; word-break: break-all; }
.ig-ctx-label { color: #666; font-weight: 500; }

.ig-batch-list { max-height: 200px; overflow-y: auto; display: flex; flex-direction: column; gap: 2px; }
.ig-batch-item { font-size: 12px; padding: 4px 8px; border-radius: 4px; cursor: pointer; display: flex; align-items: center; gap: 6px; }
.ig-batch-item:hover { background: #f5f5f5; }
.ig-batch-item.on { background: rgba(226,165,80,.12); }
.ig-batch-badge { font-size: 10px; background: #ff6b6b; color: #fff; padding: 0 4px; border-radius: 4px; }
.ig-batch-acts { display: flex; gap: 6px; margin-top: 6px; }

.ig-ref-img { width: 100%; max-height: 200px; object-fit: contain; margin-top: 8px; border-radius: 4px; }

.ig-step-pick { max-height: 140px; overflow-y: auto; margin-top: 4px; }
.ig-step-it { display: flex; gap: 6px; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 11px; }
.ig-step-it:hover { background: #f5f5f5; } .ig-step-it.on { background: rgba(226,165,80,.12); }
.ig-step-n { font-weight: 700; color: #e2a650; flex-shrink: 0; }

// 任务面板
.ig-task-list { display: flex; flex-direction: column; gap: 10px; overflow-y: auto; flex: 1; padding: 2px 0; }
.ig-task { border: 1px solid #eee; border-radius: 6px; overflow: hidden; flex-shrink: 0; }
.ig-task--running { border-color: #e2a650; background: rgba(226,165,80,.03); }
.ig-task--error { border-color: #f56c6c; background: rgba(245,108,108,.03); }

.ig-task-body { display: flex; align-items: center; gap: 10px; padding: 12px; }
.ig-task-spin { font-size: 22px; color: #e2a650; animation: ig-spin 1s linear infinite; }
@keyframes ig-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

.ig-task-info { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
.ig-task-target { font-size: 12px; font-weight: 600; color: #333; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ig-task-time { font-size: 11px; color: #999; }

.ig-task-img { width: 100%; display: block; cursor: pointer; transition: .15s; &:hover{opacity:.9} }
.ig-task-foot { display: flex; align-items: center; justify-content: space-between; padding: 6px 8px; gap: 4px; }
.ig-task-foot .ig-task-time { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; min-width: 0; }
.ig-task-acts { display: flex; gap: 4px; }

.ig-task-err { display: flex; align-items: flex-start; gap: 8px; padding: 10px; }
.ig-err-icon { width: 20px; height: 20px; border-radius: 50%; background: #f56c6c; color: #fff; font-size: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.ig-err-msg { font-size: 10px; color: #f56c6c; line-height: 1.5; word-break: break-all; }

.ig-empty { text-align: center; color: #ccc; padding: 40px 0; font-size: 13px; flex: 1; display: flex; align-items: center; justify-content: center; }

.ig-task-tabs { display: flex; gap: 2px; }
.ig-task-tabs button { padding: 4px 12px; border: 1px solid #ddd; border-radius: 4px; background: #fff; font-size: 11px; color: #666; cursor: pointer; transition: .12s; }
.ig-task-tabs button.on { background: #e2a650; color: #fff; border-color: #e2a650; }

.ig-save-tpl { margin-top: 8px; padding: 10px; background: #fafafa; border: 1px solid #eee; border-radius: 6px; }

.ig-btn-icon { min-width: 28px; padding: 4px 6px; }
.ig-applied-badge { font-size: 10px; color: #67c23a; background: rgba(103,194,58,.1); padding: 2px 6px; border-radius: 3px; flex-shrink: 0; }
</style>
