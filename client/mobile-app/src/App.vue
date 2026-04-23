<template>
  <view class="app-container">
    <view class="app-content">
      <!-- #ifdef APP-PLUS -->
      <view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>
      <!-- #endif -->
      <view class="page-container">
        <view class="page-content">
          <slot />
        </view>
        <!-- 底部 TabBar -->
        <tab-bar v-if="showTabBar" />
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import TabBar from '@/components/common/TabBar.vue';
import { useUserStore } from '@/store/user';
import { useAppStore } from '@/store/app';

const userStore = useUserStore();
const appStore = useAppStore();

// #ifdef APP-PLUS
const statusBarHeight = ref(uni.getSystemInfoSync().statusBarHeight || 20);
// #endif

// 判断当前页面是否需要显示 TabBar
const showTabBar = computed(() => {
  const noTabBarPages = ['login', 'scan', 'recipe-detail'];
  const currentPage = getCurrentPages().pop();
  if (!currentPage) return true;
  return !noTabBarPages.some((page) => currentPage.route?.includes(page));
});

onMounted(() => {
  // 初始化用户状态
  userStore.initUserInfo();
  // 检查登录状态
  userStore.checkLoginStatus();
});
</script>

<style lang="scss">
@import './styles/variables.scss';

.app-container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: $bg-color;
}

.app-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.status-bar {
  flex-shrink: 0;
  background-color: #ffffff;
}

.page-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.page-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
}
</style>
