import { Recipe } from '../../types/index';
import { loadRecipesJson, loadRecipesAsync } from '../../utils/dataLoader';
import { getFallbackRecipes } from '../../utils/fallbackRecipes';
import {
  loadRecipeSearchHistory,
  saveRecipeSearchHistory,
  clearRecipeSearchHistory
} from '../../utils/recipeSearchStorage';
import { handleWarning } from '../../utils/errorHandler';
import { matchKeyword } from '../../utils/pinyin';
import { DISH_TYPE_LABELS, MEAL_TIME_LABELS } from '../../utils/labels';

const SUGGEST_LIMIT = 50;

const HOT_SEARCHES = [
  '番茄炒蛋',
  '宫保鸡丁',
  '鱼香肉丝',
  '麻婆豆腐',
  '酸辣土豆丝',
  '红烧肉',
  '糖醋里脊',
  '青椒肉丝',
  '回锅肉',
  '酸菜鱼',
  '蒜蓉西兰花',
  '葱油拌面',
  '小米粥',
  '紫菜蛋花汤',
  '可乐鸡翅',
  '土豆炖牛肉',
  '干煸豆角',
  '蚂蚁上树',
  '鱼香茄子',
  '地三鲜',
  '白切鸡',
  '清蒸鲈鱼',
  '手撕包菜',
  '酸辣汤',
  '皮蛋瘦肉粥',
  '韭菜盒子',
];

type SlimRecipe = { id: string; name: string };

let slimRecipeCache: SlimRecipe[] = [];

/** 加载所有菜谱（本地优先，自动缓存兜底） */
async function loadAllRecipesAsync(): Promise<Recipe[]> {
  let recipes: Recipe[] = [];
  try {
    recipes = await loadRecipesAsync();
  } catch (e) {
    console.warn('[搜索页] 加载失败', e);
  }
  if (!recipes.length) {
    recipes = loadRecipesJson();
  }
  if (!recipes.length) {
    recipes = getFallbackRecipes();
  }
  return recipes;
}

Page({
  data: {
    keyword: '',
    hasKeyword: false,
    inputFocus: false,
    suggestions: [] as SlimRecipe[],
    history: [] as string[],
    hotList: HOT_SEARCHES
  },

  async onLoad(query: Record<string, string>) {
    const allRecipes = await loadAllRecipesAsync();
    slimRecipeCache = allRecipes.map((r) => ({ id: String(r.id), name: r.name }));
    const focus = query && (query.focus === '1' || query.focus === 'true');
    this.setData({
      inputFocus: !!focus,
      history: loadRecipeSearchHistory()
    });
  },

  onShow() {
    this.setData({ history: loadRecipeSearchHistory() });
  },

  onInput(e: WechatMiniprogram.Input) {
    const keyword = e.detail.value || '';
    this.updateSuggestions(keyword);
  },

  onClearInput() {
    this.setData({ keyword: '', hasKeyword: false, suggestions: [] });
  },

  updateSuggestions(keyword: string) {
    const kw = (keyword || '').trim();
    let suggestions: SlimRecipe[] = [];
    if (kw) {
      suggestions = slimRecipeCache
        .filter((r) => this.matchesKeyword(kw, r.name))
        .slice(0, SUGGEST_LIMIT);
    }
    this.setData({
      keyword,
      hasKeyword: !!kw,
      suggestions
    });
  },

  // 支持中文、拼音首字母、拼音全拼匹配
  matchesKeyword(keyword: string, recipeName: string): boolean {
    if (!keyword || !recipeName) return false;

    // 1. 原文字包含
    if (recipeName.toLowerCase().includes(keyword.toLowerCase())) return true;

    // 2. 拼音匹配
    if (matchKeyword(keyword, recipeName)) return true;

    return false;
  },

  goListWithKeyword(word: string) {
    const w = (word || '').trim();
    if (!w) {
      wx.showToast({ title: '请输入关键词', icon: 'none' });
      return;
    }
    saveRecipeSearchHistory(w);
    wx.navigateTo({
      url: `/pages/recipes/list?q=${encodeURIComponent(w)}`
    });
  },

  onTapSearchBtn() {
    this.goListWithKeyword(this.data.keyword);
  },

  onConfirmSearch() {
    this.goListWithKeyword(this.data.keyword);
  },

  onPickSuggestion(e: WechatMiniprogram.BaseEvent) {
    const name = e.currentTarget.dataset.name as string;
    if (name) {
      this.setData({ keyword: name });
      this.goListWithKeyword(name);
    }
  },

  onTapHistoryTag(e: WechatMiniprogram.BaseEvent) {
    const word = e.currentTarget.dataset.word as string;
    if (word) {
      this.setData({ keyword: word });
      this.updateSuggestions(word);
      this.goListWithKeyword(word);
    }
  },

  onTapHotTag(e: WechatMiniprogram.BaseEvent) {
    const word = e.currentTarget.dataset.word as string;
    if (word) {
      this.setData({ keyword: word });
      this.updateSuggestions(word);
      this.goListWithKeyword(word);
    }
  },

  onClearHistory() {
    wx.showModal({
      title: '清空搜索历史',
      content: '确定清空全部历史记录吗？',
      success: (res) => {
        if (res.confirm) {
          clearRecipeSearchHistory();
          this.setData({ history: [] });
        }
      }
    });
  }
});
