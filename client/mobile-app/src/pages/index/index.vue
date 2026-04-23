<template>
  <view class="index-page">
    <!-- 顶部搜索栏 -->
    <view class="search-bar">
      <view class="search-input" @tap="goToSearch">
        <text class="iconfont icon-search"></text>
        <text class="placeholder">搜索菜谱、食材</text>
      </view>
    </view>

    <!-- 内容区域 -->
    <scroll-view
      class="content"
      scroll-y
      refresher-enabled
      :refresher-triggered="isRefreshing"
      @refresherrefresh="onRefresh"
      @scrolltolower="loadMore"
    >
      <!-- Banner -->
      <view v-if="banners.length" class="banner-section">
        <swiper class="banner-swiper" :indicator-dots="true" :autoplay="true" :interval="3000" :circular="true">
          <swiper-item v-for="banner in banners" :key="banner.id">
            <image class="banner-image" :src="banner.image" mode="aspectFill" @tap="onBannerClick(banner)" />
          </swiper-item>
        </swiper>
      </view>

      <!-- 功能入口 -->
      <view class="quick-entry">
        <view class="entry-item" @tap="goToKids">
          <image class="entry-icon" src="/static/icons/kids.png" mode="aspectFit" />
          <text class="entry-text">儿童营养</text>
        </view>
        <view class="entry-item" @tap="goToFitness">
          <image class="entry-icon" src="/static/icons/fitness.png" mode="aspectFit" />
          <text class="entry-text">健身餐</text>
        </view>
        <view class="entry-item" @tap="goToScan">
          <image class="entry-icon" src="/static/icons/scan.png" mode="aspectFit" />
          <text class="entry-text">拍照识别</text>
        </view>
        <view class="entry-item" @tap="goToCollection">
          <image class="entry-icon" src="/static/icons/collection.png" mode="aspectFit" />
          <text class="entry-text">我的收藏</text>
        </view>
      </view>

      <!-- 分类推荐 -->
      <view class="section">
        <view class="section-header">
          <text class="section-title">热门推荐</text>
          <text class="section-more" @tap="goToRecipeList">更多</text>
        </view>
        <scroll-view class="recipe-scroll" scroll-x>
          <view class="recipe-list">
            <view v-for="recipe in recommendedRecipes" :key="recipe.id" class="recipe-item">
              <RecipeCard :recipe="recipe" />
            </view>
          </view>
        </scroll-view>
      </view>

      <!-- 猜你喜欢 -->
      <view class="section">
        <view class="section-header">
          <text class="section-title">猜你喜欢</text>
        </view>
        <view class="recipe-grid">
          <view v-for="recipe in recipes" :key="recipe.id" class="grid-item">
            <RecipeCard :recipe="recipe" />
          </view>
        </view>
        <view v-if="isLoading" class="loading-more">
          <text>加载中...</text>
        </view>
        <view v-if="noMore" class="no-more">
          <text>没有更多了</text>
        </view>
      </view>
    </scroll-view>

    <!-- 空状态 -->
    <EmptyState v-if="!isLoading && recipes.length === 0" :show-button="true" @action="goToSearch" />
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRecipeStore } from '@/store/recipe';
import { getBanners } from '@/api/content';
import { navigateTo, switchTab } from '@/utils/navigate';
import RecipeCard from '@/components/recipe/RecipeCard.vue';
import EmptyState from '@/components/common/EmptyState.vue';

const recipeStore = useRecipeStore();

const banners = ref<any[]>([]);
const isRefreshing = ref(false);
const noMore = ref(false);

const recommendedRecipes = ref<any[]>([]);
const recipes = ref<any[]>([]);
const isLoading = ref(false);
const page = ref(1);

// 跳转到搜索页
function goToSearch() {
  switchTab('/pages/search/index');
}

// 跳转到菜谱列表
function goToRecipeList() {
  navigateTo('/pages/recipe/list');
}

// 跳转到儿童营养
function goToKids() {
  navigateTo('/pages-sub/kids/index');
}

// 跳转到健身餐
function goToFitness() {
  navigateTo('/pages-sub/fitness/index');
}

// 跳转到拍照
function goToScan() {
  switchTab('/pages/scan/index');
}

// 跳转到收藏
function goToCollection() {
  switchTab('/pages/collection/index');
}

// Banner 点击
function onBannerClick(banner: any) {
  if (banner.link) {
    // TODO: 处理 Banner 跳转
  }
}

// 下拉刷新
async function onRefresh() {
  isRefreshing.value = true;
  page.value = 1;
  noMore.value = false;
  await Promise.all([loadRecipes(true), loadRecommended()]);
  isRefreshing.value = false;
}

// 加载更多
function loadMore() {
  if (noMore.value || isLoading.value) return;
  page.value++;
  loadRecipes();
}

// 加载推荐食谱
async function loadRecommended() {
  try {
    const res = await recipeStore.fetchRecommendedRecipes(6);
    recommendedRecipes.value = res || [];
  } catch (e) {
    console.error(e);
  }
}

// 加载食谱列表
async function loadRecipes(refresh = false) {
  if (isLoading.value) return;
  isLoading.value = true;

  try {
    const res = await recipeStore.fetchRecipes({ page: page.value, pageSize: 10 });
    if (refresh) {
      recipes.value = res || [];
    } else {
      recipes.value = [...recipes.value, ...(res || [])];
    }
    if (!res || res.length < 10) {
      noMore.value = true;
    }
  } catch (e) {
    console.error(e);
  } finally {
    isLoading.value = false;
  }
}

// 加载 Banner
async function loadBanners() {
  try {
    const res = await getBanners();
    if (res.data) {
      banners.value = res.data;
    }
  } catch (e) {
    console.error(e);
  }
}

onMounted(async () => {
  await Promise.all([loadBanners(), loadRecommended(), loadRecipes()]);
});
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.index-page {
  min-height: 100vh;
  background-color: $bg-color;
}

.search-bar {
  position: sticky;
  top: 0;
  z-index: 100;
  padding: $spacing-sm $spacing-base;
  background-color: $white;

  .search-input {
    display: flex;
    align-items: center;
    height: 72rpx;
    padding: 0 $spacing-base;
    background-color: $bg-color;
    border-radius: 36rpx;

    .placeholder {
      margin-left: $spacing-sm;
      color: $text-color-placeholder;
      font-size: $font-size-base;
    }
  }
}

.content {
  height: calc(100vh - #{$nav-height});
}

.banner-section {
  padding: $spacing-sm $spacing-base;

  .banner-swiper {
    width: 100%;
    height: 300rpx;
    border-radius: $border-radius-base;
    overflow: hidden;

    .banner-image {
      width: 100%;
      height: 100%;
    }
  }
}

.quick-entry {
  display: flex;
  justify-content: space-around;
  padding: $spacing-base 0;
  background-color: $white;
  margin: 0 $spacing-base;
  border-radius: $border-radius-base;
  margin-bottom: $spacing-base;

  .entry-item {
    display: flex;
    flex-direction: column;
    align-items: center;

    .entry-icon {
      width: 80rpx;
      height: 80rpx;
      margin-bottom: $spacing-xs;
    }

    .entry-text {
      font-size: $font-size-sm;
      color: $text-color;
    }
  }
}

.section {
  padding: $spacing-base;

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-sm;

    .section-title {
      font-size: $font-size-lg;
      font-weight: bold;
      color: $text-color;
    }

    .section-more {
      font-size: $font-size-sm;
      color: $text-color-secondary;
    }
  }
}

.recipe-scroll {
  white-space: nowrap;

  .recipe-list {
    display: inline-flex;
    gap: $spacing-sm;

    .recipe-item {
      width: 280rpx;
      flex-shrink: 0;
    }
  }
}

.recipe-grid {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-sm;

  .grid-item {
    width: calc(50% - #{$spacing-sm / 2});
  }
}

.loading-more,
.no-more {
  text-align: center;
  padding: $spacing-base;
  color: $text-color-secondary;
  font-size: $font-size-sm;
}
</style>
