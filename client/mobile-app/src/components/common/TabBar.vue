<template>
  <view class="glass-tab-bar">
    <!-- 顶部高光描边（玻璃边缘效果） -->
    <view class="glass-tab-bar__border"></view>

    <!-- 主容器：圆角胶囊 + 玻璃模糊 -->
    <view class="glass-tab-bar__container" :style="{ paddingBottom: safeAreaBottom + 'px' }">
      <view
        v-for="item in tabs"
        :key="item.pagePath"
        class="tab-item"
        :class="{ 'tab-item--active': currentPath === item.pagePath, 'tab-item--center': item.isCenter }"
        @tap="switchTab(item)"
      >
        <!-- 中间凸起按钮特殊样式 -->
        <template v-if="item.isCenter">
          <view class="center-btn">
            <image
              class="center-btn__icon"
              :src="currentPath === item.pagePath ? item.selectedIconPath : item.iconPath"
              mode="aspectFit"
            />
          </view>
          <text class="tab-text tab-text--center">{{ item.text }}</text>
        </template>

        <!-- 普通 Tab 项 -->
        <template v-else>
          <image
            class="tab-icon"
            :src="currentPath === item.pagePath ? item.selectedIconPath : item.iconPath"
            mode="aspectFit"
          />
          <text class="tab-text">{{ item.text }}</text>
        </template>
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
  isCenter?: boolean;
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
    isCenter: true,
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

// ============================================
// 液体玻璃悬浮导航栏
// 核心原理：
// 1. 外层容器负责定位、底部留白安全区
// 2. border 伪元素做顶部高光描边，模拟玻璃边缘
// 3. backdrop-filter: blur() 实现毛玻璃效果
// 4. 渐变 + 透明度叠出半透明液体质感
// ============================================

.glass-tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  // 底部安全区留白
  padding-bottom: 0;

  // ==========================================
  // 顶部高光描边 — 玻璃边缘的金属光泽感
  // ==========================================
  &__border {
    position: absolute;
    top: 0;
    left: 16rpx;
    right: 16rpx;
    height: 1px;
    background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.8) 20%,
      rgba(255, 255, 255, 1) 50%,
      rgba(255, 255, 255, 0.8) 80%,
      rgba(255, 255, 255, 0) 100%
    );
    border-radius: 1px;
    pointer-events: none;
  }

  // ==========================================
  // 主体胶囊容器
  // ==========================================
  &__container {
    position: relative;
    margin: 0 12rpx 16rpx;
    display: flex;
    align-items: flex-end;
    justify-content: space-around;
    height: 100rpx;
    border-radius: 50rpx;

    // 液体玻璃核心效果
    background: rgba(255, 255, 255, 0.68);
    backdrop-filter: blur(24px) saturate(180%);
    -webkit-backdrop-filter: blur(24px) saturate(180%);

    // Safari 低版本兼容
    @supports (-webkit-backdrop-filter: blur(24px)) {
      background: rgba(255, 255, 255, 0.68);
    }

    // 不支持 backdrop-filter 的降级背景
    @supports not (backdrop-filter: blur(24px)) {
      background: rgba(255, 255, 255, 0.92);
    }

    // 底部内阴影，制造凹陷液体感
    box-shadow:
      0 8rpx 32rpx rgba(0, 0, 0, 0.12),
      0 2rpx 8rpx rgba(0, 0, 0, 0.06),
      inset 0 -2rpx 12rpx rgba(0, 0, 0, 0.04),
      inset 0 1rpx 0px rgba(255, 255, 255, 0.9);

    // 微妙的边框，玻璃边缘质感
    border: 0.5px solid rgba(255, 255, 255, 0.5);
  }
}

// ============================================
// Tab 项基础样式
// ============================================
.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  height: 100%;
  padding: 8rpx 0;
  position: relative;
  z-index: 1;
  transition: all 0.2s ease;

  // 点击态
  &:active {
    opacity: 0.7;
    transform: scale(0.95);
  }
}

// ============================================
// 普通 Tab 图标
// ============================================
.tab-icon {
  width: 44rpx;
  height: 44rpx;
  margin-bottom: 2rpx;
  transition: all 0.2s ease;
  // 图标亮度微调，非选中态略暗
  filter: brightness(0.85);
}

.tab-item--active .tab-icon {
  filter: brightness(1);
  transform: scale(1.1);
}

// ============================================
// Tab 文字
// ============================================
.tab-text {
  font-size: 20rpx;
  color: $text-color-secondary;
  font-weight: 500;
  line-height: 1;
  transition: all 0.2s ease;
}

.tab-item--active .tab-text {
  color: $primary-color;
  font-weight: 600;
}

// ============================================
// 中间凸起拍照按钮
// ============================================
.tab-item--center {
  // 向上偏移，让按钮"冒"出来
  transform: translateY(-16rpx);

  .center-btn {
    width: 96rpx;
    height: 96rpx;
    border-radius: 50%;
    background: linear-gradient(
      145deg,
      $primary-light 0%,
      $primary-color 50%,
      $primary-dark 100%
    );
    display: flex;
    align-items: center;
    justify-content: center;
    // 凸起的立体感阴影
    box-shadow:
      0 8rpx 20rpx rgba($primary-color, 0.45),
      0 2rpx 6rpx rgba($primary-dark, 0.3),
      inset 0 2rpx 4rpx rgba(255, 255, 255, 0.35),
      inset 0 -2rpx 4rpx rgba(0, 0, 0, 0.1);

    // 高光点
    &::before {
      content: '';
      position: absolute;
      top: 6rpx;
      left: 50%;
      transform: translateX(-50%);
      width: 40rpx;
      height: 12rpx;
      background: rgba(255, 255, 255, 0.4);
      border-radius: 50%;
      filter: blur(4rpx);
    }

    &__icon {
      width: 44rpx;
      height: 44rpx;
      // 确保图标在渐变按钮上清晰可见
      filter: brightness(0) invert(1);
    }
  }

  .tab-text--center {
    color: $primary-color;
    font-weight: 600;
    font-size: 20rpx;
    margin-top: 2rpx;
    transform: translateY(8rpx);
  }

  // 选中态
  &.tab-item--active {
    .center-btn {
      box-shadow:
        0 10rpx 28rpx rgba($primary-color, 0.55),
        0 4rpx 10rpx rgba($primary-dark, 0.35),
        inset 0 3rpx 6rpx rgba(255, 255, 255, 0.4),
        inset 0 -3rpx 6rpx rgba(0, 0, 0, 0.12);
    }
  }
}
</style>
