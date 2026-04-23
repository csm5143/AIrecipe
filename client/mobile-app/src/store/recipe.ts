/**
 * 食谱状态管理
 */
import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Recipe } from '@/types';
import {
  getRecipes,
  getRecipeDetail,
  getRecommendedRecipes,
  searchRecipes,
  getCollectedRecipes,
} from '@/api/recipe';

export const useRecipeStore = defineStore('recipe', () => {
  // 状态
  const recipes = ref<Recipe[]>([]);
  const currentRecipe = ref<Recipe | null>(null);
  const recommendedRecipes = ref<Recipe[]>([]);
  const collectedRecipes = ref<Recipe[]>([]);
  const isLoading = ref(false);
  const pagination = ref({
    page: 1,
    pageSize: 20,
    total: 0,
  });

  // 获取食谱列表
  async function fetchRecipes(params?: {
    page?: number;
    pageSize?: number;
    category?: string;
    difficulty?: string;
  }) {
    isLoading.value = true;
    try {
      const res = await getRecipes({
        page: pagination.value.page,
        pageSize: pagination.value.pageSize,
        ...params,
      });
      if (res.data) {
        if (params?.page && params.page > 1) {
          recipes.value = [...recipes.value, ...res.data];
        } else {
          recipes.value = res.data;
        }
      }
      return res.data;
    } catch (error) {
      console.error('[RecipeStore] Fetch recipes failed:', error);
      return [];
    } finally {
      isLoading.value = false;
    }
  }

  // 获取食谱详情
  async function fetchRecipeDetail(id: number) {
    isLoading.value = true;
    try {
      const res = await getRecipeDetail(id);
      if (res.data) {
        currentRecipe.value = res.data;
        return res.data;
      }
      return null;
    } catch (error) {
      console.error('[RecipeStore] Fetch detail failed:', error);
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  // 获取推荐食谱
  async function fetchRecommendedRecipes(limit = 10) {
    try {
      const res = await getRecommendedRecipes(limit);
      if (res.data) {
        recommendedRecipes.value = res.data;
        return res.data;
      }
      return [];
    } catch (error) {
      console.error('[RecipeStore] Fetch recommended failed:', error);
      return [];
    }
  }

  // 搜索食谱
  async function search(keyword: string, page = 1) {
    isLoading.value = true;
    try {
      const res = await searchRecipes(keyword, { page, pageSize: pagination.value.pageSize });
      if (res.data) {
        if (page > 1) {
          recipes.value = [...recipes.value, ...res.data];
        } else {
          recipes.value = res.data;
        }
        return res.data;
      }
      return [];
    } catch (error) {
      console.error('[RecipeStore] Search failed:', error);
      return [];
    } finally {
      isLoading.value = false;
    }
  }

  // 获取收藏的食谱
  async function fetchCollectedRecipes(page = 1) {
    isLoading.value = true;
    try {
      const res = await getCollectedRecipes({ page, pageSize: pagination.value.pageSize });
      if (res.data) {
        if (page > 1) {
          collectedRecipes.value = [...collectedRecipes.value, ...res.data];
        } else {
          collectedRecipes.value = res.data;
        }
        return res.data;
      }
      return [];
    } catch (error) {
      console.error('[RecipeStore] Fetch collected failed:', error);
      return [];
    } finally {
      isLoading.value = false;
    }
  }

  // 重置分页
  function resetPagination() {
    pagination.value.page = 1;
    pagination.value.total = 0;
  }

  // 下一页
  function nextPage() {
    pagination.value.page++;
  }

  // 清空数据
  function clearData() {
    recipes.value = [];
    currentRecipe.value = null;
    resetPagination();
  }

  return {
    // 状态
    recipes,
    currentRecipe,
    recommendedRecipes,
    collectedRecipes,
    isLoading,
    pagination,
    // 方法
    fetchRecipes,
    fetchRecipeDetail,
    fetchRecommendedRecipes,
    search,
    fetchCollectedRecipes,
    resetPagination,
    nextPage,
    clearData,
  };
});
