
import { Recipe } from '../../../types/index';
import { loadRecipesJson, loadRecipesAsync } from '../../../utils/dataLoader';
import { extractCalories } from '../../../utils/recipeUtils';
import { getDifficultyLabel } from '../../../utils/labels';

interface RecipeItem {
  id: string;
  name: string;
  description: string;
  coverImage: string;
  timeCost: number;
  difficulty: string;
  difficultyLabel: string;
  difficultyClass: string;
  calories: string | null;
  sceneLabel: string;
}

const FALLBACK_IMAGE = 'https://dummyimage.com/400x400/f5f5f5/cccccc&text=暂无图片';

// 场景标签映射
const SCENE_LABELS: Record<string, string[]> = {
  internet: ['网红', '爆款', '热门'],
  new: ['新品', '尝鲜'],
  home: ['家常', '下饭'],
  solo: ['一人食', '快手'],
  fitness: ['减脂', '健身'],
  kids: ['儿童', '营养']
};

Page({
  data: {
    dateStr: '',
    recipeCount: 0,
    coverImage: '',
    bannerRecipe: null as RecipeItem | null,
    recipes: [] as RecipeItem[],
    showActionSheet: false,
    actionRecipeIndex: -1,
    actionRecipeName: '',
    _allRecipes: [] as any[]
  },

  onLoad() {
    this._initData();
  },

  async _initData() {
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const weekDay = weekDays[now.getDay()];
    const dateStr = `${month}月${day}日 ${weekDay}`;

    // 根据日期生成稳定的随机种子
    const todaySeed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();

    // 云端优先加载菜谱，自动带 24h 缓存兜底
    let allRecipes: Recipe[] = [];
    try {
      allRecipes = await loadRecipesAsync();
    } catch (e) {
      console.warn('[每日推荐] 云端加载失败', e);
    }
    if (!allRecipes || !allRecipes.length) {
      allRecipes = loadRecipesJson() as Recipe[];
    }
    if (!allRecipes || !allRecipes.length) {
      this.setData({ dateStr, recipeCount: 0, coverImage: '', recipes: [] });
      return;
    }

    // 只保留有真实图片的菜谱
    const withImage = allRecipes.filter((r: Recipe) => {
      const img = r.coverImage || '';
      return img.length > 0 && !img.includes('dummyimage');
    });
    if (!withImage.length) {
      this.setData({ dateStr, recipeCount: 0, coverImage: '', recipes: [] });
      return;
    }

    // 存储所有菜谱用于后续操作
    this.setData({ _allRecipes: allRecipes });

    // 使用日期种子打乱有图菜品顺序，然后取前 18 道
    const shuffled = this._shuffleWithSeed([...withImage], todaySeed);
    const selected = shuffled.slice(0, 18);

    // 封面图片（取第一道菜的封面作为主图，无图则用 fallback）
    const firstItem = selected[0];
    const coverImage = (firstItem && firstItem.coverImage && !firstItem.coverImage.includes('dummyimage'))
      ? firstItem.coverImage
      : FALLBACK_IMAGE;

    // 菜品列表（从第 2 道开始，留一道做 Banner）
    const listRecipes = selected.slice(1, 13).map((r: Recipe) => {
      const difficulty = r.difficulty || 'easy';
      return {
        id: r.id || '',
        name: r.name || '未知菜品',
        description: r.description || '',
        coverImage: r.coverImage || FALLBACK_IMAGE,
        timeCost: r.timeCost || 20,
        difficulty,
        difficultyLabel: getDifficultyLabel(difficulty),
        difficultyClass: difficulty,
        calories: extractCalories(r.description || ''),
        sceneLabel: this._getSceneLabel(r)
      };
    });

    // Banner 菜品（第一道）
    const bannerRecipe: RecipeItem | null = selected.length > 0
      ? (() => {
          const r = selected[0];
          const difficulty = r.difficulty || 'easy';
          return {
            id: r.id || '',
            name: r.name || '未知菜品',
            description: r.description || '',
            coverImage: r.coverImage || FALLBACK_IMAGE,
            timeCost: r.timeCost || 20,
            difficulty,
            difficultyLabel: getDifficultyLabel(difficulty),
            difficultyClass: difficulty,
            calories: extractCalories(r.description || ''),
            sceneLabel: this._getSceneLabel(r)
          };
        })()
      : null;

    this.setData({
      dateStr,
      recipeCount: listRecipes.length,
      coverImage,
      bannerRecipe,
      recipes: listRecipes
    });
  },

  // 根据种子值打乱数组（保持稳定性）
  _shuffleWithSeed(arr: any[], seed: number): any[] {
    const result = [...arr];
    let random = seed;
    for (let i = result.length - 1; i > 0; i--) {
      random = (random * 9301 + 49297) % 233280;
      const j = Math.floor((random / 233280) * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  },

  // 获取场景标签
  _getSceneLabel(recipe: any): string {
    const name = (recipe.name || '').toLowerCase();
    const desc = (recipe.description || '').toLowerCase();
    const dishTypes = recipe.dishTypes || [];
    const tags = [...dishTypes].map(t => t.toLowerCase());

    if (tags.includes('fitness') || tags.includes('diet')) return '减脂';
    if (tags.includes('kids') || tags.includes('children')) return '儿童';
    if (name.includes('快手') || name.includes('一人')) return '快手';
    if (name.includes('网红') || name.includes('爆款')) return '热门';
    if (desc.includes('家常') || desc.includes('下饭')) return '家常';

    return '推荐';
  },

  onBack() {
    wx.navigateBack();
  },

  onBannerTap(e: WechatMiniprogram.BaseEvent) {
    const id = (e.currentTarget as any).dataset.id as string;
    if (!id) return;
    wx.navigateTo({
      url: `/pages/recipes/detail?id=${encodeURIComponent(id)}&from=daily`
    });
  },

  onSearch() {
    wx.navigateTo({ url: '/pages/search/index?focus=1' });
  },

  onMore() {
    wx.showToast({ title: '更多功能开发中', icon: 'none' });
  },

  onRecipeTap(e: WechatMiniprogram.BaseEvent) {
    const id = e.currentTarget.dataset.id as string;
    if (!id) return;
    wx.navigateTo({
      url: `/pages/recipes/detail?id=${encodeURIComponent(id)}&from=daily`
    });
  },

  onMoreAction(e: WechatMiniprogram.BaseEvent) {
    const index = e.currentTarget.dataset.index as number;
    const recipe = this.data.recipes[index];
    if (!recipe) return;

    this.setData({
      showActionSheet: true,
      actionRecipeIndex: index,
      actionRecipeName: recipe.name
    });
  },

  onCloseActionSheet() {
    this.setData({
      showActionSheet: false,
      actionRecipeIndex: -1,
      actionRecipeName: ''
    });
  },

  stopPropagation() {
    // 阻止事件冒泡
  },

  onCollect() {
    const { actionRecipeIndex } = this.data;
    if (actionRecipeIndex < 0) return;

    const recipe = this.data.recipes[actionRecipeIndex];
    if (!recipe) return;

    // 调用收藏逻辑
    try {
      const favorites = wx.getStorageSync('favorites') || [];
      const exists = favorites.find((f: any) => f.id === recipe.id);
      if (exists) {
        wx.showToast({ title: '已收藏过啦', icon: 'none' });
      } else {
        favorites.unshift({
          id: recipe.id,
          name: recipe.name,
          coverImage: recipe.coverImage,
          addTime: Date.now()
        });
        wx.setStorageSync('favorites', favorites);
        wx.showToast({ title: '收藏成功', icon: 'success' });
      }
    } catch (e) {
      wx.showToast({ title: '收藏失败', icon: 'none' });
    }

    this.onCloseActionSheet();
  },

  onAddToMeal() {
    const { actionRecipeIndex } = this.data;
    if (actionRecipeIndex < 0) return;

    const recipe = this.data.recipes[actionRecipeIndex];
    if (!recipe) return;

    try {
      const mealPlan = wx.getStorageSync('todayMeal') || [];
      const exists = mealPlan.find((m: any) => m.id === recipe.id);
      if (exists) {
        wx.showToast({ title: '已在餐单中', icon: 'none' });
      } else {
        mealPlan.push({
          id: recipe.id,
          name: recipe.name,
          coverImage: recipe.coverImage,
          mealTime: '',
          addTime: Date.now()
        });
        wx.setStorageSync('todayMeal', mealPlan);
        wx.showToast({ title: '已加入今日餐单', icon: 'success' });
      }
    } catch (e) {
      wx.showToast({ title: '添加失败', icon: 'none' });
    }

    this.onCloseActionSheet();
  },

  onShare() {
    const { actionRecipeIndex } = this.data;
    if (actionRecipeIndex < 0) return;

    const recipe = this.data.recipes[actionRecipeIndex];
    if (!recipe) return;

    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });

    this.onCloseActionSheet();
  },

  onShareAppMessage(res: any) {
    const { actionRecipeIndex } = this.data;
    const recipe = actionRecipeIndex >= 0 ? this.data.recipes[actionRecipeIndex] : null;

    return {
      title: recipe ? `【吃了么】${recipe.name}` : '【吃了么】每日推荐菜谱',
      path: '/pages/index/index',
      imageUrl: recipe ? recipe.coverImage : ''
    };
  },

  onShareTimeline() {
    const { actionRecipeIndex, recipes } = this.data;
    const recipe = actionRecipeIndex >= 0 ? recipes[actionRecipeIndex] : null;

    return {
      title: recipe ? `今日推荐：${recipe.name}` : '【吃了么】每日推荐菜谱',
      imageUrl: recipe ? recipe.coverImage : '',
      query: ''
    };
  },

  onImageError(e: WechatMiniprogram.BaseEvent) {
    const index = e.currentTarget.dataset.index;
    if (index === undefined) return;
    const recipe = this.data.recipes[index];
    if (!recipe || !recipe.coverImage) return;
    const errUrl = recipe.coverImage;
    const clear = (r: typeof recipe) =>
      r.coverImage === errUrl ? { ...r, coverImage: FALLBACK_IMAGE } : r;
    this.setData({
      recipes: this.data.recipes.map(clear),
      bannerRecipe: this.data.bannerRecipe && this.data.bannerRecipe.coverImage === errUrl
        ? { ...this.data.bannerRecipe, coverImage: FALLBACK_IMAGE }
        : this.data.bannerRecipe
    } as any);
  }
});
