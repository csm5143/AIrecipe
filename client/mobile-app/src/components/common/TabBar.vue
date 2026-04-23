<template>
  <view class="tab-bar">
    <view class="tab-bar__safe" :style="{ height: safeAreaBottom + 'px' }"></view>
    <view class="tab-bar__content">
      <view
        v-for="item in tabs"
        :key="item.pagePath"
        class="tab-item"
        :class="{ 'tab-item--active': currentPath === item.pagePath }"
        @tap="switchTab(item)"
      >
        <image
          class="tab-icon"
          :src="currentPath === item.pagePath ? item.selectedIconPath : item.iconPath"
          mode="aspectFit"
        />
        <text class="tab-text">{{ item.text }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

const safeAreaBottom = ref(0);

interface TabItem {
  pagePath: string;
  text: string;
  iconPath: string;
  selectedIconPath: string;
}

const tabs: TabItem[] = [
  {
    pagePath: '/pages/index/index',
    text: '首页',
    iconPath: '/static/tabbar/home.png',
    selectedIconPath: '/static/tabbar/home-active.png',
  },
  {
    pagePath: '/pages/search/index',
    text: '搜索',
    iconPath: '/static/tabbar/search.png',
    selectedIconPath: '/static/tabbar/search-active.png',
  },
  {
    pagePath: '/pages/scan/index',
    text: '拍照',
    iconPath: '/static/tabbar/scan.png',
    selectedIconPath: '/static/tabbar/scan-active.png',
  },
  {
    pagePath: '/pages/collection/index',
    text: '收藏',
    iconPath: '/static/tabbar/collection.png',
    selectedIconPath: '/static/tabbar/collection-active.png',
  },
  {
    pagePath: '/pages/mine/index',
    text: '我的',
    iconPath: '/static/tabbar/mine.png',
    selectedIconPath: '/static/tabbar/mine-active.png',
  },
];

const currentPath = computed(() => {
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  return '/' + (currentPage?.route || '');
});

function switchTab(item: TabItem) {
  uni.switchTab({ url: item.pagePath });
}

onMounted(() => {
  const systemInfo = uni.getSystemInfoSync();
  safeAreaBottom.value = systemInfo.safeAreaInsets?.bottom || 0;
});
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: $white;
  z-index: 1000;
  border-top: 1rpx solid $border-color-light;

  &__safe {
    display: none;
  }

  &__content {
    display: flex;
    align-items: center;
    justify-content: space-around;
    height: $tab-bar-height;
    padding-bottom: constant(safe-area-inset-bottom);
    padding-bottom: env(safe-area-inset-bottom);
  }
}

.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  height: 100%;
  padding: 8rpx 0;

  &--active {
    .tab-text {
      color: $primary-color;
    }
  }
}

.tab-icon {
  width: 48rpx;
  height: 48rpx;
  margin-bottom: 4rpx;
}

.tab-text {
  font-size: $font-size-xs;
  color: $text-color-secondary;
}
</style>
