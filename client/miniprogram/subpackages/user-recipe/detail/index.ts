// 菜谱详情页面

import { 
  getRecipeDetail, 
  toggleLike, 
  checkLiked,
  increaseViewCount,
  UserRecipe
} from '../../../utils/cloudUserRecipe';
import { addRecipeIngredients } from '../../../utils/shoppingList';

Page({
  data: {
    recipe: null as UserRecipe | null,
    loading: true,
    liked: false,
    inBasket: false
  },

  recipeId: '',
  recipeType: 'community',

  onLoad(query: Record<string, string>) {
    const id = query && query.id ? String(query.id).trim() : '';
    const type = query && query.type ? String(query.type).trim() : 'community';

    this.recipeId = id;
    this.recipeType = type;

    if (id) {
      this.loadRecipe(id);
    } else {
      wx.showToast({ title: '参数错误', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
    }
  },

  async onShow() {
    if (this.recipeId && this.recipeType === 'community') {
      const liked = await checkLiked(this.recipeId);
      this.setData({ liked });
    }
  },

  async loadRecipe(id: string) {
    this.setData({ loading: true });

    try {
      const result = await getRecipeDetail(id);

      if (result.success && result.data) {
        wx.setNavigationBarTitle({ title: result.data.title });
        this.setData({ recipe: result.data });

        // 增加浏览量
        if (this.recipeType === 'community') {
          increaseViewCount(id);
          const liked = await checkLiked(id);
          this.setData({ liked });
        }
      } else {
        wx.showToast({ title: result.message || '加载失败', icon: 'none' });
        setTimeout(() => wx.navigateBack(), 1500);
      }
    } catch (err: any) {
      console.error('[RecipeDetail] 加载失败', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
    } finally {
      this.setData({ loading: false });
    }
  },

  // 点赞
  async onLike() {
    if (this.recipeType !== 'community') {
      wx.showToast({ title: '该菜谱暂不支持点赞', icon: 'none' });
      return;
    }

    try {
      const result = await toggleLike(this.recipeId);

      if (result.success) {
        this.setData({
          liked: result.liked || false,
          'recipe.likeCount': result.likeCount || this.data.recipe?.likeCount || 0
        });
        wx.showToast({
          title: result.liked ? '点赞成功' : '取消点赞',
          icon: 'success'
        });
      } else {
        wx.showToast({ title: result.message || '操作失败', icon: 'none' });
      }
    } catch (err) {
      wx.showToast({ title: '操作失败', icon: 'none' });
    }
  },

  // 加入小菜篮
  onAddToBasket() {
    const recipe = this.data.recipe;
    if (!recipe || !recipe.ingredients || recipe.ingredients.length === 0) {
      wx.showToast({ title: '暂无食材数据', icon: 'none' });
      return;
    }

    const ingredients = recipe.ingredients.map(ing => ({
      name: ing.name,
      amount: ing.amount || '适量'
    }));

    addRecipeIngredients(this.recipeId, recipe.title, ingredients);
    this.setData({ inBasket: true });
    wx.showToast({ title: '已加入小菜篮', icon: 'success' });
  },

  // 预览封面
  onPreviewCover() {
    const recipe = this.data.recipe;
    if (!recipe || !recipe.coverImage) return;

    wx.previewImage({
      urls: [recipe.coverImage],
      current: recipe.coverImage
    });
  },

  // 分享
  onShare() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  },

  // 获取难度文本
  getDifficultyText(difficulty: string): string {
    const map: Record<string, string> = {
      easy: '简单',
      normal: '中等',
      hard: '困难'
    };
    return map[difficulty] || '中等';
  },

  // 获取用餐时段文本
  getMealTimeText(mealTimes: string[]): string {
    const map: Record<string, string> = {
      breakfast: '早餐',
      lunch: '午餐',
      dinner: '晚餐',
      late_night: '夜宵'
    };
    return (mealTimes || []).map(t => map[t] || t).join('、');
  },

  // 格式化时间
  formatDate(timestamp: number): string {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}/${month}/${day}`;
  }
});
