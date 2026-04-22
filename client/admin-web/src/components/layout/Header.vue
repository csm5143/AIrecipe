<template>
  <header class="header">
    <div class="header-left">
      <nav class="breadcrumb-nav">
        <router-link to="/dashboard" class="breadcrumb-item">
          <el-icon><HomeFilled /></el-icon>
        </router-link>
        <template v-if="route.meta.title">
          <span class="breadcrumb-separator">/</span>
          <span class="breadcrumb-current">{{ route.meta.title }}</span>
        </template>
      </nav>
    </div>

    <div class="header-right">
      <div class="header-actions">
        <el-tooltip content="刷新数据" placement="bottom">
          <button class="action-btn" @click="handleRefresh">
            <el-icon :class="{ 'is-loading': isRefreshing }"><RefreshRight /></el-icon>
          </button>
        </el-tooltip>

        <el-tooltip content="全屏" placement="bottom">
          <button class="action-btn" @click="toggleFullscreen">
            <el-icon><FullScreen /></el-icon>
          </button>
        </el-tooltip>
      </div>

      <el-dropdown trigger="click" @command="handleCommand">
        <button class="user-btn">
          <div class="user-avatar">
            <img v-if="userStore.profile?.avatar" :src="userStore.profile.avatar" alt="avatar" />
            <span v-else>{{ avatarText }}</span>
          </div>
          <div class="user-info">
            <span class="user-name">{{ userStore.profile?.nickname || '管理员' }}</span>
            <span class="user-role">{{ roleText }}</span>
          </div>
          <el-icon class="user-arrow"><ArrowDown /></el-icon>
        </button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="profile">
              <el-icon><User /></el-icon>
              个人设置
            </el-dropdown-item>
            <el-dropdown-item command="password">
              <el-icon><Lock /></el-icon>
              修改密码
            </el-dropdown-item>
            <el-dropdown-item command="logout" divided>
              <el-icon><SwitchButton /></el-icon>
              退出登录
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </header>

  <!-- 修改密码对话框 -->
  <el-dialog v-model="passwordDialogVisible" title="修改密码" width="420px">
    <el-form ref="passwordFormRef" :model="passwordForm" :rules="passwordRules" label-position="top">
      <el-form-item label="当前密码" prop="oldPassword">
        <el-input
          v-model="passwordForm.oldPassword"
          type="password"
          placeholder="请输入当前密码"
          show-password
        />
      </el-form-item>
      <el-form-item label="新密码" prop="newPassword">
        <el-input
          v-model="passwordForm.newPassword"
          type="password"
          placeholder="请输入新密码"
          show-password
        />
      </el-form-item>
      <el-form-item label="确认密码" prop="confirmPassword">
        <el-input
          v-model="passwordForm.confirmPassword"
          type="password"
          placeholder="请再次输入新密码"
          show-password
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="passwordDialogVisible = false">取消</el-button>
      <el-button type="primary" @click="handleChangePassword">确认修改</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '@/store/modules/user';
import { ElMessage, ElMessageBox, FormInstance, FormRules } from 'element-plus';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const isRefreshing = ref(false);
const passwordDialogVisible = ref(false);
const passwordFormRef = ref<FormInstance>();

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
});

const passwordRules: FormRules = {
  oldPassword: [
    { required: true, message: '请输入当前密码', trigger: 'blur' },
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (_rule: any, value: string, callback: any) => {
        if (value !== passwordForm.newPassword) {
          callback(new Error('两次输入的密码不一致'));
        } else {
          callback();
        }
      },
      trigger: 'blur',
    },
  ],
};

const avatarText = computed(() => {
  const name = userStore.profile?.nickname || '管理员';
  return name.charAt(0).toUpperCase();
});

const roleText = computed(() => {
  const role = userStore.profile?.role;
  const roleMap: Record<string, string> = {
    SUPER_ADMIN: '超级管理员',
    ADMIN: '管理员',
    EDITOR: '编辑',
  };
  return roleMap[role || ''] || '管理员';
});

function handleRefresh() {
  isRefreshing.value = true;
  setTimeout(() => {
    isRefreshing.value = false;
    ElMessage.success('刷新成功');
  }, 1000);
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
}

async function handleCommand(command: string) {
  switch (command) {
    case 'logout':
      await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      });
      await userStore.logout();
      router.push({ name: 'Login' });
      break;
    case 'profile':
      ElMessage.info('个人设置功能开发中');
      break;
    case 'password':
      passwordDialogVisible.value = true;
      break;
  }
}

async function handleChangePassword() {
  const valid = await passwordFormRef.value?.validate().catch(() => false);
  if (!valid) return;

  ElMessage.success('密码修改成功');
  passwordDialogVisible.value = false;
  passwordFormRef.value?.resetFields();
}
</script>

<style scoped lang="scss">
.header {
  height: var(--header-height);
  background: var(--surface-200);
  border-bottom: 1px solid var(--border-primary);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 28px;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
}

.breadcrumb-nav {
  display: flex;
  align-items: center;
  gap: 8px;

  .breadcrumb-item {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: var(--radius-md);
    color: rgba(38, 37, 30, 0.5);
    transition: all var(--transition-fast);

    &:hover {
      background: var(--surface-300);
      color: var(--cursor-dark);
    }
  }

  .breadcrumb-separator {
    color: rgba(38, 37, 30, 0.3);
    font-size: 12px;
  }

  .breadcrumb-current {
    font-family: var(--font-display);
    font-size: 15px;
    color: var(--cursor-dark);
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 4px;

  .action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: none;
    border-radius: var(--radius-md);
    background: transparent;
    color: rgba(38, 37, 30, 0.5);
    cursor: pointer;
    transition: all var(--transition-fast);

    .el-icon {
      font-size: 18px;
    }

    &:hover {
      background: var(--surface-300);
      color: var(--cursor-dark);
    }

    .is-loading {
      animation: rotate 1s linear infinite;
    }
  }
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.user-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 12px 6px 6px;
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  background: var(--surface-200);
  cursor: pointer;
  transition: all var(--transition-fast);

  &:hover {
    background: var(--surface-300);
    border-color: var(--border-medium);
  }

  .user-avatar {
    width: 32px;
    height: 32px;
    border-radius: var(--radius-md);
    background: var(--surface-400);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    span {
      font-family: var(--font-display);
      font-size: 14px;
      font-weight: 500;
      color: var(--cursor-dark);
    }
  }

  .user-info {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 1px;

    .user-name {
      font-family: var(--font-display);
      font-size: 13px;
      color: var(--cursor-dark);
      line-height: 1.2;
    }

    .user-role {
      font-family: var(--font-serif);
      font-size: 11px;
      color: rgba(38, 37, 30, 0.5);
      line-height: 1.2;
    }
  }

  .user-arrow {
    font-size: 12px;
    color: rgba(38, 37, 30, 0.4);
  }
}
</style>
