<template>
  <div class="notification-page">
    <el-tabs v-model="activeTab">
      <el-tab-pane label="通知列表" name="list">
        <div class="toolbar">
          <el-select v-model="listQuery.type" clearable placeholder="类型" style="width: 160px" @change="loadNotifications">
            <el-option label="系统通知" value="SYSTEM" />
            <el-option label="公告" value="ANNOUNCEMENT" />
          </el-select>
          <el-input v-model="userIdInput" placeholder="用户ID" clearable style="width: 180px" @change="loadNotifications" />
        </div>

        <el-table v-loading="loading" :data="notifications" border>
          <el-table-column prop="type" label="类型" width="130" />
          <el-table-column prop="title" label="标题" min-width="180" show-overflow-tooltip />
          <el-table-column prop="receiverName" label="接收者" min-width="140">
            <template #default="{ row }">{{ row.receiverName || `用户 ${row.userId}` }}</template>
          </el-table-column>
          <el-table-column label="已读" width="90">
            <template #default="{ row }">
              <el-tag :type="row.isRead ? 'success' : 'warning'">{{ row.isRead ? '已读' : '未读' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="时间" width="170">
            <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="{ row }">
              <el-button link type="danger" @click="remove(row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="pager">
          <el-pagination
            v-model:current-page="listQuery.page"
            v-model:page-size="listQuery.pageSize"
            layout="total, sizes, prev, pager, next"
            :total="total"
            @current-change="loadNotifications"
            @size-change="loadNotifications"
          />
        </div>
      </el-tab-pane>

      <el-tab-pane label="发送通知" name="send">
        <el-form ref="formRef" :model="form" :rules="rules" label-width="96px" class="send-form">
          <el-form-item label="类型" prop="type">
            <el-radio-group v-model="form.type">
              <el-radio-button label="SYSTEM">系统通知</el-radio-button>
              <el-radio-button label="ANNOUNCEMENT">公告</el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="标题" prop="title">
            <el-input v-model="form.title" maxlength="60" show-word-limit />
          </el-form-item>
          <el-form-item label="内容" prop="content">
            <el-input v-model="form.content" type="textarea" :rows="6" maxlength="500" show-word-limit />
          </el-form-item>
          <el-form-item label="目标用户">
            <el-radio-group v-model="targetMode">
              <el-radio label="all">全体用户</el-radio>
              <el-radio label="users">指定用户</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item v-if="targetMode === 'users'" label="用户ID">
            <el-input v-model="userIdsText" placeholder="多个用户ID用英文逗号分隔" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="sending" @click="send">发送通知</el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { adminNotificationApi, type AdminNotificationItem, type AdminNotificationType } from '@/api/admin-notification';

const activeTab = ref('list');
const loading = ref(false);
const sending = ref(false);
const notifications = ref<AdminNotificationItem[]>([]);
const total = ref(0);
const userIdInput = ref('');
const targetMode = ref<'all' | 'users'>('all');
const userIdsText = ref('');
const formRef = ref<FormInstance>();

const listQuery = reactive<{ page: number; pageSize: number; type: AdminNotificationType | '' }>({
  page: 1,
  pageSize: 20,
  type: '',
});

const form = reactive<{ type: AdminNotificationType; title: string; content: string }>({
  type: 'SYSTEM',
  title: '',
  content: '',
});

const rules: FormRules = {
  type: [{ required: true, message: '请选择类型', trigger: 'change' }],
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入内容', trigger: 'blur' }],
};

const userId = computed(() => {
  const id = Number(userIdInput.value);
  return Number.isInteger(id) && id > 0 ? id : '';
});

async function loadNotifications() {
  loading.value = true;
  try {
    const res = await adminNotificationApi.getNotifications({ ...listQuery, userId: userId.value });
    notifications.value = res.data.list;
    total.value = res.data.total;
  } finally {
    loading.value = false;
  }
}

async function remove(id: number) {
  await adminNotificationApi.deleteNotification(id);
  ElMessage.success('删除成功');
  await loadNotifications();
}

async function send() {
  await formRef.value?.validate();
  const userIds = targetMode.value === 'users'
    ? userIdsText.value.split(',').map(item => Number(item.trim())).filter(id => Number.isInteger(id) && id > 0)
    : [];
  if (targetMode.value === 'users' && userIds.length === 0) {
    ElMessage.warning('请输入有效的用户ID');
    return;
  }

  sending.value = true;
  try {
    const res = await adminNotificationApi.sendNotification({ ...form, userIds });
    ElMessage.success(`已发送 ${res.data.count} 条通知`);
    form.title = '';
    form.content = '';
    userIdsText.value = '';
    activeTab.value = 'list';
    await loadNotifications();
  } finally {
    sending.value = false;
  }
}

function formatTime(value: number) {
  return value ? new Date(value).toLocaleString() : '-';
}

onMounted(loadNotifications);
</script>

<style scoped lang="scss">
.notification-page {
  padding: 24px;
}

.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.pager {
  display: flex;
  justify-content: flex-end;
  padding-top: 16px;
}

.send-form {
  max-width: 680px;
  padding-top: 12px;
}
</style>
