import { Recipe } from '../../types/index';
import { loadRecipesJson, loadRecipesAsync } from '../../utils/dataLoader';
import { handleWarning } from '../../utils/errorHandler';
import { getFallbackRecipes } from '../../utils/fallbackRecipes';
import {
  getDifficultyLabel,
  getMealTimeLabelString,
  getPrimaryCategoryLabel,
  getSecondaryCategoryLabels
} from '../../utils/labels';
import {
  extractCalories
} from '../../utils/recipeUtils';
import {
  removeRecipeFromCollection,
  getCollectionById,
  isRecipeInCollection,
  clearCollection,
  deleteCollection
} from '../../utils/collections';
import { syncDebounced } from '../../utils/dataSync';
import { isFormalUser, guideToLogin } from '../../utils/userAuth';

// 调用云函数
function callCloudFunction(action: string, data: any = {}): Promise<any> {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: 'collections',
      data: { action, data },
      success: (res: any) => {
        if (res.result && res.result.success) {
          resolve(res.result);
        } else {
          reject(new Error(res.result && res.result.message || '云函数调用失败'));
        }
      },
      fail: (err: any) => {
        reject(err);
      }
    });
  });
}

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

    // 编辑弹窗状态
    showEditModal: false,
    editName: '',
    editDesc: '',
    editCoverImage: '',

    // 下拉菜单选项（用于显示置顶状态）
    moreMenuItems: [] as Array<{ label: string; value: string }>,

    // Toast 提示状态
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
    // 每次显示刷新数据
    this.loadCollectionInfo();
    this.loadRecipes();
  },

  async loadCollectionInfo() {
    const { getCollectionById } = require('../../utils/collections');
    const collection = getCollectionById(this.data.collectionId);

    if (collection) {
      this.setData({
        collectionName: collection.name,
        collectionDesc: collection.description || '',
        recipeCount: collection.recipeCount,
        coverImage: collection.coverImage || ''
      });
      wx.setNavigationBarTitle({
        title: collection.name
      });
    }
  },

  async loadRecipes() {
    console.log('[CollectionDetail] loadRecipes 开始, collectionId:', this.data.collectionId);
    this.setData({ isLoading: true });

    try {
      // 获取收藏夹中的菜谱ID列表
      const { getCollectionRecipeIds } = require('../../utils/collections');
      const recipeIds = getCollectionRecipeIds(this.data.collectionId);
      console.log('[CollectionDetail] 收藏夹中的菜谱ID列表:', recipeIds);

      if (!recipeIds || recipeIds.length === 0) {
        this.setData({
          recipes: [],
          isEmpty: true,
          isLoading: false
        });
        return;
      }

      // 加载所有菜谱
      const allRecipes = await loadRecipesAsync();
      console.log('[CollectionDetail] 所有菜谱数量:', allRecipes.length);

      // 根据 recipeIds 筛选并映射
      const recipes = allRecipes
        .filter(r => recipeIds.includes(r.id))
        .map(r => ({
          ...r,
          difficultyLabel: getDifficultyLabel(r.difficulty),
          mealTimeLabel: getMealTimeLabelString(r.mealTimes),
          primaryCategoryLabel: getPrimaryCategoryLabel(r),
          secondaryCategoryLabels: getSecondaryCategoryLabels(r),
          calories: extractCalories(r),
          isFavorite: true
        }));

      console.log('[CollectionDetail] 筛选后的菜谱数量:', recipes.length);
      console.log('[CollectionDetail] 菜谱列表:', recipes.map(r => ({ id: r.id, name: r.name })));

      this.setData({
        recipes,
        isEmpty: recipes.length === 0,
        isLoading: false
      });
    } catch (error) {
      console.error('[CollectionDetail] 加载菜谱失败:', error);
      this.setData({
        recipes: [],
        isEmpty: true,
        isLoading: false
      });
    }
  },

  // 返回
  onBack() {
    wx.navigateBack();
  },

  // 显示更多操作菜单
  onShowMoreActions() {
    const { recipeCount } = this.data;

    // 构建菜单项
    const itemList = recipeCount > 0
      ? ['清空收藏夹', '编辑信息', '删除收藏夹']
      : ['编辑信息', '删除收藏夹'];

    wx.showActionSheet({
      itemList,
      itemColor: '#111111',
      success: (res) => {
        const index = res.tapIndex;
        console.log('[CollectionDetail] 选择了操作:', index, itemList[index]);

        switch (index) {
          case 0:
            if (recipeCount > 0) {
              // 有菜品：清空收藏夹
              this.clearCollection();
            } else {
              // 无菜品：编辑信息
              this.onEdit();
            }
            break;
          case 1:
            if (recipeCount > 0) {
              // 有菜品：编辑信息
              this.onEdit();
            } else {
              // 无菜品：删除收藏夹
              this.onDelete();
            }
            break;
          case 2:
            // 删除收藏夹（仅当有菜品时，case 2 才存在）
            if (recipeCount > 0) {
              this.onDelete();
            }
            break;
        }
      },
      fail: (err) => {
        if (err.errMsg && err.errMsg.includes('cancel')) {
          console.log('[CollectionDetail] 用户取消操作菜单');
        } else {
          console.error('[CollectionDetail] 操作菜单失败', err);
        }
      }
    });
  },

  // 清空收藏夹
  clearCollection() {
    const { collectionName, recipeCount } = this.data;

    wx.showModal({
      title: '清空收藏夹',
      content: `确定要清空"${collectionName}"中的所有 ${recipeCount} 道菜品吗？`,
      confirmText: '清空',
      confirmColor: '#ff3b30',
      cancelText: '取消',
      success: (res) => {
        if (!res.confirm) return;

        const success = clearCollection(this.data.collectionId);

        if (success) {
          this.showToast('已清空收藏夹', 'success', false, '', 2000, 'success');
          this.loadCollectionInfo();
          this.loadRecipes();

          const { markCollectionsDirty } = require('../../utils/collections');
          const { syncDebounced } = require('../../utils/dataSync');
          markCollectionsDirty();
          syncDebounced();
        } else {
          this.showToast('清空失败', 'warning', false, '', 2000, 'warning');
        }
      }
    });
  },

  // 删除收藏夹
  onDelete() {
    const { collectionName } = this.data;

    wx.showModal({
      title: '删除收藏夹',
      content: `确定要删除"${collectionName}"吗？此操作不可恢复`,
      confirmText: '删除',
      confirmColor: '#ff3b30',
      cancelText: '取消',
      success: (res) => {
        if (!res.confirm) return;

        const success = deleteCollection(this.data.collectionId);

        if (success) {
          this.showToast('已删除收藏夹', 'success', false, '', 2000, 'success');
          // 延迟返回
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
        } else {
          this.showToast('删除失败，请先移除菜品', 'warning', false, '', 2500, 'warning');
        }
      }
    });
  },

  // 打开编辑弹窗
  onEdit() {
    this.setData({
      showEditModal: true,
      editName: this.data.collectionName,
      editDesc: this.data.collectionDesc || '',
      editCoverImage: this.data.coverImage || ''
    });
  },

  // 编辑弹窗内容区域点击阻止冒泡
  onEditModalContentTap() {
    // 空函数，用于阻止事件冒泡到遮罩层
  },

  // 关闭编辑弹窗
  onCloseEditModal() {
    this.setData({
      showEditModal: false
    });
  },

  // 选择封面
  onChooseCover() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0];
        this.setData({
          editCoverImage: tempFilePath
        });
        this.showToast('封面已选择，请点击保存', 'info', false, '', 2000, 'info');
      },
      fail: (err) => {
        console.error('[CollectionDetail] 选择封面失败:', err);
        this.showToast('选择封面失败', 'warning', false, '', 2000, 'warning');
      }
    });
  },

  // 编辑名称输入
  onEditNameInput(e: WechatMiniprogram.BaseInputEvent) {
    this.setData({
      editName: e.detail.value
    });
  },

  // 编辑简介输入
  onEditDescInput(e: WechatMiniprogram.BaseInputEvent) {
    this.setData({
      editDesc: e.detail.value
    });
  },

  // 保存编辑
  onSaveEdit() {
    const { editName, editDesc, editCoverImage } = this.data;

    if (!editName.trim()) {
      this.showToast('请输入收藏夹名称', 'warning', false, '', 2000, 'warning');
      return;
    }

    const { updateCollection } = require('../../utils/collections');
    const success = updateCollection(this.data.collectionId, {
      name: editName.trim(),
      description: editDesc.trim(),
      coverImage: editCoverImage
    });

    if (success) {
      this.showToast('保存成功', 'success', false, '', 2000, 'success');
      this.onCloseEditModal();
      this.loadCollectionInfo();

      const { markCollectionsDirty } = require('../../utils/collections');
      const { syncDebounced } = require('../../utils/dataSync');
      markCollectionsDirty();
      syncDebounced();
    } else {
      this.showToast('保存失败', 'warning', false, '', 2000, 'warning');
    }
  },

  // 跳转到菜谱详情
  onRecipeTap(e: WechatMiniprogram.BaseEvent) {
    const id = e.currentTarget.dataset.id as string;
    if (!id) return;

    wx.navigateTo({
      url: `/pages/recipes/detail?id=${id}&from=collection`
    });
  },

  // 长按菜品：移除或移动
  async onRecipeLongPress(e: WechatMiniprogram.BaseEvent) {
    console.log('[CollectionDetail] 长按菜品触发', e.currentTarget.dataset);
    const recipeId = e.currentTarget.dataset.id as string;
    const recipeName = e.currentTarget.dataset.name as string;

    console.log('[CollectionDetail] recipeId:', recipeId, 'recipeName:', recipeName);
    console.log('[CollectionDetail] 当前页面数据:', {
      collectionId: this.data.collectionId,
      collectionName: this.data.collectionName
    });

    if (!recipeId) {
      console.warn('[CollectionDetail] recipeId 为空');
      return;
    }

    try {
      const action = await wx.showActionSheet({
        itemList: ['移除收藏', '移动到其他收藏夹'],
        itemColor: '#111111'
      });

      console.log('[CollectionDetail] 用户选择操作:', action);

      switch (action.tapIndex) {
        case 0:
          console.log('[CollectionDetail] 执行: 移除收藏');
          await this.removeFromCollection(recipeId, recipeName);
          break;
        case 1:
          console.log('[CollectionDetail] 执行: 移动到其他收藏夹');
          await this.moveToOtherCollection(recipeId, recipeName);
          break;
      }
    } catch (e: any) {
      console.error('[CollectionDetail] 长按菜单异常:', e);
      if (e.errMsg && e.errMsg.includes('cancel')) {
        return;
      }
      wx.showToast({
        title: '操作失败',
        icon: 'none'
      });
    }
  },

  async removeFromCollection(recipeId: string, recipeName: string) {
    console.log('[CollectionDetail] 开始移除收藏', { collectionId: this.data.collectionId, recipeId, recipeName });
    console.log('[CollectionDetail] recipeId 类型:', typeof recipeId, 'value:', recipeId);

    try {
      const res = await wx.showModal({
        title: '移除收藏',
        content: `确定要将"${recipeName}"从"${this.data.collectionName}"中移除吗？`,
        confirmText: '移除',
        confirmColor: '#ff3b30'
      });

      console.log('[CollectionDetail] 确认对话框结果:', res);

      if (!res.confirm) {
        console.log('[CollectionDetail] 用户取消移除');
        return;
      }

      const { removeRecipeFromCollection, getCollectionById } = require('../../utils/collections');

      // 先打印当前收藏夹状���
      const collectionBefore = getCollectionById(this.data.collectionId);
      console.log('[CollectionDetail] 移除前的收藏夹:', collectionBefore ? {
        id: collectionBefore.id,
        recipeIds: collectionBefore.recipeIds,
        recipeIds类型: collectionBefore.recipeIds.map(id => ({id, type: typeof id}))
      } : '未找到');

      const success = removeRecipeFromCollection(this.data.collectionId, recipeId);

      console.log('[CollectionDetail] removeRecipeFromCollection 结果:', success);

      // 再打印移除后的状态
      const collectionAfter = getCollectionById(this.data.collectionId);
      console.log('[CollectionDetail] 移除后的收藏夹:', collectionAfter ? {
        id: collectionAfter.id,
        recipeIds: collectionAfter.recipeIds
      } : '未找到');

      if (success) {
        console.log('[CollectionDetail] 移除成功，刷新页面');
        this.showToast('已移除', 'success', false, '', 2000, 'success');
        this.loadCollectionInfo();
        this.loadRecipes();

        const { markCollectionsDirty } = require('../../utils/collections');
        const { syncDebounced } = require('../../utils/dataSync');
        markCollectionsDirty();
        syncDebounced();
      } else {
        console.warn('[CollectionDetail] 移除失败');
        this.showToast('移除失败，请重试', 'warning', false, '', 2000, 'warning');
      }
    } catch (e) {
      console.error('[CollectionDetail] 移除收藏异常:', e);
      this.showToast('操作失败', 'warning', false, '', 2000, 'warning');
    }
  },

  async moveToOtherCollection(recipeId: string, recipeName: string) {
    try {
      const { getCollections } = require('../../utils/collections');
      const collections = getCollections();

      // 过滤掉当前收藏夹（不能移动到自身）
      const targetCollections = collections.filter(c => c.id !== this.data.collectionId);

      if (targetCollections.length === 0) {
        this.showToast('没有其他收藏夹', 'warning', false, '', 2000, 'warning');
        return;
      }

      // 构建操作表选项
      const itemList = targetCollections.map(c => c.name);
      const action = await wx.showActionSheet({
        itemList,
        itemColor: '#111111'
      });

      const targetCollection = targetCollections[action.tapIndex];
      if (!targetCollection) return;

      // 执行移动：先添加到目标收藏夹，再从当前收藏夹移除
      const { addRecipeToCollection, removeRecipeFromCollection } = require('../../utils/collections');

      addRecipeToCollection(targetCollection.id, recipeId);
      removeRecipeFromCollection(this.data.collectionId, recipeId);

      this.showToast(
        `已移动到"${targetCollection.name}"`,
        'success',
        false,
        '',
        2000,
        'success'
      );

      this.loadCollectionInfo();
      this.loadRecipes();

      const { markCollectionsDirty } = require('../../utils/collections');
      const { syncDebounced } = require('../../utils/dataSync');
      markCollectionsDirty();
      syncDebounced();
    } catch (e) {
      console.error('[CollectionDetail] 移动收藏失败', e);
      this.showToast('操作失败', 'warning', false, '', 2000, 'warning');
    }
  },

  // 显示轻量级提示
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
      setTimeout(() => {
        this.hideToast();
      }, duration);
    }
  },

  // 隐藏轻量级提示
  hideToast() {
    this.setData({ toastShow: false });
  },

  // 点击提示按钮
  onToastButtonTap() {
    this.hideToast();
  },

  // 下拉更多操作
  onAddMore() {
    wx.switchTab({
      url: '/pages/index/index'
    });
  },

  onRename() {
    // 已合并到更多菜单的编辑
  },

  onChangeCover() {
    // 已合并到编辑弹窗
  }
});
