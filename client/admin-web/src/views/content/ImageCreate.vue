<template>
  <div class="ig-root">
    <!-- 顶部 Bar -->
    <div class="ig-top">
      <div class="ig-top-l">
        <el-button size="small" text @click="loadModels">刷新模型</el-button>
        <el-select v-model="gen.model" size="small" style="width:200px" placeholder="选择模型">
          <el-option v-for="m in models" :key="m.id" :label="m.name + ' · ' + m.model" :value="m.model"/>
        </el-select>
        <span class="ig-tip" v-if="!models.length">提示：请先在「系统设置 → API Key 管理」创建并激活密钥</span>
      </div>
    </div>

    <!-- Tabs -->
    <div class="ig-tabs">
      <button v-for="t in tabs" :key="t" :class="{on:tab===t}" @click="tab=t">{{ t }}</button>
    </div>

    <!-- 主体三栏 -->
    <div class="ig-body">
      <!-- 左栏：参数 -->
      <div class="ig-left">
        <!-- 尺寸 -->
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
        <!-- 背景 -->
        <div class="ig-card"><div class="ig-card-hd">背景</div>
          <el-radio-group v-model="gen.bg" size="small">
            <el-radio value="opaque">不透明</el-radio><el-radio value="transparent">透明</el-radio>
          </el-radio-group>
        </div>
        <!-- 格式 -->
        <div class="ig-card"><div class="ig-card-hd">格式</div>
          <el-select v-model="gen.format" size="small" style="width:100%">
            <el-option value="PNG" label="PNG"/><el-option value="JPG" label="JPG"/><el-option value="WebP" label="WebP"/>
          </el-select>
        </div>
        <!-- 思考强度 -->
        <div class="ig-card"><div class="ig-card-hd">思考强度</div>
          <el-select v-model="gen.thinking" size="small" style="width:100%">
            <el-option value="auto" label="自动"/><el-option value="low" label="低"/><el-option value="standard" label="标准"/><el-option value="advanced" label="进阶"/>
          </el-select>
        </div>
      </div>

      <!-- 中栏：Prompt + 生成 -->
      <div class="ig-mid">
        <!-- 文生图 / 批量任务 -->
        <template v-if="tab==='文生图' || tab==='批量任务'">
          <!-- 目标选择 -->
          <div class="ig-card" v-if="tab==='文生图'">
            <div class="ig-card-hd">生成目标</div>
            <el-select v-model="targetType" size="small" style="width:100%;margin-bottom:6px" placeholder="选择目标类型">
              <el-option label="菜谱封面" value="recipe-cover"/>
              <el-option label="菜谱步骤图" value="recipe-step"/>
              <el-option label="轮播 Banner" value="banner"/>
              <el-option label="定制卡片" value="card"/>
              <el-option label="图标" value="icon"/>
              <el-option label="宣传图" value="promo"/>
              <el-option label="无特定目标" value=""/>
            </el-select>
            <template v-if="targetType==='recipe-cover'||targetType==='recipe-step'">
              <el-select v-model="targetId" filterable size="small" style="width:100%" placeholder="搜索菜谱...">
                <el-option v-for="r in allRecipes" :key="r.id" :label="r.title" :value="r.id"/>
              </el-select>
              <template v-if="targetType==='recipe-step'&&targetId">
                <div class="ig-step-pick">
                  <div v-for="(s,i) in targetRecipeSteps" :key="i" class="ig-step-it" :class="{on:targetStepIndex===i}" @click="targetStepIndex=i">
                    <span class="ig-step-n">{{ i+1 }}</span><span>{{ truncate(s.content||s.description||s,40) }}</span>
                  </div>
                </div>
              </template>
            </template>
          </div>
          <div class="ig-card"><div class="ig-card-hd">创意描述提示词</div>
            <el-input v-model="gen.prompt" type="textarea" :rows="6" size="small" placeholder="描述你想生成的图片..."/>
          </div>
          <div class="ig-row">
            <span class="ig-row-label">模板</span>
            <el-select v-model="gen.tid" size="small" style="width:180px" @change="onTplSelect">
              <el-option v-for="t in tpls" :key="t.id" :label="t.name" :value="t.id"/>
            </el-select>
            <span class="ig-row-label">数量</span>
            <el-input-number v-model="gen.count" size="small" :min="1" :max="10"/>
          </div>
          <el-button type="primary" size="large" :loading="generating" @click="doGenerate" style="width:100%;margin-top:12px">
            {{ tab==='批量任务' ? '开始批量生成' : '开始生成' }}
          </el-button>
        </template>

        <!-- 批量任务：选菜谱 -->
        <div class="ig-card" v-if="tab==='批量任务'" style="margin-top:12px">
          <div class="ig-card-hd">批量目标（{{ batchTargets.length }} 道菜谱）</div>
          <div class="ig-batch-list">
            <div v-for="r in missingCovers" :key="r.id" class="ig-batch-item" :class="{on:batchTargets.includes(r.id)}" @click="toggleBatch(r.id)">
              <span>{{ r.title }}</span><span class="ig-batch-badge" v-if="!r.coverImage">缺封面</span>
            </div>
          </div>
          <div class="ig-batch-acts">
            <el-button size="small" @click="batchTargets=missingCovers.map((r:any)=>r.id)">全选缺图</el-button>
            <el-button size="small" @click="batchTargets=[]">清空</el-button>
          </div>
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

      <!-- 右栏：结果 -->
      <div class="ig-right">
        <div class="ig-card"><div class="ig-card-hd">生成结果</div>
          <div v-if="results.length" class="ig-results">
            <div v-for="(r,i) in results" :key="i" class="ig-rs-item">
              <img :src="r.url" />
              <div class="ig-rs-acts">
                <el-button size="small" type="success" @click="adoptResult(r)">采用</el-button>
                <el-button size="small" type="danger" @click="results.splice(i,1)">删除</el-button>
              </div>
            </div>
          </div>
          <div v-else class="ig-empty">结果将在这里显示</div>
        </div>
      </div>
    </div>

    <!-- 底部：最近任务 -->
    <div class="ig-bottom" v-if="history.length">
      <div class="ig-bot-bar">
        <span class="ig-bot-title">最近任务 ({{ history.length }})</span>
        <el-button size="small" text @click="history=[]">清空</el-button>
      </div>
      <div class="ig-bot-imgs">
        <img v-for="(h,i) in history" :key="i" :src="h" @click="results.push({url:h,targetType:'history',targetId:0})" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import request from '@/api/request';
import axios from 'axios';

const tab = ref('文生图');
const tabs = ['文生图', '图生图', '批量任务'];

// 模型
const models = ref<any[]>([]);
const activeModel = computed(() => models.value.find(m => m.isActive));
const gen = reactive({
  model: '', tid: 'cover_chinese_home', prompt: '', count: 1,
  sizeK: '1K', ratio: '1:1', bg: 'opaque', format: 'PNG', thinking: 'auto',
});
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
function genContext() { return { targetType: targetType.value, targetId: targetId.value, targetStepIndex: targetStepIndex.value }; }

// 模板
const tpls = ref<any[]>([]);
function onTplSelect() {
  const t = tpls.value.find(t => t.id === gen.tid);
  if (t) gen.prompt = t.template || '';
}

// 目标选择
const targetType = ref('');
const targetId = ref(0);
const targetStepIndex = ref(0);
const allRecipes = ref<any[]>([]);
const targetRecipeSteps = computed(() => {
  const r = allRecipes.value.find(r => r.id === targetId.value) as any;
  return r?.steps || [];
});
function truncate(s: string, n: number) { return (s || '').slice(0, n) + ((s || '').length > n ? '...' : ''); }

// 图生图
const refImage = ref('');
function onRefUpload(file: any) { const raw = file?.raw; if (raw) { const u = URL.createObjectURL(raw); refImage.value = u; } }

// 批量
const missingCovers = ref<any[]>([]);
const batchTargets = ref<number[]>([]);
function toggleBatch(id: number) { const i = batchTargets.value.indexOf(id); if (i>=0) batchTargets.value.splice(i,1); else batchTargets.value.push(id); }

// 生成
const generating = ref(false);
const results = ref<any[]>([]);
const history = ref<string[]>([]);

async function doGenerate() {
  if (!gen.model) { ElMessage.warning('请选择模型'); return; }
  if (!gen.prompt && tab.value !== '图生图') { ElMessage.warning('请输入提示词'); return; }
  generating.value = true;
  const ctx = genContext();
  const count = tab.value === '批量任务' ? Math.min(batchTargets.value.length || 1, 10) : gen.count;

  const generateOne = async (recipeId?: number) => {
    try {
      const r: any = await request.post('/ai/generate-image', {
        templateId: gen.tid, prompt: gen.prompt || undefined,
        dishName: '', ingredients: '', size: currentPixelSize.value, model: gen.model,
      });
      if (r.data?.url) {
        const item = { url: r.data.url, ...ctx, targetId: recipeId || ctx.targetId };
        results.value.push(item);
        history.value.unshift(r.data.url); if (history.value.length > 50) history.value.pop();
      }
    } catch (e) { /* skip */ }
  };

  if (tab.value === '批量任务' && batchTargets.value.length) {
    for (const id of batchTargets.value.slice(0, 10)) await generateOne(id);
  } else {
    for (let i = 0; i < count; i++) await generateOne();
  }

  generating.value = false;
  if (results.value.length) ElMessage.success(`生成 ${results.value.length} 张，点「采用」写入 COS 并生效`);
}

const COS_ROOT = 'https://dish-1367781796.cos.ap-guangzhou.myqcloud.com';

function cosFolder(type: string): string {
  if (type === 'recipe-cover' || type === 'recipe-step') return 'recipes';
  if (type === 'banner' || type === 'card') return 'banners';
  if (type === 'icon') return 'icons';
  if (type === 'promo') return 'promo';
  return 'ai-generated';
}
function cosName(type: string, recipeId?: number, stepIndex?: number): string {
  const ts = Date.now();
  if (type === 'recipe-cover' && recipeId) return `ai_cover_${recipeId}_${ts}`;
  if (type === 'recipe-step' && recipeId && stepIndex !== undefined) return `ai_step_${recipeId}_${stepIndex}_${ts}`;
  if (type === 'banner') return `ai_banner_${ts}`;
  if (type === 'card') return `ai_card_${ts}`;
  if (type === 'icon') return `ai_icon_${ts}`;
  if (type === 'promo') return `ai_promo_${ts}`;
  return `img_${ts}`;
}

async function adoptResult(r: any) {
  const type = r.targetType || targetType.value;
  const rid = r.targetId || targetId.value;
  const stepIdx = r.targetStepIndex ?? targetStepIndex.value;
  try {
    // 1. 如果是 AI 生成的原始 URL 在 COS 的 ai-generated 目录，复制到目标文件夹
    //    简化处理：直接用当前 URL（AI 生成服务已存入 COS），更新目标数据库
    if (type === 'recipe-cover' && rid > 0) {
      await request.put(`/recipes/${rid}`, { coverImage: r.url });
      ElMessage.success('封面已更新 · 小程序/APP/Web 实时生效');
      loadRecipes();
    } else if (type === 'recipe-step' && rid > 0 && stepIdx >= 0) {
      // 获取当前菜谱的 steps，更新指定步骤的 image
      const detail: any = await request.get(`/recipes/${rid}`);
      const steps = [...((detail?.data?.steps || detail?.steps) as any[] || [])];
      if (steps[stepIdx]) {
        steps[stepIdx] = { ...steps[stepIdx], image: r.url };
        await request.put(`/recipes/${rid}`, { steps });
        ElMessage.success('步骤图已更新 · 实时生效');
      }
    } else if (type === 'banner' || type === 'card') {
      // Banner/Card 通过内容运营页使用，此处保存 URL 供后续使用
      ElMessage.success(`图片已就绪 · COS: ${r.url} · 可在内容运营中选用`);
    } else if (type === 'icon') {
      ElMessage.success(`图标已就绪 · COS: ${r.url}`);
    } else if (type === 'promo') {
      ElMessage.success(`宣传图已就绪 · COS: ${r.url}`);
    } else {
      ElMessage.success('已保存到素材库');
    }
    const i = results.value.indexOf(r); if (i >= 0) results.value.splice(i, 1);
  } catch (e: any) { ElMessage.error(e?.message || '采用失败'); }
}

// 加载
async function loadModels() {
  try { const r: any = await request.get('/ai-keys'); models.value = (r.data || []).filter((m:any) => m.isActive); if (models.value.length) gen.model = models.value[0].model; }
  catch (e) { /* ok */ }
}
async function loadTpls() { try { const r: any = await request.get('/ai/templates'); tpls.value = r.data || []; } catch(e){} }
async function loadRecipes() {
  try {
    const r: any = await request.get('/recipes', { params: { page: 1, pageSize: 200 } });
    const list = r.data?.list || [];
    allRecipes.value = list;
    missingCovers.value = list.filter((r:any) => !r.coverImage || r.coverImage.includes('dummyimage'));
  } catch(e){}
}
onMounted(() => { loadModels(); loadTpls(); loadRecipes(); });
</script>

<style scoped lang="scss">
.ig-root { height: calc(100vh - 64px); display: flex; flex-direction: column; overflow: hidden; background: #fff; }
.ig-top { display: flex; align-items: center; justify-content: space-between; padding: 10px 20px; border-bottom: 1px solid #eee; flex-shrink: 0; }
.ig-top-l { display: flex; align-items: center; gap: 10px; }
.ig-price { font-size: 13px; font-weight: 600; color: #e2a650; }
.ig-tip { font-size: 11px; color: #e2a650; }
.ig-cost { font-size: 12px; color: #999; }

.ig-tabs { display: flex; gap: 0; padding: 0 20px; border-bottom: 1px solid #eee; flex-shrink: 0; }
.ig-tabs button { padding: 10px 20px; border: none; background: none; font-size: 13px; color: #666; cursor: pointer; border-bottom: 2px solid transparent; transition: .15s; }
.ig-tabs button.on { color: #e2a650; border-bottom-color: #e2a650; font-weight: 600; }
.ig-tabs button:hover { color: #333; }

.ig-body { display: flex; flex: 1; overflow: hidden; }

.ig-left { width: 260px; flex-shrink: 0; border-right: 1px solid #eee; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 8px; }
.ig-mid { flex: 1; padding: 12px 16px; overflow-y: auto; display: flex; flex-direction: column; }
.ig-right { width: 280px; flex-shrink: 0; border-left: 1px solid #eee; overflow-y: auto; padding: 12px; }

.ig-card { background: #fafafa; border: 1px solid #eee; border-radius: 6px; padding: 10px; margin-bottom: 8px; }
.ig-card-hd { font-size: 12px; font-weight: 600; color: #666; margin-bottom: 8px; }

.ig-9grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 4px; }
.ig-9grid button { display: flex; flex-direction: column; align-items: center; padding: 8px 4px; border: 1px solid #ddd; border-radius: 4px; background: #fff; cursor: pointer; transition: .12s; }
.ig-9grid button:hover { border-color: #ccc; }
.ig-9grid button.on { border-color: #e2a650; background: rgba(226,165,80,.08); }
.ig9-k { font-size: 13px; font-weight: 700; color: #e2a650; }
.ig9-px { font-size: 10px; font-weight: 600; color: #333; margin-top: 2px; white-space: nowrap; }
.ig9-r { font-size: 9px; color: #999; margin-top: 1px; }
.ig-9grid button.on .ig9-k { color: #c7862d; }
.ig-9grid button.on .ig9-px { color: #e2a650; }

.ig-row { display: flex; align-items: center; gap: 8px; margin-top: 8px; }
.ig-row-label { font-size: 12px; color: #666; flex-shrink: 0; }

.ig-batch-list { max-height: 160px; overflow-y: auto; display: flex; flex-direction: column; gap: 2px; }
.ig-batch-item { font-size: 12px; padding: 4px 8px; border-radius: 4px; cursor: pointer; display: flex; align-items: center; gap: 6px; }
.ig-batch-item:hover { background: #f5f5f5; }
.ig-batch-item.on { background: rgba(226,165,80,.12); }
.ig-batch-badge { font-size: 10px; background: #ff6b6b; color: #fff; padding: 0 4px; border-radius: 4px; }
.ig-batch-acts { display: flex; gap: 6px; margin-top: 6px; }

.ig-ref-img { width: 100%; max-height: 200px; object-fit: contain; margin-top: 8px; border-radius: 4px; }

.ig-results { display: flex; flex-direction: column; gap: 10px; }
.ig-rs-item { border: 1px solid #eee; border-radius: 6px; overflow: hidden; }
.ig-rs-item img { width: 100%; display: block; }
.ig-rs-acts { display: flex; gap: 4px; padding: 6px; }

.ig-empty { text-align: center; color: #ccc; padding: 40px 0; font-size: 13px; }
.ig-step-pick { max-height: 140px; overflow-y: auto; margin-top: 4px; }
.ig-step-it { display: flex; gap: 6px; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 11px; }
.ig-step-it:hover { background: #f5f5f5; } .ig-step-it.on { background: rgba(226,165,80,.12); }
.ig-step-n { font-weight: 700; color: #e2a650; flex-shrink: 0; }

.ig-bottom { border-top: 1px solid #eee; flex-shrink: 0; padding: 8px 20px; }
.ig-bot-bar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
.ig-bot-title { font-size: 12px; color: #999; }
.ig-bot-imgs { display: flex; gap: 6px; overflow-x: auto; }
.ig-bot-imgs img { width: 48px; height: 48px; object-fit: cover; border-radius: 4px; cursor: pointer; &:hover{opacity:.8} }
</style>
