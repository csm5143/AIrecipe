<template>
  <div class="error-page">
    <div class="error-container">
      <div class="error-visual">
        <svg viewBox="0 0 200 200" class="error-illustration">
          <circle cx="100" cy="100" r="80" fill="none" stroke="currentColor" stroke-width="2" opacity="0.2"/>
          <circle cx="100" cy="100" r="60" fill="none" stroke="currentColor" stroke-width="2" opacity="0.3"/>
          <circle cx="100" cy="100" r="40" fill="none" stroke="currentColor" stroke-width="2" opacity="0.4"/>
          <text x="100" y="108" text-anchor="middle" font-size="32" font-family="system-ui" fill="currentColor" opacity="0.6">404</text>
        </svg>
      </div>

      <div class="error-content">
        <h1 class="error-title">页面不存在</h1>
        <p class="error-description">
          抱歉，您访问的页面可能已被删除、转移或暂时不可用。
        </p>
        <p class="error-hint">
          请检查 URL 是否正确，或返回首页继续浏览。
        </p>
      </div>

      <div class="error-actions">
        <el-button type="primary" size="large" @click="goHome">
          <el-icon><HomeFilled /></el-icon>
          返回首页
        </el-button>
        <el-button size="large" @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          返回上页
        </el-button>
      </div>

      <div class="error-suggestions">
        <p class="suggestions-title">您可以尝试</p>
        <div class="suggestions-list">
          <a href="/dashboard" class="suggestion-link">
            <el-icon><DataLine /></el-icon>
            数据看板
          </a>
          <a href="/recipes" class="suggestion-link">
            <el-icon><Food /></el-icon>
            食谱管理
          </a>
          <a href="/users" class="suggestion-link">
            <el-icon><User /></el-icon>
            用户管理
          </a>
          <a href="/content" class="suggestion-link">
            <el-icon><TrendCharts /></el-icon>
            内容运营
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import {
  HomeFilled,
  ArrowLeft,
  DataLine,
  Food,
  User,
  TrendCharts
} from '@element-plus/icons-vue';

const router = useRouter();

function goHome() {
  router.push('/dashboard');
}

function goBack() {
  router.back();
}
</script>

<style scoped lang="scss">
.error-page {
  width: 100%;
  height: calc(100vh - var(--header-height, 64px));
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--cursor-cream);
  padding: 40px;
}

.error-container {
  text-align: center;
  max-width: 500px;
}

.error-visual {
  margin-bottom: 32px;

  .error-illustration {
    width: 180px;
    height: 180px;
    color: var(--cursor-dark);
    opacity: 0.8;
  }
}

.error-content {
  margin-bottom: 32px;

  .error-title {
    font-family: var(--font-display);
    font-size: 28px;
    font-weight: 400;
    letter-spacing: -0.7px;
    color: var(--cursor-dark);
    margin-bottom: 16px;
  }

  .error-description {
    font-family: var(--font-serif);
    font-size: 16px;
    color: rgba(38, 37, 30, 0.7);
    line-height: 1.6;
    margin-bottom: 8px;
  }

  .error-hint {
    font-family: var(--font-mono);
    font-size: 13px;
    color: rgba(38, 37, 30, 0.4);
  }
}

.error-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-bottom: 48px;

  .el-button {
    min-width: 140px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
}

.error-suggestions {
  padding: 24px;
  background: var(--surface-200);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);

  .suggestions-title {
    font-family: var(--font-display);
    font-size: 13px;
    color: rgba(38, 37, 30, 0.5);
    margin-bottom: 16px;
  }

  .suggestions-list {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    justify-content: center;
  }

  .suggestion-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    background: var(--surface-300);
    border-radius: var(--radius-pill);
    font-family: var(--font-display);
    font-size: 13px;
    color: rgba(38, 37, 30, 0.7);
    text-decoration: none;
    transition: all var(--transition-fast);

    .el-icon {
      font-size: 14px;
      color: rgba(38, 37, 30, 0.5);
    }

    &:hover {
      background: var(--surface-400);
      color: var(--cursor-dark);

      .el-icon {
        color: var(--cursor-dark);
      }
    }
  }
}
</style>
