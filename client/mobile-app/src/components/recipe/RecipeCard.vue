<template>
  <view class="recipe-card" @tap="handleClick">
    <image class="recipe-cover" :src="recipe.coverImage || '/static/images/recipe-default.png'" mode="aspectFill" />
    <view class="recipe-info">
      <view class="recipe-title">{{ recipe.title }}</view>
      <view class="recipe-meta">
        <view class="meta-item">
          <text class="iconfont icon-time"></text>
          <text>{{ recipe.cookingTime || 30 }}分钟</text>
        </view>
        <view class="meta-item">
          <text class="iconfont icon-fire"></text>
          <text>{{ recipe.calories || '--' }}千卡</text>
        </view>
        <view class="difficulty" :class="'difficulty--' + recipe.difficulty?.toLowerCase()">
          {{ difficultyText }}
        </view>
      </view>
      <view v-if="showTags && recipe.tags?.length" class="recipe-tags">
        <text v-for="tag in recipe.tags.slice(0, 2)" :key="tag" class="tag">{{ tag }}</text>
      </view>
    </view>
    <view v-if="recipe.isAiGenerated" class="ai-badge">
      <text>AI</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Recipe } from '@/types';
import { navigateTo } from '@/utils/navigate';

interface Props {
  recipe: Recipe;
  showTags?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showTags: true,
});

const difficultyText = computed(() => {
  const map: Record<string, string> = {
    EASY: '简单',
    MEDIUM: '中等',
    HARD: '困难',
  };
  return map[props.recipe.difficulty] || '未知';
});

function handleClick() {
  navigateTo('/pages/recipe/detail', { id: String(props.recipe.id) });
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.recipe-card {
  position: relative;
  background-color: $white;
  border-radius: $border-radius-base;
  overflow: hidden;
  box-shadow: $shadow-sm;

  .recipe-cover {
    width: 100%;
    height: 320rpx;
  }

  .recipe-info {
    padding: $spacing-sm;

    .recipe-title {
      font-size: $font-size-lg;
      font-weight: bold;
      color: $text-color;
      margin-bottom: $spacing-xs;
      @include text-ellipsis;
    }

    .recipe-meta {
      display: flex;
      align-items: center;
      gap: $spacing-sm;
      margin-bottom: $spacing-xs;

      .meta-item {
        display: flex;
        align-items: center;
        font-size: $font-size-sm;
        color: $text-color-secondary;

        .iconfont {
          margin-right: 4rpx;
        }
      }

      .difficulty {
        font-size: $font-size-xs;
        padding: 2rpx 8rpx;
        border-radius: 4rpx;
        margin-left: auto;

        &--easy {
          background-color: #e8f5e9;
          color: #4caf50;
        }

        &--medium {
          background-color: #fff3e0;
          color: #ff9800;
        }

        &--hard {
          background-color: #ffebee;
          color: #f44336;
        }
      }
    }

    .recipe-tags {
      display: flex;
      gap: 8rpx;

      .tag {
        font-size: $font-size-xs;
        color: $primary-color;
        background-color: #fff5e6;
        padding: 2rpx 8rpx;
        border-radius: 4rpx;
      }
    }
  }

  .ai-badge {
    position: absolute;
    top: 16rpx;
    right: 16rpx;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: $white;
    font-size: $font-size-xs;
    font-weight: bold;
    padding: 4rpx 12rpx;
    border-radius: $border-radius-sm;
  }
}
</style>
