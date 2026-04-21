<template>
  <view class="index-page">
    <view class="banner">
      <text>AIRecipe · 智能食谱</text>
    </view>
    <view class="section">
      <text class="section-title">热门食谱</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onShow } from '@tarojs/taro';

onShow(() => {
  console.log('index page show');
});
</script>

<style lang="scss">
.index-page {
  padding: 20px;

  .banner {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 12px;
    padding: 40px 20px;
    text-align: center;
    color: #fff;
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 20px;
  }

  .section {
    .section-title {
      font-size: 18px;
      font-weight: 600;
      color: #333;
    }
  }
}
</style>
