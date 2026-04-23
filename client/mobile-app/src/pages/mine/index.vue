<template>
  <view class="mine-page">
    <!-- 用户信息 -->
    <view class="user-section">
      <view class="user-bg"></view>
      <view class="user-card">
        <image
          class="user-avatar"
          :src="userStore.avatar || '/static/images/avatar-default.png'"
          mode="aspectFill"
          @tap="uploadAvatar"
        />
        <view v-if="userStore.isLoggedIn" class="user-info">
          <text class="user-nickname">{{ userStore.nickname }}</text>
          <text class="user-id">ID: {{ userStore.userId }}</text>
        </view>
        <view v-else class="login-tip" @tap="goToLogin">
          <text>点击登录</text>
        </view>
      </view>
    </view>

    <!-- 功能菜单 -->
    <view class="menu-section">
      <view class="menu-item" @tap="goToMyRecipes">
        <image class="menu-icon" src="/static/icons/my-recipe.png" mode="aspectFit" />
        <text class="menu-text">我的菜谱</text>
        <text class="iconfont icon-arrow-right"></text>
      </view>
      <view class="menu-item" @tap="goToMyFeedback">
        <image class="menu-icon" src="/static/icons/feedback.png" mode="aspectFit" />
        <text class="menu-text">意见反馈</text>
        <text class="iconfont icon-arrow-right"></text>
      </view>
      <view class="menu-item" @tap="goToAbout">
        <image class="menu-icon" src="/static/icons/about.png" mode="aspectFit" />
        <text class="menu-text">关于我们</text>
        <text class="iconfont icon-arrow-right"></text>
      </view>
      <view class="menu-item" @tap="goToSettings">
        <image class="menu-icon" src="/static/icons/settings.png" mode="aspectFit" />
        <text class="menu-text">设置</text>
        <text class="iconfont icon-arrow-right"></text>
      </view>
    </view>

    <!-- 退出登录 -->
    <view v-if="userStore.isLoggedIn" class="logout-section">
      <view class="logout-btn" @tap="handleLogout">
        <text>退出登录</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { useUserStore } from '@/store/user';
import { navigateTo, switchTab } from '@/utils/navigate';
import { showToast } from '@/utils/toast';

const userStore = useUserStore();

function goToLogin() {
  navigateTo('/pages/login/index');
}

function uploadAvatar() {
  if (!userStore.isLoggedIn) {
    goToLogin();
    return;
  }
  uni.chooseImage({
    count: 1,
    sourceType: ['album', 'camera'],
    success: (res) => {
      // TODO: 上传头像
      console.log('Selected avatar:', res.tempFilePaths[0]);
    },
  });
}

function goToMyRecipes() {
  if (!userStore.isLoggedIn) {
    goToLogin();
    return;
  }
  navigateTo('/pages/mine/recipes');
}

function goToMyFeedback() {
  if (!userStore.isLoggedIn) {
    goToLogin();
    return;
  }
  navigateTo('/pages/mine/feedback');
}

function goToAbout() {
  navigateTo('/pages/mine/about');
}

function goToSettings() {
  if (!userStore.isLoggedIn) {
    goToLogin();
    return;
  }
  navigateTo('/pages/mine/settings');
}

async function handleLogout() {
  await userStore.logout();
  showToast('已退出登录');
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.mine-page {
  min-height: 100vh;
  background-color: $bg-color;
}

.user-section {
  position: relative;

  .user-bg {
    height: 300rpx;
    background: linear-gradient(135deg, $primary-color 0%, #ffb84d 100%);
  }

  .user-card {
    position: absolute;
    left: $spacing-base;
    right: $spacing-base;
    top: 100rpx;
    display: flex;
    align-items: center;
    padding: $spacing-base;
    background-color: $white;
    border-radius: $border-radius-lg;
    box-shadow: $shadow-base;

    .user-avatar {
      width: 120rpx;
      height: 120rpx;
      border-radius: 60rpx;
      flex-shrink: 0;
    }

    .user-info {
      margin-left: $spacing-base;
      flex: 1;

      .user-nickname {
        font-size: $font-size-lg;
        font-weight: bold;
        color: $text-color;
        display: block;
        margin-bottom: $spacing-xs;
      }

      .user-id {
        font-size: $font-size-sm;
        color: $text-color-secondary;
      }
    }

    .login-tip {
      flex: 1;
      text-align: center;

      text {
        font-size: $font-size-base;
        color: $primary-color;
      }
    }
  }
}

.menu-section {
  margin: 200rpx $spacing-base 0;
  background-color: $white;
  border-radius: $border-radius-base;

  .menu-item {
    display: flex;
    align-items: center;
    padding: $spacing-base;
    border-bottom: 1rpx solid $border-color-light;

    &:last-child {
      border-bottom: none;
    }

    .menu-icon {
      width: 48rpx;
      height: 48rpx;
      margin-right: $spacing-sm;
    }

    .menu-text {
      flex: 1;
      font-size: $font-size-base;
      color: $text-color;
    }
  }
}

.logout-section {
  padding: $spacing-xl $spacing-base;

  .logout-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 88rpx;
    background-color: $white;
    border-radius: $border-radius-base;

    text {
      font-size: $font-size-base;
      color: $danger-color;
    }
  }
}
</style>
