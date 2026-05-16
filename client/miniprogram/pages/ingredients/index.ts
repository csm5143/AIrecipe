// 食材选择页

import { loadIngredientsAsync } from '../../utils/dataLoader';
import { handleWarning, handleInfo, handleError } from '../../utils/errorHandler';
import { getFallbackIngredients } from '../../utils/fallbackIngredients';

// 常用食材优先级配置（数字越小越靠前）
// 基于中餐高频使用场景：肉类 > 蛋奶 > 基础蔬菜 > 常见主料
const COMMON_INGREDIENT_PRIORITY: Record<string, number> = {
  // ===== 肉类（第1梯队：最常用）=====
  '猪肉': 1,
  '五花肉': 1,
  '里脊肉': 1,
  '鸡胸肉': 2,
  '鸡腿': 2,
  '牛肉': 3,
  '牛腩': 3,
  '排骨': 4,
  '鸡翅': 5,
  '虾仁': 6,

  // ===== 蛋奶（第2梯队）=====
  '鸡蛋': 7,

  // ===== 水产（第3梯队）=====
  '鱼': 8,
  '鲈鱼': 8,
  '三文鱼': 9,

  // ===== 基础蔬菜（第4梯队：每家必有）=====
  '番茄': 10,
  '土豆': 11,
  '胡萝卜': 12,
  '洋葱': 13,
  '大葱': 14,
  '大蒜': 15,
  '姜': 16,

  // ===== 常见蔬菜（第5梯队）=====
  '青椒': 20,
  '红椒': 20,
  '黄瓜': 21,
  '生菜': 22,
  '菠菜': 23,
  '小白菜': 24,
  '白菜': 25,
  '萝卜': 26,
  '白萝卜': 26,
  '西兰花': 27,

  // ===== 菌菇豆制品（第6梯队）=====
  '香菇': 30,
  '金针菇': 31,
  '豆腐': 32,
  '北豆腐': 32,
  '南豆腐': 32,

  // ===== 主食（第7梯队）=====
  '米饭': 40,
  '面条': 41,
  '挂面': 41,
  '面粉': 42,
  '大米': 43,

  // ===== 常见水果（第8梯队）=====
  '苹果': 50,
  '香蕉': 51,

  // ===== 常见调料（底限展示，不优先）=====
  '盐': 100,
  '酱油': 101,
  '食用油': 102,
  '葱': 103,
  '蒜': 104,
  '糖': 106,
  '料酒': 107,
};

// 获取食材优先级（数字越小越靠前，未配置返回99）
const getIngredientPriority = (name: string): number => {
  return COMMON_INGREDIENT_PRIORITY[name] !== undefined ? COMMON_INGREDIENT_PRIORITY[name] : 99;
};

Page({
  data: {
    searchKeyword: '',
    categories: [
      { id: 'all', name: '全部', icon: '../../assets/全部食材.png' },
      { id: 'meat', name: '肉类', icon: '../../assets/西餐.png' },
      { id: 'vegetable', name: '蔬菜', icon: '../../assets/生鲜-蔬菜.png' },
      { id: 'seafood', name: '水产', icon: '../../assets/鱼.png' },
      { id: 'fungus', name: '菌菇', icon: '../../assets/香菇.png' },
      { id: 'soy', name: '豆制品', icon: '../../assets/豆制品.png' },
      { id: 'staple', name: '主食', icon: '../../assets/主食.png' },
      { id: 'egg_dairy', name: '蛋奶', icon: '../../assets/鸡蛋.png' },
      { id: 'seasoning', name: '调料', icon: '../../assets/调料瓶.png' },
      { id: 'fruit', name: '水果', icon: '../../assets/芒果.png' },
      { id: 'nut', name: '坚果', icon: '../../assets/零食_坚果.png' },
      { id: 'medicinal', name: '药食同源', icon: '../../assets/中药.png' },
      { id: 'other', name: '其他', icon: '../../assets/其他 (1).png' }
    ],
    activeCategoryId: 'all',
    activeSubCategoryId: '', // 当前选中的子分类ID
    swiperCurrent: 0, // swiper 当前显示的索引
    // 用于 scroll-view 自动滚动到指定标签
    categoryScrollIntoView: '', // 主分类标签滚动目标
    subCategoryScrollIntoView: '', // 子分类标签滚动目标
    // 动态的 swiper items 列表（根据是否有子分类选中来生成）
    swiperItems: [] as Array<{ id: string; categoryId: string; subCategoryId?: string; type: 'category' | 'subcategory' }>,
    ingredients: [] as Array<{ name: string; category: string; subCategory?: string; selected: boolean; isCommon?: boolean }>,
    filteredIngredients: [] as Array<{ name: string; category: string; subCategory?: string; selected: boolean; isCommon?: boolean }>,
    displayedIngredients: [] as Array<{ name: string; category: string; subCategory?: string; selected: boolean; isCommon?: boolean }>,
    // 每个分类/子分类的食材列表映射（用于 swiper）
    categoryIngredientsMap: {} as Record<string, Array<{ name: string; category: string; subCategory?: string; selected: boolean; isCommon?: boolean }>>,
    // 每个分类的"显示更多"按钮可见性映射
    categoryMoreVisibleMap: {} as Record<string, boolean>,
    // 每个分类的"显示更多"按钮文本映射
    categoryMoreTextMap: {} as Record<string, string>,
    // 每个分类的显示数量映射
    categoryDisplayCountMap: {} as Record<string, number>,
    // 子分类配置（每个主分类对应的子分类）
    subCategories: {} as Record<string, Array<{ id: string; name: string }>>,
    // 当前已选中的食材名称列表，用于底部"已选食材"弹层展示
    selectedIngredients: [] as string[],
    // 已选中的食材数量（用于底部角标）
    selectedCount: 0,
    ingredientsPageSize: 24,
    ingredientsStep: 24,
    ingredientsDisplayCount: 24,
    ingredientsMoreVisible: false,
    ingredientsMoreText: '显示更多',
    // 底部"已选食材"弹层是否展示
    showSelectedPanel: false
  },

  // 占位函数：用于 catchtap / 阻止事件冒泡
  noop() {},

  // swiper 切换事件
  onSwiperChange(e: WechatMiniprogram.SwiperChange) {
    const current = e.detail.current || 0;
    const { swiperItems } = this.data as { swiperItems: Array<{ id: string; categoryId: string; subCategoryId?: string; type: 'category' | 'subcategory' }> };
    const currentItem = swiperItems[current];
    
    if (!currentItem) return;
    
    // 如果切换到的是子分类类型
    if (currentItem.type === 'subcategory') {
      this.setData({
        swiperCurrent: current,
        activeCategoryId: currentItem.categoryId,
        activeSubCategoryId: currentItem.subCategoryId || '',
        // 滚动到对应的主分类和子分类标签
        categoryScrollIntoView: `category-${currentItem.categoryId}`,
        subCategoryScrollIntoView: `subcategory-${currentItem.subCategoryId || ''}`
      });
      // 子分类切换需要重新过滤
      this.applyFilter(false);
    } else {
      // 如果切换到的是主分类类型，重置子分类
      this.setData({
        swiperCurrent: current,
        activeCategoryId: currentItem.categoryId,
        activeSubCategoryId: '',
        // 滚动到对应的主分类标签
        categoryScrollIntoView: `category-${currentItem.categoryId}`,
        subCategoryScrollIntoView: '' // 清空子分类滚动目标
      });
      // 主分类切换需要重新生成 swiper items（因为从子分类模式切换回主分类模式）
      this.updateSwiperItems();
      // 重新过滤数据
      this.applyFilter(false);
    }
  },

  // 滑到底自动"加载更多"（只增不减，避免触发"收起"造成误解）
  onIngredientsScrollToLower(e: WechatMiniprogram.BaseEvent) {
    const itemId = (e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.itemId) ? (e.currentTarget.dataset.itemId as string) : '';
    if (!itemId) return;
    
    const {
      categoryIngredientsMap,
      categoryDisplayCountMap,
      ingredientsPageSize,
      ingredientsStep,
      activeCategoryId,
      activeSubCategoryId
    } = this.data as {
      categoryIngredientsMap: Record<string, Array<{ name: string; category: string; subCategory?: string; selected: boolean }>>;
      categoryDisplayCountMap: Record<string, number>;
      ingredientsPageSize: number;
      ingredientsStep: number;
      activeCategoryId: string;
      activeSubCategoryId: string;
    };

    const mapKey = itemId;
    const filteredIngredients = categoryIngredientsMap[mapKey] || [];
    const total = filteredIngredients.length;
    const pageSize = ingredientsPageSize || 24;
    const step = ingredientsStep || 24;
    const current = categoryDisplayCountMap[mapKey] || pageSize;

    if (current >= total) return;

    const nextCount = Math.min(current + step, total);
    const moreVisible = total > pageSize;
    const hasMore = nextCount < total;
    const moreText = hasMore ? '显示更多' : '收起';

    const updateData: any = {};
    updateData[`categoryDisplayCountMap.${mapKey}`] = nextCount;
    updateData[`categoryIngredientsMap.${mapKey}`] = filteredIngredients.slice(0, nextCount);
    updateData[`categoryMoreVisibleMap.${mapKey}`] = moreVisible;
    updateData[`categoryMoreTextMap.${mapKey}`] = moreVisible ? moreText : '显示更多';

    this.setData(updateData);
  },


  /**
   * 初始化子分类配置
   */
  initSubCategories(): Record<string, Array<{ id: string; name: string }>> {
    return {
      meat: [
        { id: '鸡肉', name: '鸡肉' },
        { id: '猪肉', name: '猪肉' },
        { id: '牛肉', name: '牛肉' },
        { id: '羊肉', name: '羊肉' },
        { id: '鸭鹅', name: '鸭鹅' },
        { id: '加工肉', name: '加工肉' },
        { id: '其他肉类', name: '其他肉类' }
      ],
      vegetable: [
        { id: '叶菜', name: '叶菜' },
        { id: '根茎', name: '根茎' },
        { id: '辣椒', name: '辣椒' },
        { id: '瓜果', name: '瓜果' },
        { id: '豆类', name: '豆类' },
        { id: '其他', name: '其他' }
      ],
      seafood: [
        { id: '鱼类', name: '鱼类' },
        { id: '虾蟹', name: '虾蟹' },
        { id: '贝类', name: '贝类' },
        { id: '其他', name: '其他' }
      ],
      egg_dairy: [
        { id: '蛋类', name: '蛋类' },
        { id: '奶制品', name: '奶制品' }
      ],
      staple: [
        { id: '谷物米类', name: '谷物米类' },
        { id: '面食', name: '面食' },
        { id: '米饭', name: '米饭' },
        { id: '薯芋类', name: '薯芋类' },
        { id: '面包类', name: '面包类' },
        { id: '面粉类', name: '面粉类' },
        { id: '饼类', name: '饼类' },
        { id: '蒸制类', name: '蒸制类' },
        { id: '豆类', name: '豆类' },
        { id: '其他', name: '其他' }
      ],
      fruit: [
        { id: '鲜果', name: '鲜果' },
        { id: '热带', name: '热带' },
        { id: '柑橘', name: '柑橘' },
        { id: '浆果', name: '浆果' },
        { id: '葡萄', name: '葡萄' },
        { id: '瓜类', name: '瓜类' },
        { id: '干果', name: '干果' },
        { id: '其他', name: '其他' }
      ],
      nut: [],
      medicinal: [],
      other: [],
      soy: [],
      fungus: [],
      seasoning: [
        { id: '常用', name: '常用' },
        { id: '酱料', name: '酱料' },
        { id: '香料', name: '香料' },
        { id: '油类', name: '油类' },
        { id: '酸味', name: '酸味' },
        { id: '甜味', name: '甜味' },
        { id: '酒水', name: '酒水' },
        { id: '粉类', name: '粉类' },
        { id: '芝麻', name: '芝麻' },
        { id: '其他', name: '其他' }
      ]
    };
  },

  /**
   * 加载食材数据（异步，从本地文件加载）
   */
  async loadIngredientsData(): Promise<Array<{ name: string; category: string; subCategory?: string; selected: boolean; isCommon?: boolean }>> {
    let ingredients: Array<{ name: string; category: string; subCategory?: string; selected: boolean; isCommon?: boolean }> = [];

    try {
      const jsonData = await loadIngredientsAsync();

      if (jsonData.length) {
        ingredients = (jsonData as Array<Record<string, any>>)
          .map((raw) => {
            // 这里不能使用 ?. / ??，因为微信开发工具编译到 pages/ingredients/index.js 后
            // 运行环境不一定支持，可读性稍差但更兼容
            const safe = raw || {};
            const name =
              (safe.name != null && String(safe.name).trim()) ||
              (safe.title != null && String(safe.title).trim()) ||
              (safe.ingredient != null && String(safe.ingredient).trim()) ||
              '';
            if (!name) return null;
            const categorySource =
              (safe.category != null && String(safe.category).trim()) || 'other';
            const category = categorySource || 'other';
            const subCategory = (safe.subCategory != null && String(safe.subCategory).trim()) || '';
            const selected = !!safe.selected;
            const isCommon = !!safe.isCommon;
            return { name, category, subCategory, selected, isCommon };
          })
          .filter(Boolean) as Array<{ name: string; category: string; subCategory?: string; selected: boolean; isCommon?: boolean }>;

        handleInfo(`已加载食材数据，共 ${ingredients.length} 种`, 'Ingredients');
      }
    } catch (e) {
      handleWarning(e, '加载食材失败，使用默认数据');
    }

    if (!ingredients.length) {
      ingredients = getFallbackIngredients();
    }

    return ingredients;
  },

  async onLoad() {
    const ingredients = await this.loadIngredientsData();
    const subCategories = this.initSubCategories();

    // 尝试从 Storage 恢复展开状态
    let savedDisplayCountMap: Record<string, number> = {};
    try {
      const saved = wx.getStorageSync('ingredientsDisplayCountMap');
      if (saved) {
        savedDisplayCountMap = JSON.parse(saved);
      }
    } catch (e) {}

    this.setData({
      ingredients,
      subCategories,
      categoryDisplayCountMap: savedDisplayCountMap,
      // 初始化滚动位置到"全部"分类
      categoryScrollIntoView: 'category-all'
    });

    // 初始化 swiper items
    this.updateSwiperItems();
    // 使用保存的展开状态（resetLimit = false）
    this.applyFilter(false);
  },

  onUnload() {
    // 页面卸载时保存当前展开状态
    try {
      wx.setStorageSync('ingredientsDisplayCountMap', JSON.stringify(this.data.categoryDisplayCountMap));
    } catch (e) {}
  },

  onSearchInput(e: WechatMiniprogram.Input) {
    const value = e.detail.value || '';
    this.setData({
      searchKeyword: value
    });
    this.applyFilter(true);
  },

  onCategoryTap(e: WechatMiniprogram.BaseEvent) {
    const id = e.currentTarget.dataset.id as string;
    if (!id) return;
    
    this.setData({
      activeCategoryId: id,
      activeSubCategoryId: '', // 切换主分类时重置子分类
      categoryScrollIntoView: `category-${id}`, // 滚动到对应的主分类标签
      subCategoryScrollIntoView: '' // 清空子分类滚动目标
    });
    // 更新 swiper items 并找到对应的索引
    this.updateSwiperItems();
  },

  onSubCategoryTap(e: WechatMiniprogram.BaseEvent) {
    const id = e.currentTarget.dataset.id as string;
    if (!id) return;
    const { activeSubCategoryId, activeCategoryId } = this.data as { activeSubCategoryId: string; activeCategoryId: string };
    // 如果点击的是已选中的子分类，则取消选择
    const newSubCategoryId = activeSubCategoryId === id ? '' : id;
    this.setData({
      activeSubCategoryId: newSubCategoryId,
      // 如果选中了子分类，滚动到对应的子分类标签；如果取消选择，清空滚动目标
      subCategoryScrollIntoView: newSubCategoryId ? `subcategory-${newSubCategoryId}` : ''
    });
    // 更新 swiper items（因为选中子分类后，swiper 应该显示子分类列表）
    this.updateSwiperItems();
    this.applyFilter(true); // 子分类变化需要重新过滤所有分类
  },

  // 更新 swiper items 列表（根据是否有子分类选中来生成）
  updateSwiperItems() {
    const { categories, activeCategoryId, activeSubCategoryId, subCategories } = this.data as {
      categories: Array<{ id: string; name: string }>;
      activeCategoryId: string;
      activeSubCategoryId: string;
      subCategories: Record<string, Array<{ id: string; name: string }>>;
    };

    const swiperItems: Array<{ id: string; categoryId: string; subCategoryId?: string; type: 'category' | 'subcategory' }> = [];

    // 如果有选中的子分类，则生成子分类列表 + 下一个主分类
    if (activeSubCategoryId && activeCategoryId !== 'all' && subCategories[activeCategoryId]) {
      const currentSubCategories = subCategories[activeCategoryId];
      const currentSubIndex = currentSubCategories.findIndex(sub => sub.id === activeSubCategoryId);
      
      // 添加当前主分类的所有子分类
      currentSubCategories.forEach((sub) => {
        swiperItems.push({
          id: `${activeCategoryId}:${sub.id}`,
          categoryId: activeCategoryId,
          subCategoryId: sub.id,
          type: 'subcategory'
        });
      });

      // 找到当前主分类的下一个主分类
      const currentCategoryIndex = categories.findIndex(cat => cat.id === activeCategoryId);
      if (currentCategoryIndex !== -1 && currentCategoryIndex < categories.length - 1) {
        const nextCategory = categories[currentCategoryIndex + 1];
        swiperItems.push({
          id: nextCategory.id,
          categoryId: nextCategory.id,
          type: 'category'
        });
      }
    } else {
      // 没有选中子分类，显示所有主分类
      categories.forEach((category) => {
        swiperItems.push({
          id: category.id,
          categoryId: category.id,
          type: 'category'
        });
      });
    }

    // 找到当前应该显示的 swiper 索引
    let newSwiperCurrent = 0;
    if (activeSubCategoryId && activeCategoryId !== 'all') {
      // 在子分类模式下，找到当前子分类的索引
      const currentSubCategories = subCategories[activeCategoryId];
      if (currentSubCategories) {
        const subIndex = currentSubCategories.findIndex(sub => sub.id === activeSubCategoryId);
        if (subIndex !== -1) {
          newSwiperCurrent = subIndex;
        }
      }
    } else {
      // 在主分类模式下，找到当前主分类的索引
      const categoryIndex = categories.findIndex(cat => cat.id === activeCategoryId);
      if (categoryIndex !== -1) {
        newSwiperCurrent = categoryIndex;
      }
    }

    this.setData({
      swiperItems,
      swiperCurrent: newSwiperCurrent
    });
  },

  applyFilter(resetLimit = false) {
    const { ingredients, searchKeyword, categories, activeSubCategoryId, ingredientsPageSize, categoryDisplayCountMap, swiperItems } = this.data as {
      ingredients: Array<{ name: string; category: string; subCategory?: string; selected: boolean }>;
      searchKeyword: string;
      categories: Array<{ id: string; name: string }>;
      activeSubCategoryId: string;
      ingredientsPageSize: number;
      categoryDisplayCountMap: Record<string, number>;
      swiperItems: Array<{ id: string; categoryId: string; subCategoryId?: string; type: 'category' | 'subcategory' }>;
    };

    const keyword = (searchKeyword || '').trim();
    const pageSize = ingredientsPageSize || 24;
    
    // 为每个分类/子分类计算过滤后的食材列表
    const categoryIngredientsMap: Record<string, Array<{ name: string; category: string; subCategory?: string; selected: boolean }>> = {};
    const categoryMoreVisibleMap: Record<string, boolean> = {};
    const categoryMoreTextMap: Record<string, string> = {};
    const categoryDisplayCountMapNew: Record<string, number> = {};

    // 为 swiper items 中的每一项计算数据
    swiperItems.forEach((item) => {
      const mapKey = item.subCategoryId ? `${item.categoryId}:${item.subCategoryId}` : item.categoryId;
      
      let filtered = ingredients.filter((ingredient) => {
        const matchCategory = item.categoryId === 'all' ? true : ingredient.category === item.categoryId;
        // 如果 swiper item 有子分类ID，只显示该子分类的食材
        // 如果 swiper item 没有子分类ID（主分类类型），显示该主分类下的所有食材
        const matchSubCategory = item.subCategoryId
          ? ingredient.subCategory === item.subCategoryId
          : true; // 主分类类型显示所有子分类的食材
        const matchKeyword = keyword ? ingredient.name.indexOf(keyword) !== -1 : true;
        return matchCategory && matchSubCategory && matchKeyword;
      });

      // 按优先级排序：常用食材排前面，未配置的统一排后面
      filtered.sort((a, b) => {
        const priorityA = getIngredientPriority(a.name);
        const priorityB = getIngredientPriority(b.name);
        return priorityA - priorityB;
      });


      const currentCount = resetLimit ? pageSize : (categoryDisplayCountMap[mapKey] || pageSize);
      const nextCount = Math.min(Math.max(currentCount, pageSize), filtered.length);
      const moreVisible = filtered.length > pageSize;
      const hasMore = nextCount < filtered.length;
      const moreText = hasMore ? '显示更多' : '收起';

      categoryIngredientsMap[mapKey] = filtered.slice(0, nextCount);
      categoryMoreVisibleMap[mapKey] = moreVisible;
      categoryMoreTextMap[mapKey] = moreVisible ? moreText : '显示更多';
      categoryDisplayCountMapNew[mapKey] = nextCount;
    });

    // 计算当前分类的数据（用于兼容旧代码）
    const { activeCategoryId } = this.data as { activeCategoryId: string };
    const currentMapKey = activeSubCategoryId ? `${activeCategoryId}:${activeSubCategoryId}` : activeCategoryId;
    const currentFiltered = categoryIngredientsMap[currentMapKey] || [];

    const selectedItems = ingredients.filter((item) => item.selected);
    const selectedCount = selectedItems.length;
    const selectedIngredients = selectedItems.map((item) => item.name);

    this.setData({
      filteredIngredients: currentFiltered,
      displayedIngredients: currentFiltered,
      categoryIngredientsMap,
      categoryMoreVisibleMap,
      categoryMoreTextMap,
      categoryDisplayCountMap: categoryDisplayCountMapNew,
      selectedCount,
      selectedIngredients
    });
  },

  onToggleIngredient(e: WechatMiniprogram.BaseEvent) {
    const name = e.currentTarget.dataset.name as string;
    if (!name) return;

    const { ingredients } = this.data as {
      ingredients: Array<{ name: string; category: string; subCategory?: string; selected: boolean; isCommon?: boolean }>;
    };

    const updated = ingredients.map((item) =>
      item.name === name ? { ...item, selected: !item.selected } : item
    );

    this.setData({
      ingredients: updated
    });
    this.applyFilter(false);
  },

  onToggleIngredientMore(e: WechatMiniprogram.BaseEvent) {
    const itemId = (e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.itemId) ? (e.currentTarget.dataset.itemId as string) : '';
    if (!itemId) return;
    
    const {
      categoryIngredientsMap,
      categoryDisplayCountMap,
      ingredientsPageSize,
      ingredientsStep,
      activeCategoryId,
      activeSubCategoryId
    } = this.data as {
      categoryIngredientsMap: Record<string, Array<{ name: string; category: string; subCategory?: string; selected: boolean }>>;
      categoryDisplayCountMap: Record<string, number>;
      ingredientsPageSize: number;
      ingredientsStep: number;
      activeCategoryId: string;
      activeSubCategoryId: string;
    };

    const allIngredients = this.data.ingredients as Array<{ name: string; category: string; subCategory?: string; selected: boolean }>;
    const { searchKeyword } = this.data as { searchKeyword: string };
    
    // 解析 itemId 获取 categoryId 和 subCategoryId
    const parts = itemId.split(':');
    const categoryId = parts[0];
    const subCategoryId = parts.length > 1 ? parts[1] : '';
    
    // 重新计算该分类的所有食材（包括未显示的）
    const keyword = (searchKeyword || '').trim();
    const filtered = allIngredients.filter((item) => {
      const matchCategory = categoryId === 'all' ? true : item.category === categoryId;
      const matchSubCategory = subCategoryId 
        ? item.subCategory === subCategoryId 
        : (!activeSubCategoryId || categoryId === 'all' ? true : true);
      const matchKeyword = keyword ? item.name.indexOf(keyword) !== -1 : true;
      return matchCategory && matchSubCategory && matchKeyword;
    });

    const total = filtered.length;
    const pageSize = ingredientsPageSize || 24;
    const step = ingredientsStep || 24;
    let nextCount = categoryDisplayCountMap[itemId] || pageSize;

    if (nextCount < total) {
      nextCount = Math.min(nextCount + step, total);
    } else {
      nextCount = Math.min(pageSize, total);
    }

    const moreVisible = total > pageSize;
    const hasMore = nextCount < total;
    const moreText = hasMore ? '显示更多' : '收起';

    const updateData: any = {};
    updateData[`categoryDisplayCountMap.${itemId}`] = nextCount;
    updateData[`categoryIngredientsMap.${itemId}`] = filtered.slice(0, nextCount);
    updateData[`categoryMoreVisibleMap.${itemId}`] = moreVisible;
    updateData[`categoryMoreTextMap.${itemId}`] = moreVisible ? moreText : '显示更多';

    this.setData(updateData);
  },

  onViewRecipes() {
    const { ingredients } = this.data as {
      ingredients: Array<{ name: string; category: string; subCategory?: string; selected: boolean }>;
    };
    const selected = ingredients.filter((item) => item.selected).map((item) => item.name);

    if (!selected.length) {
      wx.showToast({
        title: '先选几个家里有的食材吧',
        icon: 'none'
      });
      return;
    }

    // 将用户当前勾选的食材写入全局存储，供菜谱详情页区分“已拥有/待补充”
    // 设置会话标记（当前页面栈有效，退出后自动失效）
    const sessionId = 'select_' + Date.now();
    wx.setStorageSync('selectSessionId', sessionId);
    wx.setStorageSync('selectIngredients', selected);

    const query = encodeURIComponent(JSON.stringify(selected));
    wx.navigateTo({
      url: `/pages/recipes/list?ingredients=${query}&sessionId=${sessionId}`
    });
  },

  // 切换底部“已选食材”弹层
  onToggleSelectedPanel() {
    const { selectedCount, showSelectedPanel } = this.data as {
      selectedCount: number;
      showSelectedPanel: boolean;
    };

    if (!selectedCount) return;

    this.setData({
      showSelectedPanel: !showSelectedPanel
    });
  },

  // 关闭底部“已选食材”弹层
  onCloseSelectedPanel() {
    this.setData({
      showSelectedPanel: false
    });
  },

  // 在底部弹层中移除某个已选食材
  onRemoveSelected(e: WechatMiniprogram.BaseEvent) {
    const name = e.currentTarget.dataset.name as string;
    if (!name) return;

    const { ingredients } = this.data as {
      ingredients: Array<{ name: string; category: string; subCategory?: string; selected: boolean }>;
    };

    const updated = ingredients.map((item) =>
      item.name === name ? { ...item, selected: false } : item
    );

    this.setData({
      ingredients: updated
    });
    this.applyFilter(false);
  }
});

