/**
 * 菜谱详情页 - 调用 /v1/app/recipes/:id
 * 包含离线收藏能力
 */

const { get } = require('../../../utils/httpApi/request');
const { post } = require('../../../utils/httpApi/request');
const {
  addOfflineFavorite,
  removeOfflineFavorite,
  getOfflineFavoriteIds,
  isNetworkAvailable,
} = require('../../../utils/localCache');

Page({
  data: {
    recipe: null,
    isFavorite: false,
    loading: true,
    error: '',
    recipeId: null,
  },

  onLoad(query) {
    const id = parseInt(query.id);
    if (!id) {
      this.setData({ loading: false, error: '无效的菜谱 ID' });
      return;
    }
    this.setData({ recipeId: id });
    this.loadRecipeDetail(id);
  },

  onShow() {
    if (this.data.recipeId) {
      const ids = getOfflineFavoriteIds().map(f => String(f.recipeId));
      this.setData({ isFavorite: ids.includes(String(this.data.recipeId)) });
    }
  },

  async loadRecipeDetail(id) {
    this.setData({ loading: true, error: '' });

    // 优先离线缓存
    const cached = wx.getStorageSync(`favorite_detail_${id}`);
    if (cached) {
      this.setData({ recipe: cached });
    }

    try {
      const res = await get(`/v1/app/recipes/${id}`);

      if (res.success && res.data) {
        this.setData({ recipe: res.data, loading: false });
        wx.setStorageSync(`favorite_detail_${id}`, res.data);
      } else {
        if (!this.data.recipe) {
          this.setData({ loading: false, error: res.message || '加载失败' });
        } else {
          this.setData({ loading: false });
        }
      }
    } catch (e) {
      console.error('[RecipeDetail] loadRecipeDetail failed:', e);
      if (!this.data.recipe) {
        this.setData({ loading: false, error: '网络异常' });
      } else {
        this.setData({ loading: false });
      }
    }
  },

  async toggleFavorite() {
    const { recipe, isFavorite } = this.data;
    if (!recipe) return;

    const networkOk = await isNetworkAvailable();

    if (!networkOk) {
      const ids = getOfflineFavoriteIds().map(f => String(f.recipeId));
      const fav = ids.includes(String(recipe.id));
      if (fav) {
        removeOfflineFavorite(recipe.id);
      } else {
        addOfflineFavorite(recipe.id, recipe);
      }
      this.setData({ isFavorite: !fav });
      wx.showToast({
        title: !fav ? '已收藏（离线）' : '已取消',
        icon: 'none',
      });
      return;
    }

    try {
      const res = await post('/app/favorites', {
        recipeId: recipe.id,
      }, {
        withToken: true,
      });

      if (res.success) {
        const ids = getOfflineFavoriteIds().map(f => String(f.recipeId));
        if (ids.includes(String(recipe.id))) {
          removeOfflineFavorite(recipe.id);
        } else {
          addOfflineFavorite(recipe.id, recipe);
        }
        this.setData({ isFavorite: !ids.includes(String(recipe.id)) });
        wx.showToast({
          title: !ids.includes(String(recipe.id)) ? '收藏成功' : '已取消收藏',
          icon: 'none',
        });
      } else {
        wx.showToast({ title: res.message || '操作失败', icon: 'none' });
      }
    } catch (e) {
      console.error('[RecipeDetail] toggleFavorite failed:', e);
      wx.showToast({ title: '网络异常', icon: 'none' });
    }
  },

  onAddToBasket() {
    const { recipe } = this.data;
    if (!recipe) return;
    const ingredients = recipe.usage || {};
    const ingredientList = Object.entries(ingredients).map(([name, amount]) => ({
      name,
      amount,
      owned: false,
    }));
    try {
      const existing = wx.getStorageSync('basket_recipes') || '[]';
      const data = JSON.parse(existing);
      const alreadyIn = data.some((r) => String(r.recipeId) === String(recipe.id));
      if (alreadyIn) {
        wx.showToast({ title: '已在小菜篮中', icon: 'none' });
        return;
      }
      data.push({
        recipeId: recipe.id,
        recipeName: recipe.name || recipe.title,
        ingredients: ingredientList,
      });
      wx.setStorageSync('basket_recipes', JSON.stringify(data));
      wx.showToast({ title: '已加入小菜篮', icon: 'success' });
    } catch (e) {
      wx.showToast({ title: '加入失败', icon: 'none' });
    }
  },
});
