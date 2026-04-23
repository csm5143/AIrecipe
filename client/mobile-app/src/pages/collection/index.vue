<template>
  <view class="collection-page">
    <!-- 顶部导航 -->
    <view class="nav-header">
      <text class="nav-title">我的收藏</text>
    </view>

    <!-- Tab 切换 -->
    <view class="tab-bar">
      <view
        v-for="tab in tabs"
        :key="tab.key"
        class="tab-item"
        :class="{ 'tab-item--active': currentTab === tab.key }"
        @tap="switchTab(tab.key)"
      >
        <text class="tab-text">{{ tab.label }}</text>
      </view>
    </view>

    <!-- 收藏列表 -->
    <scroll-view
      v-if="collections.length || recipes.length"
      class="content-scroll"
      scroll-y
      refresher-enabled
      :refresher-triggered="isRefreshing"
      @refresherrefresh="onRefresh"
      @scrolltolower="loadMore"
    >
      <!-- 收藏夹列表 -->
      <view v-if="currentTab === 'folders'" class="folders-section">
        <view v-for="folder in collections" :key="folder.id" class="folder-card" @tap="openFolder(folder)">
          <image class="folder-cover" :src="folder.coverImage || '/static/images/folder-default.png'" mode="aspectFill" />
          <view class="folder-info">
            <text class="folder-name">{{ folder.name }}</text>
            <text class="folder-count">{{ folder.itemCount }}个菜谱</text>
          </view>
          <text class="iconfont icon-arrow-right"></text>
        </view>
      </view>

      <!-- 收藏食谱列表 -->
      <view v-if="currentTab === 'recipes'" class="recipes-section">
        <view class="recipe-grid">
          <view v-for="recipe in recipes" :key="recipe.id" class="recipe-item">
            <RecipeCard :recipe="recipe" />
          </view>
        </view>
      </view>

      <!-- 加载状态 -->
      <view v-if="isLoading" class="loading-more">
        <text>加载中...</text>
      </view>
      <view v-if="noMore" class="no-more">
        <text>没有更多了</text>
      </view>
    </scroll-view>

    <!-- 空状态 -->
    <EmptyState
      v-if="!isLoading && ((currentTab === 'folders' && !collections.length) || (currentTab === 'recipes' && !recipes.length))"
      :text="currentTab === 'folders' ? '暂无收藏夹' : '暂无收藏食谱'"
      :show-button="true"
      button-text="去收藏"
      @action="goToRecipes"
    />
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRecipeStore } from '@/store/recipe';
import { getCollections } from '@/api/collection';
import { switchTab as navigateTab } from '@/utils/navigate';
import RecipeCard from '@/components/recipe/RecipeCard.vue';
import EmptyState from '@/components/common/EmptyState.vue';

const recipeStore = useRecipeStore();

const tabs = [
  { key: 'folders', label: '收藏夹' },
  { key: 'recipes', label: '全部收藏' },
];

const currentTab = ref('folders');
const collections = ref<any[]>([]);
const recipes = ref<any[]>([]);
const isLoading = ref(false);
const isRefreshing = ref(false);
const noMore = ref(false);
const page = ref(1);

function switchTab(key: string) {
  currentTab.value = key;
  page.value = 1;
  noMore.value = false;
  if (key === 'folders') {
    collections.value = [];
    loadCollections();
  } else {
    recipes.value = [];
    loadCollectedRecipes();
  }
}

async function loadCollections() {
  isLoading.value = true;
  try {
    const res = await getCollections();
    if (res.data) {
      collections.value = res.data;
    }
  } catch (e) {
    console.error(e);
  } finally {
    isLoading.value = false;
  }
}

async function loadCollectedRecipes() {
  if (isLoading.value) return;
  isLoading.value = true;
  try {
    const res = await recipeStore.fetchCollectedRecipes(page.value);
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
  if (currentTab.value === 'recipes') {
    loadCollectedRecipes();
  }
}

async function onRefresh() {
  isRefreshing.value = true;
  page.value = 1;
  noMore.value = false;
  if (currentTab.value === 'folders') {
    await loadCollections();
  } else {
    recipes.value = [];
    await loadCollectedRecipes();
  }
  isRefreshing.value = false;
}

function openFolder(folder: any) {
  // TODO: 打开收藏夹详情
  console.log('Open folder:', folder);
}

function goToRecipes() {
  navigateTab('/pages/index/index');
}

onMounted(() => {
  loadCollections();
});
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.collection-page {
  min-height: 100vh;
  background-color: $bg-color;
}

.nav-header {
  display: flex;
  align-items: center;
  justify-content: center;
  height: $nav-height;
  background-color: $white;

  .nav-title {
    font-size: $font-size-lg;
    font-weight: bold;
    color: $text-color;
  }
}

.tab-bar {
  display: flex;
  background-color: $white;
  border-bottom: 1rpx solid $border-color-light;

  .tab-item {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 88rpx;

    .tab-text {
      font-size: $font-size-base;
      color: $text-color-secondary;
    }

    &--active {
      .tab-text {
        color: $primary-color;
        font-weight: bold;
      }
    }
  }
}

.content-scroll {
  height: calc(100vh - #{$nav-height} - 88rpx);
}

.folders-section {
  padding: $spacing-base;

  .folder-card {
    display: flex;
    align-items: center;
    padding: $spacing-base;
    background-color: $white;
    border-radius: $border-radius-base;
    margin-bottom: $spacing-sm;

    .folder-cover {
      width: 120rpx;
      height: 120rpx;
      border-radius: $border-radius-sm;
      flex-shrink: 0;
    }

    .folder-info {
      flex: 1;
      margin-left: $spacing-sm;

      .folder-name {
        font-size: $font-size-base;
        font-weight: bold;
        color: $text-color;
        display: block;
        margin-bottom: $spacing-xs;
      }

      .folder-count {
        font-size: $font-size-sm;
        color: $text-color-secondary;
      }
    }
  }
}

.recipes-section {
  padding: $spacing-base;

  .recipe-grid {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-sm;

    .recipe-item {
      width: calc(50% - #{$spacing-sm / 2});
    }
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
