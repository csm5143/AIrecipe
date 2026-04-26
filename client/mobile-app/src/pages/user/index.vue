<template>
  <view class="user-page">
    <view class="user-header">
      <view class="avatar">
        <text>{{ userStore.profile?.nickname?.charAt(0) || '游' }}</text>
      </view>
      <text class="nickname">{{ userStore.profile?.nickname || '未登录' }}</text>
    </view>
    <view class="menu-list">
      <view class="menu-item" @click="navigateTo('/pages/user/profile')">
        <text>个人资料</text>
        <text class="arrow">›</text>
      </view>
      <view class="menu-item" @click="navigateTo('/pages/user/collections')">
        <text>我的收藏</text>
        <text class="arrow">›</text>
      </view>
      <view class="menu-item" @click="navigateTo('/pages/user/feedback')">
        <text>意见反馈</text>
        <text class="arrow">›</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import Taro from '@tarojs/taro';

const userStore = {
  profile: { nickname: '用户' },
};

function navigateTo(url: string) {
  Taro.navigateTo({ url });
}
</script>

<style lang="scss">
.user-page {
  .user-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 40px 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    color: #fff;

    .avatar {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: rgba(255,255,255,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      margin-bottom: 12px;
    }

    .nickname {
      font-size: 16px;
    }
  }

  .menu-list {
    margin-top: 12px;
    background: #fff;

    .menu-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid #f0f0f0;
      font-size: 15px;
      color: #333;

      .arrow {
        color: #ccc;
        font-size: 18px;
      }
    }
  }
}
</style>
