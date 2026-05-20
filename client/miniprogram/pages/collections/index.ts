import { collectionService } from '../../utils/services/collectionService.js';
import { authService } from '../../utils/services/authService.js';

Page({
  data: {
    collections: [] as Array<{
      id: string;
      name: string;
      coverImage: string;
      description: string;
      itemCount: number;
      isDefault: boolean;
      recipes?: Array<{ coverImage: string }>;
    }>,
    isEmpty: false,
    loading: false,
    error: false
  },

  onLoad() {
    this.loadCollections();
  },

  onShow() {
    const tab = typeof this.getTabBar === 'function' && this.getTabBar();
    if (tab) {
      tab.setData({ selected: 2 });
    }
    this.loadCollections();
  },

  async loadCollections() {
    this.setData({ loading: true });

    if (!authService.isLoggedIn()) {
      this.setData({ collections: [], isEmpty: true, loading: false, error: false });
      return;
    }

    try {
      const collections = await collectionService?.getCollectionsWithCache?.() ?? [];
      const mapped = collections.map((item: any) => ({
        id: String(item.id),
        name: item.name || item.title || '',
        coverImage: item.coverImage || '',
        description: item.description || '',
        itemCount: item.itemCount || item.recipeCount || 0,
        isDefault: !!item.isDefault,
        recipes: item.recipes || [],
      }));
      this.setData({
        collections: mapped,
        isEmpty: mapped.length === 0,
        loading: false,
        error: false,
      });
    } catch (e) {
      console.error('[Collections] 加载收藏夹列表失败', e);
      this.setData({ loading: false, error: true, isEmpty: true });
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

      const result = await collectionService.createCollectionCached({
        name: res.content.trim(),
        description: '',
        isPublic: false,
      });

      if (result.success) {
        wx.showToast({ title: '创建成功', icon: 'success' });
        this.loadCollections();
      } else {
        wx.showToast({ title: result.message || '创建失败', icon: 'none' });
      }
    } catch (e) {
      console.error('[Collections] 创建收藏夹失败', e);
      wx.showToast({ title: '创建失败', icon: 'none' });
    }
  },

  onItemTap(e: WechatMiniprogram.BaseEvent) {
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

    const isDefaultItem = isDefault;
    const itemList = isDefaultItem
      ? ['编辑信息']
      : ['编辑信息', '删除收藏夹'];

    try {
      const res = await wx.showActionSheet({
        itemList,
        itemColor: '#111111'
      });

      const action = res.tapIndex;

      if (action === 0) {
        // 编辑信息 → 跳转完整编辑页
        wx.navigateTo({
          url: `/pages/collection-edit/index?id=${encodeURIComponent(id)}`
        });
      } else if (action === 1 && !isDefaultItem) {
        // 删除
        await this.deleteCollectionConfirm(id, name);
      }
    } catch (e: any) {
      if (e.errMsg && e.errMsg.includes('cancel')) {
        return;
      }
      console.error('[Collections] 长按菜单失败', e);
    }
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

      const result = await collectionService.deleteCollectionCached(Number(collectionId));

      if (result.success) {
        wx.showToast({ title: '删除成功', icon: 'success' });
        this.loadCollections();
      } else {
        wx.showToast({ title: result.message || '删除失败', icon: 'none' });
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
  },

  onGoExplore() {
    wx.switchTab({ url: '/pages/index/index' });
  }
});
