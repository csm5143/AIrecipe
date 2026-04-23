<template>
  <view class="fitness-page">
    <view class="nav-header">
      <text class="nav-back iconfont icon-arrow-left" @tap="goBack"></text>
      <text class="nav-title">健身餐</text>
    </view>

    <scroll-view class="content-scroll" scroll-y>
      <!-- 热量目标 -->
      <view class="calorie-card">
        <view class="calorie-header">
          <text class="calorie-icon">&#128170;</text>
          <text class="calorie-title">今日热量目标</text>
        </view>
        <view class="calorie-input">
          <input
            v-model="dailyCalories"
            type="number"
            placeholder="请输入每日热量目标"
            class="calorie-input-field"
          />
          <text class="calorie-unit">千卡</text>
        </view>
        <view class="calorie-presets">
          <text
            v-for="preset in caloriePresets"
            :key="preset.value"
            class="preset-btn"
            :class="{ 'preset-btn--active': dailyCalories == preset.value }"
            @tap="setCalories(preset.value)"
          >
            {{ preset.label }}
          </text>
        </view>
      </view>

      <!-- 饮食偏好 -->
      <view class="preference-section">
        <view class="section-title">饮食偏好</view>
        <view class="preference-tags">
          <text
            v-for="tag in preferenceTags"
            :key="tag.key"
            class="tag-item"
            :class="{ 'tag-item--active': selectedPreferences.includes(tag.key) }"
            @tap="togglePreference(tag.key)"
          >
            {{ tag.label }}
          </text>
        </view>
      </view>

      <!-- 推荐食谱 -->
      <view class="recipes-section">
        <view class="section-title">健身食谱推荐</view>
        <view class="recipe-grid">
          <view v-for="recipe in recipes" :key="recipe.id" class="recipe-item">
            <RecipeCard :recipe="recipe" />
          </view>
        </view>
      </view>

      <!-- 营养成分 -->
      <view class="nutrition-section">
        <view class="section-title">每日营养摄入建议</view>
        <view class="nutrition-bars">
          <view class="nutrition-bar">
            <view class="bar-label">蛋白质</view>
            <view class="bar-track">
              <view class="bar-fill protein" :style="{ width: '60%' }"></view>
            </view>
            <view class="bar-value">60%</view>
          </view>
          <view class="nutrition-bar">
            <view class="bar-label">碳水</view>
            <view class="bar-track">
              <view class="bar-fill carbs" :style="{ width: '25%' }"></view>
            </view>
            <view class="bar-value">25%</view>
          </view>
          <view class="nutrition-bar">
            <view class="bar-label">脂肪</view>
            <view class="bar-track">
              <view class="bar-fill fat" :style="{ width: '15%' }"></view>
            </view>
            <view class="bar-value">15%</view>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { navigateBack } from '@/utils/navigate';
import RecipeCard from '@/components/recipe/RecipeCard.vue';

const dailyCalories = ref('1800');
const selectedPreferences = ref<string[]>(['high-protein', 'low-fat']);
const recipes = ref<any[]>([]);

const caloriePresets = [
  { label: '减脂', value: '1500' },
  { label: '维持', value: '2000' },
  { label: '增肌', value: '2500' },
];

const preferenceTags = [
  { key: 'high-protein', label: '高蛋白' },
  { key: 'low-fat', label: '低脂' },
  { key: 'low-carb', label: '低碳水' },
  { key: 'high-fiber', label: '高纤维' },
  { key: 'low-calorie', label: '低热量' },
  { key: 'low-sodium', label: '低钠' },
];

function goBack() {
  navigateBack();
}

function setCalories(value: string) {
  dailyCalories.value = value;
}

function togglePreference(key: string) {
  const index = selectedPreferences.value.indexOf(key);
  if (index > -1) {
    selectedPreferences.value.splice(index, 1);
  } else {
    selectedPreferences.value.push(key);
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.fitness-page {
  min-height: 100vh;
  background-color: $bg-color;
}

.nav-header {
  display: flex;
  align-items: center;
  justify-content: center;
  height: $nav-height;
  background-color: $white;

  .nav-back {
    position: absolute;
    left: $spacing-base;
    font-size: $font-size-xl;
  }

  .nav-title {
    font-size: $font-size-lg;
    font-weight: bold;
  }
}

.content-scroll {
  height: calc(100vh - #{$nav-height});
}

.calorie-card {
  margin: $spacing-base;
  padding: $spacing-base;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: $border-radius-base;

  .calorie-header {
    display: flex;
    align-items: center;
    margin-bottom: $spacing-base;

    .calorie-icon {
      font-size: 48rpx;
      margin-right: $spacing-sm;
    }

    .calorie-title {
      font-size: $font-size-lg;
      font-weight: bold;
      color: $white;
    }
  }

  .calorie-input {
    display: flex;
    align-items: center;
    background-color: rgba(255, 255, 255, 0.2);
    border-radius: $border-radius-base;
    padding: $spacing-sm $spacing-base;
    margin-bottom: $spacing-sm;

    .calorie-input-field {
      flex: 1;
      font-size: $font-size-xl;
      color: $white;
    }

    .calorie-unit {
      color: rgba(255, 255, 255, 0.8);
      font-size: $font-size-sm;
    }
  }

  .calorie-presets {
    display: flex;
    gap: $spacing-sm;

    .preset-btn {
      flex: 1;
      text-align: center;
      padding: $spacing-xs;
      background-color: rgba(255, 255, 255, 0.2);
      color: $white;
      border-radius: $border-radius-sm;
      font-size: $font-size-sm;

      &--active {
        background-color: $white;
        color: #764ba2;
      }
    }
  }
}

.preference-section,
.recipes-section,
.nutrition-section {
  padding: 0 $spacing-base $spacing-base;

  .section-title {
    font-size: $font-size-lg;
    font-weight: bold;
    margin-bottom: $spacing-sm;
  }
}

.preference-tags {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-xs;

  .tag-item {
    padding: $spacing-xs $spacing-sm;
    background-color: $white;
    color: $text-color;
    border-radius: $border-radius-sm;
    font-size: $font-size-sm;

    &--active {
      background-color: #667eea;
      color: $white;
    }
  }
}

.recipe-grid {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-sm;

  .recipe-item {
    width: calc(50% - #{$spacing-sm / 2});
  }
}

.nutrition-bars {
  background-color: $white;
  border-radius: $border-radius-base;
  padding: $spacing-base;

  .nutrition-bar {
    display: flex;
    align-items: center;
    margin-bottom: $spacing-sm;

    &:last-child {
      margin-bottom: 0;
    }

    .bar-label {
      width: 100rpx;
      font-size: $font-size-sm;
      color: $text-color-secondary;
    }

    .bar-track {
      flex: 1;
      height: 16rpx;
      background-color: $bg-color;
      border-radius: 8rpx;
      margin: 0 $spacing-sm;
      overflow: hidden;

      .bar-fill {
        height: 100%;
        border-radius: 8rpx;
      }

      .protein { background-color: #34c759; }
      .carbs { background-color: #ff9500; }
      .fat { background-color: #ff3b30; }
    }

    .bar-value {
      width: 80rpx;
      text-align: right;
      font-size: $font-size-sm;
      color: $text-color;
    }
  }
}
</style>
