<template>
  <view class="kids-menu-page">
    <view class="nav-header">
      <text class="nav-back iconfont icon-arrow-left" @tap="goBack"></text>
      <text class="nav-title">儿童食谱</text>
    </view>

    <scroll-view class="content-scroll" scroll-y>
      <!-- 年龄段切换 -->
      <view class="age-tabs">
        <view
          v-for="age in ageGroups"
          :key="age.key"
          class="tab-item"
          :class="{ 'tab-item--active': currentAge === age.key }"
          @tap="selectAge(age.key)"
        >
          <text>{{ age.label }}</text>
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
          <image class="recipe-cover" :src="recipe.coverImage || '/static/images/recipe-default.png'" mode="aspectFill" />
          <view class="recipe-info">
            <view class="recipe-name">{{ recipe.name }}</view>
            <view class="recipe-meta">
              <text class="meta-item">&#128337; {{ recipe.cookTime || '30分钟' }}</text>
              <text class="meta-item">&#127828; {{ recipe.difficulty || '简单' }}</text>
            </view>
            <view class="recipe-tags">
              <text v-for="tag in (recipe.tags || []).slice(0, 2)" :key="tag" class="tag">{{ tag }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <view v-if="recipes.length === 0" class="empty-state">
        <text class="empty-icon">&#127828;</text>
        <text class="empty-text">暂无{{ currentAge }}岁推荐食谱</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { navigateBack, navigateTo } from '@/utils/navigate';

const currentAge = ref('3-6');

const ageGroups = [
  { key: '1-3', label: '1-3岁' },
  { key: '3-6', label: '3-6岁' },
  { key: '6-9', label: '6-9岁' },
  { key: '9-12', label: '9-12岁' },
];

const recipes = ref<any[]>([
  { id: 1, name: '胡萝卜鸡蛋饼', coverImage: '', cookTime: '20分钟', difficulty: '简单', tags: ['补铁', '护眼'] },
  { id: 2, name: '三鲜小馄饨', coverImage: '', cookTime: '30分钟', difficulty: '中等', tags: ['补钙', '易消化'] },
  { id: 3, name: '番茄牛腩面', coverImage: '', cookTime: '40分钟', difficulty: '中等', tags: ['补铁', '开胃'] },
  { id: 4, name: '虾仁蔬菜粥', coverImage: '', cookTime: '25分钟', difficulty: '简单', tags: ['高蛋白', '暖胃'] },
]);

function goBack() {
  navigateBack();
}

function selectAge(age: string) {
  currentAge.value = age;
}

function goToDetail(recipe: any) {
  navigateTo(`/pages/recipe/detail?id=${recipe.id}`);
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.kids-menu-page {
  min-height: 100vh;
  background-color: $bg-color;
}

.nav-header {
  display: flex;
  align-items: center;
  justify-content: center;
  height: $nav-height;
  background-color: $white;
  position: sticky;
  top: 0;
  z-index: 10;

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
  height: calc(100vh - #{$nav-height} - 120rpx);
  padding-bottom: 120rpx;
}

.age-tabs {
  display: flex;
  gap: $spacing-sm;
  padding: $spacing-base;
  background-color: $white;
  margin-bottom: $spacing-sm;

  .tab-item {
    flex: 1;
    text-align: center;
    padding: $spacing-sm;
    background-color: $bg-color;
    border-radius: $border-radius-base;
    font-size: $font-size-sm;
    color: $text-color-secondary;

    &--active {
      background-color: $primary-color;
      color: $white;
      font-weight: bold;
    }
  }
}

.recipe-list {
  padding: 0 $spacing-base;

  .recipe-card {
    display: flex;
    background-color: $white;
    border-radius: $border-radius-base;
    padding: $spacing-sm;
    margin-bottom: $spacing-sm;
    box-shadow: $shadow-sm;

    .recipe-cover {
      width: 180rpx;
      height: 180rpx;
      border-radius: $border-radius-base;
      flex-shrink: 0;
      background-color: $bg-color;
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
        color: $text-color;
        line-height: 1.4;
      }

      .recipe-meta {
        display: flex;
        gap: $spacing-sm;

        .meta-item {
          font-size: $font-size-xs;
          color: $text-color-secondary;
        }
      }

      .recipe-tags {
        display: flex;
        gap: $spacing-xs;

        .tag {
          padding: 2rpx $spacing-xs;
          background-color: rgba($primary-color, 0.1);
          color: $primary-color;
          border-radius: $border-radius-sm;
          font-size: 18rpx;
        }
      }
    }
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $spacing-xl * 2;

  .empty-icon {
    font-size: 80rpx;
    margin-bottom: $spacing-base;
  }

  .empty-text {
    font-size: $font-size-sm;
    color: $text-color-secondary;
  }
}
</style>
