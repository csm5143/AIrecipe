<template>
  <view class="recipe-list-page">
    <!-- 顶部导航 -->
    <view class="nav-header">
      <text class="nav-back iconfont icon-arrow-left" @tap="goBack"></text>
      <text class="nav-title">{{ pageTitle }}</text>
      <text class="nav-filter" @tap="showFilter">筛选</text>
    </view>

    <!-- 分类标签 -->
    <scroll-view class="category-scroll" scroll-x>
      <view class="category-list">
        <view
          v-for="category in categories"
          :key="category.id"
          class="category-item"
          :class="{ 'category-item--active': currentCategory === category.id }"
          @tap="selectCategory(category.id)"
        >
          {{ category.name }}
        </view>
      </view>
    </scroll-view>

    <!-- 排序选项 -->
    <view class="sort-bar">
      <view
        v-for="sort in sortOptions"
        :key="sort.key"
        class="sort-item"
        :class="{ 'sort-item--active': currentSort === sort.key }"
        @tap="selectSort(sort.key)"
      >
        {{ sort.label }}
      </view>
    </view>

    <!-- 食谱列表 -->
    <scroll-view
      class="content-scroll"
      scroll-y
      refresher-enabled
      :refresher-triggered="isRefreshing"
      @refresherrefresh="onRefresh"
      @scrolltolower="loadMore"
    >
      <view class="recipe-grid">
        <view v-for="recipe in recipes" :key="recipe.id" class="recipe-item">
          <RecipeCard :recipe="recipe" />
        </view>
      </view>
      <view v-if="isLoading" class="loading-more">
        <text>加载中...</text>
      </view>
      <view v-if="noMore && recipes.length" class="no-more">
        <text>没有更多了</text>
      </view>
    </scroll-view>

    <!-- 空状态 -->
    <EmptyState v-if="!isLoading && !recipes.length" text="暂无相关菜谱" />
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRecipeStore } from '@/store/recipe';
import { navigateBack } from '@/utils/navigate';
import RecipeCard from '@/components/recipe/RecipeCard.vue';
import EmptyState from '@/components/common/EmptyState.vue';

const recipeStore = useRecipeStore();

const pageTitle = ref('菜谱列表');
const currentCategory = ref('all');
const currentSort = ref('recommend');
const recipes = ref<any[]>([]);
const isLoading = ref(false);
const isRefreshing = ref(false);
const noMore = ref(false);
const page = ref(1);

const categories = [
  { id: 'all', name: '全部' },
  { id: 'home', name: '家常菜' },
  { id: 'soup', name: '汤类' },
  { id: 'dish', name: '凉菜' },
  { id: 'main', name: '主菜' },
  { id: 'dessert', name: '甜点' },
  { id: 'drink', name: '饮品' },
];

const sortOptions = [
  { key: 'recommend', label: '推荐' },
  { key: 'hot', label: '最热' },
  { key: 'new', label: '最新' },
  { key: 'time', label: '耗时' },
];

function goBack() {
  navigateBack();
}

function showFilter() {
  // TODO: 显示筛选弹窗
}

function selectCategory(id: string) {
  currentCategory.value = id;
  page.value = 1;
  noMore.value = false;
  recipes.value = [];
  loadRecipes();
}

function selectSort(key: string) {
  currentSort.value = key;
  page.value = 1;
  noMore.value = false;
  recipes.value = [];
  loadRecipes();
}

async function loadRecipes() {
  if (isLoading.value) return;
  isLoading.value = true;

  try {
    const res = await recipeStore.fetchRecipes({
      page: page.value,
      pageSize: 20,
      category: currentCategory.value === 'all' ? undefined : currentCategory.value,
    });
    if (page.value === 1) {
      recipes.value = res || [];
    } else {
      recipes.value = [...recipes.value, ...(res || [])];
    }
    if (!res || res.length < 20) {
      noMore.value = true;
    }
  } catch (e) {
    console.error(e);
  } finally {
    isLoading.value = false;
  }
}

function loadMore() {
  if (noMore.value || isLoading.value) return;
  page.value++;
  loadRecipes();
}

async function onRefresh() {
  isRefreshing.value = true;
  page.value = 1;
  noMore.value = false;
  await loadRecipes();
  isRefreshing.value = false;
}

onMounted(() => {
  loadRecipes();
});
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.recipe-list-page {
  min-height: 100vh;
  background-color: $bg-color;
}

.nav-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: $nav-height;
  padding: 0 $spacing-base;
  background-color: $white;

  .nav-back,
  .nav-filter {
    width: 100rpx;
    font-size: $font-size-lg;
    color: $text-color;
  }

  .nav-title {
    flex: 1;
    text-align: center;
    font-size: $font-size-lg;
    font-weight: bold;
  }
}

.category-scroll {
  white-space: nowrap;
  background-color: $white;
  border-bottom: 1rpx solid $border-color-light;

  .category-list {
    display: inline-flex;
    padding: $spacing-sm $spacing-base;

    .category-item {
      flex-shrink: 0;
      padding: $spacing-xs $spacing-base;
      margin-right: $spacing-sm;
      font-size: $font-size-sm;
      color: $text-color-secondary;
      background-color: $bg-color;
      border-radius: $border-radius-round;

      &--active {
        color: $white;
        background-color: $primary-color;
      }
    }
  }
}

.sort-bar {
  display: flex;
  padding: $spacing-sm $spacing-base;
  background-color: $white;
  margin-bottom: $spacing-xs;

  .sort-item {
    flex: 1;
    text-align: center;
    font-size: $font-size-sm;
    color: $text-color-secondary;
    padding: $spacing-xs 0;

    &--active {
      color: $primary-color;
      font-weight: bold;
    }
  }
}

.content-scroll {
  height: calc(100vh - #{$nav-height} - 80rpx);
  padding: $spacing-sm;
}

.recipe-grid {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-sm;

  .recipe-item {
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
