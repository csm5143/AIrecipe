<template>
  <div class="co-root">
    <div class="co-bar">
      <div class="co-bar-l">
        <h2 class="co-t">内容运营</h2>
        <el-select v-model="platform" size="small" style="width:110px">
          <el-option label="小程序" value="MINIPROGRAM"/>
          <el-option label="APP" value="APP"/>
          <el-option label="Web" value="WEB"/>
        </el-select>
        <el-select v-model="pageId" size="small" style="width:90px">
          <el-option v-for="p in currentPages" :key="p.id" :label="p.label" :value="p.id"/>
        </el-select>
      </div>
      <div class="co-bar-r">
        <el-button v-if="dirty" type="primary" size="small" @click="save">保存</el-button>
        <el-button v-if="dirty" size="small" @click="revert">撤销</el-button>
        <el-button size="small" @click="refreshAll">刷新</el-button>
        <el-button size="small" @click="togglePreview">{{ showPreview?'收起预览':'展开预览' }}</el-button>
      </div>
    </div>

    <div class="co-body">
      <!-- 左栏：可编辑内容（从 API 数据动态生成） -->
      <LeftPanel
        :page="pageId"
        :cards="cards"
        :hot="hotRecipes"
        :brand="brandLogoUrl"
        :fitness="fitnessImg"
        :kids="kidsImg"
        :about="aboutContent"
        :app-logo="brandLogoUrl" :app-banner="appBannerImg"
        :web-logo="brandLogoUrl" :web-hero="webHeroImg"
        :selKey="selKey"
        @select="onItemSelect"
      />

      <!-- 中栏：预览 -->
      <div class="co-mid" v-if="showPreview">
        <template v-if="platform==='MINIPROGRAM'">
          <HomePreview v-if="pageId==='home'" :brand-logo="brandLogoUrl" :hot-recipes="hotRecipes" @select="onPvSelect" />
          <CustomPreview v-else-if="pageId==='custom'" :cards="cards" :fitness-image="fitnessImg" :kids-image="kidsImg" @select="onPvSelect" />
          <MinePreview v-else :about-content="aboutContent" @select="onPvSelect" />
        </template>
        <AppPreview v-else-if="platform==='APP'" :app-banner="appBannerImg" :app-logo="brandLogoUrl" :app-recipes="hotRecipes" @select="onPvSelect" />
        <WebPreview v-else :web-hero="webHeroImg" :web-logo="brandLogoUrl" :web-recipes="hotRecipes" @select="onPvSelect" />
      </div>

      <!-- 右栏：编辑面板 -->
      <div class="co-right" v-if="sel">
        <div class="co-pnl">
          <div class="co-phd">{{ sel._title || sel.title || '编辑' }}</div>

          <div class="co-pimg" v-if="sel.imageUrl !== undefined">
            <img v-if="sel.imageUrl" :src="sel.imageUrl" />
            <div v-else class="co-pimge">暂无图片</div>
            <div class="co-pia">
              <el-upload action="#" :auto-upload="false" :show-file-list="false" accept="image/*" @change="upload">
                <el-button size="small">📁 上传</el-button>
              </el-upload>
              <el-button size="small" type="primary" @click="aiImgOpen=true">✨ AI 生成</el-button>
            </div>
          </div>

          <div class="co-pfm">
            <div class="co-fld" v-if="sel.title !== undefined && sel._type !== 'about'"><label>标题</label><el-input v-model="sel.title" size="small" /></div>
            <div class="co-fld" v-if="sel.subtitle !== undefined"><label>描述</label><el-input v-model="sel.subtitle" size="small" /></div>
            <div class="co-fld" v-if="sel.name !== undefined && sel._type === 'hot'"><label>菜名</label><el-input v-model="sel.name" size="small" /></div>
            <div class="co-fld" v-if="sel.content !== undefined"><label>文案</label><el-input v-model="sel.content" type="textarea" :rows="5" size="small" />
              <el-button size="small" style="margin-top:6px" @click="aiTxtOpen=true">✨ AI 写文案</el-button>
            </div>
            <div class="co-fld" v-if="sel.linkType !== undefined"><label>导航类型</label>
              <el-select v-model="sel.linkType" size="small" style="width:100%">
                <el-option label="每日推荐" value="DAILY"/><el-option label="发现页" value="DISCOVER"/>
                <el-option label="列表页" value="LIST"/><el-option label="热门" value="HOT"/><el-option label="无跳转" value="NONE"/>
              </el-select>
            </div>
            <div class="co-fld" v-if="sel.linkValue !== undefined"><label>导航参数</label><el-input v-model="sel.linkValue" size="small" /></div>
          </div>
        </div>
      </div>
    </div>

    <!-- AI 图片 -->
    <el-drawer v-model="aiImgOpen" title="AI 生成图片" direction="rtl" size="420px">
      <div class="ai-dw"><div class="ai-fd"><label>模板</label><el-select v-model="aiImg.tid" size="small" style="width:100%"><el-option v-for="t in tpls" :key="t.id" :label="t.name" :value="t.id"/></el-select></div>
        <div class="ai-fd"><label>名称</label><el-input v-model="aiImg.name" size="small"/></div>
        <div class="ai-fd"><label>食材</label><el-input v-model="aiImg.ing" size="small"/></div>
        <el-button type="primary" :loading="aiImgLoading" @click="aiGenImg" style="width:100%">✨ 生成</el-button>
        <div v-if="aiImgResult" style="margin-top:12px"><img :src="aiImgResult" style="width:100%;border-radius:8px"/><div style="display:flex;gap:8px;margin-top:8px"><el-button size="small" type="success" @click="aiImgAdopt">采用</el-button><el-button size="small" @click="aiImgRetry">换一张</el-button></div></div>
      </div>
    </el-drawer>

    <!-- AI 文案 -->
    <el-drawer v-model="aiTxtOpen" title="AI 写文案" direction="rtl" size="420px">
      <div class="ai-dw"><div class="ai-fd"><label>主题</label><el-input v-model="aiTxt.topic" size="small"/></div>
        <div class="ai-fd"><label>长度</label><el-radio-group v-model="aiTxt.len" size="small"><el-radio value="short">短</el-radio><el-radio value="medium">中</el-radio></el-radio-group></div>
        <el-button type="primary" :loading="aiTxtLoading" @click="aiGenTxt" style="width:100%">✨ 生成</el-button>
        <div v-if="aiTxtResult" class="ai-rt">{{ aiTxtResult }}<el-button size="small" type="success" style="margin-top:8px;display:block" @click="aiTxtAdopt">填充</el-button></div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { ElMessage } from 'element-plus';
import request from '@/api/request';
import axios from 'axios';
import HomePreview from './HomePreview.vue';
import CustomPreview from './CustomPreview.vue';
import MinePreview from './MinePreview.vue';
import AppPreview from './AppPreview.vue';
import WebPreview from './WebPreview.vue';
import LeftPanel from './LeftPanel.vue';
import { contentApi } from '@/api/content';

const platform = ref('MINIPROGRAM');
const pageId = ref('home');
const showPreview = ref(true);
const pages = [{ id: 'home', label: '首页' }, { id: 'custom', label: '定制页' }, { id: 'mine', label: '我的' }];
const currentPages = computed(() => {
  if (platform.value === 'MINIPROGRAM') return pages;
  if (platform.value === 'APP') return [{ id: 'app', label: 'APP首页' }];
  return [{ id: 'web', label: 'Web首页' }];
});

// 动态数据
const brandLogoUrl = ref('https://dish-1367781796.cos.ap-guangzhou.myqcloud.com/%E7%B3%BB%E7%BB%9F%E5%9B%BE%E7%89%87/%E5%90%83%E4%BA%86%E4%B9%884.png');
const fitnessImg = ref('https://dish-1367781796.cos.ap-guangzhou.myqcloud.com/%E8%8F%9C%E5%93%81/%E5%81%A5%E8%BA%AB%E9%A4%901.png');
const kidsImg = ref('https://dish-1367781796.cos.ap-guangzhou.myqcloud.com/%E8%8F%9C%E5%93%81/%E5%84%BF%E7%AB%A5%E9%A4%901.png');
const aboutContent = ref('AI 智能菜谱\n\n让厨房里的食材，都有做法。\n\n版本：v1.0.0');
const appBannerImg = ref('');
const webHeroImg = ref('');
const hotRecipes = ref<any[]>([]);
const cards = ref<any[]>([]);

const D = [
  { id:9001, title:'每日推荐', subtitle:'', imageUrl:'https://dish-1367781796.cos.ap-guangzhou.myqcloud.com/%E8%8F%9C%E5%93%81/%E5%AE%AB%E4%BF%9D%E9%B8%A1%E4%B8%81.png', linkType:'DAILY', linkValue:'', platform:'MINIPROGRAM', sortOrder:0, status:'ACTIVE' },
  { id:9002, title:'新菜首发', subtitle:'', imageUrl:'https://dish-1367781796.cos.ap-guangzhou.myqcloud.com/%E8%8F%9C%E5%93%81/%E7%BA%A2%E7%83%A7%E8%82%89.png', linkType:'DISCOVER', linkValue:'new', platform:'MINIPROGRAM', sortOrder:1, status:'ACTIVE' },
  { id:9003, title:'家常菜', subtitle:'', imageUrl:'https://dish-1367781796.cos.ap-guangzhou.myqcloud.com/%E8%8F%9C%E5%93%81/%E5%8F%AF%E4%B9%90%E9%B8%A1%E7%BF%85.png', linkType:'DISCOVER', linkValue:'home', platform:'MINIPROGRAM', sortOrder:2, status:'ACTIVE' },
  { id:9004, title:'一人食谱', subtitle:'', imageUrl:'https://dish-1367781796.cos.ap-guangzhou.myqcloud.com/%E8%8F%9C%E5%93%81/%E6%A4%92%E7%9B%90%E8%99%BE.png', linkType:'DISCOVER', linkValue:'solo', platform:'MINIPROGRAM', sortOrder:3, status:'ACTIVE' },
];

// 选中项
const sel = ref<any>(null);
const selKey = ref('');
const selOrig = ref<any>(null);
const dirty = computed(() => sel.value && selOrig.value && JSON.stringify(sel.value) !== JSON.stringify(selOrig.value));

function onItemSelect(item: any) {
  sel.value = reactive({ ...item });
  selKey.value = item._key;
  selOrig.value = { ...item };
}
function onPvSelect(type: string, data: any) {
  const key = type + '-' + (data.id || '');
  sel.value = reactive({ ...data, _key: key, _type: type, _title: data.title || data.name || type });
  selKey.value = key;
  selOrig.value = { ...data, _key: key, _type: type, _title: data.title || data.name || type };
}

// 数据加载
async function loadCards() {
  try {
    const res = await contentApi.getCards({ page: 1, pageSize: 99, platform: 'MINIPROGRAM' });
    const list = (res.data?.list || []) as any[];
    const apiTitles = new Set(list.map((c: any) => c.title));
    cards.value = [...list, ...D.filter(d => !apiTitles.has(d.title))];
  } catch (e) { cards.value = [...D]; }
}
async function loadHot() {
  try {
    const r: any = await request.get('/featured-recipes/hot', { params: { page: 1, pageSize: 6 } });
    hotRecipes.value = (r.data?.list || []).slice(0, 6).map((h: any) => ({
      id: h.id, name: h.title || h.name || '未知', coverUrl: h.coverImage || '',
    }));
  } catch (e) { /* ok */ }
}
async function refreshAll() { await Promise.all([loadCards(), loadHot()]); ElMessage.success('已刷新'); }

// 保存
async function save() {
  const s = sel.value; if (!s) return;
  try {
    const t = s._type || '';
    if (t === 'brand' || t === 'app-logo' || t === 'web-logo') { brandLogoUrl.value = s.imageUrl; }
    else if (t === 'app-banner') { appBannerImg.value = s.imageUrl; }
    else if (t === 'web-hero') { webHeroImg.value = s.imageUrl; }
    else if (t === 'fitness') { fitnessImg.value = s.imageUrl; }
    else if (t === 'kids') { kidsImg.value = s.imageUrl; }
    else if (t === 'about') { aboutContent.value = s.content; }
    else if (t === 'hot') { await request.put(`/recipes/${s.id}`, { coverImage: s.coverUrl || s.imageUrl }); loadHot(); }
    else if (t === 'card') {
      const isNew = s.id >= 9000 || s.id === 0;
      if (isNew) await contentApi.createCard({ title: s.title, subtitle: s.subtitle, imageUrl: s.imageUrl, linkType: s.linkType || 'DISCOVER', linkValue: s.linkValue || '', sortOrder: 0, status: 'ACTIVE', platform: 'MINIPROGRAM' });
      else await contentApi.updateCard(s.id, { title: s.title, subtitle: s.subtitle, imageUrl: s.imageUrl, linkType: s.linkType, linkValue: s.linkValue });
      loadCards();
    }
    ElMessage.success('已保存'); selOrig.value = { ...s };
  } catch (e: any) { ElMessage.error(e?.message || '保存失败'); }
}
function revert() { if (selOrig.value && sel.value) Object.assign(sel.value, selOrig.value); }

// 上传
async function upload(file: any) {
  const raw = file?.raw; if (!raw || !(raw instanceof File)) return;
  try {
    const fd = new FormData(); fd.append('file', raw); fd.append('folder', 'banners');
    const token = localStorage.getItem('token');
    const res = await axios.post('/v1/upload', fd, { headers: token ? { Authorization: `Bearer ${token}` } : {}, timeout: 60000 });
    const url = res.data?.data?.url || (res.data as any)?.url || '';
    if (url && sel.value) { sel.value.imageUrl = url; ElMessage.success('上传成功'); }
  } catch (e: any) { ElMessage.error('上传失败'); }
}

// AI 图片
const aiImgOpen = ref(false); const aiImgLoading = ref(false); const aiImgResult = ref('');
const aiImg = reactive({ tid: '' as string | number, name: '', ing: '' });
const tpls = ref<any[]>([]);
async function loadTpls() {
  try {
    const r: any = await request.get('/ai/templates');
    tpls.value = r.data || [];
    if (tpls.value.length && !aiImg.tid) aiImg.tid = tpls.value[0].id;
  } catch (e: any) { ElMessage.warning('加载模板失败: ' + (e?.message || '')); }
}
async function aiGenImg() { aiImgLoading.value = true; aiImgResult.value = ''; try { const r: any = await request.post('/ai/generate-image', { templateId: aiImg.tid, dishName: aiImg.name || sel.value?.title || '美食', ingredients: aiImg.ing || '新鲜食材' }); if (r.data?.url) aiImgResult.value = r.data.url; else ElMessage.error(r.message || '生成失败'); } catch (e: any) { const msg = e?.message || '生成失败'; if (msg.includes('401') || msg.includes('认证')) ElMessage.error('认证已过期，请刷新页面重新登录'); else ElMessage.error(msg); } finally { aiImgLoading.value = false; } }
function aiImgAdopt() { if (sel.value?.imageUrl !== undefined) sel.value.imageUrl = aiImgResult.value; aiImgOpen.value = false; aiImgResult.value = ''; }
function aiImgRetry() { aiImgResult.value = ''; aiGenImg(); }

// AI 文案
const aiTxtOpen = ref(false); const aiTxtLoading = ref(false); const aiTxtResult = ref('');
const aiTxt = reactive({ topic: '', len: 'short' as string });
async function aiGenTxt() { if (!aiTxt.topic) { ElMessage.warning('请输入主题'); return; } aiTxtLoading.value = true; aiTxtResult.value = ''; try { const r: any = await request.post('/ai/generate-text', { topic: aiTxt.topic, length: aiTxt.len }); if (r.data?.content) aiTxtResult.value = r.data.content; } catch (e: any) { ElMessage.error(e?.message); } finally { aiTxtLoading.value = false; } }
function aiTxtAdopt() { if (sel.value?.content !== undefined) sel.value.content = aiTxtResult.value; aiTxtOpen.value = false; aiTxtResult.value = ''; }

function togglePreview() { showPreview.value = !showPreview.value; }

watch(platform, (val) => {
  if (val === 'MINIPROGRAM') pageId.value = 'home';
  else if (val === 'APP') pageId.value = 'app';
  else pageId.value = 'web';
  loadHot();
});
watch(pageId, (val) => {
  if (val === 'home') loadHot();
  if (val === 'custom') loadCards();
  if (val === 'app' || val === 'web') loadHot();
});
onMounted(() => { loadCards(); loadHot(); loadTpls(); });
</script>

<style scoped lang="scss">
.co-root { height: calc(100vh - 64px); display: flex; flex-direction: column; overflow: hidden; }
.co-bar { display: flex; align-items: center; justify-content: space-between; padding: 10px 20px; border-bottom: 1px solid var(--border-primary); background: var(--surface-100); flex-shrink: 0; }
.co-bar-l { display: flex; align-items: center; gap: 12px; }
.co-bar-r { display: flex; gap: 8px; }
.co-t { font-size: 16px; font-weight: 600; color: var(--text-strong); margin: 0; }
.co-sep { color: #ddd; }
.co-body { display: flex; flex: 1; overflow: hidden; }
.co-mid { flex: 1; display: flex; justify-content: center; padding: 16px 8px; overflow-y: auto; }
.co-right { width: 320px; flex-shrink: 0; border-left: 1px solid var(--border-primary); overflow-y: auto; background: var(--surface-100); }
.co-pnl { padding: 16px; }
.co-phd { font-size: 14px; font-weight: 600; color: var(--text-strong); margin-bottom: 12px; }
.co-pimg { margin-bottom: 12px; img { width: 100%; border-radius: 8px; } }
.co-pimge { height: 100px; background: var(--surface-300); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: var(--muted); font-size: 12px; }
.co-pia { display: flex; gap: 6px; margin-top: 8px; }
.co-pfm { display: flex; flex-direction: column; gap: 10px; }
.co-fld { display: flex; flex-direction: column; gap: 4px; label { font-size: 12px; color: var(--muted); } }
.ai-dw { display: flex; flex-direction: column; gap: 14px; }
.ai-fd { display: flex; flex-direction: column; gap: 4px; label { font-size: 13px; font-weight: 500; } }
.ai-rt { font-size: 13px; line-height: 1.7; padding: 12px; background: var(--surface-200); border-radius: 8px; white-space: pre-wrap; }
</style>
