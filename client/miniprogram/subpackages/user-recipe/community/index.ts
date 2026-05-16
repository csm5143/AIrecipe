// 社区菜谱页面

import { 
  getCommunityRecipes, 
  increaseViewCount,
  UserRecipe
} from '../../../utils/cloudUserRecipe';

interface MealTimeOption {
  value: string;
  label: string;
}

Page({
  data: {
    recipes: [] as UserRecipe[],
    loading: false,
    hasMore: true,
    page: 1,
    pageSize: 20,
    
    // 筛选
    selectedMealTime: '',
    mealTimeOptions: [
      { value: '', label: '全部' },
      { value: 'breakfast', label: '早餐' },
      { value: 'lunch', label: '午餐' },
      { value: 'dinner', label: '晚餐' },
      { value: 'late_night', label: '夜宵' }
    ] as MealTimeOption[]
  },

  onLoad() {
    this.loadRecipes();
  },

  onPullDownRefresh() {
    this.refreshData();
  },

  onReachBottom() {
    this.loadMore();
  },

  // 刷新数据
  refreshData() {
    this.setData({
      recipes: [],
      page: 1,
      hasMore: true
    });
    this.loadRecipes();
  },

  // 加载数据
  async loadRecipes() {
    if (this.data.loading || !this.data.hasMore) return;
    
    this.setData({ loading: true });
    
    try {
      const result = await getCommunityRecipes({
        page: this.data.page,
        pageSize: this.data.pageSize,
        mealTime: this.data.selectedMealTime || undefined
      });
      
      if (result.success && result.data) {
        this.setData({
          recipes: this.data.page === 1 ? result.data : [...this.data.recipes, ...result.data],
          hasMore: result.hasMore || false,
          page: this.data.page + 1
        });
      } else {
        wx.showToast({ title: result.message || '加载失败', icon: 'none' });
      }
    } catch (err: any) {
      console.error('[Community] 加载失败', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
      wx.stopPullDownRefresh();
    }
  },

  // 加载更多
  loadMore() {
    this.loadRecipes();
  },

  // 选择用餐时段筛选
  onSelectMealTime(e: any) {
    const value = e.currentTarget.dataset.value;
    if (value === this.data.selectedMealTime) return;
    
    this.setData({
      selectedMealTime: value,
      recipes: [],
      page: 1,
      hasMore: true
    });
    this.loadRecipes();
  },

  // 查看详情
  onViewDetail(e: any) {
    const recipeId = e.currentTarget.dataset.id;
    // 增加浏览量（异步，不阻塞）
    increaseViewCount(recipeId);
    
    wx.navigateTo({
      url: `/subpackages/user-recipe/detail/index?id=${recipeId}&type=community`
    });
  },

  // 格式化时间
  formatTime(timestamp: number): string {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}月${day}日`;
  },

  // 获取难度文本
  getDifficultyText(difficulty: string): string {
    const map: Record<string, string> = {
      easy: '简单',
      normal: '中等',
      hard: '困难'
    };
    return map[difficulty] || '中等';
  }
});
