<template>
  <aside class="sidebar">
    <div class="logo">
      <img src="@/assets/icons/logo.svg" alt="AIRecipe" />
      <span class="logo-text">AIRecipe</span>
    </div>
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

      <el-sub-menu index="/users">
        <template #title>
          <el-icon><User /></el-icon>
          <span>用户管理</span>
        </template>
        <el-menu-item index="/users">用户列表</el-menu-item>
      </el-sub-menu>

      <el-sub-menu index="/recipes">
        <template #title>
          <el-icon><Food /></el-icon>
          <span>食谱管理</span>
        </template>
        <el-menu-item index="/recipes">食谱列表</el-menu-item>
        <el-menu-item index="/recipes/create">创建食谱</el-menu-item>
      </el-sub-menu>

      <el-menu-item index="/ingredients">
        <el-icon><FoodComponent /></el-icon>
        <template #title>食材管理</template>
      </el-menu-item>

      <el-menu-item index="/collections">
        <el-icon><Collection /></el-icon>
        <template #title>收藏管理</template>
      </el-menu-item>

      <el-menu-item index="/feedbacks">
        <el-icon><ChatDotRound /></el-icon>
        <template #title>反馈管理</template>
      </el-menu-item>

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
  </aside>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const isCollapse = ref(false);
const activeMenu = computed(() => route.path);
</script>

<style scoped lang="scss">
.sidebar {
  width: 210px;
  height: 100vh;
  background: #304156;
  overflow-y: auto;
  flex-shrink: 0;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  background: #263445;

  img {
    width: 32px;
    height: 32px;
  }

  .logo-text {
    margin-left: 10px;
    font-size: 18px;
    font-weight: 700;
    color: #fff;
  }
}

.sidebar-menu {
  border-right: none;
  background: #304156;

  :deep(.el-menu-item),
  :deep(.el-sub-menu__title) {
    color: #bfcbd9;
    &:hover {
      background: #263445;
    }
  }

  :deep(.el-menu-item.is-active) {
    background: #263445;
    color: #409eff;
  }
}
</style>
