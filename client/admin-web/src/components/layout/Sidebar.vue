<template>
  <aside class="sidebar" :class="{ collapsed: isCollapse }">
    <div class="logo">
      <div class="logo-icon">
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="14" stroke="currentColor" stroke-width="2"/>
          <path d="M10 16C10 12.686 12.686 10 16 10C19.314 10 22 12.686 22 16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <circle cx="12" cy="14" r="2" fill="currentColor"/>
          <circle cx="20" cy="18" r="2" fill="currentColor"/>
        </svg>
      </div>
      <span class="logo-text">AIRecipe</span>
    </div>

    <div class="sidebar-content">
    <div class="menu-section">
      <div class="menu-title">导航</div>
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        :unique-opened="true"
        class="sidebar-menu"
        router
      >
        <el-menu-item index="/dashboard">
          <el-icon><Odometer /></el-icon>
          <template #title>数据看板</template>
        </el-menu-item>
      </el-menu>
    </div>

    <div class="menu-section">
      <div class="menu-title">内容管理</div>
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        :unique-opened="true"
        class="sidebar-menu"
        router
      >
        <el-sub-menu index="/recipes">
          <template #title>
            <el-icon><Food /></el-icon>
            <span>食谱</span>
          </template>
          <el-menu-item index="/recipes">食谱列表</el-menu-item>
          <el-menu-item index="/recipes/create">创建食谱</el-menu-item>
        </el-sub-menu>

        <el-menu-item index="/ingredients">
          <el-icon><FoodComponent /></el-icon>
          <template #title>食材库</template>
        </el-menu-item>

        <el-menu-item index="/collections">
          <el-icon><Collection /></el-icon>
          <template #title>收藏管理</template>
        </el-menu-item>
      </el-menu>
    </div>

    <div class="menu-section">
      <div class="menu-title">用户与反馈</div>
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        :unique-opened="true"
        class="sidebar-menu"
        router
      >
        <el-menu-item index="/users">
          <el-icon><User /></el-icon>
          <template #title>用户管理</template>
        </el-menu-item>

        <el-menu-item index="/feedbacks">
          <el-icon><ChatDotRound /></el-icon>
          <template #title>反馈管理</template>
        </el-menu-item>
      </el-menu>
    </div>

    <div class="menu-section">
      <div class="menu-title">系统</div>
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        :unique-opened="true"
        class="sidebar-menu"
        router
      >
        <el-menu-item index="/content">
          <el-icon><TrendCharts /></el-icon>
          <template #title>内容运营</template>
        </el-menu-item>

        <el-sub-menu index="/system">
          <template #title>
            <el-icon><Setting /></el-icon>
            <span>系统设置</span>
          </template>
          <el-menu-item index="/system/settings">基础设置</el-menu-item>
          <el-menu-item index="/system/admin">管理员</el-menu-item>
          <el-menu-item index="/system/operation-logs">操作日志</el-menu-item>
        </el-sub-menu>
      </el-menu>
    </div>
    </div>

    <div class="sidebar-footer">
      <div class="collapse-btn" @click="toggleCollapse">
        <el-icon v-if="isCollapse"><DArrowRight /></el-icon>
        <el-icon v-else><DArrowLeft /></el-icon>
        <span v-if="!isCollapse">收起</span>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const isCollapse = ref(false);
const activeMenu = computed(() => route.path);

function toggleCollapse() {
  isCollapse.value = !isCollapse.value;
}
</script>

<style scoped lang="scss">
.sidebar {
  width: var(--sidebar-width);
  height: 100vh;
  background: var(--surface-200);
  border-right: 1px solid var(--border-primary);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  transition: width var(--transition-normal);

  &.collapsed {
    width: var(--sidebar-collapsed-width);

    .logo-text,
    .menu-title,
    .sidebar-footer span {
      opacity: 0;
      width: 0;
    }

    .menu-section {
      padding: 0 8px;
    }

    :deep(.el-menu--collapse) {
      .el-sub-menu__title span {
        display: none;
      }
    }
  }
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--surface-500);
    border-radius: var(--radius-pill);
  }
}

.logo {
  height: var(--header-height);
  display: flex;
  align-items: center;
  padding: 0 20px;
  gap: 12px;
  border-bottom: 1px solid var(--border-primary);
  flex-shrink: 0;

  .logo-icon {
    width: 32px;
    height: 32px;
    color: var(--cursor-dark);
    flex-shrink: 0;
  }

  .logo-text {
    font-family: var(--font-display);
    font-size: 18px;
    font-weight: 400;
    letter-spacing: -0.36px;
    color: var(--cursor-dark);
    white-space: nowrap;
    transition: opacity var(--transition-fast), width var(--transition-normal);
  }
}

.menu-section {
  padding: 16px 12px 8px;
  transition: padding var(--transition-normal);

  .menu-title {
    font-family: var(--font-mono);
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: rgba(38, 37, 30, 0.4);
    padding: 0 12px;
    margin-bottom: 8px;
    white-space: nowrap;
    overflow: hidden;
    transition: opacity var(--transition-fast), width var(--transition-normal);
  }
}

.sidebar-menu {
  background: transparent;
  border: none;

  :deep(.el-menu-item),
  :deep(.el-sub-menu__title) {
    height: 40px;
    line-height: 40px;
    padding: 0 12px !important;
    border-radius: var(--radius-md);
    margin-bottom: 2px;
    color: rgba(38, 37, 30, 0.65);
    font-family: var(--font-display);
    font-size: 13px;
    transition: all var(--transition-fast);

    .el-icon {
      margin-right: 10px;
      font-size: 16px;
      color: rgba(38, 37, 30, 0.5);
      transition: color var(--transition-fast);
    }

    &:hover {
      background: var(--surface-300);
      color: var(--cursor-dark);

      .el-icon {
        color: var(--cursor-dark);
      }
    }

    &.is-active {
      background: rgba(245, 78, 0, 0.08);
      color: var(--cursor-orange);

      .el-icon {
        color: var(--cursor-orange);
      }
    }
  }

  :deep(.el-sub-menu) {
    .el-menu {
      background: transparent;
      padding-left: 28px;

      .el-menu-item {
        height: 36px;
        line-height: 36px;
        font-size: 12px;
      }
    }
  }
}

.sidebar-footer {
  margin-top: auto;
  padding: 16px 12px;
  border-top: 1px solid var(--border-primary);
  flex-shrink: 0;

  .collapse-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-radius: var(--radius-md);
    cursor: pointer;
    color: rgba(38, 37, 30, 0.5);
    font-family: var(--font-display);
    font-size: 12px;
    transition: all var(--transition-fast);

    .el-icon {
      font-size: 14px;
      transition: transform var(--transition-fast);
    }

    &:hover {
      background: var(--surface-300);
      color: var(--cursor-dark);
    }

    span {
      white-space: nowrap;
      transition: opacity var(--transition-fast), width var(--transition-normal);
    }
  }
}
</style>
