<template>
  <view class="kids-page">
    <view class="nav-header">
      <text class="nav-back iconfont icon-arrow-left" @tap="goBack"></text>
      <text class="nav-title">儿童营养</text>
    </view>

    <scroll-view class="content-scroll" scroll-y>
      <!-- 营养知识卡片 -->
      <view class="tips-card">
        <view class="tips-header">
          <text class="tips-icon">&#128104;&#8205;&#127828;</text>
          <text class="tips-title">儿童营养指南</text>
        </view>
        <view class="tips-content">
          <text>3-6岁儿童每日需要：</text>
          <text class="tips-item">蛋白质：50-60g</text>
          <text class="tips-item">钙：800-1000mg</text>
          <text class="tips-item">铁：12mg</text>
          <text class="tips-item">锌：10mg</text>
        </view>
      </view>

      <!-- 年龄段选择 -->
      <view class="age-section">
        <view class="section-title">按年龄段选择</view>
        <view class="age-list">
          <view
            v-for="age in ageGroups"
            :key="age.key"
            class="age-item"
            :class="{ 'age-item--active': currentAge === age.key }"
            @tap="selectAge(age.key)"
          >
            <text class="age-range">{{ age.label }}</text>
          </view>
        </view>
      </view>

      <!-- 推荐食谱 -->
      <view class="recipes-section">
        <view class="section-title">营养食谱推荐</view>
        <view class="recipe-grid">
          <view v-for="recipe in recipes" :key="recipe.id" class="recipe-item">
            <RecipeCard :recipe="recipe" />
          </view>
        </view>
      </view>

      <!-- 营养提示 -->
      <view class="nutrition-tips">
        <view class="section-title">每日营养提示</view>
        <view class="tips-list">
          <view v-for="(tip, index) in dailyTips" :key="index" class="tip-item">
            <text class="tip-icon">{{ tip.icon }}</text>
            <text class="tip-text">{{ tip.text }}</text>
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

const currentAge = ref('3-6');
const recipes = ref<any[]>([]);

const ageGroups = [
  { key: '1-3', label: '1-3岁' },
  { key: '3-6', label: '3-6岁' },
  { key: '6-9', label: '6-9岁' },
  { key: '9-12', label: '9-12岁' },
];

const dailyTips = [
  { icon: '&#127813;', text: '早餐是一天中最重要的一餐' },
  { icon: '&#129367;', text: '多喝牛奶有助于补钙' },
  { icon: '&#127822;', text: '多吃蔬菜水果补充维生素' },
  { icon: '&#128170;', text: '适度运动促进食欲' },
];

function goBack() {
  navigateBack();
}

function selectAge(age: string) {
  currentAge.value = age;
  // TODO: 根据年龄段加载不同食谱
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.kids-page {
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

.tips-card {
  margin: $spacing-base;
  padding: $spacing-base;
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
  border-radius: $border-radius-base;

  .tips-header {
    display: flex;
    align-items: center;
    margin-bottom: $spacing-sm;

    .tips-icon {
      font-size: 48rpx;
      margin-right: $spacing-sm;
    }

    .tips-title {
      font-size: $font-size-lg;
      font-weight: bold;
      color: $text-color;
    }
  }

  .tips-content {
    font-size: $font-size-sm;
    color: $text-color;

    .tips-item {
      display: block;
      margin-top: $spacing-xs;
      padding-left: $spacing-base;
    }
  }
}

.age-section,
.recipes-section,
.nutrition-tips {
  padding: 0 $spacing-base $spacing-base;

  .section-title {
    font-size: $font-size-lg;
    font-weight: bold;
    margin-bottom: $spacing-sm;
  }
}

.age-list {
  display: flex;
  gap: $spacing-sm;

  .age-item {
    flex: 1;
    padding: $spacing-sm;
    background-color: $white;
    border-radius: $border-radius-base;
    text-align: center;

    &--active {
      background-color: $primary-color;
      color: $white;
    }

    .age-range {
      font-size: $font-size-sm;
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

.tips-list {
  background-color: $white;
  border-radius: $border-radius-base;
  padding: $spacing-sm;

  .tip-item {
    display: flex;
    align-items: center;
    padding: $spacing-sm 0;
    border-bottom: 1rpx solid $border-color-light;

    &:last-child {
      border-bottom: none;
    }

    .tip-icon {
      font-size: 32rpx;
      margin-right: $spacing-sm;
    }

    .tip-text {
      font-size: $font-size-sm;
      color: $text-color;
    }
  }
}
</style>
