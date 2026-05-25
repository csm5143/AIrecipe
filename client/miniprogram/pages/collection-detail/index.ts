import { Recipe } from '../../types/index.js';
import { getGlobalRecipesAsync, getGlobalRecipes } from '../../utils/httpServices/recipeService.js';
import { handleWarning } from '../../utils/errorHandler.js';
import {
  getDifficultyLabel,
  getMealTimeLabelString,
  getPrimaryCategoryLabel,
  getSecondaryCategoryLabels
} from '../../utils/labels.js';
import { extractCalories } from '../../utils/recipeUtils.js';
import { collectionService } from '../../utils/services/collectionService.js';
import { authService } from '../../utils/services/authService.js';

Page({
  data: {
    collectionId: '',
    collectionName: '',
    collectionDesc: '',
    recipeCount: 0,
    coverImage: '',
    recipes: [] as Array<
      Recipe & {
        difficultyLabel: string;
        mealTimeLabel: string;
        primaryCategoryLabel: string;
        secondaryCategoryLabels: string[];
        calories: string | null;
        isFavorite: boolean;
      }
    >,
    isEmpty: false,
    isLoading: false,
    recipesNotFound: false,

    showEditModal: false,
    editName: '',
    editDesc: '',
    editCoverImage: '',

    moreMenuItems: [] as Array<{ label: string; value: string }>,

    toastShow: false,
    toastMessage: '',
    toastType: 'info' as 'info' | 'success' | 'warning',
    toastShowButton: false,
    toastButtonText: '去看看',
    toastDuration: 2000
  },

  onLoad(options: any) {
    const collectionId = options.id || '';
    this.setData({ collectionId });
    this.loadCollectionInfo();
    this.loadRecipes();
  },

  onShow() {
    this.loadCollectionInfo();
    this.loadRecipes();
  },

  async loadCollectionInfo() {
    if (!authService.isLoggedIn()) return;

    try {
      const detail = await collectionService.getCollectionDetailCached(Number(this.data.collectionId));
      if (detail) {
        const collection = detail as any;
        this.setData({
          collectionName: collection.name,
          collectionDesc: collection.description || '',
          recipeCount: collection.recipes?.length || 0,
          coverImage: collection.coverImage || ''
        });
        wx.setNavigationBarTitle({ title: collection.name });
      }
    } catch (e) {
      console.error('[CollectionDetail] 加载收藏夹信息失败', e);
    }
  },

  async loadRecipes() {
    this.setData({ isLoading: true, recipesNotFound: false });

    try {
      const detail = await collectionService.getCollectionDetailCached(Number(this.data.collectionId));
      const backendRecipes = ((detail as any)?.recipes || []) as any[];

      if (backendRecipes.length === 0) {
        this.setData({ recipes: [], isEmpty: true, isLoading: false, recipesNotFound: false });
        return;
      }

      // 直接用后端返回的菜谱数据，不再依赖本地分页列表
      const recipes = backendRecipes.map((r: any) => ({
        id: r.id,
        name: r.title || r.name || '未知菜谱',
        coverImage: r.coverImage || '',
        difficulty: r.difficulty || 'easy',
        cookingTime: r.cookingTime || r.timeCost || 0,
        calories: r.calories || 0,
        description: r.description || '',
        ingredients: r.ingredients || [],
        usage: r.usage || {},
        mealTimes: r.mealTimes || [],
        dishTypes: r.dishTypes || [],
        tags: r.tags || [],
        steps: r.steps || [],
        nutrition: r.nutrition || {},
        difficultyLabel: getDifficultyLabel(r.difficulty || 'easy'),
        mealTimeLabel: getMealTimeLabelString(r.mealTimes || []),
        primaryCategoryLabel: getPrimaryCategoryLabel(r),
        secondaryCategoryLabels: getSecondaryCategoryLabels(r),
        calories: extractCalories(r),
        isFavorite: true,
      }));

      console.log('[CollectionDetail] 菜谱数量:', recipes.length);

      this.setData({
        recipes,
        isEmpty: recipes.length === 0,
        isLoading: false,
        recipesNotFound: false,
      });
    } catch (error) {
      console.error('[CollectionDetail] 加载菜谱失败:', error);
      this.setData({ recipes: [], isEmpty: true, isLoading: false, recipesNotFound: false });
    }
  },

  onBack() {
    wx.navigateBack();
  },

  onShowMoreActions() {
    const { recipeCount } = this.data;

    const itemList = recipeCount > 0
      ? ['清空收藏夹', '编辑信息', '删除收藏夹']
      : ['编辑信息', '删除收藏夹'];

    wx.showActionSheet({
      itemList,
      itemColor: '#111111',
      success: (res) => {
        const index = res.tapIndex;

        switch (index) {
          case 0:
            if (recipeCount > 0) {
              this.clearCollection();
            } else {
              this.onEdit();
            }
            break;
          case 1:
            if (recipeCount > 0) {
              this.onEdit();
            } else {
              this.onDelete();
            }
            break;
          case 2:
            if (recipeCount > 0) {
              this.onDelete();
            }
            break;
        }
      }
    });
  },

  async clearCollection() {
    const { collectionName, recipeCount, recipes } = this.data;

    const res = await wx.showModal({
      title: '清空收藏夹',
      content: `确定要清空"${collectionName}"中的所有 ${recipeCount} 道菜品吗？`,
      confirmText: '清空',
      confirmColor: '#ff3b30',
      cancelText: '取消',
    });

    if (!res.confirm) return;

    try {
      for (const recipe of recipes) {
        await collectionService.removeFavoriteCached(Number(this.data.collectionId), Number(recipe.id));
      }
      this.showToast('已清空收藏夹', 'success', false, '', 2000, 'success');
      this.loadCollectionInfo();
      this.loadRecipes();
    } catch (e) {
      console.error('[CollectionDetail] 清空失败', e);
      this.showToast('清空失败', 'warning', false, '', 2000, 'warning');
    }
  },

  async onDelete() {
    const { collectionName } = this.data;

    const res = await wx.showModal({
      title: '删除收藏夹',
      content: `确定要删除"${collectionName}"吗？此操作不可恢复`,
      confirmText: '删除',
      confirmColor: '#ff3b30',
      cancelText: '取消',
    });

    if (!res.confirm) return;

    const result = await collectionService.deleteCollectionCached(Number(this.data.collectionId));

    if (result.success) {
      this.showToast('已删除收藏夹', 'success', false, '', 2000, 'success');
      setTimeout(() => wx.navigateBack(), 1500);
    } else {
      this.showToast(result.message || '删除失败，请先移除菜品', 'warning', false, '', 2500, 'warning');
    }
  },

  onEdit() {
    this.setData({
      showEditModal: true,
      editName: this.data.collectionName,
      editDesc: this.data.collectionDesc || '',
      editCoverImage: this.data.coverImage || ''
    });
  },

  onEditModalContentTap() {},

  onCloseEditModal() {
    this.setData({ showEditModal: false });
  },

  onChooseCover() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.setData({ editCoverImage: res.tempFilePaths[0] });
        this.showToast('封面已选择，请点击保存', 'info', false, '', 2000, 'info');
      },
      fail: (err) => {
        console.error('[CollectionDetail] 选择封面失败:', err);
        this.showToast('选择封面失败', 'warning', false, '', 2000, 'warning');
      }
    });
  },

  onEditNameInput(e: WechatMiniprogram.BaseInputEvent) {
    this.setData({ editName: e.detail.value });
  },

  onEditDescInput(e: WechatMiniprogram.BaseInputEvent) {
    this.setData({ editDesc: e.detail.value });
  },

  async onSaveEdit() {
    const { editName, editDesc } = this.data;

    if (!editName.trim()) {
      this.showToast('请输入收藏夹名称', 'warning', false, '', 2000, 'warning');
      return;
    }

    const result = await collectionService.updateCollectionCached(Number(this.data.collectionId), {
      name: editName.trim(),
      description: editDesc.trim(),
    });

    if (result.success) {
      this.showToast('保存成功', 'success', false, '', 2000, 'success');
      this.onCloseEditModal();
      this.loadCollectionInfo();
    } else {
      this.showToast(result.message || '保存失败', 'warning', false, '', 2000, 'warning');
    }
  },

  onRecipeTap(e: WechatMiniprogram.BaseEvent) {
    const id = e.currentTarget.dataset.id as string;
    if (!id) return;

    wx.navigateTo({
      url: `/pages/recipes/detail?id=${id}&from=collection`
    });
  },

  async onRecipeLongPress(e: WechatMiniprogram.BaseEvent) {
    const recipeId = e.currentTarget.dataset.id as string;
    const recipeName = e.currentTarget.dataset.name as string;

    if (!recipeId) return;

    try {
      const action = await wx.showActionSheet({
        itemList: ['移除收藏', '移动到其他收藏夹'],
        itemColor: '#111111'
      });

      switch (action.tapIndex) {
        case 0:
          await this.removeFromCollection(recipeId, recipeName);
          break;
        case 1:
          await this.moveToOtherCollection(recipeId, recipeName);
          break;
      }
    } catch (e: any) {
      if (e.errMsg && e.errMsg.includes('cancel')) return;
      wx.showToast({ title: '操作失败', icon: 'none' });
    }
  },

  async removeFromCollection(recipeId: string, recipeName: string) {
    const res = await wx.showModal({
      title: '移除收藏',
      content: `确定要将"${recipeName}"从"${this.data.collectionName}"中移除吗？`,
      confirmText: '移除',
      confirmColor: '#ff3b30'
    });

    if (!res.confirm) return;

    const result = await collectionService.removeFavoriteCached(Number(this.data.collectionId), Number(recipeId));

    if (result.success) {
      this.showToast('已移除', 'success', false, '', 2000, 'success');
      this.loadCollectionInfo();
      this.loadRecipes();
    } else {
      this.showToast(result.message || '移除失败', 'warning', false, '', 2000, 'warning');
    }
  },

  async moveToOtherCollection(recipeId: string, recipeName: string) {
    try {
      const collections = await collectionService.getCollectionsWithCache();
      const targetCollections = collections.filter((c: any) => String(c.id) !== this.data.collectionId);

      if (targetCollections.length === 0) {
        this.showToast('没有其他收藏夹', 'warning', false, '', 2000, 'warning');
        return;
      }

      const itemList = targetCollections.map((c: any) => c.name);
      const action = await wx.showActionSheet({ itemList, itemColor: '#111111' });
      const targetCollection = targetCollections[action.tapIndex];
      if (!targetCollection) return;

      await collectionService.addFavoriteCached(Number(targetCollection.id), Number(recipeId));
      await collectionService.removeFavoriteCached(Number(this.data.collectionId), Number(recipeId));

      this.showToast(`已移动到"${targetCollection.name}"`, 'success', false, '', 2000, 'success');
      this.loadCollectionInfo();
      this.loadRecipes();
    } catch (e) {
      console.error('[CollectionDetail] 移动收藏失败', e);
      this.showToast('操作失败', 'warning', false, '', 2000, 'warning');
    }
  },

  showToast(
    message: string,
    type: 'info' | 'success' | 'warning' = 'info',
    showButton: boolean = false,
    buttonText: string = '去看看',
    duration: number = 2000,
    iconType: string = ''
  ) {
    this.setData({
      toastShow: true,
      toastMessage: message,
      toastType: type,
      toastShowButton: showButton,
      toastButtonText: buttonText,
      toastDuration: duration
    });

    if (duration > 0) {
      setTimeout(() => { this.hideToast(); }, duration);
    }
  },

  hideToast() {
    this.setData({ toastShow: false });
  },

  onToastButtonTap() {
    this.hideToast();
  },

  onAddMore() {
    wx.switchTab({ url: '/pages/index/index' });
  },

  onRename() {},
  onChangeCover() {}
});
