// 收藏夹编辑页 - 编辑名称、封面、简介
import { collectionService } from '../../utils/services/collectionService.js';
import { authService } from '../../utils/services/authService.js';
import { upload } from '../../utils/httpApi/request.js';

function isLocalTempPath(path: string): boolean {
  if (!path) return false;
  if (/^(wxfile|file|blob):\/\//.test(path)) return true;
  if (/^https?:\/\/tmp\//.test(path)) return true;
  if (/^https?:\/\//.test(path)) return false;
  return !path.startsWith('/');
}

Page({
  data: {
    collectionId: '',
    collection: null as any,
    nameValue: '',
    descValue: '',
    coverImage: '',
    nameLength: 0,
    descLength: 0,
    recipeCount: 0,
    createdDate: '',
    hasChanges: false,
    isDefault: false,
    saving: false,
  },

  onLoad(options: { id?: string }) {
    const collectionId = options.id || '';
    if (!collectionId) {
      wx.showToast({ title: '参数错误', icon: 'none' });
      wx.navigateBack();
      return;
    }
    this.setData({ collectionId });
    this.loadCollection();
  },

  async loadCollection() {
    if (!authService.isLoggedIn()) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      wx.navigateBack();
      return;
    }

    try {
      const detail = await collectionService.getCollectionDetailCached(Number(this.data.collectionId));
      if (!detail) {
        wx.showToast({ title: '收藏夹不存在', icon: 'none' });
        wx.navigateBack();
        return;
      }

      const col = detail as any;
      const name = col.name || '';
      const desc = col.description || '';
      const cover = col.coverImage || '';
      const createdDate = col.createdAt
        ? new Date(col.createdAt).toLocaleDateString('zh-CN')
        : '';

      this.setData({
        collection: col,
        nameValue: name,
        descValue: desc,
        coverImage: cover,
        nameLength: name.length,
        descLength: desc.length,
        recipeCount: col.itemCount || col.recipes?.length || 0,
        createdDate,
        isDefault: !!col.isDefault,
      });

      wx.setNavigationBarTitle({ title: name || '编辑收藏夹' });
    } catch (e) {
      console.error('[CollectionEdit] 加载收藏夹失败', e);
      wx.showToast({ title: '加载失败', icon: 'none' });
      wx.navigateBack();
    }
  },

  onNameInput(e: any) {
    const name = e.detail.value || '';
    this.setData({
      nameValue: name,
      nameLength: name.length,
      hasChanges: true,
    });
  },

  onDescInput(e: any) {
    const desc = e.detail.value || '';
    this.setData({
      descValue: desc,
      descLength: desc.length,
      hasChanges: true,
    });
  },

  onChangeCover() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempPath = res.tempFilePaths[0];
        if (tempPath) {
          this.setData({ coverImage: tempPath, hasChanges: true });
          wx.showToast({ title: '封面已选择，请保存', icon: 'none' });
        }
      },
    });
  },

  async onSave() {
    const { collectionId, nameValue, descValue, coverImage } = this.data;

    if (!nameValue.trim()) {
      wx.showToast({ title: '请输入收藏夹名称', icon: 'none' });
      return;
    }

    this.setData({ saving: true });

    try {
      let finalCoverImage = coverImage;
      if (isLocalTempPath(coverImage)) {
        const uploadRes = await upload('/v1/upload/collection-cover', coverImage, 'file');
        if (!uploadRes.success || !uploadRes.data?.url) {
          throw new Error(uploadRes.message || '封面上传失败');
        }
        finalCoverImage = uploadRes.data.url;
      }

      const params: any = {
        name: nameValue.trim(),
        description: descValue.trim(),
      };
      if (finalCoverImage) params.coverImage = finalCoverImage;

      const result = await collectionService.updateCollectionCached(Number(collectionId), params);

      if (result.success) {
        wx.showToast({ title: '保存成功', icon: 'success' });
        setTimeout(() => wx.navigateBack(), 1000);
      } else {
        wx.showToast({ title: (result as any).message || '保存失败', icon: 'none' });
      }
    } catch (e) {
      console.error('[CollectionEdit] 保存失败', e);
      wx.showToast({ title: '保存失败', icon: 'none' });
    } finally {
      this.setData({ saving: false });
    }
  },

  async onDelete() {
    const { collectionId, isDefault, nameValue, recipeCount } = this.data;

    if (isDefault) {
      wx.showToast({ title: '默认收藏夹不可删除', icon: 'none' });
      return;
    }

    const res = await wx.showModal({
      title: '删除收藏夹',
      content: `确定要删除"${nameValue}"吗？${recipeCount > 0 ? `（含 ${recipeCount} 道菜）` : ''}`,
      confirmText: '删除',
      confirmColor: '#ff3b30',
      cancelText: '取消',
    });

    if (!res.confirm) return;

    try {
      const result = await collectionService.deleteCollectionCached(Number(collectionId));
      if (result.success) {
        wx.showToast({ title: '已删除', icon: 'success' });
        setTimeout(() => wx.navigateBack(), 1000);
      } else {
        wx.showToast({ title: (result as any).message || '删除失败，请先清空收藏夹', icon: 'none' });
      }
    } catch (e) {
      console.error('[CollectionEdit] 删除失败', e);
      wx.showToast({ title: '删除失败', icon: 'none' });
    }
  },
});
