<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <h2 class="page-title">内容运营</h2>
        <p class="page-subtitle">管理首页 Banner、系统公告与首页模块顺序</p>
      </div>
    </div>

    <div class="card-container">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="首页 Banner" name="banner">
          <div class="tab-toolbar">
            <el-button type="primary" @click="openBannerDialog()">新增 Banner</el-button>
          </div>

          <div class="banner-grid">
            <div v-for="(banner, index) in banners" :key="banner.id" class="banner-card" @click="openBannerDialog(banner)">
              <div class="drag-actions" @click.stop>
                <el-button link :disabled="index === 0" @click="moveBanner(index, -1)">上移</el-button>
                <el-button link :disabled="index === banners.length - 1" @click="moveBanner(index, 1)">下移</el-button>
              </div>
              <el-image :src="banner.imageUrl" class="banner-cover" fit="cover">
                <template #error><div class="image-placeholder">暂无图片</div></template>
              </el-image>
              <div class="banner-body">
                <div class="banner-title">{{ banner.title }}</div>
                <div class="banner-subtitle">{{ banner.subtitle || '未设置副标题' }}</div>
                <div class="banner-meta">
                  <el-tag size="small">{{ linkTypeText(banner.linkType) }}</el-tag>
                  <span>{{ banner.linkValue || '-' }}</span>
                </div>
                <div class="banner-footer" @click.stop>
                  <el-switch
                    v-model="banner.status"
                    active-value="ACTIVE"
                    inactive-value="INACTIVE"
                    active-text="启用"
                    @change="updateBannerStatus(banner)"
                  />
                  <span>{{ platformText(banner.platform || 'ALL') }}</span>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="系统公告" name="notice">
          <div class="tab-toolbar">
            <el-button type="primary" @click="openNoticeDialog()">新增公告</el-button>
          </div>
          <el-table :data="notices" v-loading="noticeLoading" @row-click="openNoticeDialog">
            <el-table-column prop="title" label="标题" min-width="220" />
            <el-table-column label="类型" width="110">
              <template #default="{ row }">{{ noticeTypeText(row.type) }}</template>
            </el-table-column>
            <el-table-column label="目标用户" width="120">
              <template #default="{ row }">{{ noticeTargetText(row.target) }}</template>
            </el-table-column>
            <el-table-column label="状态" width="110">
              <template #default="{ row }">
                <el-tag :type="noticeStatusTag(row.status)">{{ noticeStatusText(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="发布时间" width="180">
              <template #default="{ row }">{{ formatTime(row.publishedAt) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" @click.stop="openNoticeDialog(row as Notice)">编辑</el-button>
                <el-button link type="danger" @click.stop="deleteNotice(row as Notice)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="首页布局" name="layout">
          <div class="layout-preview">
            <div v-for="item in layoutItems" :key="item.key" class="layout-row">
              <span>{{ item.label }}</span>
              <small>{{ item.desc }}</small>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <el-dialog v-model="bannerDialogVisible" :title="bannerForm.id ? '编辑 Banner' : '新增 Banner'" width="720px">
      <el-form :model="bannerForm" label-width="96px">
        <el-form-item label="封面图">
          <div class="cover-row">
            <el-upload action="#" :auto-upload="false" :show-file-list="false" accept="image/*" @change="handleBannerUpload">
              <el-image v-if="bannerForm.imageUrl" :src="bannerForm.imageUrl" class="upload-preview" fit="cover" />
              <div v-else class="upload-box">上传封面</div>
            </el-upload>
            <el-button @click="aiDrawerVisible = true">AI 生成封面</el-button>
          </div>
        </el-form-item>
        <el-form-item label="标题"><el-input v-model="bannerForm.title" /></el-form-item>
        <el-form-item label="副标题"><el-input v-model="bannerForm.subtitle" /></el-form-item>
        <el-form-item label="跳转类型">
          <el-select v-model="bannerForm.linkType" style="width: 220px">
            <el-option label="无" value="NONE" />
            <el-option label="菜谱" value="RECIPE" />
            <el-option label="分类" value="CATEGORY" />
            <el-option label="链接" value="WEBVIEW" />
          </el-select>
        </el-form-item>
        <el-form-item label="跳转值"><el-input v-model="bannerForm.linkValue" placeholder="菜谱ID、分类值或 URL" /></el-form-item>
        <el-form-item label="显示平台">
          <el-checkbox-group v-model="bannerPlatforms">
            <el-checkbox label="APP">APP</el-checkbox>
            <el-checkbox label="MINIPROGRAM">小程序</el-checkbox>
            <el-checkbox label="WEB">Web</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="启用状态">
          <el-switch v-model="bannerForm.status" active-value="ACTIVE" inactive-value="INACTIVE" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button v-if="bannerForm.id" type="danger" link @click="deleteBanner">删除</el-button>
        <el-button @click="bannerDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="bannerSaving" @click="saveBanner">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="noticeDialogVisible" :title="noticeForm.id ? '编辑公告' : '新增公告'" width="680px">
      <el-form :model="noticeForm" label-width="96px">
        <el-form-item label="标题"><el-input v-model="noticeForm.title" /></el-form-item>
        <el-form-item label="内容"><el-input v-model="noticeForm.content" type="textarea" :rows="8" /></el-form-item>
        <el-form-item label="类型">
          <el-select v-model="noticeForm.type" style="width: 220px">
            <el-option label="普通" value="NORMAL" />
            <el-option label="重要" value="IMPORTANT" />
            <el-option label="活动" value="ACTIVITY" />
            <el-option label="系统" value="SYSTEM" />
            <el-option label="更新" value="UPDATE" />
            <el-option label="欢迎" value="WELCOME" />
          </el-select>
        </el-form-item>
        <el-form-item label="目标用户">
          <el-select v-model="noticeForm.target" style="width: 220px">
            <el-option label="全部" value="ALL" />
            <el-option label="新用户" value="NEW_USER" />
            <el-option label="活跃用户" value="ACTIVE_USER" />
            <el-option label="不活跃用户" value="INACTIVE_USER" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="noticeForm.status" style="width: 220px">
            <el-option label="草稿" value="DRAFT" />
            <el-option label="已发布" value="PUBLISHED" />
            <el-option label="已下线" value="OFFLINE" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="noticeDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="noticeSaving" @click="saveNotice">保存</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="aiDrawerVisible" title="AI 生成封面" size="900px">
      <ImageCreate />
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { contentApi, type Banner, type LinkType, type Notice, type NoticeStatus, type NoticeTarget, type NoticeType, type Platform } from '@/api/content';
import { uploadBanner } from '@/api/upload';
import ImageCreate from './ImageCreate.vue';

const activeTab = ref('banner');
const bannerLoading = ref(false);
const noticeLoading = ref(false);
const bannerSaving = ref(false);
const noticeSaving = ref(false);
const bannerDialogVisible = ref(false);
const noticeDialogVisible = ref(false);
const aiDrawerVisible = ref(false);
const banners = ref<Banner[]>([]);
const notices = ref<Notice[]>([]);
const bannerPlatforms = ref<Platform[]>(['APP', 'MINIPROGRAM', 'WEB']);

const bannerForm = reactive<Partial<Banner>>({
  title: '',
  subtitle: '',
  imageUrl: '',
  linkType: 'NONE',
  linkValue: '',
  sortOrder: 0,
  status: 'ACTIVE',
  platform: 'ALL',
});

const noticeForm = reactive<Partial<Notice>>({
  title: '',
  content: '',
  type: 'NORMAL',
  target: 'ALL',
  status: 'DRAFT',
});

const layoutItems = computed(() => [
  { key: 'banner', label: '首页 Banner', desc: `${banners.value.length} 个轮播项` },
  { key: 'notice', label: '系统公告', desc: `${notices.value.length} 条公告` },
  { key: 'hot', label: '热门/精选菜谱', desc: '在菜谱列表中统一配置' },
]);

async function loadBanners() {
  bannerLoading.value = true;
  try {
    const res = await contentApi.getBanners({ page: 1, pageSize: 99 });
    banners.value = res.data?.list || [];
  } finally {
    bannerLoading.value = false;
  }
}

async function loadNotices() {
  noticeLoading.value = true;
  try {
    const res = await contentApi.getNotices({ page: 1, pageSize: 99 });
    notices.value = res.data?.list || [];
  } finally {
    noticeLoading.value = false;
  }
}

function resetBannerForm() {
  Object.assign(bannerForm, {
    id: undefined,
    title: '',
    subtitle: '',
    imageUrl: '',
    linkType: 'NONE' as LinkType,
    linkValue: '',
    sortOrder: banners.value.length,
    status: 'ACTIVE',
    platform: 'ALL',
  });
  bannerPlatforms.value = ['APP', 'MINIPROGRAM', 'WEB'];
}

function openBannerDialog(row?: Banner) {
  resetBannerForm();
  if (row) {
    Object.assign(bannerForm, row);
    bannerPlatforms.value = row.platform && row.platform !== 'ALL'
      ? [row.platform]
      : ['APP', 'MINIPROGRAM', 'WEB'];
  }
  bannerDialogVisible.value = true;
}

async function handleBannerUpload(file: any) {
  const result = await uploadBanner(file.raw);
  bannerForm.imageUrl = result.url || '';
}

function normalizePlatform(): Platform {
  return bannerPlatforms.value.length === 1 ? bannerPlatforms.value[0] : 'ALL';
}

async function saveBanner() {
  if (!bannerForm.title || !bannerForm.imageUrl) {
    ElMessage.warning('请填写标题并上传封面图');
    return;
  }
  bannerSaving.value = true;
  try {
    const payload = {
      title: bannerForm.title!,
      subtitle: bannerForm.subtitle || '',
      imageUrl: bannerForm.imageUrl!,
      linkType: bannerForm.linkType || 'NONE',
      linkValue: bannerForm.linkValue || '',
      sortOrder: bannerForm.sortOrder || 0,
      status: bannerForm.status || 'ACTIVE',
      platform: normalizePlatform(),
    };
    if (bannerForm.id) await contentApi.updateBanner(bannerForm.id, payload);
    else await contentApi.createBanner(payload);
    ElMessage.success('保存成功');
    bannerDialogVisible.value = false;
    await loadBanners();
  } finally {
    bannerSaving.value = false;
  }
}

async function updateBannerStatus(row: Banner) {
  await contentApi.updateBanner(row.id, { status: row.status });
  ElMessage.success('状态已更新');
}

async function moveBanner(index: number, direction: -1 | 1) {
  const targetIndex = index + direction;
  const current = banners.value[index];
  const target = banners.value[targetIndex];
  if (!current || !target) return;
  const currentOrder = current.sortOrder;
  current.sortOrder = target.sortOrder;
  target.sortOrder = currentOrder;
  await Promise.all([
    contentApi.updateBanner(current.id, { sortOrder: current.sortOrder }),
    contentApi.updateBanner(target.id, { sortOrder: target.sortOrder }),
  ]);
  await loadBanners();
}

async function deleteBanner() {
  if (!bannerForm.id) return;
  await ElMessageBox.confirm('确定删除这个 Banner 吗？', '提示', { type: 'warning' });
  await contentApi.deleteBanner(bannerForm.id);
  ElMessage.success('删除成功');
  bannerDialogVisible.value = false;
  await loadBanners();
}

function resetNoticeForm() {
  Object.assign(noticeForm, {
    id: undefined,
    title: '',
    content: '',
    type: 'NORMAL' as NoticeType,
    target: 'ALL' as NoticeTarget,
    status: 'DRAFT' as NoticeStatus,
  });
}

function openNoticeDialog(row?: Notice) {
  resetNoticeForm();
  if (row) Object.assign(noticeForm, row);
  noticeDialogVisible.value = true;
}

async function saveNotice() {
  if (!noticeForm.title || !noticeForm.content) {
    ElMessage.warning('请填写标题和内容');
    return;
  }
  noticeSaving.value = true;
  try {
    const payload = {
      title: noticeForm.title!,
      content: noticeForm.content!,
      type: noticeForm.type || 'NORMAL',
      target: noticeForm.target || 'ALL',
      status: noticeForm.status || 'DRAFT',
      publishedAt: noticeForm.status === 'PUBLISHED' ? new Date().toISOString() : undefined,
    };
    if (noticeForm.id) await contentApi.updateNotice(noticeForm.id, payload);
    else await contentApi.createNotice(payload);
    ElMessage.success('保存成功');
    noticeDialogVisible.value = false;
    await loadNotices();
  } finally {
    noticeSaving.value = false;
  }
}

async function deleteNotice(row: Notice) {
  await ElMessageBox.confirm('确定删除这条公告吗？', '提示', { type: 'warning' });
  await contentApi.deleteNotice(row.id);
  ElMessage.success('删除成功');
  await loadNotices();
}

function linkTypeText(type: LinkType) {
  return ({ NONE: '无跳转', RECIPE: '菜谱', CATEGORY: '分类', WEBVIEW: '链接' } as Record<LinkType, string>)[type] || type;
}

function platformText(platform: Platform) {
  return ({ ALL: '全平台', APP: 'APP', MINIPROGRAM: '小程序', WEB: 'Web' } as Record<Platform, string>)[platform] || platform;
}

function noticeTypeText(type: NoticeType) {
  return ({ NORMAL: '普通', IMPORTANT: '重要', ACTIVITY: '活动', SYSTEM: '系统', UPDATE: '更新', WELCOME: '欢迎' } as Record<NoticeType, string>)[type] || type;
}

function noticeTargetText(target: NoticeTarget) {
  return ({ ALL: '全部', NEW_USER: '新用户', ACTIVE_USER: '活跃用户', INACTIVE_USER: '不活跃用户' } as Record<NoticeTarget, string>)[target] || target;
}

function noticeStatusText(status: NoticeStatus) {
  return ({ DRAFT: '草稿', PUBLISHED: '已发布', OFFLINE: '已下线' } as Record<NoticeStatus, string>)[status] || status;
}

function noticeStatusTag(status: NoticeStatus) {
  if (status === 'PUBLISHED') return 'success';
  if (status === 'OFFLINE') return 'info';
  return 'warning';
}

function formatTime(value?: string) {
  return value ? new Date(value).toLocaleString() : '-';
}

onMounted(() => {
  loadBanners();
  loadNotices();
});
</script>

<style scoped lang="scss">
.page-header {
  margin-bottom: 20px;
}

.tab-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
}

.banner-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.banner-card {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  background: var(--surface-100);
  cursor: pointer;
}

.drag-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 2;
  display: flex;
  gap: 4px;
  padding: 2px 6px;
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.88);
}

.banner-cover {
  width: 100%;
  height: 150px;
  display: block;
  background: var(--surface-300);
}

.image-placeholder,
.upload-box {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: rgba(38, 37, 30, 0.45);
  background: var(--surface-300);
}

.banner-body {
  padding: 12px;
}

.banner-title {
  font-weight: 600;
  color: var(--cursor-dark);
  margin-bottom: 4px;
}

.banner-subtitle,
.banner-meta,
.banner-footer {
  color: rgba(38, 37, 30, 0.62);
  font-size: 13px;
}

.banner-meta,
.banner-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 10px;
}

.cover-row {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.upload-preview,
.upload-box {
  width: 220px;
  height: 124px;
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px dashed var(--border-primary);
}

.layout-preview {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 520px;
}

.layout-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  background: var(--surface-100);

  span {
    font-weight: 600;
  }

  small {
    color: rgba(38, 37, 30, 0.55);
  }
}

@media (max-width: 1100px) {
  .banner-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .banner-grid {
    grid-template-columns: 1fr;
  }
}
</style>
