<template>
  <div class="page-container">
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">内容运营</h2>
        <p class="text-muted">管理 Banner、公告等运营内容</p>
      </div>
    </div>

    <el-tabs v-model="activeTab" class="content-tabs">
      <!-- Banner 管理 -->
      <el-tab-pane label="Banner 管理" name="banners">
        <div class="tab-content">
          <div class="tab-header">
            <el-button type="primary" @click="handleAddBanner">
              <el-icon><Plus /></el-icon>
              添加 Banner
            </el-button>
          </div>

          <div class="mobile-hint"><el-icon><DArrowLeft /></el-icon><span>左右滑动查看更多</span><el-icon><DArrowRight /></el-icon></div>
          <div class="hide-mobile">
          <el-table :data="banners" v-loading="loading" row-key="id">
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column label="Banner 图" width="180">
              <template #default="{ row }">
                <el-image :src="row.imageUrl" fit="cover" class="banner-preview">
                  <template #error>
                    <div class="preview-placeholder">
                      <el-icon><Picture /></el-icon>
                    </div>
                  </template>
                </el-image>
              </template>
            </el-table-column>
            <el-table-column prop="title" label="标题" min-width="150">
              <template #default="{ row }">
                <div class="banner-title">
                  <span>{{ row.title }}</span>
                  <span v-if="row.subtitle" class="subtitle">{{ row.subtitle }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="跳转" width="150">
              <template #default="{ row }">
                <div class="link-info">
                  <span class="link-type">{{ getLinkTypeText(row.linkType) }}</span>
                  <span v-if="row.linkValue" class="link-value">{{ row.linkValue }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="sortOrder" label="排序" width="80" align="center" />
            <el-table-column prop="status" label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-switch
                  v-model="row.status"
                  active-value="ACTIVE"
                  inactive-value="INACTIVE"
                  @change="handleBannerStatusChange(row)"
                />
              </template>
            </el-table-column>
            <el-table-column label="展示时间" width="200">
              <template #default="{ row }">
                <span class="text-muted text-small">
                  {{ row.startTime ? formatTime(row.startTime) : '-' }}
                  ~
                  {{ row.endTime ? formatTime(row.endTime) : '-' }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="140" fixed="right" align="center">
              <template #default="{ row }">
                <div class="action-buttons">
                  <el-button type="primary" link @click="handleEditBanner(row)">
                    <el-icon><Edit /></el-icon>
                    编辑
                  </el-button>
                  <el-button type="danger" link @click="handleDeleteBanner(row)">
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>

          <div v-if="banners.length === 0 && !loading" class="empty-state">
            <div class="empty-icon"><el-icon><Picture /></el-icon></div>
            <div class="empty-title">暂无 Banner</div>
            <div class="empty-desc">点击上方按钮添加第一条 Banner</div>
            <el-button type="primary" @click="handleAddBanner">添加 Banner</el-button>
          </div>

          <div class="table-footer">
            <span class="page-subtitle">共 {{ bannerPagination.total }} 条</span>
            <el-pagination
              v-model:current-page="bannerPagination.page"
              v-model:page-size="bannerPagination.pageSize"
              :total="bannerPagination.total"
              :page-sizes="[10, 20, 50]"
              layout="sizes, prev, pager, next"
              background
              @size-change="handleBannerSizeChange"
              @current-change="handleBannerPageChange"
            />
          </div>
          </div><!-- /hide-mobile -->
        </div>
      </el-tab-pane>

      <!-- 公告管理 -->
      <el-tab-pane label="公告管理" name="notices">
        <div class="tab-content">
          <div class="tab-header">
            <el-button type="primary" @click="handleAddNotice">
              <el-icon><Plus /></el-icon>
              发布公告
            </el-button>
          </div>

          <div class="mobile-hint"><el-icon><DArrowLeft /></el-icon><span>左右滑动查看更多</span><el-icon><DArrowRight /></el-icon></div>
          <div class="hide-mobile">
          <el-table :data="notices" v-loading="noticeLoading" row-key="id">
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="title" label="标题" min-width="200" />
            <el-table-column label="类型" width="100" align="center">
              <template #default="{ row }">
                <span class="notice-type" :class="row.type?.toLowerCase()">
                  {{ getNoticeTypeText(row.type) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="content" label="内容" min-width="250" :show-overflow-tooltip="true">
              <template #default="{ row }">
                <span class="notice-content">{{ row.content }}</span>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100" align="center">
              <template #default="{ row }">
                <span class="status-pill" :class="getNoticeStatusClass(row.status)">
                  {{ getNoticeStatusText(row.status) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="发布时间" width="140" align="center">
              <template #default="{ row }">
                <span class="text-muted text-small">{{ row.publishedAt ? formatTime(row.publishedAt) : '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="140" fixed="right" align="center">
              <template #default="{ row }">
                <div class="action-buttons">
                  <el-button type="primary" link @click="handleEditNotice(row)">
                    <el-icon><Edit /></el-icon>
                    编辑
                  </el-button>
                  <el-button type="danger" link @click="handleDeleteNotice(row)">
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>
          </div><!-- /hide-mobile -->

          <div v-if="notices.length === 0 && !noticeLoading" class="empty-state">
            <div class="empty-icon"><el-icon><ChatDotRound /></el-icon></div>
            <div class="empty-title">暂无公告</div>
            <div class="empty-desc">点击上方按钮发布第一条公告</div>
            <el-button type="primary" @click="handleAddNotice">发布公告</el-button>
          </div>

          <div class="table-footer">
            <span class="page-subtitle">共 {{ noticePagination.total }} 条</span>
            <el-pagination
              v-model:current-page="noticePagination.page"
              v-model:page-size="noticePagination.pageSize"
              :total="noticePagination.total"
              :page-sizes="[10, 20, 50]"
              layout="sizes, prev, pager, next"
              background
              @size-change="handleNoticeSizeChange"
              @current-change="handleNoticePageChange"
            />
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- Banner 编辑对话框 -->
    <el-dialog
      v-model="bannerDialogVisible"
      :title="isEditBanner ? '编辑 Banner' : '添加 Banner'"
      width="600px"
    >
      <el-form ref="bannerFormRef" :model="bannerForm" :rules="bannerRules" label-position="top">
        <el-form-item label="Banner 标题" prop="title">
          <el-input v-model="bannerForm.title" placeholder="请输入 Banner 标题" />
        </el-form-item>
        <el-form-item label="副标题">
          <el-input v-model="bannerForm.subtitle" placeholder="请输入副标题（可选）" />
        </el-form-item>
        <el-form-item label="Banner 图片" prop="imageUrl">
          <div class="banner-upload-area">
            <el-upload
              action="#"
              :auto-upload="false"
              :show-file-list="false"
              accept="image/*"
              class="banner-upload"
              @change="handleBannerImageChange"
            >
              <img v-if="bannerPreview || bannerForm.imageUrl" :src="bannerPreview || bannerForm.imageUrl" class="banner-image-preview" />
              <div v-else class="upload-placeholder">
                <el-icon><Plus /></el-icon>
                <span>点击上传图片</span>
                <span class="hint">建议尺寸 750x400</span>
              </div>
            </el-upload>
            <div v-if="bannerUploading" class="upload-mask">
              <el-icon class="is-loading"><Loading /></el-icon>
              <span>上传中...</span>
            </div>
          </div>
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="跳转类型" prop="linkType">
              <el-select v-model="bannerForm.linkType" placeholder="选择跳转类型" style="width: 100%">
                <el-option label="无跳转" value="NONE" />
                <el-option label="食谱详情" value="RECIPE" />
                <el-option label="网页链接" value="WEBVIEW" />
                <el-option label="分类页面" value="CATEGORY" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="跳转值">
              <el-input v-model="bannerForm.linkValue" placeholder="根据类型填写对应值" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="排序">
              <el-input-number v-model="bannerForm.sortOrder" :min="0" :max="999" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态">
              <el-radio-group v-model="bannerForm.status">
                <el-radio value="ACTIVE">启用</el-radio>
                <el-radio value="INACTIVE">禁用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="开始时间">
              <el-date-picker
                v-model="bannerForm.startTime"
                type="datetime"
                placeholder="选择开始时间"
                style="width: 100%"
                value-format="YYYY-MM-DDTHH:mm:ss"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="结束时间">
              <el-date-picker
                v-model="bannerForm.endTime"
                type="datetime"
                placeholder="选择结束时间"
                style="width: 100%"
                value-format="YYYY-MM-DDTHH:mm:ss"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="bannerDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="bannerSaving" @click="handleSaveBanner">保存</el-button>
      </template>
    </el-dialog>

    <!-- 公告编辑对话框 -->
    <el-dialog
      v-model="noticeDialogVisible"
      :title="isEditNotice ? '编辑公告' : '发布公告'"
      width="600px"
    >
      <el-form ref="noticeFormRef" :model="noticeForm" :rules="noticeRules" label-position="top">
        <el-form-item label="公告标题" prop="title">
          <el-input v-model="noticeForm.title" placeholder="请输入公告标题" />
        </el-form-item>
        <el-form-item label="公告类型" prop="type">
          <el-radio-group v-model="noticeForm.type">
            <el-radio value="NORMAL">普通</el-radio>
            <el-radio value="IMPORTANT">重要</el-radio>
            <el-radio value="ACTIVITY">活动</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="公告内容" prop="content">
          <el-input
            v-model="noticeForm.content"
            type="textarea"
            :rows="4"
            placeholder="请输入公告内容"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="noticeForm.status">
            <el-radio value="DRAFT">草稿</el-radio>
            <el-radio value="PUBLISHED">立即发布</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="noticeDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="noticeSaving" @click="handleSaveNotice">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import {
  Plus,
  Picture,
  Edit,
  Delete,
  Loading
} from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { contentApi } from '@/api/content';
import { uploadBanner } from '@/api/upload';
import { usePreferences } from '@/composables/usePreferences';

const { defaultPageSize, formatDateTime } = usePreferences();
const activeTab = ref('banners');
const loading = ref(false);
const noticeLoading = ref(false);
const banners = ref<any[]>([]);
const notices = ref<any[]>([]);

const bannerDialogVisible = ref(false);
const noticeDialogVisible = ref(false);
const isEditBanner = ref(false);
const isEditNotice = ref(false);
const bannerPreview = ref('');
const bannerFormRef = ref();
const noticeFormRef = ref();
const bannerSaving = ref(false);
const noticeSaving = ref(false);
const bannerUploading = ref(false);

const bannerPagination = reactive({ page: 1, pageSize: defaultPageSize(), total: 0 });
const noticePagination = reactive({ page: 1, pageSize: defaultPageSize(), total: 0 });

const bannerForm = reactive({
  id: 0 as number,
  title: '',
  subtitle: '',
  imageUrl: '',
  linkType: 'NONE',
  linkValue: '',
  sortOrder: 0,
  status: 'ACTIVE',
  startTime: '',
  endTime: '',
});

const bannerRules = {
  title: [{ required: true, message: '请输入 Banner 标题', trigger: 'blur' }],
  imageUrl: [{ required: true, message: '请上传 Banner 图片', trigger: 'change' }],
};

const noticeForm = reactive({
  id: 0 as number,
  title: '',
  type: 'NORMAL',
  content: '',
  status: 'DRAFT',
});

const noticeRules = {
  title: [{ required: true, message: '请输入公告标题', trigger: 'blur' }],
  type: [{ required: true, message: '请选择公告类型', trigger: 'change' }],
  content: [{ required: true, message: '请输入公告内容', trigger: 'blur' }],
};

function formatTime(iso: string) {
  return formatDateTime(iso);
}

function getLinkTypeText(type: string) {
  const map: Record<string, string> = {
    NONE: '无跳转',
    RECIPE: '食谱详情',
    WEBVIEW: '网页链接',
    CATEGORY: '分类页面',
  };
  return map[type] || type;
}

function getNoticeTypeText(type: string) {
  const map: Record<string, string> = {
    NORMAL: '普通',
    IMPORTANT: '重要',
    ACTIVITY: '活动',
  };
  return map[type] || type;
}

function getNoticeStatusText(status: string) {
  const map: Record<string, string> = {
    DRAFT: '草稿',
    PUBLISHED: '已发布',
    OFFLINE: '已下线',
  };
  return map[status] || status;
}

function getNoticeStatusClass(status: string) {
  const map: Record<string, string> = {
    DRAFT: 'draft',
    PUBLISHED: 'published',
    OFFLINE: 'offline',
  };
  return map[status] || '';
}

// ==================== Banner ====================

async function fetchBanners() {
  loading.value = true;
  try {
    const res = await contentApi.getBanners({
      page: bannerPagination.page,
      pageSize: bannerPagination.pageSize,
      status: 'ACTIVE',
    });
    const data = res.data ?? {};
    banners.value = data.list ?? [];
    bannerPagination.total = data.total ?? 0;
  } catch {
    ElMessage.error('加载 Banner 列表失败');
  } finally {
    loading.value = false;
  }
}

function handleAddBanner() {
  isEditBanner.value = false;
  Object.assign(bannerForm, {
    id: 0,
    title: '',
    subtitle: '',
    imageUrl: '',
    linkType: 'NONE',
    linkValue: '',
    sortOrder: banners.value.length,
    status: 'ACTIVE',
    startTime: '',
    endTime: '',
  });
  bannerPreview.value = '';
  bannerDialogVisible.value = true;
}

function handleEditBanner(row: any) {
  isEditBanner.value = true;
  Object.assign(bannerForm, {
    ...row,
    startTime: row.startTime ? new Date(row.startTime).toISOString().slice(0, 19) : '',
    endTime: row.endTime ? new Date(row.endTime).toISOString().slice(0, 19) : '',
  });
  bannerPreview.value = '';
  bannerDialogVisible.value = true;
}

async function handleBannerImageChange(file: any) {
  const raw = file.raw as File;
  if (!raw) return;
  bannerUploading.value = true;
  bannerPreview.value = URL.createObjectURL(raw);
  try {
    const result = await uploadBanner(raw);
    bannerForm.imageUrl = result.url || (result.data as any)?.url || '';
    ElMessage.success('图片上传成功');
  } catch {
    ElMessage.error('图片上传失败');
    bannerPreview.value = '';
  } finally {
    bannerUploading.value = false;
  }
}

async function handleSaveBanner() {
  const valid = await bannerFormRef.value?.validate().catch(() => false);
  if (!valid) return;

  bannerSaving.value = true;
  try {
    const payload = {
      title: bannerForm.title,
      subtitle: bannerForm.subtitle,
      imageUrl: bannerForm.imageUrl,
      linkType: bannerForm.linkType,
      linkValue: bannerForm.linkValue || undefined,
      sortOrder: bannerForm.sortOrder,
      status: bannerForm.status,
      startTime: bannerForm.startTime || undefined,
      endTime: bannerForm.endTime || undefined,
    };

    if (isEditBanner.value) {
      await contentApi.updateBanner(bannerForm.id, payload);
    } else {
      await contentApi.createBanner(payload);
    }

    ElMessage.success('保存成功');
    bannerDialogVisible.value = false;
    fetchBanners();
  } catch {
    ElMessage.error('保存失败');
  } finally {
    bannerSaving.value = false;
  }
}

async function handleDeleteBanner(row: any) {
  await ElMessageBox.confirm(`确定要删除 Banner「${row.title}」吗？`, '提示', { type: 'warning' });
  try {
    await contentApi.deleteBanner(row.id);
    ElMessage.success('删除成功');
    fetchBanners();
  } catch {
    ElMessage.error('删除失败');
  }
}

async function handleBannerStatusChange(row: any) {
  try {
    await contentApi.updateBanner(row.id, { status: row.status });
    const action = row.status === 'ACTIVE' ? '启用' : '禁用';
    ElMessage.success(`Banner 已${action}`);
  } catch {
    ElMessage.error('状态更新失败');
    row.status = row.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
  }
}

function handleBannerPageChange(page: number) {
  bannerPagination.page = page;
  fetchBanners();
}

function handleBannerSizeChange(size: number) {
  bannerPagination.pageSize = size;
  bannerPagination.page = 1;
  fetchBanners();
}

// ==================== Notice ====================

async function fetchNotices() {
  noticeLoading.value = true;
  try {
    const res = await contentApi.getNotices({
      page: noticePagination.page,
      pageSize: noticePagination.pageSize,
    });
    const data = res.data ?? {};
    notices.value = data.list ?? [];
    noticePagination.total = data.total ?? 0;
  } catch {
    ElMessage.error('加载公告列表失败');
  } finally {
    noticeLoading.value = false;
  }
}

function handleAddNotice() {
  isEditNotice.value = false;
  Object.assign(noticeForm, {
    id: 0,
    title: '',
    type: 'NORMAL',
    content: '',
    status: 'DRAFT',
  });
  noticeDialogVisible.value = true;
}

function handleEditNotice(row: any) {
  isEditNotice.value = true;
  Object.assign(noticeForm, { ...row });
  noticeDialogVisible.value = true;
}

async function handleSaveNotice() {
  const valid = await noticeFormRef.value?.validate().catch(() => false);
  if (!valid) return;

  noticeSaving.value = true;
  try {
    const payload = {
      title: noticeForm.title,
      content: noticeForm.content,
      type: noticeForm.type,
      status: noticeForm.status,
    };

    if (isEditNotice.value) {
      await contentApi.updateNotice(noticeForm.id, payload);
    } else {
      await contentApi.createNotice(payload);
    }

    ElMessage.success('保存成功');
    noticeDialogVisible.value = false;
    fetchNotices();
  } catch {
    ElMessage.error('保存失败');
  } finally {
    noticeSaving.value = false;
  }
}

async function handleDeleteNotice(row: any) {
  await ElMessageBox.confirm(`确定要删除公告「${row.title}」吗？`, '提示', { type: 'warning' });
  try {
    await contentApi.deleteNotice(row.id);
    ElMessage.success('删除成功');
    fetchNotices();
  } catch {
    ElMessage.error('删除失败');
  }
}

function handleNoticePageChange(page: number) {
  noticePagination.page = page;
  fetchNotices();
}

function handleNoticeSizeChange(size: number) {
  noticePagination.pageSize = size;
  noticePagination.page = 1;
  fetchNotices();
}

// ==================== Tab 懒加载 ====================

watch(activeTab, (tab) => {
  if (tab === 'banners' && banners.value.length === 0) {
    fetchBanners();
  } else if (tab === 'notices' && notices.value.length === 0) {
    fetchNotices();
  }
});
</script>

<style scoped lang="scss">
.page-header {
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

.content-tabs {
  :deep(.el-tabs__header) {
    margin-bottom: 24px;
  }
}

.tab-content {
  .tab-header {
    margin-bottom: 20px;
  }
}

.banner-preview {
  width: 160px;
  height: 60px;
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.preview-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-400);
  color: rgba(38, 37, 30, 0.3);

  .el-icon {
    font-size: 24px;
  }
}

.banner-title {
  display: flex;
  flex-direction: column;
  gap: 4px;

  .subtitle {
    font-family: var(--font-serif);
    font-size: 12px;
    color: rgba(38, 37, 30, 0.5);
  }
}

.link-info {
  display: flex;
  flex-direction: column;
  gap: 2px;

  .link-type {
    font-family: var(--font-display);
    font-size: 12px;
    color: var(--cursor-orange);
  }

  .link-value {
    font-family: var(--font-mono);
    font-size: 11px;
    color: rgba(38, 37, 30, 0.4);
  }
}

.notice-type {
  display: inline-flex;
  padding: 4px 10px;
  border-radius: var(--radius-pill);
  font-family: var(--font-display);
  font-size: 11px;
  background: var(--surface-400);
  color: rgba(38, 37, 30, 0.6);

  &.normal {
    background: var(--surface-400);
    color: rgba(38, 37, 30, 0.6);
  }

  &.important {
    background: rgba(207, 45, 86, 0.12);
    color: var(--color-error);
  }

  &.activity {
    background: rgba(31, 138, 101, 0.12);
    color: var(--color-success);
  }
}

.notice-content {
  font-family: var(--font-serif);
  font-size: 13px;
  color: rgba(38, 37, 30, 0.7);
}

.status-pill {
  display: inline-flex;
  padding: 4px 10px;
  border-radius: var(--radius-pill);
  font-family: var(--font-display);
  font-size: 11px;

  &.draft {
    background: var(--surface-400);
    color: rgba(38, 37, 30, 0.6);
  }

  &.published {
    background: rgba(31, 138, 101, 0.12);
    color: var(--color-success);
  }

  &.offline {
    background: rgba(212, 136, 14, 0.12);
    color: var(--color-warning);
  }
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 4px;
  justify-content: center;
}

.banner-upload-area {
  position: relative;

  .upload-mask {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background: rgba(255, 255, 255, 0.85);
    border-radius: var(--radius-md);
    font-family: var(--font-display);
    font-size: 13px;
    color: var(--cursor-orange);
    z-index: 1;
  }
}

.banner-upload {
  :deep(.el-upload) {
    width: 100%;
  }

  .banner-image-preview {
    width: 100%;
    max-height: 200px;
    object-fit: contain;
    border-radius: var(--radius-md);
    background: var(--surface-300);
  }

  .upload-placeholder {
    height: 160px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background: var(--surface-300);
    border: 2px dashed var(--border-medium);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all var(--transition-fast);

    &:hover {
      border-color: var(--cursor-orange);
    }

    .el-icon {
      font-size: 32px;
      color: rgba(38, 37, 30, 0.3);
    }

    span {
      font-family: var(--font-display);
      font-size: 13px;
      color: rgba(38, 37, 30, 0.6);
    }

    .hint {
      font-family: var(--font-mono);
      font-size: 11px;
      color: rgba(38, 37, 30, 0.4);
    }
  }
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
</style>
