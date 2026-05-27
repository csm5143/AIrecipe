<template>
  <view class="fitness-menu-page">
    <view class="nav-header">
      <text class="nav-back iconfont icon-arrow-left" @tap="goBack"></text>
      <text class="nav-title">健身食谱</text>
    </view>

    <scroll-view class="content-scroll" scroll-y>
      <!-- 热量筛选 -->
      <view class="filter-bar">
        <view
          v-for="filter in filters"
          :key="filter.key"
          class="filter-item"
          :class="{ 'filter-item--active': currentFilter === filter.key }"
          @tap="selectFilter(filter.key)"
        >
          {{ filter.label }}
        </view>
      </view>

      <!-- 营养指标 -->
      <view class="nutrition-summary">
        <view class="summary-item">
          <text class="summary-value">156</text>
          <text class="summary-label">千卡/份</text>
        </view>
        <view class="summary-item">
          <text class="summary-value">28g</text>
          <text class="summary-label">蛋白质</text>
        </view>
        <view class="summary-item">
          <text class="summary-value">12g</text>
          <text class="summary-label">碳水</text>
        </view>
        <view class="summary-item">
          <text class="summary-value">4g</text>
          <text class="summary-label">脂肪</text>
        </view>
      </view>

      <!-- 食谱列表 -->
      <view class="recipe-list">
        <view
          v-for="recipe in recipes"
          :key="recipe.id"
          class="recipe-card"
          @tap="goToDetail(recipe)"
        >
          <view class="card-left">
            <image class="recipe-cover" :src="recipe.coverImage || '/static/images/recipe-default.png'" mode="aspectFill" />
            <view class="calorie-badge">{{ recipe.calories }}千卡</view>
          </view>
          <view class="recipe-info">
            <view class="recipe-name">{{ recipe.name }}</view>
            <view class="nutrition-bars">
              <view class="bar-row">
                <text class="bar-label">蛋白质</text>
                <view class="bar-track">
                  <view class="bar-fill protein" :style="{ width: recipe.proteinPercent + '%' }"></view>
                </view>
                <text class="bar-value">{{ recipe.protein }}g</text>
              </view>
              <view class="bar-row">
                <text class="bar-label">碳水</text>
                <view class="bar-track">
                  <view class="bar-fill carbs" :style="{ width: recipe.carbsPercent + '%' }"></view>
                </view>
                <text class="bar-value">{{ recipe.carbs }}g</text>
              </view>
              <view class="bar-row">
                <text class="bar-label">脂肪</text>
                <view class="bar-track">
                  <view class="bar-fill fat" :style="{ width: recipe.fatPercent + '%' }"></view>
                </view>
                <text class="bar-value">{{ recipe.fat }}g</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { navigateBack, navigateTo } from '@/utils/navigate';

const currentFilter = ref('all');

const filters = [
  { key: 'all', label: '全部' },
  { key: 'high-protein', label: '高蛋白' },
  { key: 'low-fat', label: '低脂' },
  { key: 'low-carb', label: '低碳水' },
  { key: 'pre-workout', label: '训练前' },
];

const recipes = ref<any[]>([
  { id: 1, name: '鸡胸肉沙拉', coverImage: '', calories: 320, protein: 42, proteinPercent: 70, carbs: 8, carbsPercent: 15, fat: 8, fatPercent: 15 },
  { id: 2, name: '三文鱼牛油果碗', coverImage: '', calories: 450, protein: 35, proteinPercent: 60, carbs: 20, carbsPercent: 25, fat: 25, fatPercent: 15 },
  { id: 3, name: '蛋白煎蛋卷', coverImage: '', calories: 180, protein: 28, proteinPercent: 80, carbs: 5, carbsPercent: 10, fat: 6, fatPercent: 10 },
  { id: 4, name: '希腊酸奶水果碗', coverImage: '', calories: 280, protein: 22, proteinPercent: 55, carbs: 30, carbsPercent: 35, fat: 8, fatPercent: 10 },
]);

function goBack() {
  navigateBack();
}

function selectFilter(key: string) {
  currentFilter.value = key;
}

function goToDetail(recipe: any) {
  navigateTo(`/pages/recipe/detail?id=${recipe.id}`);
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.fitness-menu-page {
  min-height: 100vh;
  background-color: #1a1a2e;
}

.nav-header {
  display: flex;
  align-items: center;
  justify-content: center;
  height: $nav-height;
  background-color: #1a1a2e;
  position: sticky;
  top: 0;
  z-index: 10;

  .nav-back {
    position: absolute;
    left: $spacing-base;
    font-size: $font-size-xl;
    color: $white;
  }

  .nav-title {
    font-size: $font-size-lg;
    font-weight: bold;
    color: $white;
  }
}

.content-scroll {
  height: calc(100vh - #{$nav-height} - 120rpx);
  padding-bottom: 120rpx;
}

.filter-bar {
  display: flex;
  gap: $spacing-sm;
  padding: $spacing-base;
  overflow-x: auto;

  &::-webkit-scrollbar {
    display: none;
  }

  .filter-item {
    padding: $spacing-xs $spacing-base;
    background-color: rgba($white, 0.1);
    color: rgba($white, 0.7);
    border-radius: 50rpx;
    font-size: $font-size-sm;
    white-space: nowrap;
    border: 1px solid rgba($white, 0.1);

    &--active {
      background-color: $primary-color;
      color: $white;
      border-color: $primary-color;
      font-weight: bold;
    }
  }
}

.nutrition-summary {
  display: flex;
  padding: $spacing-base;
  margin: 0 $spacing-base $spacing-sm;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: $border-radius-base;

  .summary-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;

    .summary-value {
      font-size: $font-size-xl;
      font-weight: bold;
      color: $white;
    }

    .summary-label {
      font-size: 18rpx;
      color: rgba($white, 0.8);
      margin-top: 4rpx;
    }
  }
}

.recipe-list {
  padding: 0 $spacing-base;

  .recipe-card {
    display: flex;
    background-color: rgba($white, 0.05);
    border-radius: $border-radius-base;
    padding: $spacing-sm;
    margin-bottom: $spacing-sm;
    border: 1px solid rgba($white, 0.1);

    .card-left {
      position: relative;
      flex-shrink: 0;

      .recipe-cover {
        width: 200rpx;
        height: 200rpx;
        border-radius: $border-radius-base;
        background-color: rgba($white, 0.1);
      }

      .calorie-badge {
        position: absolute;
        top: $spacing-xs;
        left: $spacing-xs;
        padding: 2rpx $spacing-xs;
        background-color: rgba($primary-color, 0.9);
        color: $white;
        border-radius: $border-radius-sm;
        font-size: 18rpx;
        font-weight: bold;
      }
    }

    .recipe-info {
      flex: 1;
      margin-left: $spacing-sm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;

      .recipe-name {
        font-size: $font-size-base;
        font-weight: bold;
        color: $white;
        line-height: 1.4;
      }

      .nutrition-bars {
        .bar-row {
          display: flex;
          align-items: center;
          margin-bottom: 6rpx;

          .bar-label {
            width: 80rpx;
            font-size: 18rpx;
            color: rgba($white, 0.6);
          }

          .bar-track {
            flex: 1;
            height: 8rpx;
            background-color: rgba($white, 0.1);
            border-radius: 4rpx;
            margin: 0 $spacing-xs;
            overflow: hidden;

            .bar-fill {
              height: 100%;
              border-radius: 4rpx;
            }

            .protein { background-color: #34c759; }
            .carbs { background-color: #ff9500; }
            .fat { background-color: #ff3b30; }
          }

          .bar-value {
            width: 60rpx;
            font-size: 18rpx;
            color: rgba($white, 0.8);
            text-align: right;
          }
        }
      }
    }
  }
}
</style>
