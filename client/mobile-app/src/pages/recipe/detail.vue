<template>
  <view class="recipe-detail-page">
    <!-- 顶部导航 -->
    <view class="nav-bar" :class="{ 'nav-bar--transparent': scrollTop < 300 }">
      <view class="nav-back" @tap="goBack">
        <text class="iconfont icon-arrow-left"></text>
      </view>
      <view class="nav-actions">
        <text class="iconfont icon-share" @tap="shareRecipe"></text>
        <text class="iconfont icon-ellipsis" @tap="showMoreActions"></text>
      </view>
    </view>

    <!-- 主图 -->
    <view class="cover-section">
      <image
        class="cover-image"
        :src="recipe?.coverImage || '/static/images/recipe-default.png'"
        mode="aspectFill"
      />
      <view v-if="recipe?.isAiGenerated" class="ai-badge">
        <text>AI 生成</text>
      </view>
    </view>

    <!-- 内容区域 -->
    <scroll-view class="content-scroll" scroll-y @scroll="onScroll">
      <view class="content-wrapper">
        <!-- 基本信息 -->
        <view class="info-section">
          <view class="recipe-title">{{ recipe?.title || '加载中...' }}</view>
          <view class="recipe-desc">{{ recipe?.description || '' }}</view>

          <view class="meta-row">
            <view class="meta-item">
              <text class="meta-label">难度</text>
              <text class="meta-value difficulty" :class="'difficulty--' + recipe?.difficulty?.toLowerCase()">
                {{ difficultyText }}
              </text>
            </view>
            <view class="meta-item">
              <text class="meta-label">耗时</text>
              <text class="meta-value">{{ recipe?.cookingTime || 30 }}分钟</text>
            </view>
            <view class="meta-item">
              <text class="meta-label">热量</text>
              <text class="meta-value">{{ recipe?.calories || '--' }}千卡</text>
            </view>
            <view class="meta-item">
              <text class="meta-label">份量</text>
              <text class="meta-value">{{ recipe?.servings || 2 }}人份</text>
            </view>
          </view>

          <!-- 标签 -->
          <view v-if="recipe?.tags?.length" class="tags-row">
            <text v-for="tag in recipe.tags" :key="tag" class="tag">{{ tag }}</text>
          </view>
        </view>

        <!-- 营养信息 -->
        <view v-if="recipe?.nutrition" class="nutrition-section">
          <view class="section-title">营养信息</view>
          <view class="nutrition-grid">
            <view class="nutrition-item">
              <text class="nutrition-value">{{ recipe.nutrition.calories || '--' }}</text>
              <text class="nutrition-label">千卡</text>
            </view>
            <view class="nutrition-item">
              <text class="nutrition-value">{{ recipe.nutrition.protein || '--' }}g</text>
              <text class="nutrition-label">蛋白质</text>
            </view>
            <view class="nutrition-item">
              <text class="nutrition-value">{{ recipe.nutrition.fat || '--' }}g</text>
              <text class="nutrition-label">脂肪</text>
            </view>
            <view class="nutrition-item">
              <text class="nutrition-value">{{ recipe.nutrition.carbs || '--' }}g</text>
              <text class="nutrition-label">碳水</text>
            </view>
          </view>
        </view>

        <!-- 食材清单 -->
        <view class="ingredient-section">
          <view class="section-title">食材清单</view>
          <view class="ingredient-list">
            <view v-for="(item, index) in recipe?.ingredients" :key="index" class="ingredient-item">
              <text class="ingredient-name">{{ item.name }}</text>
              <text class="ingredient-amount">
                {{ item.amount }}{{ item.unit || '' }}
                <text v-if="item.isOptional" class="optional">(可选)</text>
              </text>
            </view>
          </view>
        </view>

        <!-- 步骤 -->
        <view class="steps-section">
          <view class="section-title">烹饪步骤</view>
          <view class="steps-list">
            <view v-for="(step, index) in recipe?.steps" :key="index" class="step-item">
              <view class="step-number">{{ index + 1 }}</view>
              <view class="step-content">
                <text class="step-text">{{ step.content }}</text>
                <image v-if="step.image" class="step-image" :src="step.image" mode="aspectFill" />
                <view v-if="step.duration" class="step-duration">
                  <text>约 {{ step.duration }} 分钟</text>
                </view>
              </view>
            </view>
          </view>
        </view>

        <!-- 小贴士 -->
        <view v-if="recipe?.tips" class="tips-section">
          <view class="section-title">小贴士</view>
          <view class="tips-content">
            <text>{{ recipe.tips }}</text>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 底部操作栏 -->
    <view class="action-bar">
      <view class="action-btn" @tap="toggleCollect">
        <text class="iconfont" :class="isCollected ? 'icon-favor-fill' : 'icon-favor'"></text>
        <text>{{ isCollected ? '已收藏' : '收藏' }}</text>
      </view>
      <view class="action-btn" @tap="addToShoppingList">
        <text class="iconfont icon-shopping-cart"></text>
        <text>加入购物车</text>
      </view>
      <view class="action-btn action-btn--primary" @tap="shareRecipe">
        <text class="iconfont icon-share"></text>
        <text>分享</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRecipeStore } from '@/store/recipe';
import { navigateBack, getPageParams } from '@/utils/navigate';
import { showToast } from '@/utils/toast';
import type { Recipe } from '@/types';

const recipeStore = useRecipeStore();

const recipe = ref<Recipe | null>(null);
const isCollected = ref(false);
const scrollTop = ref(0);

const difficultyText = computed(() => {
  const map: Record<string, string> = {
    EASY: '简单',
    MEDIUM: '中等',
    HARD: '困难',
  };
  return map[recipe.value?.difficulty || ''] || '未知';
});

function onScroll(e: any) {
  scrollTop.value = e.detail.scrollTop;
}

function goBack() {
  navigateBack();
}

function toggleCollect() {
  isCollected.value = !isCollected.value;
  showToast(isCollected.value ? '收藏成功' : '已取消收藏');
}

function addToShoppingList() {
  showToast('已加入购物清单');
}

function shareRecipe() {
  // #ifdef APP-PLUS
  uni.share({
    provider: 'weixin',
    type: 0,
    title: recipe.value?.title || '分享菜谱',
    scene: 'WXSceneSession',
    success: () => {
      showToast('分享成功');
    },
    fail: () => {
      showToast('分享失败');
    },
  });
  // #endif

  // #ifndef APP-PLUS
  showToast('请在 APP 中分享');
  // #endif
}

function showMoreActions() {
  uni.showActionSheet({
    itemList: ['举报', '纠错', '复制链接'],
    success: (res) => {
      console.log('Action:', res.tapIndex);
    },
  });
}

onMounted(async () => {
  const params = getPageParams<{ id: string }>();
  if (params.id) {
    recipe.value = await recipeStore.fetchRecipeDetail(Number(params.id));
  }
});
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.recipe-detail-page {
  min-height: 100vh;
  background-color: $bg-color;
  padding-bottom: 120rpx;
}

.nav-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: $nav-height;
  padding: 0 $spacing-base;
  background-color: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  z-index: 100;

  &--transparent {
    background-color: transparent;
    .nav-back text,
    .nav-actions text {
      color: $white;
    }
  }

  .nav-actions {
    display: flex;
    gap: $spacing-base;

    text {
      font-size: 44rpx;
      color: $text-color;
    }
  }
}

.cover-section {
  position: relative;
  width: 100%;
  height: 600rpx;

  .cover-image {
    width: 100%;
    height: 100%;
  }

  .ai-badge {
    position: absolute;
    top: 120rpx;
    right: $spacing-base;
    padding: $spacing-xs $spacing-sm;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: $white;
    font-size: $font-size-sm;
    border-radius: $border-radius-sm;
  }
}

.content-scroll {
  height: calc(100vh - 600rpx - 120rpx);
}

.content-wrapper {
  background-color: $white;
  border-radius: $border-radius-xl $border-radius-xl 0 0;
  margin-top: -40rpx;
  position: relative;
  z-index: 10;
}

.info-section {
  padding: $spacing-base;

  .recipe-title {
    font-size: 44rpx;
    font-weight: bold;
    color: $text-color;
    margin-bottom: $spacing-xs;
  }

  .recipe-desc {
    font-size: $font-size-base;
    color: $text-color-secondary;
    line-height: 1.6;
    margin-bottom: $spacing-base;
  }

  .meta-row {
    display: flex;
    justify-content: space-between;
    padding: $spacing-base 0;
    border-top: 1rpx solid $border-color-light;
    border-bottom: 1rpx solid $border-color-light;

    .meta-item {
      text-align: center;

      .meta-label {
        font-size: $font-size-xs;
        color: $text-color-secondary;
        display: block;
        margin-bottom: 4rpx;
      }

      .meta-value {
        font-size: $font-size-base;
        font-weight: bold;

        &.difficulty--easy { color: $success-color; }
        &.difficulty--medium { color: $warning-color; }
        &.difficulty--hard { color: $danger-color; }
      }
    }
  }

  .tags-row {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-xs;
    margin-top: $spacing-base;

    .tag {
      padding: $spacing-xs $spacing-sm;
      background-color: #fff5e6;
      color: $primary-color;
      font-size: $font-size-xs;
      border-radius: $border-radius-sm;
    }
  }
}

.nutrition-section,
.ingredient-section,
.steps-section,
.tips-section {
  padding: $spacing-base;

  .section-title {
    font-size: $font-size-lg;
    font-weight: bold;
    color: $text-color;
    margin-bottom: $spacing-base;
  }
}

.nutrition-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: $spacing-sm;

  .nutrition-item {
    text-align: center;
    padding: $spacing-sm;
    background-color: $bg-color;
    border-radius: $border-radius-sm;

    .nutrition-value {
      font-size: $font-size-lg;
      font-weight: bold;
      color: $primary-color;
      display: block;
    }

    .nutrition-label {
      font-size: $font-size-xs;
      color: $text-color-secondary;
    }
  }
}

.ingredient-list {
  .ingredient-item {
    display: flex;
    justify-content: space-between;
    padding: $spacing-sm 0;
    border-bottom: 1rpx solid $border-color-light;

    &:last-child {
      border-bottom: none;
    }

    .ingredient-name {
      font-size: $font-size-base;
      color: $text-color;
    }

    .ingredient-amount {
      font-size: $font-size-base;
      color: $text-color-secondary;

      .optional {
        color: $text-color-placeholder;
      }
    }
  }
}

.steps-list {
  .step-item {
    display: flex;
    margin-bottom: $spacing-base;

    .step-number {
      width: 48rpx;
      height: 48rpx;
      background-color: $primary-color;
      color: $white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      flex-shrink: 0;
    }

    .step-content {
      flex: 1;
      margin-left: $spacing-sm;

      .step-text {
        font-size: $font-size-base;
        color: $text-color;
        line-height: 1.6;
      }

      .step-image {
        width: 100%;
        height: 300rpx;
        margin-top: $spacing-sm;
        border-radius: $border-radius-sm;
      }

      .step-duration {
        margin-top: $spacing-xs;
        font-size: $font-size-sm;
        color: $text-color-secondary;
      }
    }
  }
}

.tips-content {
  padding: $spacing-base;
  background-color: #fff9e6;
  border-radius: $border-radius-base;
  font-size: $font-size-base;
  color: $text-color;
  line-height: 1.6;
}

.action-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  padding: $spacing-sm $spacing-base;
  padding-bottom: calc(#{$spacing-sm} + constant(safe-area-inset-bottom));
  padding-bottom: calc(#{$spacing-sm} + env(safe-area-inset-bottom));
  background-color: $white;
  border-top: 1rpx solid $border-color-light;

  .action-btn {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    font-size: $font-size-xs;
    color: $text-color-secondary;

    text:first-child {
      font-size: 40rpx;
      margin-bottom: 4rpx;
    }

    &--primary {
      background-color: $primary-color;
      color: $white;
      margin-left: $spacing-sm;
      padding: $spacing-sm;
      border-radius: $border-radius-base;
    }
  }
}
</style>
