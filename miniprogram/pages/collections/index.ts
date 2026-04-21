Page({
  data: {
    collections: [] as Array<{
      id: string;
      name: string;
      coverImage: string;
      description: string;
      recipeCount: number;
      isDefault: boolean;
    }>,
    showEmpty: false,
    isLoading: false
  },

  onLoad() {
    // 初始化确保有默认收藏夹
    this.initDefaultCollection();
    this.loadCollections();
  },

  onShow() {
    const tab = typeof this.getTabBar === 'function' && this.getTabBar();
    if (tab) {
      tab.setData({ selected: 2 });
    }
    this.loadCollections();
  },

  // 初始化默认收藏夹
  initDefaultCollection() {
    try {
      const { ensureDefaultCollection } = require('../../utils/collections');
      ensureDefaultCollection();
    } catch (e) {
      console.error('[Collections] 初始化默认收藏夹失败', e);
    }
  },

  async loadCollections() {
    this.setData({ isLoading: true });

    try {
      const { getCollections } = require('../../utils/collections');
      const collections = getCollections();

      // 按排序权重排序
      collections.sort((a, b) => a.sortOrder - b.sortOrder);

      // 为没有封面的收藏夹自动设置第一个菜品封面
      const { loadRecipesJson } = require('../../utils/dataLoader');
      const recipes = loadRecipesJson();
      const { updateCollection } = require('../../utils/collections');
      const { markCollectionsDirty } = require('../../utils/collections');
      const { syncDebounced } = require('../../utils/dataSync');

      let needSave = false;

      for (const collection of collections) {
        // 如果已有封面，跳过
        if (collection.coverImage && collection.coverImage.trim()) {
          continue;
        }

        // 如果收藏夹为空，跳过
        if (!collection.recipeIds || collection.recipeIds.length === 0) {
          continue;
        }

        // 获取第一个菜品
        const firstRecipeId = String(collection.recipeIds[0]);
        const recipe = recipes.find(r => String(r.id) === firstRecipeId);

        if (recipe && recipe.coverImage) {
          // 更新收藏夹封面
          collection.coverImage = recipe.coverImage;
          updateCollection(collection.id, { coverImage: recipe.coverImage });
          needSave = true;
          console.log('[Collections] 自动设置封面:', collection.name, '→', recipe.coverImage);
        }
      }

      // 如果有更新，触发同步
      if (needSave) {
        markCollectionsDirty();
        syncDebounced();
      }

      this.setData({
        collections,
        showEmpty: collections.length === 0,
        isLoading: false
      });
    } catch (e) {
      console.error('[Collections] 加载收藏夹列表失败', e);
      this.setData({ isLoading: false });
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  async onAddCollection() {
    try {
      const res = await wx.showModal({
        title: '新建收藏夹',
        content: '',
        editable: true,
        placeholderText: '请输入收藏夹名称'
      });

      if (!res.confirm || !res.content || !res.content.trim()) {
        return;
      }

      const { createCollection, ensureDefaultCollection } = require('../../utils/collections');

      // 确保有默认收藏夹
      ensureDefaultCollection();

      const newCollection = createCollection({
        name: res.content.trim(),
        description: '',
        isDefault: false
      });

      if (newCollection) {
        wx.showToast({ title: '创建成功', icon: 'success' });
        this.loadCollections();

        // 触发云端同步
        const { markCollectionsDirty } = require('../../utils/collections');
        const { syncDebounced } = require('../../utils/dataSync');
        markCollectionsDirty();
        syncDebounced();
      }
    } catch (e) {
      console.error('[Collections] 创建收藏夹失败', e);
      wx.showToast({ title: '创建失败', icon: 'none' });
    }
  },

  onCollectionTap(e: WechatMiniprogram.BaseEvent) {
    const id = e.currentTarget.dataset.id as string;
    if (!id) return;

    wx.navigateTo({
      url: `/pages/collection-detail/index?id=${encodeURIComponent(id)}`
    });
  },

  async onCollectionLongPress(e: WechatMiniprogram.BaseEvent) {
    const id = e.currentTarget.dataset.id as string;
    const name = e.currentTarget.dataset.name as string;
    const isDefault = e.currentTarget.dataset.isdefault === 'true';

    if (isDefault) {
      wx.showToast({ title: '默认收藏夹不能删除', icon: 'none' });
      return;
    }

    try {
      const res = await wx.showActionSheet({
        itemList: ['重命名', '更换封面', '删除收藏夹'],
        itemColor: '#111111'
      });

      const action = res.tapIndex;

      switch (action) {
        case 0: // 重命名
          await this.renameCollection(id, name);
          break;
        case 1: // 更换封面 - 从相册选择
          await this.changeCollectionCover(id);
          break;
        case 2: // 删除
          await this.deleteCollectionConfirm(id, name);
          break;
      }
    } catch (e: any) {
      if (e.errMsg && e.errMsg.includes('cancel')) {
        return;
      }
      console.error('[Collections] 长按菜单失败', e);
    }
  },

  async renameCollection(collectionId: string, currentName: string) {
    try {
      const res = await wx.showModal({
        title: '重命名收藏夹',
        content: '请输入新的名称',
        editable: true,
        placeholderText: currentName
      });

      if (!res.confirm || !res.content || !res.content.trim()) {
        return;
      }

      const { updateCollection } = require('../../utils/collections');
      const success = updateCollection(collectionId, {
        name: res.content.trim()
      });

      if (success) {
        wx.showToast({ title: '重命名成功', icon: 'success' });
        this.loadCollections();

        const { markCollectionsDirty } = require('../../utils/collections');
        const { syncDebounced } = require('../../utils/dataSync');
        markCollectionsDirty();
        syncDebounced();
      }
    } catch (e) {
      console.error('[Collections] 重命名失败', e);
      wx.showToast({ title: '重命名失败', icon: 'none' });
    }
  },

  /**
   * 【核心功能】更换收藏夹封面 - 从相册选择照片
   */
  async changeCollectionCover(collectionId: string) {
    try {
      // 获取收藏夹信息（使用本地存储直接读取，避免 require）
      const collections = this.getLocalCollections();
      const collection = collections.find(c => c.id === collectionId);

      if (!collection) {
        wx.showToast({ title: '收藏夹不存在', icon: 'none' });
        return;
      }

      // 1. 选择图片（支持相册和拍照）
      const mediaRes = await wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        sizeType: ['compressed']
      });

      if (!mediaRes.tempFiles || mediaRes.tempFiles.length === 0) {
        return; // 用户取消
      }

      const tempFilePath = mediaRes.tempFiles[0].tempFilePath;

      wx.showLoading({
        title: '处理中...',
        mask: true
      });

      try {
        // 2. 保存封面到本地持久化存储
        const savedPath = await this.saveCoverImage(tempFilePath, collectionId);

        // 3. 更新收藏夹封面（直接操作本地存储）
        const success = this.updateCollectionCover(collectionId, savedPath);

        if (success) {
          wx.showToast({ title: '封面更新成功', icon: 'success' });
          this.loadCollections();
          this.markDirtyAndSync();
        } else {
          wx.showToast({ title: '更新失败', icon: 'none' });
        }
      } finally {
        wx.hideLoading();
      }

    } catch (e: any) {
      console.error('[Collections] 更换封面失败', e);
      if (e.errMsg && e.errMsg.includes('cancel')) {
        return;
      }
      // 权限问题处理
      if (e.errMsg && (e.errMsg.includes('auth deny') || e.errMsg.includes('authorize'))) {
        wx.showModal({
          title: '需要相册权限',
          content: '请在设置中开启相册权限，以便选择封面图片',
          confirmText: '去设置',
          success: (res) => {
            if (res.confirm) {
              wx.openSetting();
            }
          }
        });
      } else {
        wx.showToast({
          title: '更换封面失败',
          icon: 'none'
        });
      }
    }
  },

  /**
   * 保存封面图片到本地持久化目录
   */
  saveCoverImage(tempFilePath: string, collectionId: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const fs = wx.getFileSystemManager();
      const localDir = `${wx.env.USER_DATA_PATH}/collection-covers`;
      const localPath = `${localDir}/${collectionId}.jpg`;

      try {
        // 确保目录存在
        try {
          fs.accessSync(localDir);
        } catch (_e) {
          fs.mkdirSync(localDir, true);
        }

        // 如果已存在旧封面，先删除
        try {
          fs.accessSync(localPath);
          fs.unlinkSync(localPath);
        } catch (_e) {}

        // 复制文件到本地持久化目录
        fs.copyFileSync(tempFilePath, localPath);
        console.log('[Collections] 封面保存成功:', localPath);
        resolve(localPath);
      } catch (e) {
        console.error('[Collections] 保存封面失败:', e);
        // 降级：使用临时路径
        console.warn('[Collections] 降级使用临时路径:', tempFilePath);
        resolve(tempFilePath);
      }
    });
  },

  /**
   * 更新收藏夹封面（直接操作本地存储）
   */
  updateCollectionCover(collectionId: string, coverImage: string): boolean {
    try {
      const STORAGE_KEY = 'user_collections_v2';
      const raw = wx.getStorageSync(STORAGE_KEY);
      if (!raw) return false;

      const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
      const index = data.collections.findIndex((c: any) => c.id === collectionId);

      if (index === -1) return false;

      data.collections[index].coverImage = coverImage;
      data.collections[index].updatedAt = Date.now();
      data.collections[index].synced = false;

      wx.setStorageSync(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('[Collections] 更新封面失败:', e);
      return false;
    }
  },

  /**
   * 标记需要同步并触发同步
   */
  markDirtyAndSync() {
    try {
      const { syncDebounced } = require('../../utils/dataSync');
      syncDebounced();
    } catch (e) {
      console.warn('[Collections] 同步触发失败', e);
    }
  },

  /**
   * 从本地存储读取收藏夹列表（辅助方法）
   */
  getLocalCollections(): any[] {
    try {
      const STORAGE_KEY = 'user_collections_v2';
      const raw = wx.getStorageSync(STORAGE_KEY);
      if (raw) {
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        return parsed.collections || [];
      }
    } catch (e) {
      console.error('[Collections] 读取本地收藏夹失败', e);
    }
    return [];
  },

  async deleteCollectionConfirm(collectionId: string, name: string) {
    try {
      const res = await wx.showModal({
        title: '删除收藏夹',
        content: `确定要删除"${name}"吗？删除后该收藏夹中的菜品收藏记录将被移除。`,
        confirmText: '删除',
        confirmColor: '#ff3b30'
      });

      if (!res.confirm) return;

      const { deleteCollection } = require('../../utils/collections');
      const success = deleteCollection(collectionId);

      if (success) {
        wx.showToast({ title: '删除成功', icon: 'success' });
        this.loadCollections();

        const { markCollectionsDirty } = require('../../utils/collections');
        const { syncDebounced } = require('../../utils/dataSync');
        markCollectionsDirty();
        syncDebounced();
      }
    } catch (e) {
      console.error('[Collections] 删除收藏夹失败', e);
      wx.showToast({ title: '删除失败', icon: 'none' });
    }
  },

  onShareAppMessage() {
    return {
      title: '我的收藏夹 - AIrecipe',
      path: '/pages/collections/index'
    };
  }
});
