// 收藏夹编辑页
// 编辑收藏夹的名称、封面、简介

import { Collection } from '../../types/index';
import {
  getCollectionById,
  updateCollection,
  deleteCollection,
  getCollections,
  addRecipeToCollection
} from '../../utils/collections';
import { syncCollectionsToCloud } from '../../utils/cloudCollections';

Page({
  data: {
    collectionId: '',
    collection: null as Collection | null,
    nameLength: 0,
    descLength: 0,
    createdDate: '',
    hasChanges: false,
    originalData: null as { name: string; description: string; coverImage: string } | null
  },

  onLoad(options: { id?: string }) {
    const collectionId = options.id || '';
    this.setData({ collectionId });
    this.loadCollection();
  },

  // 加载收藏夹信息
  loadCollection() {
    const { collectionId } = this.data;

    if (!collectionId) {
      wx.showToast({ title: '参数错误', icon: 'none' });
      wx.navigateBack();
      return;
    }

    const collection = getCollectionById(collectionId);

    if (!collection) {
      wx.showToast({ title: '收藏夹不存在', icon: 'none' });
      wx.navigateBack();
      return;
    }

    // 格式化创建日期
    const createdDate = new Date(collection.createdAt);
    const dateStr = `${createdDate.getFullYear()}.${String(createdDate.getMonth() + 1).padStart(2, '0')}.${String(createdDate.getDate()).padStart(2, '0')}`;

    // 记录原始数据用于检测变化
    const originalData = {
      name: collection.name,
      description: collection.description || '',
      coverImage: collection.coverImage || ''
    };

    this.setData({
      collection,
      nameLength: (collection.name || '').length,
      descLength: (collection.description || '').length,
      createdDate: dateStr,
      hasChanges: false,
      originalData
    });
  },

  // 名称输入
  onNameInput(e: any) {
    const name = e.detail.value;
    const collection = { ...this.data.collection, name } as Collection;
    this.setData({
      collection,
      nameLength: name.length,
      hasChanges: this.checkHasChanges({ name })
    });
  },

  // 简介输入
  onDescInput(e: any) {
    const description = e.detail.value;
    this.setData({
      collection: { ...this.data.collection, description } as Collection,
      descLength: description.length,
      hasChanges: this.checkHasChanges({ description })
    });
  },

  // 检测是否有变化
  checkHasChanges(partial: { name?: string; description?: string; coverImage?: string }): boolean {
    const original = this.data.originalData;
    if (!original) return false;

    const name = partial.name !== undefined ? partial.name : original.name;
    const description = partial.description !== undefined ? partial.description : original.description;
    const coverImage = partial.coverImage !== undefined ? partial.coverImage : original.coverImage;

    return (
      name !== original.name ||
      description !== original.description ||
      coverImage !== original.coverImage
    );
  },

  // 更换封面
  onChangeCover() {
    wx.showActionSheet({
      itemList: ['从相册选择', '拍照', '使用默认图标'],
      success: (res) => {
        if (res.tapIndex === 0) {
          this.chooseImageFromAlbum();
        } else if (res.tapIndex === 1) {
          this.takePhoto();
        } else {
          this.useDefaultCover();
        }
      }
    });
  },

  // 从相册选择
  chooseImageFromAlbum() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album'],
      success: (res) => {
        const tempFile = res.tempFiles[0];
        if (tempFile) {
          this.uploadCover(tempFile.tempFilePath);
        }
      }
    });
  },

  // 拍照
  takePhoto() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['camera'],
      success: (res) => {
        const tempFile = res.tempFiles[0];
        if (tempFile) {
          this.uploadCover(tempFile.tempFilePath);
        }
      }
    });
  },

  // 上传封面图片
  uploadCover(filePath: string) {
    wx.showLoading({ title: '上传中...' });

    // 使用云开发上传
    if (wx.cloud) {
      wx.cloud.uploadFile({
        cloudPath: `collection-covers/${Date.now()}.jpg`,
        filePath: filePath,
        success: (res) => {
          console.log('[CollectionEdit] 封面上传成功', res.fileID);
          const coverImage = res.fileID;

          this.setData({
            collection: { ...this.data.collection, coverImage } as Collection,
            hasChanges: this.checkHasChanges({ coverImage })
          });

          wx.hideLoading();
          wx.showToast({ title: '上传成功', icon: 'success' });
        },
        fail: (err) => {
          console.error('[CollectionEdit] 封面上传失败', err);
          wx.hideLoading();
          wx.showToast({ title: '上传失败', icon: 'none' });
        }
      });
    } else {
      // 降级处理：使用本地临时路径（仅测试用）
      wx.hideLoading();
      this.setData({
        collection: { ...this.data.collection, coverImage: filePath } as Collection,
        hasChanges: true
      });
      wx.showToast({ title: '封面已更新', icon: 'success' });
    }
  },

  // 使用默认封面
  useDefaultCover() {
    const defaultCover = '/assets/收藏.png';
    this.setData({
      collection: { ...this.data.collection, coverImage: defaultCover } as Collection,
      hasChanges: this.checkHasChanges({ coverImage: defaultCover })
    });
  },

  // 保存修改
  onSave() {
    const { collection } = this.data;

    if (!collection) return;

    // 检查名称
    if (!collection.name || !collection.name.trim()) {
      wx.showToast({ title: '请输入收藏夹名称', icon: 'none' });
      return;
    }

    // 更新收藏夹
    const result = updateCollection(collection.id, {
      name: collection.name.trim(),
      description: collection.description ? collection.description.trim() : '',
      coverImage: collection.coverImage
    });

    if (result) {
      wx.showToast({ title: '保存成功', icon: 'success' });

      // 触发云端同步
      syncCollectionsToCloud();

      // 返回上一页
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    } else {
      wx.showToast({ title: '保存失败', icon: 'none' });
    }
  },

  // 删除收藏夹
  onDeleteCollection() {
    const { collection } = this.data;

    if (!collection || collection.isDefault) {
      wx.showToast({ title: '默认收藏夹不可删除', icon: 'none' });
      return;
    }

    wx.showModal({
      title: '删除收藏夹',
      content: `确定要删除"${collection.name}"吗？${
        collection.recipeCount > 0
          ? `（${collection.recipeCount}道菜将被移至默认收藏夹）`
          : ''
      }`,
      confirmText: '删除',
      confirmColor: '#ff3b30',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          // 获取默认收藏夹
          const collections = getCollections();
          const defaultCol = collections.find(c => c.isDefault);

          let success: boolean;
          if (collection.recipeCount > 0 && defaultCol) {
            // 将该收藏夹中的所有菜谱移动到默认收藏夹
            const recipeIds = collection.recipeIds || [];
            recipeIds.forEach(recipeId => {
              addRecipeToCollection(defaultCol.id, recipeId);
            });
            // 删除收藏夹
            success = deleteCollection(collection.id);
          } else {
            success = deleteCollection(collection.id);
          }

          if (success) {
            wx.showToast({ title: '已删除', icon: 'success' });
            // 触发云端同步
            syncCollectionsToCloud();
            // 返回收藏夹列表页
            setTimeout(() => {
              wx.navigateBack();
            }, 1500);
          } else {
            wx.showToast({ title: '删除失败', icon: 'none' });
          }
        }
      }
    });
  }
});
