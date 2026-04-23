<template>
  <view class="search-page">
    <!-- 搜索框 -->
    <view class="search-header">
      <view class="search-input-wrap">
        <text class="iconfont icon-search"></text>
        <input
          v-model="keyword"
          class="search-input"
          placeholder="搜索菜谱、食材"
          confirm-type="search"
          @confirm="onSearch"
          @input="onInput"
        />
        <text v-if="keyword" class="iconfont icon-close" @tap="clearKeyword"></text>
      </view>
      <text class="cancel-btn" @tap="cancel">取消</text>
    </view>

    <!-- 搜索历史 -->
    <view v-if="!keyword && searchHistory.length" class="search-history">
      <view class="history-header">
        <text class="history-title">搜索历史</text>
        <text class="history-clear" @tap="clearHistory">清空</text>
      </view>
      <view class="history-list">
        <text v-for="(item, index) in searchHistory" :key="index" class="history-item" @tap="searchFromHistory(item)">
          {{ item }}
        </text>
      </view>
    </view>

    <!-- 热门搜索 -->
    <view v-if="!keyword" class="hot-search">
      <view class="hot-title">热门搜索</view>
      <view class="hot-list">
        <text v-for="(item, index) in hotKeywords" :key="index" class="hot-item" @tap="searchFromHot(item)">
          {{ item }}
        </text>
      </view>
    </view>

    <!-- 搜索结果 -->
    <view v-if="keyword && searchResults.length" class="search-results">
      <scroll-view scroll-y class="results-scroll" @scrolltolower="loadMore">
        <view class="results-list">
          <view v-for="recipe in searchResults" :key="recipe.id" class="result-item">
            <RecipeCard :recipe="recipe" />
          </view>
        </view>
        <view v-if="isLoading" class="loading-more">
          <text>加载中...</text>
        </view>
        <view v-if="noMore && searchResults.length" class="no-more">
          <text>没有更多了</text>
        </view>
      </scroll-view>
    </view>

    <!-- 空结果 -->
    <view v-if="keyword && !isLoading && searchResults.length === 0 && hasSearched" class="empty-results">
      <image class="empty-image" src="/static/images/empty-search.png" mode="aspectFit" />
      <text class="empty-text">未找到相关菜谱</text>
      <text class="empty-hint">换个关键词试试吧</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRecipeStore } from '@/store/recipe';
import { addSearchHistory, getSearchHistory, clearSearchHistory } from '@/utils/storage';
import RecipeCard from '@/components/recipe/RecipeCard.vue';
import type { Recipe } from '@/types';

const recipeStore = useRecipeStore();

const keyword = ref('');
const searchResults = ref<Recipe[]>([]);
const searchHistory = ref<string[]>([]);
const hasSearched = ref(false);
const isLoading = ref(false);
const noMore = ref(false);
const page = ref(1);

const hotKeywords = ['红烧肉', '番茄炒蛋', '宫保鸡丁', '鱼香肉丝', '糖醋排骨', '麻婆豆腐', '可乐鸡翅'];

function onInput() {
  if (!keyword.value) {
    searchResults.value = [];
    hasSearched.value = false;
  }
}

function clearKeyword() {
  keyword.value = '';
  searchResults.value = [];
  hasSearched.value = false;
}

function cancel() {
  uni.navigateBack();
}

function onSearch() {
  if (!keyword.value.trim()) return;
  page.value = 1;
  noMore.value = false;
  searchResults.value = [];
  addSearchHistory(keyword.value);
  searchHistory.value = getSearchHistory();
  doSearch();
}

async function doSearch() {
  if (isLoading.value) return;
  isLoading.value = true;
  hasSearched.value = true;

  try {
    const res = await recipeStore.search(keyword.value, page.value);
    if (page.value === 1) {
      searchResults.value = res || [];
    } else {
      searchResults.value = [...searchResults.value, ...(res || [])];
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
  doSearch();
}

function searchFromHistory(item: string) {
  keyword.value = item;
  onSearch();
}

function searchFromHot(item: string) {
  keyword.value = item;
  onSearch();
}

function clearHistory() {
  clearSearchHistory();
  searchHistory.value = [];
}

onMounted(() => {
  searchHistory.value = getSearchHistory();
});
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.search-page {
  min-height: 100vh;
  background-color: $bg-color;
}

.search-header {
  display: flex;
  align-items: center;
  padding: $spacing-sm $spacing-base;
  background-color: $white;

  .search-input-wrap {
    flex: 1;
    display: flex;
    align-items: center;
    height: 64rpx;
    padding: 0 $spacing-sm;
    background-color: $bg-color;
    border-radius: 32rpx;

    .search-input {
      flex: 1;
      margin-left: $spacing-sm;
      font-size: $font-size-base;
    }
  }

  .cancel-btn {
    margin-left: $spacing-sm;
    color: $text-color;
    font-size: $font-size-base;
  }
}

.search-history {
  padding: $spacing-base;

  .history-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-sm;

    .history-title {
      font-size: $font-size-base;
      font-weight: bold;
    }

    .history-clear {
      font-size: $font-size-sm;
      color: $text-color-secondary;
    }
  }

  .history-list {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-sm;

    .history-item {
      padding: $spacing-xs $spacing-sm;
      background-color: $white;
      border-radius: $border-radius-sm;
      font-size: $font-size-sm;
      color: $text-color;
    }
  }
}

.hot-search {
  padding: 0 $spacing-base $spacing-base;

  .hot-title {
    font-size: $font-size-base;
    font-weight: bold;
    margin-bottom: $spacing-sm;
  }

  .hot-list {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-sm;

    .hot-item {
      padding: $spacing-xs $spacing-sm;
      background-color: $white;
      border-radius: $border-radius-sm;
      font-size: $font-size-sm;
      color: $primary-color;
    }
  }
}

.search-results {
  .results-scroll {
    height: calc(100vh - #{$nav-height} - 100rpx);
  }

  .results-list {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-sm;
    padding: $spacing-sm;

    .result-item {
      width: calc(50% - #{$spacing-sm / 2});
    }
  }
}

.empty-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 200rpx;

  .empty-image {
    width: 300rpx;
    height: 300rpx;
    margin-bottom: $spacing-base;
  }

  .empty-text {
    font-size: $font-size-lg;
    color: $text-color;
    margin-bottom: $spacing-xs;
  }

  .empty-hint {
    font-size: $font-size-sm;
    color: $text-color-secondary;
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
