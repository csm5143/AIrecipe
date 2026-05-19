/**
 * 菜谱列表页 - 调用 /v1/app/recipes
 */

const { get } = require('../../../utils/httpApi/request');

Page({
  data: {
    recipeList: [],
    page: 1,
    total: 0,
    hasMore: true,
    loading: false,
    keyword: '',
    category: '',
    sort: 'createdAt',
  },

  onLoad(query) {
    if (query.keyword) this.setData({ keyword: query.keyword });
    if (query.category) this.setData({ category: decodeURIComponent(query.category) });
    this.loadRecipes(true);
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadRecipes(false);
    }
  },

  onPullDownRefresh() {
    this.loadRecipes(true);
  },

  async loadRecipes(reset = false) {
    if (this.data.loading) return;
    if (!reset && !this.data.hasMore) return;

    const page = reset ? 1 : this.data.page + 1;
    this.setData({ loading: true });

    try {
      const res = await get('/v1/app/recipes', {
        page,
        pageSize: 20,
        keyword: this.data.keyword,
        category: this.data.category,
        sort: this.data.sort,
      });

      if (res.success && res.data) {
        const newList = reset ? res.data : this.data.recipeList.concat(res.data);
        this.setData({
          recipeList: newList,
          page,
          total: res.total || newList.length,
          hasMore: newList.length < (res.total || newList.length),
        });
      } else {
        wx.showToast({ title: '加载失败', icon: 'none' });
      }
    } catch (e) {
      console.error('[RecipeList] loadRecipes failed:', e);
      wx.showToast({ title: '网络异常', icon: 'none' });
    } finally {
      this.setData({ loading: false });
      wx.stopPullDownRefresh();
    }
  },

  onRecipeTap(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/recipes/detail/index?id=${id}` });
  },

  onSortChange(e) {
    const sort = e.currentTarget.dataset.sort;
    this.setData({ sort });
    this.loadRecipes(true);
  },
});
