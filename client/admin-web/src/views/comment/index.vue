<template>
  <div class="page-container">
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">评论管理</h2>
        <p class="text-muted">统一管理菜谱作品下的评论、回复和点赞互动</p>
      </div>
      <div class="header-actions">
        <el-button :icon="Refresh" :loading="loading" @click="fetchComments">刷新</el-button>
      </div>
    </div>

    <div class="overview-grid">
      <div class="metric-card">
        <span class="metric-value">{{ pagination.total }}</span>
        <span class="metric-label">筛选结果</span>
      </div>
      <div class="metric-card">
        <span class="metric-value">{{ rootCount }}</span>
        <span class="metric-label">本页一级评论</span>
      </div>
      <div class="metric-card">
        <span class="metric-value">{{ replyCount }}</span>
        <span class="metric-label">本页回复</span>
      </div>
      <div class="metric-card">
        <span class="metric-value">{{ likeCount }}</span>
        <span class="metric-label">本页点赞</span>
      </div>
    </div>

    <div class="card-container">
      <div class="filter-section">
        <div class="filter-left">
          <el-select
            v-model="filters.recipeId"
            filterable
            remote
            clearable
            reserve-keyword
            placeholder="搜索菜谱标题/作者"
            :remote-method="searchRecipes"
            :loading="recipeSearching"
            style="width: 280px"
          >
            <el-option
              v-for="item in recipeOptions"
              :key="item.id"
              :label="`${item.title} (${item.commentCount})`"
              :value="item.id"
            />
          </el-select>
          <el-input v-model="filters.keyword" clearable placeholder="评论内容关键词" style="width: 220px" :prefix-icon="Search" @keyup.enter="handleSearch" />
          <el-input v-model="filters.userKeyword" clearable placeholder="用户昵称/手机号" style="width: 200px" :prefix-icon="User" @keyup.enter="handleSearch" />
          <el-select v-model="filters.parentType" clearable placeholder="评论类型" style="width: 130px">
            <el-option label="全部" value="" />
            <el-option label="一级评论" value="root" />
            <el-option label="回复" value="reply" />
          </el-select>
        </div>
        <div class="filter-right">
          <el-button @click="resetFilters">重置</el-button>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
        </div>
      </div>

      <el-table v-loading="loading" :data="tableData" row-key="id">
        <el-table-column label="评论内容" min-width="320">
          <template #default="{ row }">
            <div class="comment-cell">
              <el-tag v-if="row.parentId" size="small" type="info">回复</el-tag>
              <el-tag v-else size="small" type="success">评论</el-tag>
              <span class="comment-text">{{ row.content }}</span>
              <div v-if="row.parent" class="parent-preview">回复 @{{ row.parent.user.nickname || '用户' }}：{{ row.parent.content }}</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="用户" width="180">
          <template #default="{ row }">
            <div class="user-cell">
              <el-avatar :size="32" :src="row.user.avatar">{{ row.user.nickname?.charAt(0) }}</el-avatar>
              <div>
                <div class="name">{{ row.user.nickname || '未命名用户' }}</div>
                <div class="sub">ID: {{ row.user.id }}</div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="所属菜谱" min-width="220">
          <template #default="{ row }">
            <div class="recipe-cell">
              <el-image v-if="row.recipe.coverImage" :src="row.recipe.coverImage" fit="cover" class="recipe-cover" />
              <div class="recipe-cover placeholder" v-else><el-icon><Food /></el-icon></div>
              <div>
                <div class="name">{{ row.recipe.title || '-' }}</div>
                <div class="sub">ID: {{ row.recipe.id }}</div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="互动" width="110" align="center">
          <template #default="{ row }">
            <div class="interaction-cell">
              <span><el-icon><Pointer /></el-icon>{{ row.likeCount }}</span>
              <span><el-icon><ChatDotRound /></el-icon>{{ row.replyCount }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="时间" width="170">
          <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
        </el-table-column>

        <el-table-column label="操作" width="180" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row as AdminComment)">详情</el-button>
            <el-button link type="primary" @click="openEdit(row as AdminComment)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(row as AdminComment)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-footer">
        <span class="page-subtitle">共 {{ pagination.total }} 条</span>
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="sizes, prev, pager, next"
          background
          @size-change="handleSizeChange"
          @current-change="fetchComments"
        />
      </div>
    </div>

    <el-drawer v-model="detailVisible" title="评论详情" size="680px">
      <div v-if="currentComment" class="detail-panel">
        <div class="detail-main">{{ currentComment.content }}</div>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="评论ID">{{ currentComment.id }}</el-descriptions-item>
          <el-descriptions-item label="类型">{{ currentComment.parentId ? '回复' : '一级评论' }}</el-descriptions-item>
          <el-descriptions-item label="用户">{{ currentComment.user.nickname || currentComment.user.id }}</el-descriptions-item>
          <el-descriptions-item label="菜谱">{{ currentComment.recipe.title }}</el-descriptions-item>
          <el-descriptions-item label="点赞">{{ currentComment.likeCount }}</el-descriptions-item>
          <el-descriptions-item label="回复">{{ currentComment.replyCount }}</el-descriptions-item>
        </el-descriptions>

        <div v-if="currentComment.replies?.length" class="reply-list">
          <h3>回复列表</h3>
          <div v-for="reply in currentComment.replies" :key="reply.id" class="reply-item">
            <el-avatar :size="28" :src="reply.user.avatar">{{ reply.user.nickname?.charAt(0) }}</el-avatar>
            <div>
              <div class="reply-meta">{{ reply.user.nickname || '用户' }} · {{ formatDateTime(reply.createdAt) }}</div>
              <div class="reply-content">{{ reply.content }}</div>
            </div>
          </div>
        </div>
      </div>
    </el-drawer>

    <el-dialog v-model="editVisible" title="编辑评论" width="520px">
      <el-input v-model="editForm.content" type="textarea" :rows="5" maxlength="1000" show-word-limit />
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveEdit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ChatDotRound, Food, Pointer, Refresh, Search, User } from '@element-plus/icons-vue';
import { commentApi, type AdminComment, type CommentRecipeOption } from '@/api/comment';
import { usePreferences } from '@/composables/usePreferences';

const { defaultPageSize, formatDateTime } = usePreferences();
const loading = ref(false);
const recipeSearching = ref(false);
const tableData = ref<AdminComment[]>([]);
const recipeOptions = ref<CommentRecipeOption[]>([]);
const detailVisible = ref(false);
const editVisible = ref(false);
const saving = ref(false);
const currentComment = ref<AdminComment | null>(null);

const filters = reactive({
  keyword: '',
  userKeyword: '',
  recipeId: undefined as number | undefined,
  parentType: '' as '' | 'root' | 'reply',
});

const pagination = reactive({
  page: 1,
  pageSize: 0,
  total: 0,
});

const editForm = reactive({
  id: 0,
  content: '',
});

const rootCount = computed(() => tableData.value.filter(item => !item.parentId).length);
const replyCount = computed(() => tableData.value.filter(item => item.parentId).length);
const likeCount = computed(() => tableData.value.reduce((sum, item) => sum + item.likeCount, 0));

async function fetchComments() {
  loading.value = true;
  try {
    const res = await commentApi.list({
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: filters.keyword || undefined,
      userKeyword: filters.userKeyword || undefined,
      recipeId: filters.recipeId,
      parentType: filters.parentType || undefined,
    });
    tableData.value = res.data?.list || [];
    pagination.total = res.data?.total || 0;
  } finally {
    loading.value = false;
  }
}

async function searchRecipes(keyword: string) {
  recipeSearching.value = true;
  try {
    const res = await commentApi.recipeOptions(keyword);
    recipeOptions.value = res.data || [];
  } finally {
    recipeSearching.value = false;
  }
}

function handleSearch() {
  pagination.page = 1;
  fetchComments();
}

function resetFilters() {
  filters.keyword = '';
  filters.userKeyword = '';
  filters.recipeId = undefined;
  filters.parentType = '';
  pagination.page = 1;
  fetchComments();
}

function handleSizeChange() {
  pagination.page = 1;
  fetchComments();
}

async function openDetail(row: AdminComment) {
  const res = await commentApi.detail(row.id);
  currentComment.value = res.data || row;
  detailVisible.value = true;
}

function openEdit(row: AdminComment) {
  editForm.id = row.id;
  editForm.content = row.content;
  editVisible.value = true;
}

async function saveEdit() {
  if (!editForm.content.trim()) {
    ElMessage.warning('评论内容不能为空');
    return;
  }
  saving.value = true;
  try {
    await commentApi.update(editForm.id, { content: editForm.content.trim() });
    ElMessage.success('评论已更新');
    editVisible.value = false;
    fetchComments();
  } finally {
    saving.value = false;
  }
}

async function handleDelete(row: AdminComment) {
  await ElMessageBox.confirm(`确定删除这条评论吗？${row.replyCount ? `会同时删除 ${row.replyCount} 条回复。` : ''}`, '删除确认', { type: 'warning' });
  await commentApi.delete(row.id);
  ElMessage.success('评论已删除');
  fetchComments();
}

onMounted(() => {
  pagination.pageSize = defaultPageSize();
  searchRecipes('');
  fetchComments();
});
</script>

<style scoped lang="scss">
.overview-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.metric-card {
  display: flex;
  flex-direction: column;
  padding: 18px 20px;
  background: var(--surface-200);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
}

.metric-value {
  font-family: var(--font-display);
  font-size: 28px;
  color: var(--cursor-dark);
}

.metric-label {
  color: rgba(38, 37, 30, 0.55);
  font-size: 13px;
}

.filter-section {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--border-primary);
}

.filter-left,
.filter-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.comment-cell {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.comment-text {
  color: var(--cursor-dark);
  line-height: 1.5;
}

.parent-preview,
.sub,
.reply-meta {
  color: rgba(38, 37, 30, 0.48);
  font-size: 12px;
}

.user-cell,
.recipe-cell,
.interaction-cell,
.reply-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.name {
  color: var(--cursor-dark);
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recipe-cover {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  overflow: hidden;
  flex-shrink: 0;
}

.recipe-cover.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-300);
}

.interaction-cell {
  justify-content: center;
  flex-direction: column;
  gap: 3px;
  color: rgba(38, 37, 30, 0.6);
}

.table-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 18px;
}

.detail-panel {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.detail-main {
  padding: 16px;
  border-radius: var(--radius-md);
  background: var(--surface-300);
  color: var(--cursor-dark);
  line-height: 1.7;
}

.reply-list {
  display: flex;
  flex-direction: column;
  gap: 10px;

  h3 {
    font-size: 15px;
    color: var(--cursor-dark);
  }
}

.reply-item {
  align-items: flex-start;
  padding: 12px;
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  background: var(--surface-100);
}

.reply-content {
  color: var(--cursor-dark);
  margin-top: 2px;
}

@media (max-width: 900px) {
  .overview-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
