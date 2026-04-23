<template>
  <view class="scan-page">
    <!-- 顶部提示 -->
    <view class="scan-header">
      <text class="scan-tip">拍摄食材照片，AI自动识别并生成菜谱</text>
    </view>

    <!-- 拍照区域 -->
    <view class="camera-area">
      <view class="camera-frame">
        <view class="corner top-left"></view>
        <view class="corner top-right"></view>
        <view class="corner bottom-left"></view>
        <view class="corner bottom-right"></view>
        <view v-if="!hasPhoto" class="camera-placeholder">
          <image class="camera-icon" src="/static/icons/camera-large.png" mode="aspectFit" />
          <text class="camera-text">将食材放入框内拍摄</text>
        </view>
        <image v-else class="preview-image" :src="photoPath" mode="aspectFill" />
      </view>
    </view>

    <!-- 识别结果 -->
    <view v-if="recognizedIngredients.length" class="result-section">
      <view class="result-title">
        <text>识别到的食材</text>
        <text class="result-count">{{ recognizedIngredients.length }}种</text>
      </view>
      <view class="ingredient-tags">
        <text v-for="(item, index) in recognizedIngredients" :key="index" class="ingredient-tag">
          {{ item.name }}
        </text>
      </view>
    </view>

    <!-- 操作按钮 -->
    <view class="action-buttons">
      <view v-if="!hasPhoto" class="btn-take" @tap="takePhoto">
        <view class="btn-inner">
          <image class="btn-icon" src="/static/icons/camera.png" mode="aspectFit" />
          <text>拍照识别</text>
        </view>
      </view>

      <view v-else class="btn-group">
        <view class="btn btn-secondary" @tap="retake">
          <text>重新拍摄</text>
        </view>
        <view class="btn btn-primary" :class="{ 'btn-loading': isGenerating }" @tap="generateRecipe">
          <text v-if="!isGenerating">生成菜谱</text>
          <text v-else>AI分析中...</text>
        </view>
      </view>
    </view>

    <!-- 生成结果预览 -->
    <view v-if="generatedRecipe" class="recipe-preview">
      <view class="preview-header">
        <text class="preview-title">AI 生成的菜谱</text>
      </view>
      <view class="preview-content" @tap="viewRecipeDetail">
        <image class="preview-cover" :src="generatedRecipe.coverImage || '/static/images/recipe-default.png'" mode="aspectFill" />
        <view class="preview-info">
          <text class="preview-name">{{ generatedRecipe.title }}</text>
          <text class="preview-desc">{{ generatedRecipe.description || '一道美味的菜肴' }}</text>
          <view class="preview-meta">
            <text>{{ generatedRecipe.cookingTime || 30 }}分钟</text>
            <text>{{ generatedRecipe.calories || '--' }}千卡</text>
          </view>
        </view>
      </view>
      <view class="preview-action">
        <text class="action-text" @tap="viewRecipeDetail">查看完整菜谱</text>
        <text class="iconfont icon-arrow-right"></text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { navigateTo } from '@/utils/navigate';
import { showToast } from '@/utils/toast';
import { uploadImage } from '@/api/upload';
import { generateRecipeByPhoto } from '@/api/recipe';
import type { Recipe } from '@/types';

const photoPath = ref('');
const hasPhoto = ref(false);
const recognizedIngredients = ref<{ name: string; confidence: number }[]>([]);
const isGenerating = ref(false);
const generatedRecipe = ref<Recipe | null>(null);

// 拍照
function takePhoto() {
  uni.chooseImage({
    count: 1,
    sourceType: ['camera'],
    success: (res) => {
      photoPath.value = res.tempFilePaths[0];
      hasPhoto.value = true;
      // 模拟识别结果
      simulateRecognition();
    },
    fail: () => {
      showToast('请允许相机权限');
    },
  });
}

// 重新拍摄
function retake() {
  photoPath.value = '';
  hasPhoto.value = false;
  recognizedIngredients.value = [];
  generatedRecipe.value = null;
}

// 模拟识别（实际项目中调用 AI 识别接口）
function simulateRecognition() {
  // 模拟识别结果
  recognizedIngredients.value = [
    { name: '西红柿', confidence: 0.95 },
    { name: '鸡蛋', confidence: 0.92 },
    { name: '葱花', confidence: 0.88 },
  ];
}

// 生成菜谱
async function generateRecipe() {
  if (isGenerating.value) return;
  isGenerating.value = true;

  try {
    // 1. 上传图片
    const uploadRes = await uploadImage(photoPath.value, 'recipe');
    const imageUrl = uploadRes.data?.url || '';

    // 2. 调用 AI 生成菜谱
    const recipeRes = await generateRecipeByPhoto(imageUrl);
    if (recipeRes.data) {
      generatedRecipe.value = recipeRes.data;
      showToast('菜谱生成成功');
    }
  } catch (e: any) {
    showToast(e.message || '生成失败，请重试');
  } finally {
    isGenerating.value = false;
  }
}

// 查看菜谱详情
function viewRecipeDetail() {
  if (generatedRecipe.value) {
    navigateTo('/pages/recipe/detail', { id: String(generatedRecipe.value.id) });
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.scan-page {
  min-height: 100vh;
  background-color: #1a1a1a;
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}

.scan-header {
  padding: $spacing-base;
  text-align: center;

  .scan-tip {
    color: rgba(255, 255, 255, 0.8);
    font-size: $font-size-sm;
  }
}

.camera-area {
  display: flex;
  justify-content: center;
  padding: $spacing-lg 0;

  .camera-frame {
    position: relative;
    width: 500rpx;
    height: 500rpx;
    border: 2rpx solid rgba(255, 255, 255, 0.3);
    border-radius: $border-radius-lg;
    overflow: hidden;

    .corner {
      position: absolute;
      width: 40rpx;
      height: 40rpx;
      border-color: $primary-color;
      border-style: solid;

      &.top-left {
        top: 0;
        left: 0;
        border-width: 6rpx 0 0 6rpx;
      }

      &.top-right {
        top: 0;
        right: 0;
        border-width: 6rpx 6rpx 0 0;
      }

      &.bottom-left {
        bottom: 0;
        left: 0;
        border-width: 0 0 6rpx 6rpx;
      }

      &.bottom-right {
        bottom: 0;
        right: 0;
        border-width: 0 6rpx 6rpx 0;
      }
    }

    .camera-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;

      .camera-icon {
        width: 120rpx;
        height: 120rpx;
        margin-bottom: $spacing-base;
        opacity: 0.5;
      }

      .camera-text {
        color: rgba(255, 255, 255, 0.6);
        font-size: $font-size-base;
      }
    }

    .preview-image {
      width: 100%;
      height: 100%;
    }
  }
}

.result-section {
  padding: $spacing-base;
  margin: 0 $spacing-base;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: $border-radius-base;
  margin-bottom: $spacing-base;

  .result-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-sm;
    color: $white;
    font-size: $font-size-base;

    .result-count {
      color: $primary-color;
    }
  }

  .ingredient-tags {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-xs;

    .ingredient-tag {
      padding: $spacing-xs $spacing-sm;
      background-color: rgba(255, 149, 0, 0.2);
      color: $primary-color;
      border-radius: $border-radius-sm;
      font-size: $font-size-sm;
    }
  }
}

.action-buttons {
  padding: $spacing-base $spacing-lg;

  .btn-take {
    display: flex;
    justify-content: center;

    .btn-inner {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: $spacing-base $spacing-xl;
      background-color: $primary-color;
      border-radius: $border-radius-lg;

      .btn-icon {
        width: 80rpx;
        height: 80rpx;
        margin-bottom: $spacing-sm;
      }

      text {
        color: $white;
        font-size: $font-size-lg;
        font-weight: bold;
      }
    }
  }

  .btn-group {
    display: flex;
    gap: $spacing-base;

    .btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 88rpx;
      border-radius: $border-radius-base;
      font-size: $font-size-lg;
    }

    .btn-secondary {
      background-color: rgba(255, 255, 255, 0.2);
      color: $white;
    }

    .btn-primary {
      background-color: $primary-color;
      color: $white;

      &.btn-loading {
        opacity: 0.7;
      }
    }
  }
}

.recipe-preview {
  margin: $spacing-base $spacing-base 0;
  background-color: $white;
  border-radius: $border-radius-base;
  overflow: hidden;

  .preview-header {
    padding: $spacing-sm $spacing-base;
    background-color: $bg-color;

    .preview-title {
      font-size: $font-size-base;
      font-weight: bold;
      color: $text-color;
    }
  }

  .preview-content {
    display: flex;
    padding: $spacing-sm;

    .preview-cover {
      width: 200rpx;
      height: 200rpx;
      border-radius: $border-radius-sm;
      flex-shrink: 0;
    }

    .preview-info {
      flex: 1;
      margin-left: $spacing-sm;
      display: flex;
      flex-direction: column;

      .preview-name {
        font-size: $font-size-lg;
        font-weight: bold;
        color: $text-color;
        margin-bottom: $spacing-xs;
      }

      .preview-desc {
        flex: 1;
        font-size: $font-size-sm;
        color: $text-color-secondary;
        @include text-ellipsis-2;
      }

      .preview-meta {
        display: flex;
        gap: $spacing-base;
        font-size: $font-size-sm;
        color: $text-color-secondary;
      }
    }
  }

  .preview-action {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: $spacing-base;
    border-top: 1rpx solid $border-color-light;

    .action-text {
      color: $primary-color;
      font-size: $font-size-base;
    }
  }
}
</style>
