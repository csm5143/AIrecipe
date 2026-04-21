import {
  getBasket,
  getTotalIngredientCount,
  getRecipeCount,
  removeRecipeById,
  removeIngredientFromRecipe,
  clearBasket,
  getMergedIngredientsSplit,
  formatBasketCopyText,
  formatMergedCopyText,
  type BasketRecipeEntry,
  type BasketIngredient
} from '../../utils/shoppingList';
import { isFormalUser, guideToLogin } from '../../utils/userAuth';
import { syncDebounced } from '../../utils/dataSync';

Page({
  data: {
    recipes: [] as BasketRecipeEntry[],
    totalCount: 0,
    recipeCount: 0,
    showMerged: false,
    mergedCoreList: [] as BasketIngredient[],
    mergedSeasoningList: [] as BasketIngredient[],
    mergedTotalCount: 0,
    expandedIds: [] as string[]
  },

  onLoad() {
    if (!isFormalUser()) {
      guideToLogin(() => {
        // 登录成功后刷新
        this.refresh();
      });
      return;
    }
    this.refresh();
  },

  onShow() {
    // 每次显示都检查登录状态
    if (!isFormalUser()) {
      guideToLogin(() => {
        this.refresh();
      });
      return;
    }
    this.refresh();
    const tab = typeof this.getTabBar === 'function' && this.getTabBar();
    if (tab) tab.setData({ selected: 1 });
  },

  refresh() {
    const recipes = getBasket();
    const totalCount = getTotalIngredientCount();
    const recipeCount = getRecipeCount();
    // 已有数据时默认展开第一道菜，避免一进来满屏空白
    const expandedIds =
      recipes.length > 0
        ? [recipes[0].recipeId]
        : [];
    this.setData({
      recipes,
      totalCount,
      recipeCount,
      expandedIds,
      showMerged: false,
      mergedCoreList: [],
      mergedSeasoningList: [],
      mergedTotalCount: 0
    });
  },

  // ── 菜谱卡片展开/折叠 ────────────────────────────────
  onToggleRecipe(e: WechatMiniprogram.BaseEvent) {
    const id = e.currentTarget.dataset.id as string;
    if (!id) return;
    const { expandedIds } = this.data;
    if (expandedIds.indexOf(id) !== -1) {
      this.setData({ expandedIds: expandedIds.filter((x) => x !== id) });
    } else {
      this.setData({ expandedIds: [...expandedIds, id] });
    }
  },

  // ── 删除整道菜谱 ─────────────────────────────────────
  onRemoveRecipe(e: WechatMiniprogram.BaseEvent) {
    const id = e.currentTarget.dataset.id as string;
    const name = e.currentTarget.dataset.name as string;
    if (!id) return;
    wx.showModal({
      title: '删除菜谱',
      content: `确定从小菜篮中移除「${name}」及其所有食材吗？`,
      confirmText: '删除',
      confirmColor: '#ff3b30',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          removeRecipeById(id);
          syncDebounced();
          this.refresh();
          wx.showToast({ title: '已删除', icon: 'none', duration: 1200 });
        }
      }
    });
  },

  // ── 删除单种食材 ─────────────────────────────────────
  onRemoveIngredient(e: WechatMiniprogram.BaseEvent) {
    const { recipeId, ingredientName } = e.currentTarget.dataset as {
      recipeId: string;
      ingredientName: string;
    };
    if (!recipeId || !ingredientName) return;
    wx.showModal({
      title: '删除食材',
      content: `从小菜篮中移除「${ingredientName}」吗？`,
      confirmText: '删除',
      confirmColor: '#ff3b30',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          removeIngredientFromRecipe(recipeId, ingredientName);
          syncDebounced();
          this.refresh();
          wx.showToast({ title: '已移除', icon: 'none', duration: 1200 });
        }
      }
    });
  },

  // ── 查看菜谱详情 ─────────────────────────────────────
  onViewRecipeDetail(e: WechatMiniprogram.BaseEvent) {
    const id = e.currentTarget.dataset.id as string;
    if (!id) return;
    wx.navigateTo({
      url: `/pages/recipes/detail?id=${encodeURIComponent(id)}&from=basket`
    });
  },

  // ── 合并食材清单 ─────────────────────────────────────
  onToggleMerge() {
    const { showMerged } = this.data;
    if (!showMerged) {
      const { core, seasoning } = getMergedIngredientsSplit();
      const mergedTotalCount = core.length + seasoning.length;
      this.setData({
        showMerged: true,
        mergedCoreList: core,
        mergedSeasoningList: seasoning,
        mergedTotalCount
      });
    } else {
      this.setData({
        showMerged: false,
        mergedCoreList: [],
        mergedSeasoningList: [],
        mergedTotalCount: 0
      });
    }
  },

  // ── 复制清单（分组文本）──────────────────────────────
  onCopyBasket() {
    const text = formatBasketCopyText();
    if (!text) {
      wx.showToast({ title: '清单是空的', icon: 'none' });
      return;
    }
    wx.setClipboardData({
      data: text,
      success: () => wx.showToast({ title: '已复制', icon: 'success' })
    });
  },

  // ── 复制合并清单 ─────────────────────────────────────
  onCopyMerged() {
    const text = formatMergedCopyText();
    if (!text) {
      wx.showToast({ title: '清单是空的', icon: 'none' });
      return;
    }
    wx.setClipboardData({
      data: text,
      success: () => wx.showToast({ title: '已复制', icon: 'success' })
    });
  },

  // ── 清空全部 ─────────────────────────────────────────
  onClearAll() {
    if (!this.data.recipes.length) {
      wx.showToast({ title: '清单已经是空的', icon: 'none' });
      return;
    }
    wx.showModal({
      title: '清空小菜篮',
      content: '确定清空所有菜谱和食材吗？此操作不可恢复。',
      confirmText: '清空',
      confirmColor: '#ff3b30',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          clearBasket();
          syncDebounced();
          this.refresh();
          wx.showToast({ title: '已清空', icon: 'none', duration: 1200 });
        }
      }
    });
  }
});
