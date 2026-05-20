<template>
  <div class="page-container">
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">用户管理</h2>
        <p class="text-muted">管理平台注册用户</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" :icon="Plus" @click="showCreateDialog = true">新增用户</el-button>
        <el-button :icon="Download" @click="handleExport">导出</el-button>
        <el-button :icon="Refresh" @click="fetchUsers">刷新</el-button>
      </div>
    </div>

    <div class="card-container">
      <div class="filter-section">
        <div class="filter-left">
          <el-input
            v-model="filters.keyword"
            placeholder="搜索用户昵称或手机号..."
            clearable
            style="width: 260px"
            :prefix-icon="Search"
          />
          <el-select v-model="filters.gender" placeholder="性别" clearable style="width: 100px">
            <el-option label="全部" value="" />
            <el-option label="男" value="male" />
            <el-option label="女" value="female" />
          </el-select>
          <el-select v-model="filters.status" placeholder="状态" clearable style="width: 100px">
            <el-option label="全部" value="" />
            <el-option label="正常" value="ACTIVE" />
            <el-option label="禁用" value="DISABLED" />
          </el-select>
        </div>
        <el-button type="primary" @click="fetchUsers">
          <el-icon><Search /></el-icon>
          搜索
        </el-button>
      </div>

      <div class="mobile-hint"><el-icon><DArrowLeft /></el-icon><span>左右滑动查看更多</span><el-icon><DArrowRight /></el-icon></div>
      <div class="hide-mobile">
      <el-table
        v-loading="loading"
        :data="tableData"
        row-key="id"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="50" />
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="用户信息" min-width="200">
          <template #default="{ row }">
            <div class="user-info">
              <el-avatar :size="40" :src="row.avatar" class="user-avatar">
                {{ row.nickname?.charAt(0) }}
              </el-avatar>
              <div class="user-detail">
                <span class="user-name">{{ row.nickname || '未设置昵称' }}</span>
                <span class="user-id">ID: {{ row.id }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="手机号" width="130">
          <template #default="{ row }">
            <span class="text-mono">{{ row.phone || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="gender" label="性别" width="60" align="center">
          <template #default="{ row }">
            <span class="cursor-pill" :class="row.gender === 'MALE' ? 'info' : row.gender === 'FEMALE' ? 'success' : ''">
              {{ row.gender === 'MALE' ? '男' : row.gender === 'FEMALE' ? '女' : '-' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="简介" min-width="160">
          <template #default="{ row }">
            <span class="text-ellipsis" :title="row.bio || ''">{{ row.bio || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="数据统计" width="180" align="center">
          <template #default="{ row }">
            <div class="stats-mini">
              <span title="收藏数">
                <el-icon><Collection /></el-icon>
                {{ row.collectionCount }}
              </span>
              <span title="反馈数">
                <el-icon><ChatDotRound /></el-icon>
                {{ row.feedbackCount }}
              </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              active-value="ACTIVE"
              inactive-value="DISABLED"
              @change="handleStatusChange(row)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="注册时间" width="120" align="center">
          <template #default="{ row }">
            <span class="text-muted text-small">{{ row.createdAt }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right" align="center">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button type="primary" link @click="handleDetail(row)">
                <el-icon><View /></el-icon>
                详情
              </el-button>
              <el-button type="danger" link @click="handleDelete(row)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
      </div><!-- /hide-mobile -->

      <div v-if="tableData.length === 0 && !loading" class="empty-state">
        <div class="empty-icon"><el-icon><FolderOpened /></el-icon></div>
        <div class="empty-title">暂无用户</div>
        <div class="empty-desc">目前没有注册用户</div>
      </div>

      <div class="table-footer">
        <span class="page-subtitle">共 {{ pagination.total }} 条</span>
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="sizes, prev, pager, next"
          background
        />
      </div>
    </div>

    <!-- 新增用户对话框 -->
    <el-dialog v-model="showCreateDialog" title="新增用户" width="520px" destroy-on-close>
      <el-form :model="createForm" :rules="createRules" ref="createFormRef" label-width="80px">
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="createForm.nickname" placeholder="请输入用户昵称" maxlength="30" show-word-limit />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="createForm.phone" placeholder="请输入手机号" maxlength="11" />
        </el-form-item>
        <el-form-item label="登录密码" prop="password">
          <el-input v-model="createForm.password" type="password" placeholder="请输入登录密码（可选）" show-password />
        </el-form-item>
        <el-form-item label="性别" prop="gender">
          <el-select v-model="createForm.gender" placeholder="请选择性别" style="width: 100%">
            <el-option label="未设置" value="" />
            <el-option label="男" value="male" />
            <el-option label="女" value="female" />
          </el-select>
        </el-form-item>
        <el-form-item label="头像 URL" prop="avatar">
          <el-input v-model="createForm.avatar" placeholder="请输入头像图片地址（可选）" />
        </el-form-item>
        <el-form-item label="个人简介" prop="bio">
          <el-input v-model="createForm.bio" type="textarea" placeholder="请输入个人简介（可选）" :rows="3" maxlength="200" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" :loading="creating" @click="handleCreate">确认创建</el-button>
      </template>
    </el-dialog>

    <!-- 用户详情抽屉 -->
    <el-drawer v-model="detailVisible" :title="null" direction="rtl" size="880px" :show-close="false" class="user-detail-drawer">
      <template #header>
        <div class="drawer-header" v-if="currentUser">
          <div class="drawer-user-info">
            <el-upload
              action="#"
              :auto-upload="false"
              :show-file-list="false"
              accept="image/*"
              :before-upload="(file: File) => { handleAvatarChange(file); return false; }"
            >
              <el-avatar :size="56" :src="currentUser.avatar" class="detail-avatar uploadable-avatar">
                {{ currentUser.nickname?.charAt(0) }}
              </el-avatar>
              <div v-if="avatarUploading" class="avatar-upload-mask">
                <el-icon class="is-loading"><Upload /></el-icon>
              </div>
            </el-upload>
            <div>
              <div class="drawer-user-name">{{ currentUser.nickname || '未设置昵称' }}</div>
              <div class="drawer-user-sub">ID: {{ currentUser.id }} · {{ currentUser.phone || '未绑定手机' }}</div>
            </div>
          </div>
          <el-button @click="detailVisible = false"><el-icon><Close /></el-icon></el-button>
        </div>
      </template>

      <div v-if="currentUser" class="drawer-body">
        <!-- 快速统计 -->
        <div class="quick-stats">
          <div class="quick-stat-item">
            <span class="qs-value">{{ currentUser.collectionCount }}</span>
            <span class="qs-label">收藏</span>
          </div>
          <div class="quick-stat-item">
            <span class="qs-value">{{ currentUser.feedbackCount }}</span>
            <span class="qs-label">反馈</span>
          </div>
          <div class="quick-stat-item">
            <span class="qs-value">{{ currentUser.fridgeCount || 0 }}</span>
            <span class="qs-label">冰箱</span>
          </div>
          <div class="quick-stat-item">
            <span class="qs-value">{{ currentUser.aiScanCount || 0 }}</span>
            <span class="qs-label">AI扫描</span>
          </div>
        </div>

        <el-tabs v-model="activeDetailTab" class="user-detail-tabs">
          <!-- 基本信息 -->
          <el-tab-pane label="基本信息" name="info">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="性别">{{ currentUser.gender === 'MALE' ? '男' : currentUser.gender === 'FEMALE' ? '女' : '-' }}</el-descriptions-item>
              <el-descriptions-item label="状态">
                <el-tag :type="currentUser.status === 'ACTIVE' ? 'success' : 'danger'" size="small">
                  {{ currentUser.status === 'ACTIVE' ? '正常' : '禁用' }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="注册时间">{{ currentUser.createdAt }}</el-descriptions-item>
              <el-descriptions-item label="最后登录">{{ currentUser.lastLoginAt || '-' }}</el-descriptions-item>
              <el-descriptions-item label="个人简介" :span="2">{{ currentUser.bio || '未设置' }}</el-descriptions-item>
            </el-descriptions>
            <div class="tab-actions">
              <el-button type="primary" @click="handleEditUser">编辑用户</el-button>
              <el-button @click="handleStatusToggle">
                {{ currentUser.status === 'ACTIVE' ? '禁用账号' : '启用账号' }}
              </el-button>
            </div>
          </el-tab-pane>

          <!-- 收藏夹 -->
          <el-tab-pane label="收藏夹" name="collections">
            <div v-if="userDetailData.collections?.length" class="list-items">
              <div v-for="col in userDetailData.collections" :key="col.id" class="list-item-card">
                <div class="item-cover" v-if="col.coverImage">
                  <img :src="getFullImageUrl(col.coverImage)" />
                </div>
                <div class="item-cover item-cover-placeholder" v-else>
                  <el-icon><Folder /></el-icon>
                </div>
                <div class="item-info">
                  <div class="item-title">{{ col.name }}</div>
                  <div class="item-meta">{{ col.itemCount }} 个菜谱 · {{ col.isPublic ? '公开' : '私密' }}</div>
                  <div class="item-meta">创建于 {{ col.createdAt }}</div>
                </div>
              </div>
            </div>
            <div v-else class="empty-tab">
              <el-icon><Folder /></el-icon>
              <span>暂无收藏夹</span>
            </div>
          </el-tab-pane>

          <!-- 收藏菜谱 -->
          <el-tab-pane label="收藏菜谱" name="favorites">
            <div v-if="userDetailData.favorites?.length" class="list-items">
              <div v-for="fav in userDetailData.favorites" :key="fav.id" class="list-item-card">
                <div class="item-cover" v-if="fav.recipeCover">
                  <img :src="getFullImageUrl(fav.recipeCover)" />
                </div>
                <div class="item-cover item-cover-placeholder" v-else>
                  <el-icon><Food /></el-icon>
                </div>
                <div class="item-info">
                  <div class="item-title">{{ fav.recipeTitle || '未知菜谱' }}</div>
                  <div class="item-meta">收藏于 {{ formatTime(fav.createdAt) }}</div>
                </div>
              </div>
            </div>
            <div v-else class="empty-tab">
              <el-icon><Collection /></el-icon>
              <span>暂无收藏</span>
            </div>
          </el-tab-pane>

          <!-- 小菜篮 -->
          <el-tab-pane label="小菜篮" name="shopping">
            <div v-if="shoppingLoading" class="empty-tab"><el-icon class="is-loading"><Loading /></el-icon><span>加载中...</span></div>
            <div v-else-if="userDetailData.shoppingLists?.length" class="list-items">
              <div v-for="list in userDetailData.shoppingLists" :key="list.id" class="shopping-list-block">
                <div class="shopping-list-header">{{ list.name || '默认清单' }} ({{ list.items?.length || 0 }}项)</div>
                <div class="shopping-items">
                  <div v-for="item in list.items" :key="item.id" class="shopping-item">
                    <span>{{ item.name }}</span>
                    <span v-if="item.amount" class="item-amount">{{ item.amount }}{{ item.unit }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="empty-tab">
              <el-icon><ShoppingCart /></el-icon>
              <span>暂无购物清单</span>
            </div>
          </el-tab-pane>

          <!-- 小冰箱 -->
          <el-tab-pane label="小冰箱" name="fridge">
            <div class="fridge-toolbar">
              <el-input v-model="newFridgeItem.name" placeholder="添加食材名称" style="width: 200px" />
              <el-input v-model="newFridgeItem.amount" placeholder="数量" style="width: 100px" />
              <el-input v-model="newFridgeItem.unit" placeholder="单位（如：个）" style="width: 100px" />
              <el-button type="primary" @click="handleAddFridgeItem" :loading="fridgeSaving">添加</el-button>
            </div>
            <div v-if="userDetailData.fridgeItems?.length" class="fridge-list">
              <div v-for="item in userDetailData.fridgeItems" :key="item.id" class="fridge-item">
                <div class="fridge-item-info">
                  <span class="fridge-name">{{ item.name }}</span>
                  <span class="fridge-amount">{{ item.amount || '' }}{{ item.unit || '' }}</span>
                </div>
                <span class="fridge-category" v-if="item.category">{{ item.category }}</span>
                <el-button type="danger" link @click="handleDeleteFridgeItem(item.id)">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
            </div>
            <div v-else class="empty-tab">
              <el-icon><Goods /></el-icon>
              <span>冰箱是空的</span>
            </div>
          </el-tab-pane>

          <!-- AI 扫描 -->
          <el-tab-pane label="AI 扫描" name="aiscans">
            <div v-if="userDetailData.aiScans?.length" class="list-items">
              <div v-for="scan in userDetailData.aiScans" :key="scan.id" class="list-item-card compact">
                <div class="item-cover" v-if="scan.imageUrl">
                  <img :src="getFullImageUrl(scan.imageUrl)" />
                </div>
                <div class="item-cover item-cover-placeholder" v-else>
                  <el-icon><Cpu /></el-icon>
                </div>
                <div class="item-info">
                  <div class="item-title">扫描记录 #{{ scan.id }}</div>
                  <div class="item-meta">
                    <el-tag size="small" :type="scan.status === 'SUCCESS' ? 'success' : scan.status === 'FAILED' ? 'danger' : 'warning'">
                      {{ scan.status === 'SUCCESS' ? '成功' : scan.status === 'FAILED' ? '失败' : '处理中' }}
                    </el-tag>
                    · {{ scan.createdAt }}
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="empty-tab">
              <el-icon><Cpu /></el-icon>
              <span>暂无扫描记录</span>
            </div>
          </el-tab-pane>

          <!-- 浏览历史 -->
          <el-tab-pane label="浏览历史" name="history">
            <div v-if="userDetailData.browseHistory?.length" class="list-items">
              <div v-for="bh in userDetailData.browseHistory" :key="bh.id" class="list-item-card">
                <div class="item-cover" v-if="bh.recipeCover">
                  <img :src="getFullImageUrl(bh.recipeCover)" />
                </div>
                <div class="item-cover item-cover-placeholder" v-else>
                  <el-icon><Food /></el-icon>
                </div>
                <div class="item-info">
                  <div class="item-title">{{ bh.recipeTitle || '未知菜谱' }}</div>
                  <div class="item-meta">浏览于 {{ formatTime(bh.createdAt) }}</div>
                </div>
              </div>
            </div>
            <div v-else class="empty-tab">
              <el-icon><Clock /></el-icon>
              <span>暂无浏览记录</span>
            </div>
          </el-tab-pane>

          <!-- 通知记录 -->
          <el-tab-pane label="通知记录" name="notifications">
            <div v-if="userDetailData.notifications?.length" class="notification-list">
              <div v-for="n in userDetailData.notifications" :key="n.id" class="notification-item">
                <div class="notif-content">
                  <div class="notif-title">{{ n.title }}</div>
                  <div class="notif-body">{{ n.content }}</div>
                </div>
                <div class="notif-meta">
                  <el-tag v-if="n.isRead" size="small" type="info">已读</el-tag>
                  <el-tag v-else size="small" type="warning">未读</el-tag>
                  <span class="notif-time">{{ n.createdAt }}</span>
                </div>
              </div>
            </div>
            <div v-else class="empty-tab">
              <el-icon><Bell /></el-icon>
              <span>暂无通知</span>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-drawer>

    <!-- 导出弹窗 -->
    <el-dialog v-model="exportDialogVisible" title="导出用户" width="480px" :close-on-click-modal="false">
      <div class="export-dialog-body">
        <p class="export-tip">
          共 <strong>{{ pagination.total }}</strong> 条用户数据，将按照当前筛选条件导出
        </p>
        <div class="export-format-list">
          <label
            class="export-format-item"
            :class="{ active: exportFormat === 'xlsx' }"
            @click="exportFormat = 'xlsx'"
          >
            <input type="radio" name="exportFormat" value="xlsx" v-model="exportFormat" hidden />
            <div class="format-icon xlsx-icon"><span>Excel</span></div>
            <div class="format-info">
              <span class="format-name">Excel 格式</span>
              <span class="format-ext">.xlsx</span>
              <span class="format-desc">支持公式、筛选，适合数据分析</span>
            </div>
            <div class="format-check" v-if="exportFormat === 'xlsx'"><el-icon><Check /></el-icon></div>
          </label>

          <label
            class="export-format-item"
            :class="{ active: exportFormat === 'csv' }"
            @click="exportFormat = 'csv'"
          >
            <input type="radio" name="exportFormat" value="csv" v-model="exportFormat" hidden />
            <div class="format-icon csv-icon"><span>CSV</span></div>
            <div class="format-info">
              <span class="format-name">CSV 格式</span>
              <span class="format-ext">.csv</span>
              <span class="format-desc">体积更小，兼容所有编辑器</span>
            </div>
            <div class="format-check" v-if="exportFormat === 'csv'"><el-icon><Check /></el-icon></div>
          </label>

          <label
            class="export-format-item"
            :class="{ active: exportFormat === 'json' }"
            @click="exportFormat = 'json'"
          >
            <input type="radio" name="exportFormat" value="json" v-model="exportFormat" hidden />
            <div class="format-icon json-icon"><span>JSON</span></div>
            <div class="format-info">
              <span class="format-name">JSON 数据</span>
              <span class="format-ext">.json</span>
              <span class="format-desc">保留完整结构，适合程序导入</span>
            </div>
            <div class="format-check" v-if="exportFormat === 'json'"><el-icon><Check /></el-icon></div>
          </label>
        </div>
      </div>
      <template #footer>
        <el-button @click="exportDialogVisible = false" :disabled="exporting">取消</el-button>
        <el-button type="primary" :loading="exporting" @click="handleConfirm">
          确认导出
        </el-button>
      </template>
    </el-dialog>

    <!-- 编辑用户对话框 -->
    <el-dialog v-model="editVisible" title="编辑用户资料" width="520px" destroy-on-close>
      <el-form :model="editForm" :rules="editRules" ref="editFormRef" label-width="80px">
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="editForm.nickname" placeholder="请输入用户昵称" maxlength="30" show-word-limit />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="editForm.phone" placeholder="请输入手机号（选填）" maxlength="11" />
        </el-form-item>
        <el-form-item label="性别" prop="gender">
          <el-select v-model="editForm.gender" placeholder="请选择性别" style="width: 100%">
            <el-option label="未设置" value="" />
            <el-option label="男" value="male" />
            <el-option label="女" value="female" />
          </el-select>
        </el-form-item>
        <el-form-item label="个人简介" prop="bio">
          <el-input v-model="editForm.bio" type="textarea" placeholder="请输入个人简介（选填）" :rows="3" maxlength="200" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" :loading="editSaving" @click="handleSaveEdit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue';
import {
  Search, Refresh, Download, View, Delete, Collection, ChatDotRound,
  Plus, Upload, Check, Folder, Food, ShoppingCart, Goods, Cpu, Clock, Bell,
  Close, Loading,
} from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { userApi, type UserRow } from '@/api/user';
import { uploadAvatar } from '@/api/upload';
import { useExport, downloadFile } from '@/composables/useExport';
import { usePreferences } from '@/composables/usePreferences';

const { defaultPageSize } = usePreferences();
const loading = ref(false);
const detailVisible = ref(false);
const showCreateDialog = ref(false);
const creating = ref(false);
const currentUser = ref<UserRow | null>(null);
const selectedRows = ref<any[]>([]);
const avatarUploading = ref(false);
const editVisible = ref(false);
const editSaving = ref(false);
const editFormRef = ref<any>(null);
const editForm = reactive({
  nickname: '',
  phone: '',
  gender: '' as '' | 'male' | 'female',
  bio: '',
  avatar: '',
});
const editRules = {
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' },
  ],
};
const { exportDialogVisible, exportFormat, exporting, showExportDialog, handleConfirm } = useExport();

// 抽屉状态
const activeDetailTab = ref('info');
const userDetailData = ref<any>({});
const shoppingLoading = ref(false);
const fridgeSaving = ref(false);
const newFridgeItem = reactive({ name: '', amount: '', unit: '' });

const createForm = reactive({
  nickname: '',
  phone: '',
  password: '',
  gender: '' as '' | 'male' | 'female',
  avatar: '',
  bio: '',
});

const createRules = {
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' },
  ],
};

const createFormRef = ref<any>(null);

const filters = reactive({
  keyword: '',
  gender: '',
  status: '',
});

const pagination = reactive({
  page: 1,
  pageSize: defaultPageSize(),
  total: 0,
});

const tableData = ref<UserRow[]>([]);

function handleSelectionChange(rows: any[]) {
  selectedRows.value = rows;
}

async function fetchUsers() {
  loading.value = true;
  try {
    const res = await userApi.list({
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: filters.keyword || undefined,
      gender: filters.gender || undefined,
      status: filters.status || undefined,
    });
    tableData.value = res.data?.list || [];
    pagination.total = res.data?.total || 0;
  } catch (error) {
    console.error('获取用户列表失败:', error);
  } finally {
    loading.value = false;
  }
}

async function handleAvatarChange(file: File) {
  if (!currentUser.value) return;
  avatarUploading.value = true;
  try {
    const result = await uploadAvatar(file as any, String(currentUser.value.id));
    const avatarUrl = result.url || (result.data as any)?.url || '';
    currentUser.value.avatar = avatarUrl;
    // 同步更新列表中的头像
    const row = tableData.value.find(r => r.id === currentUser.value!.id);
    if (row) row.avatar = avatarUrl;
    ElMessage.success('头像更新成功');
  } catch {
    ElMessage.error('头像上传失败');
  } finally {
    avatarUploading.value = false;
  }
}

function handleDetail(row: any) {
  currentUser.value = row;
  activeDetailTab.value = 'info';
  userDetailData.value = {};
  detailVisible.value = true;
  fetchUserDetail(row.id);
}

async function fetchUserDetail(userId: number) {
  try {
    const res = await userApi.detail(userId);
    const data = res.data as any;
    if (data) {
      currentUser.value = { ...currentUser.value, ...data };
      userDetailData.value = {
        favorites: data.favorites || [],
        collections: data.collections || [],
        fridgeItems: data.fridgeItems || [],
        aiScans: data.aiScans || [],
        browseHistory: data.browseHistory || [],
        notifications: data.notifications || [],
      };
    }
  } catch (e) {
    console.error('获取用户详情失败', e);
  }
}

async function fetchUserShoppingLists(userId: number) {
  if (userDetailData.value.shoppingLists) return;
  shoppingLoading.value = true;
  try {
    const res = await (userApi as any).getShoppingLists(userId);
    userDetailData.value.shoppingLists = (res.data as any[]) || [];
  } catch (e) {
    console.error('获取购物清单失败', e);
  } finally {
    shoppingLoading.value = false;
  }
}

function handleStatusToggle() {
  if (!currentUser.value) return;
  const newStatus = currentUser.value.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
  const action = newStatus === 'ACTIVE' ? '启用' : '禁用';
  ElMessageBox.confirm(`确定要${action}该用户账号？`, '确认', { type: 'warning' })
    .then(async () => {
      await userApi.updateStatus(currentUser.value!.id, newStatus);
      currentUser.value.status = newStatus;
      const row = tableData.value.find(r => r.id === currentUser.value!.id);
      if (row) row.status = newStatus;
      ElMessage.success(`用户已${action}`);
    })
    .catch(() => {});
}

async function handleAddFridgeItem() {
  if (!newFridgeItem.name.trim() || !currentUser.value) return;
  fridgeSaving.value = true;
  try {
    await (userApi as any).addFridgeItem(currentUser.value.id, {
      name: newFridgeItem.name.trim(),
      amount: newFridgeItem.amount || undefined,
      unit: newFridgeItem.unit || undefined,
    });
    ElMessage.success('食材已添加');
    newFridgeItem.name = '';
    newFridgeItem.amount = '';
    newFridgeItem.unit = '';
    fetchUserDetail(currentUser.value!.id);
  } catch {
    ElMessage.error('添加失败');
  } finally {
    fridgeSaving.value = false;
  }
}

async function handleDeleteFridgeItem(fridgeId: number) {
  if (!currentUser.value) return;
  try {
    await userApi.deleteFridgeItem(currentUser.value.id, fridgeId);
    ElMessage.success('已删除');
    userDetailData.value.fridgeItems = userDetailData.value.fridgeItems.filter((f: any) => f.id !== fridgeId);
  } catch {
    ElMessage.error('删除失败');
  }
}

function formatTime(timestamp: number) {
  if (!timestamp) return '-';
  return new Date(timestamp).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function getFullImageUrl(path: string) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `https://dish-1367781796.cos.ap-guangzhou.myqcloud.com${path.startsWith('/') ? '' : '/'}${path}`;
}

function handleEditUser() {
  if (!currentUser.value) return;
  editFormRef.value?.resetFields();
  Object.assign(editForm, {
    nickname: currentUser.value.nickname || '',
    phone: currentUser.value.phone || '',
    gender: (currentUser.value.gender || '').toLowerCase() as '' | 'male' | 'female',
    bio: currentUser.value.bio || '',
    avatar: currentUser.value.avatar || '',
  });
  editVisible.value = true;
}

async function handleSaveEdit() {
  if (!editFormRef.value) return;
  try {
    await editFormRef.value.validate();
  } catch {
    return;
  }
  editSaving.value = true;
  try {
    const payload: any = {};
    if (editForm.nickname) payload.nickname = editForm.nickname;
    if (editForm.gender) payload.gender = editForm.gender.toUpperCase();
    if (editForm.avatar) payload.avatar = editForm.avatar;
    if (editForm.bio !== undefined) payload.bio = editForm.bio;
    await userApi.update(currentUser.value!.id, payload);
    ElMessage.success('用户信息已更新');
    editVisible.value = false;
    fetchUserDetail(currentUser.value!.id);
    fetchUsers();
  } catch (e: any) {
    ElMessage.error(e?.message || '保存失败');
  } finally {
    editSaving.value = false;
  }
}

async function handleStatusChange(row: UserRow) {
  try {
    await userApi.updateStatus(row.id, row.status);
    const action = row.status === 'ACTIVE' ? '启用' : '禁用';
    ElMessage.success(`用户已${action}`);
  } catch {
    // revert UI
    row.status = row.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
  }
}

async function handleDelete(row: UserRow) {
  await ElMessageBox.confirm(`确定要删除用户「${row.nickname}」吗？删除后无法恢复。`, '警告', {
    type: 'warning',
  });
  await userApi.delete(row.id);
  ElMessage.success('删除成功');
  fetchUsers();
}

function handleExport() {
  const params = {
    keyword: filters.keyword || undefined,
    gender: filters.gender || undefined,
    status: filters.status || undefined,
  };
  showExportDialog({
    name: '用户',
    total: pagination.total,
    exportFn: (format) => downloadFile('/users/export', params, format),
  });
}

async function handleCreate() {
  if (!createForm.nickname && !createForm.phone) {
    ElMessage.warning('手机号或昵称至少填写一项');
    return;
  }
  try {
    await createFormRef.value.validate();
  } catch {
    return;
  }
  creating.value = true;
  try {
    const payload: any = {};
    if (createForm.nickname) payload.nickname = createForm.nickname;
    if (createForm.phone) payload.phone = createForm.phone;
    if (createForm.password) payload.password = createForm.password;
    if (createForm.gender) payload.gender = createForm.gender.toUpperCase();
    if (createForm.avatar) payload.avatar = createForm.avatar;
    if (createForm.bio) payload.bio = createForm.bio;

    await userApi.create(payload);
    ElMessage.success('用户创建成功');
    showCreateDialog.value = false;
    Object.assign(createForm, { nickname: '', phone: '', password: '', gender: '', avatar: '', bio: '' });
    fetchUsers();
  } catch (error: any) {
    ElMessage.error(error?.message || '创建失败');
  } finally {
    creating.value = false;
  }
}

watch(() => activeDetailTab.value, (tab) => {
  if (tab === 'shopping' && currentUser.value) {
    fetchUserShoppingLists(currentUser.value.id);
  }
});

onMounted(() => {
  pagination.pageSize = defaultPageSize();
  fetchUsers();
});
</script>

<style scoped lang="scss">
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
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

  .header-actions {
    display: flex;
    gap: 12px;
  }
}

.filter-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--border-primary);

  .filter-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;

  .user-avatar {
    flex-shrink: 0;
    background: var(--surface-400);
    color: var(--cursor-dark);
  }

  .user-detail {
    display: flex;
    flex-direction: column;
    gap: 2px;

    .user-name {
      font-family: var(--font-display);
      font-size: 14px;
      color: var(--cursor-dark);
    }

    .user-id {
      font-family: var(--font-mono);
      font-size: 11px;
      color: rgba(38, 37, 30, 0.4);
    }
  }
}

.stats-mini {
  display: flex;
  justify-content: center;
  gap: 16px;

  span {
    display: flex;
    align-items: center;
    gap: 4px;
    font-family: var(--font-mono);
    font-size: 12px;
    color: rgba(38, 37, 30, 0.6);

    .el-icon {
      font-size: 14px;
    }
  }
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 4px;
  justify-content: center;
}

.table-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--border-primary);
}

.user-detail-modal {
  .detail-header {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 24px;
    padding-bottom: 24px;
    border-bottom: 1px solid var(--border-primary);
    position: relative;

    .detail-avatar {
      flex-shrink: 0;
      background: var(--surface-400);
      color: var(--cursor-dark);
    }

    .uploadable-avatar {
      cursor: pointer;
      transition: opacity var(--transition-fast);
      &:hover { opacity: 0.8; }
    }

    .avatar-upload-mask {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      background: rgba(0,0,0,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
    }

    .detail-info {
      h3 {
        font-family: var(--font-display);
        font-size: 20px;
        font-weight: 400;
        color: var(--cursor-dark);
        margin-bottom: 4px;
      }
    }
  }

  .detail-descriptions {
    margin-bottom: 20px;
  }

  .detail-section {
    padding: 16px;
    background: var(--surface-300);
    border-radius: var(--radius-md);
    margin-top: 16px;

    h4 {
      font-family: var(--font-display);
      font-size: 13px;
      color: rgba(38, 37, 30, 0.7);
      margin-bottom: 8px;
    }

    p {
      font-family: var(--font-serif);
      font-size: 14px;
    }
  }
}

// 导出弹窗
.export-dialog-body {
  padding: 8px 4px;
}

.export-tip {
  color: rgba(38, 37, 30, 0.6);
  font-size: 13px;
  margin-bottom: 20px;

  strong {
    color: var(--cursor-orange);
    font-weight: 600;
  }
}

.export-format-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.export-format-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border: 1.5px solid var(--border-primary);
  border-radius: 10px;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
  user-select: none;

  &:hover {
    border-color: var(--cursor-orange);
    background: rgba(245, 111, 32, 0.04);
  }

  &.active {
    border-color: var(--cursor-orange);
    background: rgba(245, 111, 32, 0.06);

    .format-icon {
      opacity: 1;
    }
  }
}

.format-icon {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 13px;
  flex-shrink: 0;
  opacity: 0.7;
  transition: opacity 0.2s;
  color: #fff;

  &.xlsx-icon { background: #1d7a3d; }
  &.csv-icon { background: #3a6e38; }
  &.json-icon { background: #c47f17; }
}

.format-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.format-name {
  font-weight: 600;
  font-size: 14px;
  color: var(--cursor-dark);
  font-family: var(--font-display);
}

.format-ext {
  font-size: 11px;
  color: rgba(38, 37, 30, 0.4);
  font-family: monospace;
}

.format-desc {
  font-size: 12px;
  color: rgba(38, 37, 30, 0.5);
  margin-top: 2px;
}

.format-check {
  color: var(--cursor-orange);
  font-size: 18px;
  flex-shrink: 0;
}

// 用户详情抽屉
.user-detail-drawer {
  :deep(.el-drawer__header) {
    margin-bottom: 0;
    padding: 0;
    border-bottom: 1px solid var(--border-primary);
  }

  :deep(.el-drawer__body) {
    padding: 0;
  }
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
}

.drawer-user-info {
  display: flex;
  align-items: center;
  gap: 14px;

  .detail-avatar {
    background: var(--surface-400);
    color: var(--cursor-dark);
    cursor: pointer;
    flex-shrink: 0;
    position: relative;

    &.uploadable-avatar:hover { opacity: 0.85; }
  }

  .avatar-upload-mask {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: rgba(0,0,0,0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
  }

  .drawer-user-name {
    font-family: var(--font-display);
    font-size: 18px;
    font-weight: 400;
    color: var(--cursor-dark);
  }

  .drawer-user-sub {
    font-family: var(--font-mono);
    font-size: 12px;
    color: rgba(38, 37, 30, 0.5);
    margin-top: 2px;
  }
}

.drawer-body {
  padding: 0;
}

.quick-stats {
  display: flex;
  gap: 0;
  border-bottom: 1px solid var(--border-primary);
  background: var(--surface-200);

  .quick-stat-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 16px 8px;
    border-right: 1px solid var(--border-primary);
    cursor: default;

    &:last-child { border-right: none; }

    .qs-value {
      font-family: var(--font-display);
      font-size: 22px;
      font-weight: 400;
      color: var(--cursor-dark);
    }

    .qs-label {
      font-family: var(--font-mono);
      font-size: 11px;
      color: rgba(38, 37, 30, 0.5);
      margin-top: 2px;
    }
  }
}

.user-detail-tabs {
  :deep(.el-tabs__header) {
    margin: 0;
    background: var(--surface-100);
    padding: 0 24px;
    border-bottom: 1px solid var(--border-primary);
  }

  :deep(.el-tabs__nav-wrap::after) {
    display: none;
  }

  :deep(.el-tabs__content) {
    padding: 20px 24px;
  }
}

.tab-actions {
  display: flex;
  gap: 10px;
  margin-top: 16px;
}

.list-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.list-item-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: var(--surface-100);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  transition: border-color 0.15s;

  &:hover { border-color: rgba(245, 78, 0, 0.3); }

  &.compact { padding: 8px 12px; }
}

.item-cover {
  width: 48px;
  height: 48px;
  border-radius: 6px;
  overflow: hidden;
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &.item-cover-placeholder {
    background: var(--surface-300);
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(38, 37, 30, 0.3);
    font-size: 20px;
  }
}

.item-info {
  flex: 1;
  min-width: 0;

  .item-title {
    font-family: var(--font-display);
    font-size: 14px;
    color: var(--cursor-dark);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .item-meta {
    font-family: var(--font-mono);
    font-size: 11px;
    color: rgba(38, 37, 30, 0.5);
    margin-top: 2px;
    display: flex;
    align-items: center;
    gap: 4px;
  }
}

.empty-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 40px 0;
  color: rgba(38, 37, 30, 0.3);
  font-family: var(--font-display);
  font-size: 14px;

  .el-icon { font-size: 32px; }
}

// 购物清单
.shopping-list-block {
  background: var(--surface-100);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  overflow: hidden;
  margin-bottom: 8px;

  .shopping-list-header {
    padding: 8px 12px;
    background: var(--surface-200);
    font-family: var(--font-display);
    font-size: 13px;
    font-weight: 500;
    color: var(--cursor-dark);
    border-bottom: 1px solid var(--border-primary);
  }

  .shopping-items { padding: 4px 0; }

  .shopping-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 12px;
    font-size: 13px;

    .item-amount {
      font-family: var(--font-mono);
      font-size: 12px;
      color: rgba(38, 37, 30, 0.5);
    }
  }
}

// 小冰箱
.fridge-toolbar {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 16px;
}

.fridge-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.fridge-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--surface-100);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);

  .fridge-item-info {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .fridge-name {
    font-family: var(--font-display);
    font-size: 14px;
    color: var(--cursor-dark);
  }

  .fridge-amount {
    font-family: var(--font-mono);
    font-size: 12px;
    color: rgba(38, 37, 30, 0.5);
  }

  .fridge-category {
    font-family: var(--font-mono);
    font-size: 11px;
    padding: 2px 6px;
    background: var(--surface-300);
    border-radius: 4px;
    color: rgba(38, 37, 30, 0.5);
  }
}

// 通知
.notification-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.notification-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background: var(--surface-100);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);

  .notif-content { flex: 1; }

  .notif-title {
    font-family: var(--font-display);
    font-size: 14px;
    color: var(--cursor-dark);
    margin-bottom: 4px;
  }

  .notif-body {
    font-family: var(--font-serif);
    font-size: 13px;
    color: rgba(38, 37, 30, 0.6);
  }

  .notif-meta {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
    flex-shrink: 0;
  }

  .notif-time {
    font-family: var(--font-mono);
    font-size: 11px;
    color: rgba(38, 37, 30, 0.4);
    white-space: nowrap;
  }
}
</style>
