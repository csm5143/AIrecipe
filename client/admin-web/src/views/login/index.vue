<template>
  <div class="login-page">
    <div class="login-bg">
      <div class="bg-shape shape-1"></div>
      <div class="bg-shape shape-2"></div>
      <div class="bg-shape shape-3"></div>
    </div>

    <div class="login-card">
      <div class="login-header">
        <div class="logo">
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="14" stroke="currentColor" stroke-width="2"/>
            <path d="M10 16C10 12.686 12.686 10 16 10C19.314 10 22 12.686 22 16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <circle cx="12" cy="14" r="2" fill="currentColor"/>
            <circle cx="20" cy="18" r="2" fill="currentColor"/>
          </svg>
        </div>
        <h1 class="login-title">AIRecipe</h1>
        <p class="login-subtitle">智能食谱 · 管理后台</p>
      </div>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        class="login-form"
        @submit.prevent="handleLogin"
      >
        <el-form-item prop="username" class="form-item">
          <div class="input-label">
            <el-icon><User /></el-icon>
            <span>用户名</span>
          </div>
          <el-input
            v-model="form.username"
            placeholder="请输入用户名"
            size="large"
            :prefix-icon="User"
          />
        </el-form-item>

        <el-form-item prop="password" class="form-item">
          <div class="input-label">
            <el-icon><Lock /></el-icon>
            <span>密码</span>
          </div>
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            :prefix-icon="Lock"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <div class="form-options">
          <el-checkbox v-model="rememberMe">记住我</el-checkbox>
          <a href="#" class="forgot-link">忘记密码？</a>
        </div>

        <el-form-item class="form-item">
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            class="login-button"
            @click="handleLogin"
          >
            <span v-if="!loading">登 录</span>
            <span v-else>登录中...</span>
          </el-button>
        </el-form-item>
      </el-form>

      <div class="login-footer">
        <span class="footer-text">还没有账号？</span>
        <a href="#" class="register-link">联系管理员</a>
      </div>
    </div>

    <div class="login-tips">
      <div class="tip">
        <el-icon><CircleCheck /></el-icon>
        <span>智能食谱推荐</span>
      </div>
      <div class="tip">
        <el-icon><CircleCheck /></el-icon>
        <span>AI 食材识别</span>
      </div>
      <div class="tip">
        <el-icon><CircleCheck /></el-icon>
        <span>健康饮食管理</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useUserStore } from '@/store/modules/user';
import { User, Lock, CircleCheck } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

const formRef = ref();
const loading = ref(false);
const rememberMe = ref(false);

const form = reactive({
  username: '',
  password: '',
});

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' },
  ],
};

async function handleLogin() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  loading.value = true;
  try {
    await userStore.login(form);
    const redirect = (route.query.redirect as string) || '/dashboard';
    router.push(redirect);
    ElMessage.success('登录成功');
  } catch (error) {
    ElMessage.error('登录失败，请检查用户名和密码');
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped lang="scss">
.login-page {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--cursor-cream);
  position: relative;
  overflow: hidden;
}

.login-bg {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;

  .bg-shape {
    position: absolute;
    border-radius: 50%;
    opacity: 0.5;
  }

  .shape-1 {
    width: 400px;
    height: 400px;
    background: radial-gradient(circle, rgba(245, 78, 0, 0.08) 0%, transparent 70%);
    top: -100px;
    right: -100px;
  }

  .shape-2 {
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, rgba(31, 138, 101, 0.06) 0%, transparent 70%);
    bottom: -50px;
    left: -50px;
  }

  .shape-3 {
    width: 200px;
    height: 200px;
    background: radial-gradient(circle, rgba(74, 125, 191, 0.05) 0%, transparent 70%);
    top: 50%;
    left: 20%;
  }
}

.login-card {
  width: 420px;
  padding: 48px;
  background: var(--surface-200);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-elevated);
  position: relative;
  z-index: 1;
}

.login-header {
  text-align: center;
  margin-bottom: 36px;

  .logo {
    width: 56px;
    height: 56px;
    margin: 0 auto 16px;
    color: var(--cursor-dark);

    svg {
      width: 100%;
      height: 100%;
    }
  }

  .login-title {
    font-family: var(--font-display);
    font-size: 28px;
    font-weight: 400;
    letter-spacing: -0.7px;
    color: var(--cursor-dark);
    margin-bottom: 6px;
  }

  .login-subtitle {
    font-family: var(--font-serif);
    font-size: 14px;
    color: rgba(38, 37, 30, 0.5);
  }
}

.login-form {
  .form-item {
    margin-bottom: 20px;

    :deep(.el-form-item__error) {
      font-family: var(--font-ui);
      padding-top: 4px;
    }
  }

  .input-label {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 8px;
    font-family: var(--font-display);
    font-size: 13px;
    color: rgba(38, 37, 30, 0.7);

    .el-icon {
      font-size: 14px;
      color: rgba(38, 37, 30, 0.5);
    }
  }

  .el-input {
    .el-input__wrapper {
      padding: 14px 16px;
      border-radius: var(--radius-md);
      background: var(--surface-300);
      border: 1px solid var(--border-primary);
      box-shadow: none;
      transition: all var(--transition-fast);

      &:hover {
        border-color: var(--border-medium);
      }

      &.is-focus {
        border-color: var(--cursor-dark);
        background: var(--surface-200);
        box-shadow: 0 0 0 3px rgba(38, 37, 30, 0.08);
      }

      .el-input__inner {
        font-family: var(--font-ui);
        font-size: 14px;
        color: var(--cursor-dark);

        &::placeholder {
          color: rgba(38, 37, 30, 0.4);
        }
      }

      .el-input__prefix {
        color: rgba(38, 37, 30, 0.4);
      }
    }
  }

  .form-options {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;

    :deep(.el-checkbox__label) {
      font-family: var(--font-display);
      font-size: 13px;
      color: rgba(38, 37, 30, 0.6);
    }
  }

  .forgot-link {
    font-family: var(--font-display);
    font-size: 13px;
    color: var(--cursor-orange);
    transition: opacity var(--transition-fast);

    &:hover {
      opacity: 0.8;
    }
  }

  .login-button {
    width: 100%;
    height: 48px;
    border-radius: var(--radius-md);
    font-family: var(--font-display);
    font-size: 15px;
    font-weight: 500;
    letter-spacing: 2px;
    background: var(--cursor-dark);
    border-color: var(--cursor-dark);
    color: var(--cursor-cream);
    transition: all var(--transition-fast);

    &:hover {
      background: #3a3831;
      border-color: #3a3831;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(38, 37, 30, 0.2);
    }

    &:active {
      transform: translateY(0);
    }
  }
}

.login-footer {
  margin-top: 24px;
  text-align: center;

  .footer-text {
    font-family: var(--font-serif);
    font-size: 13px;
    color: rgba(38, 37, 30, 0.5);
  }

  .register-link {
    font-family: var(--font-display);
    font-size: 13px;
    color: var(--cursor-orange);
    margin-left: 4px;
    transition: opacity var(--transition-fast);

    &:hover {
      opacity: 0.8;
    }
  }
}

.login-tips {
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 32px;
  z-index: 1;

  .tip {
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: var(--font-serif);
    font-size: 13px;
    color: rgba(38, 37, 30, 0.4);

    .el-icon {
      font-size: 16px;
      color: var(--color-success);
    }
  }
}
</style>
