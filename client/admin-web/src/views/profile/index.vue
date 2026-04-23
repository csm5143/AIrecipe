<template>
  <div class="page-container">
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">个人设置</h2>
        <p class="page-subtitle">管理您的个人信息和安全设置</p>
      </div>
    </div>

    <div class="settings-layout">
      <div class="settings-nav">
        <div
          v-for="item in settingItems"
          :key="item.key"
          class="nav-item"
          :class="{ active: activeSetting === item.key }"
          @click="activeSetting = item.key"
        >
          <el-icon><component :is="item.icon" /></el-icon>
          <span>{{ item.label }}</span>
        </div>
      </div>

      <div class="settings-content">
        <!-- 基本信息 -->
        <div v-show="activeSetting === 'profile'" class="settings-panel">
          <div class="panel-header">
            <h3>基本信息</h3>
            <p class="text-muted">修改您的个人资料信息</p>
          </div>
          <div class="panel-body">
            <div class="avatar-section">
              <div class="avatar-display">
                <el-image
                  v-if="avatarPreview || profileForm.avatar"
                  :src="avatarPreview || profileForm.avatar"
                  class="avatar-img"
                  fit="cover"
                >
                  <template #error>
                    <div class="avatar-placeholder">
                      <el-icon><UserFilled /></el-icon>
                    </div>
                  </template>
                </el-image>
                <div v-else class="avatar-placeholder">
                  <span>{{ avatarInitial }}</span>
                </div>
                <div class="avatar-overlay" @click="triggerAvatarUpload">
                  <el-icon><Camera /></el-icon>
                  <span>更换头像</span>
                </div>
              </div>
              <div class="avatar-tips">
                <p>支持 JPG、PNG 格式</p>
                <p>建议尺寸 200x200</p>
                <p>最大 2MB</p>
              </div>
              <input
                ref="avatarInputRef"
                type="file"
                accept="image/*"
                style="display: none"
                @change="handleAvatarChange"
              />
            </div>

            <el-form
              ref="profileFormRef"
              :model="profileForm"
              :rules="profileRules"
              label-position="top"
              style="max-width: 480px"
            >
              <el-form-item label="用户名" prop="username">
                <el-input v-model="profileForm.username" disabled>
                  <template #suffix>
                    <el-tooltip content="用户名不可修改">
                      <el-icon><Lock /></el-icon>
                    </el-tooltip>
                  </template>
                </el-input>
              </el-form-item>

              <el-form-item label="昵称" prop="nickname">
                <el-input
                  v-model="profileForm.nickname"
                  placeholder="请输入昵称"
                  maxlength="30"
                  show-word-limit
                />
              </el-form-item>

              <el-form-item label="手机号" prop="phone">
                <el-input
                  v-model="profileForm.phone"
                  placeholder="请输入手机号"
                />
              </el-form-item>

              <el-form-item label="角色">
                <el-input :model-value="roleText" disabled />
              </el-form-item>

              <el-form-item label="账号状态">
                <el-input :model-value="statusText" disabled />
              </el-form-item>

              <el-form-item label="上次登录">
                <el-input
                  :model-value="lastLoginText"
                  disabled
                />
              </el-form-item>

              <el-form-item>
                <el-button
                  type="primary"
                  :loading="profileSaving"
                  @click="handleSaveProfile"
                >
                  保存修改
                </el-button>
              </el-form-item>
            </el-form>
          </div>
        </div>

        <!-- 安全设置 -->
        <div v-show="activeSetting === 'security'" class="settings-panel">
          <div class="panel-header">
            <h3>修改密码</h3>
            <p class="text-muted">定期更换密码可以提高账户安全性</p>
          </div>
          <div class="panel-body">
            <el-form
              ref="passwordFormRef"
              :model="passwordForm"
              :rules="passwordRules"
              label-position="top"
              style="max-width: 480px"
            >
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
                  placeholder="请输入新密码（至少 6 位）"
                  show-password
                />
                <div class="password-strength" v-if="passwordForm.newPassword">
                  <div class="strength-bar">
                    <div
                      class="strength-fill"
                      :class="passwordStrength.class"
                      :style="{ width: passwordStrength.width }"
                    />
                  </div>
                  <span class="strength-text" :class="passwordStrength.class">
                    {{ passwordStrength.label }}
                  </span>
                </div>
              </el-form-item>

              <el-form-item label="确认密码" prop="confirmPassword">
                <el-input
                  v-model="passwordForm.confirmPassword"
                  type="password"
                  placeholder="请再次输入新密码"
                  show-password
                />
              </el-form-item>

              <el-form-item>
                <el-button
                  type="primary"
                  :loading="passwordSaving"
                  @click="handleChangePassword"
                >
                  修改密码
                </el-button>
              </el-form-item>
            </el-form>

            <el-divider />

            <div class="security-tips">
              <h4>密码安全建议</h4>
              <ul>
                <li><el-icon><Check /></el-icon> 密码长度至少 8 位</li>
                <li><el-icon><Check /></el-icon> 包含大小写字母组合</li>
                <li><el-icon><Check /></el-icon> 包含数字和特殊字符</li>
                <li><el-icon><Check /></el-icon> 避免使用常见密码或个人信息</li>
                <li><el-icon><Check /></el-icon> 定期更换密码</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- 偏好设置 -->
        <div v-show="activeSetting === 'preferences'" class="settings-panel">
          <div class="panel-header">
            <h3>界面偏好</h3>
            <p class="text-muted">自定义您的后台使用体验</p>
          </div>
          <div class="panel-body">
            <el-form label-position="top" style="max-width: 480px">
              <el-form-item label="侧边栏默认状态">
                <el-radio-group v-model="preferences.collapseSidebar">
                  <el-radio :value="false">展开</el-radio>
                  <el-radio :value="true">收起</el-radio>
                </el-radio-group>
              </el-form-item>

              <el-form-item label="每页显示条数">
                <el-select v-model="preferences.pageSize" style="width: 160px">
                  <el-option label="10 条/页" :value="10" />
                  <el-option label="20 条/页" :value="20" />
                  <el-option label="50 条/页" :value="50" />
                </el-select>
              </el-form-item>

              <el-form-item label="日期格式">
                <el-select v-model="preferences.dateFormat" style="width: 160px">
                  <el-option label="YYYY-MM-DD" value="YYYY-MM-DD" />
                  <el-option label="YYYY/MM/DD" value="YYYY/MM/DD" />
                  <el-option label="DD-MM-YYYY" value="DD-MM-YYYY" />
                </el-select>
              </el-form-item>

              <el-form-item>
                <el-button type="primary" @click="handleSavePreferences">
                  保存偏好
                </el-button>
              </el-form-item>
            </el-form>
          </div>
        </div>

        <!-- 通知设置 -->
        <div v-show="activeSetting === 'notifications'" class="settings-panel">
          <div class="panel-header">
            <h3>通知设置</h3>
            <p class="text-muted">选择您希望接收的通知类型</p>
          </div>
          <div class="panel-body">
            <el-form label-position="top" style="max-width: 480px">
              <el-form-item label="系统通知">
                <el-switch v-model="notifications.system" />
                <span class="setting-hint">接收系统更新、维护等通知</span>
              </el-form-item>

              <el-form-item label="安全提醒">
                <el-switch v-model="notifications.security" />
                <span class="setting-hint">接收登录异常、密码修改等安全通知</span>
              </el-form-item>

              <el-form-item label="数据统计">
                <el-switch v-model="notifications.stats" />
                <span class="setting-hint">接收每日/每周数据报告</span>
              </el-form-item>

              <el-form-item>
                <el-button type="primary" @click="handleSaveNotifications">
                  保存通知设置
                </el-button>
              </el-form-item>
            </el-form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useUserStore } from '@/store/modules/user';
import { systemApi } from '@/api/system';
import {
  User,
  Lock,
  Bell,
  Tools,
  Camera,
  Check,
  UserFilled,
} from '@element-plus/icons-vue';
import { ElMessage, FormInstance, FormRules } from 'element-plus';

const userStore = useUserStore();

const activeSetting = ref('profile');
const profileFormRef = ref<FormInstance>();
const passwordFormRef = ref<FormInstance>();
const avatarInputRef = ref<HTMLInputElement>();
const avatarPreview = ref('');
const profileSaving = ref(false);
const passwordSaving = ref(false);

const settingItems = [
  { key: 'profile', label: '基本信息', icon: User },
  { key: 'security', label: '安全设置', icon: Lock },
  { key: 'preferences', label: '界面偏好', icon: Tools },
  { key: 'notifications', label: '通知设置', icon: Bell },
];

const profileForm = reactive({
  username: '',
  nickname: '',
  phone: '',
  avatar: '',
});

const profileRules: FormRules = {
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { min: 2, max: 30, message: '昵称长度在 2-30 个字符', trigger: 'blur' },
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' },
  ],
};

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

const preferences = reactive({
  collapseSidebar: false,
  pageSize: 20,
  dateFormat: 'YYYY-MM-DD',
});

const notifications = reactive({
  system: true,
  security: true,
  stats: false,
});

const roleText = computed(() => {
  const roleMap: Record<string, string> = {
    SUPER_ADMIN: '超级管理员',
    ADMIN: '管理员',
    EDITOR: '编辑',
  };
  return roleMap[userStore.profile?.role || ''] || '管理员';
});

const statusText = computed(() => {
  const statusMap: Record<string, string> = {
    ACTIVE: '正常',
    DISABLED: '已禁用',
  };
  return statusMap[userStore.profile?.status || ''] || '正常';
});

const lastLoginText = computed(() => {
  return userStore.profile?.lastLoginAt
    ? new Date(userStore.profile.lastLoginAt).toLocaleString('zh-CN')
    : '首次登录';
});

const avatarInitial = computed(() => {
  const name = profileForm.nickname || userStore.profile?.nickname || '管理员';
  return name.charAt(0).toUpperCase();
});

const passwordStrength = computed(() => {
  const pwd = passwordForm.newPassword;
  if (!pwd) return { label: '', class: '', width: '0%' };

  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[a-z]/.test(pwd)) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^a-zA-Z0-9]/.test(pwd)) score++;

  if (score <= 2) return { label: '弱', class: 'weak', width: '33%' };
  if (score <= 4) return { label: '中等', class: 'medium', width: '66%' };
  return { label: '强', class: 'strong', width: '100%' };
});

function triggerAvatarUpload() {
  avatarInputRef.value?.click();
}

async function handleAvatarChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;

  if (file.size > 2 * 1024 * 1024) {
    ElMessage.error('头像图片不能超过 2MB');
    return;
  }

  if (!file.type.startsWith('image/')) {
    ElMessage.error('请上传图片文件');
    return;
  }

  avatarPreview.value = URL.createObjectURL(file);
  profileSaving.value = true;
  try {
    const res = await systemApi.uploadImage(file);
    const resp = res.data as any;
    const url = resp.data?.url || resp.url;
    await userStore.updateAvatar(url);
    ElMessage.success('头像更新成功');
  } catch {
    avatarPreview.value = userStore.profile?.avatar ? getFullAvatarUrl(userStore.profile.avatar) : '';
    ElMessage.error('头像更新失败');
  } finally {
    profileSaving.value = false;
  }
}

function getFullAvatarUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('//')) {
    return path.startsWith('//') ? window.location.protocol + path : path;
  }
  if (path.startsWith('/')) {
    return path;
  }
  return path;
}

async function handleSaveProfile() {
  const valid = await profileFormRef.value?.validate().catch(() => false);
  if (!valid) return;

  profileSaving.value = true;
  try {
    await userStore.updateProfile({
      nickname: profileForm.nickname,
      phone: profileForm.phone,
    });
    ElMessage.success('个人信息已保存');
  } catch {
    ElMessage.error('保存失败，请重试');
  } finally {
    profileSaving.value = false;
  }
}

async function handleChangePassword() {
  const valid = await passwordFormRef.value?.validate().catch(() => false);
  if (!valid) return;

  passwordSaving.value = true;
  try {
    await userStore.changePassword({
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword,
    });
    ElMessage.success('密码修改成功');
    passwordFormRef.value?.resetFields();
  } catch {
    ElMessage.error('密码修改失败，请检查当前密码是否正确');
  } finally {
    passwordSaving.value = false;
  }
}

function handleSavePreferences() {
  localStorage.setItem('userPreferences', JSON.stringify(preferences));
  ElMessage.success('偏好设置已保存');
}

function handleSaveNotifications() {
  localStorage.setItem('userNotifications', JSON.stringify(notifications));
  ElMessage.success('通知设置已保存');
}

onMounted(async () => {
  await userStore.fetchProfile();
  profileForm.username = userStore.profile?.username || '';
  profileForm.nickname = userStore.profile?.nickname || '';
  profileForm.avatar = userStore.profile?.avatar || '';
  avatarPreview.value = userStore.profile?.avatar ? getFullAvatarUrl(userStore.profile.avatar) : '';

  const savedPrefs = localStorage.getItem('userPreferences');
  if (savedPrefs) {
    Object.assign(preferences, JSON.parse(savedPrefs));
  }

  const savedNotif = localStorage.getItem('userNotifications');
  if (savedNotif) {
    Object.assign(notifications, JSON.parse(savedNotif));
  }
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

    .page-subtitle {
      font-family: var(--font-serif);
      font-size: 13px;
      color: rgba(38, 37, 30, 0.5);
    }
  }
}

.settings-layout {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 24px;
  align-items: start;
}

.settings-nav {
  background: var(--surface-200);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  padding: 12px;
  position: sticky;
  top: 24px;

  .nav-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    border-radius: var(--radius-md);
    cursor: pointer;
    font-family: var(--font-display);
    font-size: 13px;
    color: rgba(38, 37, 30, 0.7);
    transition: all var(--transition-fast);

    .el-icon {
      font-size: 16px;
      color: rgba(38, 37, 30, 0.5);
      transition: color var(--transition-fast);
    }

    &:hover {
      background: var(--surface-300);
      color: var(--cursor-dark);
    }

    &.active {
      background: rgba(245, 78, 0, 0.08);
      color: var(--cursor-orange);

      .el-icon {
        color: var(--cursor-orange);
      }
    }
  }
}

.settings-content {
  min-height: 400px;
}

.settings-panel {
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.panel-header {
  margin-bottom: 24px;

  h3 {
    font-family: var(--font-display);
    font-size: 18px;
    font-weight: 400;
    color: var(--cursor-dark);
    margin-bottom: 6px;
  }
}

.panel-body {
  background: var(--surface-200);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  padding: 28px;
}

.avatar-section {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 32px;
  padding-bottom: 28px;
  border-bottom: 1px solid var(--border-primary);
}

.avatar-display {
  position: relative;
  width: 96px;
  height: 96px;
  border-radius: var(--radius-lg);
  overflow: hidden;
  flex-shrink: 0;
  background: var(--surface-400);

  .avatar-img {
    width: 100%;
    height: 100%;
  }

  .avatar-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;

    span {
      font-family: var(--font-display);
      font-size: 32px;
      font-weight: 500;
      color: var(--cursor-dark);
    }

    .el-icon {
      font-size: 40px;
      color: rgba(38, 37, 30, 0.3);
    }
  }

  .avatar-overlay {
    position: absolute;
    inset: 0;
    background: rgba(38, 37, 30, 0.6);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    opacity: 0;
    cursor: pointer;
    transition: opacity var(--transition-fast);

    .el-icon {
      font-size: 20px;
      color: white;
    }

    span {
      font-family: var(--font-display);
      font-size: 11px;
      color: white;
    }
  }

  &:hover .avatar-overlay {
    opacity: 1;
  }
}

.avatar-tips {
  p {
    font-family: var(--font-mono);
    font-size: 11px;
    color: rgba(38, 37, 30, 0.4);
    line-height: 1.8;
  }
}

.password-strength {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 10px;

  .strength-bar {
    flex: 1;
    height: 4px;
    background: var(--surface-400);
    border-radius: var(--radius-pill);
    overflow: hidden;

    .strength-fill {
      height: 100%;
      border-radius: var(--radius-pill);
      transition: width 0.3s ease, background 0.3s ease;

      &.weak { background: var(--color-danger); }
      &.medium { background: var(--color-warning); }
      &.strong { background: var(--color-success); }
    }
  }

  .strength-text {
    font-family: var(--font-mono);
    font-size: 11px;
    min-width: 32px;

    &.weak { color: var(--color-danger); }
    &.medium { color: var(--color-warning); }
    &.strong { color: var(--color-success); }
  }
}

.security-tips {
  margin-top: 24px;

  h4 {
    font-family: var(--font-display);
    font-size: 14px;
    font-weight: 400;
    color: rgba(38, 37, 30, 0.7);
    margin-bottom: 12px;
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  li {
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: var(--font-serif);
    font-size: 13px;
    color: rgba(38, 37, 30, 0.6);

    .el-icon {
      font-size: 14px;
      color: var(--color-success);
    }
  }
}

.setting-hint {
  margin-left: 12px;
  font-family: var(--font-serif);
  font-size: 12px;
  color: rgba(38, 37, 30, 0.4);
}

.el-divider {
  margin: 24px 0;
}
</style>
