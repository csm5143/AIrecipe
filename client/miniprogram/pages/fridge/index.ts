/**
 * 小冰箱页面
 *
 * 功能：
 * 1. 展示冰箱中的食材列表（从后端 /v1/app/fridge 加载）
 * 2. 拍照添加食材（AI 识别后加入冰箱）
 * 3. 手动添加食材
 * 4. 编辑/删除食材
 */

import {
  getFridgeItemsWithCache,
  addToFridgeCached,
  addBatchCached,
  removeFromFridge,
  updateFridgeItem,
  clearAllCached,
  type FridgeItem
} from '../../utils/services/fridgeService';
import { recognizeImage, type IngredientRecognitionResult } from '../../utils/ingredientRecognize';
import { getAppIngredientsList } from '../../utils/httpApi/ingredient';

// ============ 食材建议 API ============

interface IngredientSuggestion {
  id: number;
  name: string;
  alias: string;
  subCategory: string;
  category: string;
  unit: string;
}

let cachedIngredients: IngredientSuggestion[] = [];
let ingredientCacheTime = 0;
const INGREDIENT_CACHE_TTL = 5 * 60 * 1000; // 5分钟

async function fetchIngredientSuggestions(keyword?: string): Promise<IngredientSuggestion[]> {
  const now = Date.now();
  if (keyword && cachedIngredients.length > 0 && now - ingredientCacheTime < INGREDIENT_CACHE_TTL) {
    return cachedIngredients.filter(i =>
      !keyword || i.name.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  try {
    const res = await getAppIngredientsList({ pageSize: 1000, keyword });
    if (res.success && res.data && res.data.length > 0) {
      if (!keyword) {
        cachedIngredients = res.data.map(i => ({
          id: i.id,
          name: i.name,
          alias: i.alias || '',
          subCategory: i.subCategory || '',
          category: i.category || 'other',
          unit: i.unit || '',
        }));
        ingredientCacheTime = now;
      }
      return cachedIngredients.filter(i =>
        !keyword || i.name.toLowerCase().includes(keyword.toLowerCase())
      );
    }
  } catch (e) {
    console.warn('[Fridge] 获取食材建议失败', e);
  }

  return [];
}

Page({
  data: {
    // 食材列表
    items: [] as FridgeItem[],
    displayedItems: [] as FridgeItem[],
    itemCount: 0,

    // 分类统计
    categories: [
      { id: 'vegetable', name: '蔬菜', icon: '🥬', count: 0 },
      { id: 'meat', name: '肉类', icon: '🥩', count: 0 },
      { id: 'egg_dairy', name: '蛋奶', icon: '🥚', count: 0 },
      { id: 'seafood', name: '水产', icon: '🦐', count: 0 },
      { id: 'fungus', name: '菌菇', icon: '🍄', count: 0 },
      { id: 'soy', name: '豆制品', icon: '🫘', count: 0 },
      { id: 'other', name: '其他', icon: '🫙', count: 0 },
    ],

    // 搜索
    searchKeyword: '',

    // 添加面板
    showAddPanel: false,
    addMode: 'manual' as 'manual' | 'photo',
    addInputValue: '',
    addSuggestions: [] as string[],

    // 拍照识别
    imageUrls: [] as string[],
    recognizing: false,
    recognizedIngredients: [] as IngredientRecognitionResult[],
    selectedIngredients: [] as string[],

    // 编辑食材
    showEditPanel: false,
    editingItem: null as FridgeItem | null,
    editQuantity: 1,
    editUnit: '个',
    unitOptions: ['个', '克', '斤', '两', 'kg', 'ml'],

    // Toast
    toastShow: false,
    toastMessage: '',
    toastType: 'info' as 'info' | 'success' | 'warning',

    // 空状态
    isEmpty: true,

    // 剩余拍照次数
    remainingCount: 3,

    // 加载状态
    loading: false,
  },

  onLoad() {
    // 无需登录，直接可用
  },

  onShow() {
    this.refresh();
    this.updateRemainingCount();
  },

  onReady() {
    wx.setNavigationBarTitle({ title: '小冰箱' });
  },

  // ==================== 数据刷新 ====================

  async refresh() {
    this.setData({ loading: true });
    try {
      const items = await getFridgeItemsWithCache();
      const categoryCount = this.countByCategory(items);
      this.setData({
        items,
        displayedItems: items,
        itemCount: items.length,
        categories: this.data.categories.map(cat => ({
          ...cat,
          count: categoryCount[cat.id] || 0
        })),
        isEmpty: items.length === 0,
        searchKeyword: '',
      });
    } catch (e) {
      console.error('[Fridge] 刷新失败', e);
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  countByCategory(items: FridgeItem[]): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const item of items) {
      const cat = item.category || 'other';
      counts[cat] = (counts[cat] || 0) + 1;
    }
    return counts;
  },

  // ==================== 搜索 ====================

  onSearchInput(e: any) {
    const keyword = e.detail.value || '';
    this.setData({ searchKeyword: keyword });
    this.updateDisplayedItems();
  },

  updateDisplayedItems() {
    const { items, searchKeyword } = this.data;
    if (!searchKeyword.trim()) {
      this.setData({ displayedItems: items });
      return;
    }

    const keyword = searchKeyword.toLowerCase();
    const filtered = items.filter(item =>
      item.name.toLowerCase().includes(keyword)
    );
    this.setData({ displayedItems: filtered });
  },

  // ==================== 添加食材 ====================

  onOpenAddPanel() {
    this.setData({
      showAddPanel: true,
      addMode: 'manual',
      addInputValue: '',
      addSuggestions: [],
      imageUrls: [],
      recognizedIngredients: [],
      selectedIngredients: [],
    });
  },

  onCloseAddPanel() {
    this.setData({
      showAddPanel: false,
      addMode: 'manual',
      addInputValue: '',
      addSuggestions: [],
      imageUrls: [],
      recognizedIngredients: [],
      selectedIngredients: [],
    });
  },

  // 切换添加模式
  onSwitchAddMode(e: any) {
    const mode = e.currentTarget.dataset.mode as 'manual' | 'photo';
    this.setData({ addMode: mode });
  },

  // 手动添加 - 输入
  async onAddInput(e: any) {
    const input = (e.detail.value || '').trim();
    this.setData({ addInputValue: input });

    if (!input) {
      this.setData({ addSuggestions: [] });
      return;
    }

    // 从 API 获取食材建议（带缓存）
    const allIngredients = await fetchIngredientSuggestions(input);
    const matched = allIngredients
      .map((item: any) => item.name)
      .filter((name: string, idx: number, arr: string[]) =>
        name.toLowerCase().includes(input.toLowerCase()) && arr.indexOf(name) === idx
      )
      .slice(0, 8);

    this.setData({ addSuggestions: matched });
  },

  // 手动添加 - 选择建议
  onSelectSuggestion(e: any) {
    const name = e.currentTarget.dataset.name as string;
    this.setData({ addInputValue: name, addSuggestions: [] });
  },

  // 手动添加 - 确认
  async onConfirmAdd() {
    const input = this.data.addInputValue.trim();
    if (!input) return;

    this.setData({ loading: true });
    try {
      // 尝试匹配食材库
      const matchedName = await this.findBestMatch(input);
      if (!matchedName) {
        wx.showToast({ title: '未找到该食材', icon: 'none' });
        return;
      }

      // 获取分类
      const category = this.getIngredientCategory(matchedName);
      const unit = this.getSmartUnit(matchedName, category);

      const result = await addToFridgeCached({
        name: matchedName,
        amount: String(1),
        unit,
        category,
      });
      if (result.success) {
        await this.refresh();
        this.onCloseAddPanel();
        wx.showToast({ title: `已添加「${matchedName}」`, icon: 'success' });
      }
    } finally {
      this.setData({ loading: false });
    }
  },

  // 根据食材类型智能推荐单位
  getSmartUnit(name: string, category: string): string {
    if (category === 'meat' || category === 'seafood') return '克';
    if (category === 'vegetable' || category === 'fruit') return '个';
    if (category === 'egg_dairy') return '个';
    if (category === 'soy') return '块';
    return '个';
  },

  // 查找最佳匹配
  async findBestMatch(input: string): Promise<string | null> {
    const allIngredients = await fetchIngredientSuggestions();
    const inputLower = input.toLowerCase();

    // 精确匹配
    for (const item of allIngredients) {
      if (item.name.toLowerCase() === inputLower) return item.name;
    }

    // 包含匹配
    for (const item of allIngredients) {
      if (item.name.toLowerCase().includes(inputLower)) return item.name;
    }

    // 反向包含
    for (const item of allIngredients) {
      if (inputLower.includes(item.name.toLowerCase())) return item.name;
    }

    return input; // 返回原输入
  },

  // 获取食材分类
  async getIngredientCategory(name: string): Promise<string> {
    const categoryMap: Record<string, string> = {
      '鸡蛋': 'egg_dairy', '鸭蛋': 'egg_dairy', '鹌鹑蛋': 'egg_dairy', '皮蛋': 'egg_dairy',
      '牛奶': 'egg_dairy', '酸奶': 'egg_dairy',
      '猪肉': 'meat', '牛肉': 'meat', '羊肉': 'meat', '鸡肉': 'meat', '鸭肉': 'meat',
      '鸡翅': 'meat', '鸡腿': 'meat', '五花肉': 'meat', '里脊肉': 'meat', '排骨': 'meat', '猪蹄': 'meat',
      '虾': 'seafood', '鱼': 'seafood', '螃蟹': 'seafood', '虾仁': 'seafood',
      '番茄': 'vegetable', '西红柿': 'vegetable', '土豆': 'vegetable', '胡萝卜': 'vegetable',
      '黄瓜': 'vegetable', '青菜': 'vegetable', '白菜': 'vegetable', '菠菜': 'vegetable',
      '油菜': 'vegetable', '芹菜': 'vegetable', '洋葱': 'vegetable', '大蒜': 'vegetable',
      '姜': 'vegetable', '葱': 'vegetable', '韭菜': 'vegetable', '青椒': 'vegetable', '辣椒': 'vegetable',
      '豆腐': 'soy', '豆浆': 'soy', '豆皮': 'soy', '腐竹': 'soy', '千张': 'soy',
    };

    if (categoryMap[name]) return categoryMap[name];

    // 从 API 数据中查找
    const allIngredients = await fetchIngredientSuggestions();
    const found = allIngredients.find((item: any) => item.name === name);
    if (found && found.category) return found.category;

    return 'other';
  },

  // ==================== 拍照添加 ====================

  updateRemainingCount() {
    const count = getDisplayRemainingCount();
    this.setData({ remainingCount: count });
  },

  onTakePhoto() {
    const { canUse } = checkScanAccess();
    if (!canUse) {
      wx.showModal({
        title: '提示',
        content: '今日次数已用尽，请明天再来~',
        showCancel: false,
        confirmText: '我知道了'
      });
      return;
    }

    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['camera'],
      camera: 'back',
      sizeType: ['compressed'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        this.setData({ imageUrls: [tempFilePath], recognizing: true });
        this.recognizeImage(tempFilePath);
      },
      fail: (err) => {
        if (err.errMsg.indexOf('cancel') === -1) {
          wx.showToast({ title: '拍照失败', icon: 'none' });
        }
      }
    });
  },

  onChooseImage() {
    const { canUse } = checkScanAccess();
    if (!canUse) {
      wx.showModal({
        title: '提示',
        content: '今日次数已用尽，请明天再来~',
        showCancel: false,
        confirmText: '我知道了'
      });
      return;
    }

    wx.chooseMedia({
      count: 9,
      mediaType: ['image'],
      sourceType: ['album'],
      success: (res) => {
        const tempFilePaths = res.tempFiles.map(f => f.tempFilePath);
        if (tempFilePaths.length === 0) return;

        this.setData({
          imageUrls: tempFilePaths,
          recognizing: true,
        });

        Promise.all(
          tempFilePaths.map(path => recognizeImage(path).catch(() => []))
        ).then(results => {
          const allIngredients: IngredientRecognitionResult[] = [];
          const selectedNames: string[] = [];

          for (const result of results) {
            for (const item of result) {
              if (item.confidence >= 0.3) {
                const normalized = this.normalizeIngredientName(item.name);
                if (normalized && !allIngredients.some(r => r.name === normalized)) {
                  allIngredients.push({ ...item, name: normalized });
                  selectedNames.push(normalized);
                }
              }
            }
          }

          this.setData({
            recognizing: false,
            recognizedIngredients: allIngredients,
            selectedIngredients: selectedNames,
          });

          if (allIngredients.length === 0) {
            wx.showToast({ title: '未识别到食材', icon: 'none' });
          } else {
            wx.showToast({ title: `识别到 ${allIngredients.length} 种食材`, icon: 'none' });
          }
        });
      },
      fail: (err) => {
        if (err.errMsg.indexOf('cancel') === -1) {
          wx.showToast({ title: '选择图片失败', icon: 'none' });
        }
      }
    });
  },

  async recognizeImage(imagePath: string) {
    try {
      const results = await recognizeImage(imagePath);
      const allIngredients: IngredientRecognitionResult[] = [];
      const selectedNames: string[] = [];

      for (const item of results) {
        if (item.confidence >= 0.3) {
          const normalized = this.normalizeIngredientName(item.name);
          if (normalized && !allIngredients.some(r => r.name === normalized)) {
            allIngredients.push({ ...item, name: normalized });
            selectedNames.push(normalized);
          }
        }
      }

      this.setData({
        recognizing: false,
        recognizedIngredients: allIngredients,
        selectedIngredients: selectedNames,
      });

      if (allIngredients.length === 0) {
        wx.showToast({ title: '未识别到食材', icon: 'none' });
      }
    } catch (e) {
      console.error('识别失败', e);
      this.setData({ recognizing: false });
      wx.showToast({ title: '识别失败，请重试', icon: 'none' });
    }
  },

  // 规范化食材名称
  async normalizeIngredientName(name: string): Promise<string | null> {
    const allIngredients = await fetchIngredientSuggestions();
    const normalized = name.trim().toLowerCase();

    // 精确匹配
    for (const item of allIngredients) {
      if (item.name.toLowerCase() === normalized) return item.name;
    }

    // 别名映射
    const aliasMap: Record<string, string> = {
      '西红柿': '番茄', '马铃薯': '土豆', '大蒜': '蒜',
      '小葱': '葱', '大葱': '葱',
    };

    for (const [alias, standard] of Object.entries(aliasMap)) {
      if (normalized.includes(alias.toLowerCase())) return standard;
    }

    // 包含匹配
    for (const item of allIngredients) {
      if (item.name.toLowerCase().includes(normalized) || normalized.includes(item.name.toLowerCase())) {
        return item.name;
      }
    }

    return null;
  },

  // 切换识别食材选中状态
  onToggleRecognized(e: any) {
    const name = e.currentTarget.dataset.name as string;
    const { selectedIngredients } = this.data;
    const idx = selectedIngredients.indexOf(name);

    if (idx > -1) {
      selectedIngredients.splice(idx, 1);
    } else {
      selectedIngredients.push(name);
    }

    this.setData({ selectedIngredients });
  },

  // 确认添加识别到的食材
  async onConfirmRecognized() {
    const { selectedIngredients } = this.data;
    if (selectedIngredients.length === 0) {
      wx.showToast({ title: '请先选择食材', icon: 'none' });
      return;
    }

    this.setData({ loading: true });
    try {
      const ingredients = await Promise.all(
        selectedIngredients.map(async (name) => {
          const category = await this.getIngredientCategory(name);
          return {
            name,
            count: 1,
            unit: '个',
            category,
          };
        })
      );

      await addBatchCached(ingredients.map(i => ({
        name: i.name,
        amount: String(i.count || 1),
        unit: i.unit,
        category: i.category,
      })));
      await this.refresh();
      this.onCloseAddPanel();
      wx.showToast({
        title: `已添加 ${selectedIngredients.length} 种食材`,
        icon: 'success'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  // 重新拍照
  onRetake() {
    this.setData({
      imageUrls: [],
      recognizedIngredients: [],
      selectedIngredients: [],
    });
  },

  // ==================== 编辑/删除 ====================

  onEditItem(e: any) {
    const id = e.currentTarget.dataset.id as string;
    const item = this.data.items.find(i => i.id === id);
    if (!item) return;

    this.setData({
      showEditPanel: true,
      editingItem: item,
      editQuantity: item.count || 1,
      editUnit: item.unit || '个'
    });
  },

  onCloseEditPanel() {
    this.setData({
      showEditPanel: false,
      editingItem: null,
      editQuantity: 1,
      editUnit: '个'
    });
  },

  onQuantityInput(e: any) {
    const quantity = parseInt(e.detail.value) || 1;
    this.setData({ editQuantity: Math.max(1, quantity) });
  },

  onQtyMinus() {
    const { editQuantity, editUnit } = this.data;
    const bulkUnits = ['克', 'g', 'kg', 'ml', 'L', '斤', '两'];
    let newQty = editQuantity;

    if (bulkUnits.includes(editUnit)) {
      if (editUnit === '斤' || editUnit === '两') {
        newQty = Math.max(0.5, editQuantity - 0.5);
      } else {
        newQty = Math.max(50, editQuantity - 50);
      }
    } else {
      newQty = Math.max(1, editQuantity - 1);
    }

    this.setData({ editQuantity: newQty });
  },

  onQtyPlus() {
    const { editQuantity, editUnit } = this.data;
    const bulkUnits = ['克', 'g', 'kg', 'ml', 'L', '斤', '两'];

    if (bulkUnits.includes(editUnit)) {
      if (editUnit === '斤' || editUnit === '两') {
        this.setData({ editQuantity: editQuantity + 0.5 });
      } else {
        this.setData({ editQuantity: editQuantity + 50 });
      }
    } else {
      this.setData({ editQuantity: editQuantity + 1 });
    }
  },

  onSelectUnit(e: any) {
    const unit = e.currentTarget.dataset.unit as string;
    this.setData({ editUnit: unit });
  },

  onUnitChange(e: any) {
    this.setData({ editUnit: e.detail.value });
  },

  async onSaveEdit() {
    const { editingItem, editQuantity, editUnit } = this.data;
    if (!editingItem) return;

    await fridgeService.updateFridgeItem(editingItem.id, {
      count: editQuantity,
      unit: editUnit,
    });

    await this.refresh();
    this.onCloseEditPanel();
    wx.showToast({ title: '已更新', icon: 'success' });
  },

  async onDeleteItem(e: any) {
    const id = e.currentTarget.dataset.id as string;
    const item = this.data.items.find(i => i.id === id);
    if (!item) return;

    wx.showModal({
      title: '删除食材',
      content: `确定要从冰箱移除「${item.name}」吗？`,
      confirmText: '删除',
      confirmColor: '#ff3b30',
      cancelText: '取消',
      success: async (res) => {
        if (res.confirm) {
          await fridgeService.deleteFridgeItemCached(id);
          await this.refresh();
          wx.showToast({ title: '已删除', icon: 'none' });
        }
      }
    });
  },

  // ==================== 一键清空 ====================

  async onClearAll() {
    if (this.data.items.length === 0) {
      wx.showToast({ title: '冰箱已经是空的', icon: 'none' });
      return;
    }

    wx.showModal({
      title: '清空冰箱',
      content: '确定要清空冰箱吗？此操作不可恢复。',
      confirmText: '清空',
      confirmColor: '#ff3b30',
      cancelText: '取消',
      success: async (res) => {
        if (res.confirm) {
          await fridgeService.clearAllCached();
          await this.refresh();
          wx.showToast({ title: '已清空', icon: 'none' });
        }
      }
    });
  },

  // ==================== Toast ====================

  showToast(message: string, type: 'info' | 'success' | 'warning' = 'info') {
    this.setData({
      toastShow: true,
      toastMessage: message,
      toastType: type
    });
    setTimeout(() => {
      this.setData({ toastShow: false });
    }, 2000);
  },
});
