// 我的上传页面

import { 
  getMyRecipes, 
  deleteMyRecipe, 
  STATUS_TEXT,
  STATUS_COLOR,
  UserRecipe,
  RecipeStatus
} from '../../../utils/cloudUserRecipe';
import { isLoggedIn } from '../../../utils/userAuth';

interface TabItem {
  key: string;
  label: string;
  value?: RecipeStatus;
}

Page({
  data: {
    tabs: [
      { key: 'all', label: '全部' },
      { key: 'pending', label: '待审核', value: 'pending' as RecipeStatus },
      { key: 'approved', label: '已通过', value: 'approved' as RecipeStatus },
      { key: 'rejected', label: '已拒绝', value: 'rejected' as RecipeStatus }
    ] as TabItem[],
    currentTab: 'all',
    recipes: [] as UserRecipe[],
    loading: false,
    hasMore: true,
    page: 1,
    pageSize: 10
  },

  onLoad() {
    this.loadRecipes();
  },

  onShow() {
    if (isLoggedIn()) {
      this.refreshData();
    }
  },

  onPullDownRefresh() {
    this.refreshData();
  },

  onReachBottom() {
    this.loadMore();
  },

  // 切换Tab
  onSwitchTab(e: any) {
    const key = e.currentTarget.dataset.key;
    if (key === this.data.currentTab) return;
    
    this.setData({
      currentTab: key,
      recipes: [],
      page: 1,
      hasMore: true
    });
    this.loadRecipes();
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
      const currentTab = this.data.currentTab;
      const status = currentTab === 'all' ? undefined : currentTab as RecipeStatus;
      
      const result = await getMyRecipes(status, this.data.page, this.data.pageSize);
      
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
      console.error('[MyUploads] 加载失败', err);
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

  // 查看详情
  onViewDetail(e: any) {
    const recipeId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/subpackages/user-recipe/detail/index?id=${recipeId}&type=mine`
    });
  },

  // 删除菜谱
  onDeleteRecipe(e: any) {
    const recipeId = e.currentTarget.dataset.id;
    const recipe = this.data.recipes.find(r => r.recipeId === recipeId);
    
    if (recipe && recipe.status === 'approved') {
      wx.showToast({ title: '已通过的菜谱不能删除', icon: 'none' });
      return;
    }

    wx.showModal({
      title: '确认删除',
      content: '确定要删除这道菜谱吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            const result = await deleteMyRecipe(recipeId);
            if (result.success) {
              wx.showToast({ title: '删除成功', icon: 'success' });
              // 从列表中移除
              const recipes = this.data.recipes.filter(r => r.recipeId !== recipeId);
              this.setData({ recipes });
            } else {
              wx.showToast({ title: result.message || '删除失败', icon: 'none' });
            }
          } catch (err) {
            wx.showToast({ title: '删除失败', icon: 'none' });
          }
        }
      }
    });
  },

  // 上传新菜谱
  onUploadNew() {
    wx.navigateTo({
      url: '/subpackages/user-recipe/upload/index'
    });
  },

  // 查看拒绝原因
  onViewRejectReason(e: any) {
    const reason = e.currentTarget.dataset.reason;
    if (reason) {
      wx.showModal({
        title: '拒绝原因',
        content: reason,
        showCancel: false
      });
    }
  },

  // 格式化时间
  formatTime(timestamp: number): string {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}月${day}日`;
  },

  // 获取状态文本
  getStatusText(status: RecipeStatus): string {
    return STATUS_TEXT[status] || status;
  },

  // 获取状态颜色
  getStatusColor(status: RecipeStatus): string {
    return STATUS_COLOR[status] || '#999';
  }
});
