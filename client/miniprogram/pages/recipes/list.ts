// 菜谱列表页：根据食材 + 分类筛选展示菜谱
// 注意：不再使用 import 导入 recipes.ts，改为运行时从 recipes.json 加载数据
// 这样可以避免微信小程序模块加载错误

import { Recipe } from '../../types/index';
import { SEASONING_INGREDIENTS } from '../../utils/constants';
import { loadRecipesJson, loadRecipesAsync } from '../../utils/dataLoader';
import { extractCalories, normalizeStepsForDisplay } from '../../utils/recipeUtils';
import { expandUserIngredients, isIngredientOwnedWithChickenExceptions } from '../../utils/ingredientUtils';
import {
  getDifficultyLabel,
  getMealTimeLabelString,
  getPrimaryCategoryLabel,
  getSecondaryCategoryLabels,
  DISH_TYPE_LABELS,
} from '../../utils/labels';
// 旧版收藏接口（保留兼容）
import { getFavorites, isFavorite, toggleFavorite } from '../../utils/favorites';
// 新版收藏夹系统
import {
  getActiveCollection,
  toggleRecipeInCollection,
  isRecipeInCollection,
  getCollections,
  addRecipeToCollection,
  getCollectionRecipeIds,
  isRecipeInAnyCollection
} from '../../utils/collections';
import { handleWarning, handleInfo } from '../../utils/errorHandler';
import { getFallbackRecipes } from '../../utils/fallbackRecipes';
import { saveRecipeSearchHistory } from '../../utils/recipeSearchStorage';
import { matchKeyword } from '../../utils/pinyin';
import { syncDebounced } from '../../utils/dataSync';

// 默认视为「可选增香」的调料：缺少并不会影响是否推荐这道菜，只在详情页做轻提示
// 实际上哪些调料是"关键"会因菜而异，这里先按日常直觉做一层通用弱区分
const LIST_OPTIONAL_SEASONING_INGREDIENTS: readonly string[] = [];

Page({
  data: {
    // 搜索关键词
    searchKeyword: '',
    // 是否从"勾选食材页"携带 ingredients 参数进入（= 允许进入轻量详情页）
    fromIngredientsSelection: false,
    userIngredients: [] as string[],
    // 拍照识别的 sessionId（传递给详情页）
    scanSessionId: '',
    // 是否展开顶部已选食材标签
    showSelectedIngredients: true,
    // 仅统计"有效食材"（去掉纯调料）数量，用于折叠时摘要展示
    effectiveIngredientCount: 0,
    rawRecipes: [] as Recipe[],
    // 经过筛选 + 打分排序后的完整结果（用于"显示更多/收起"）
    allRecipes: [] as Array<
      Recipe & { owned: number; total: number; missing: number; difficultyLabel: string; mealTimeLabel: string; primaryCategoryLabel: string; secondaryCategoryLabels: string[]; matchedMealTimes: string[]; matchedDishTypes: string[]; calories: string | null; isFavorite: boolean; steps: string[] }
    >,
    displayRecipes: [] as Array<
      Recipe & { owned: number; total: number; missing: number; difficultyLabel: string; mealTimeLabel: string; primaryCategoryLabel: string; secondaryCategoryLabels: string[]; matchedMealTimes: string[]; matchedDishTypes: string[]; calories: string | null; isFavorite: boolean; steps: string[] }
    >,
    /** scroll-view 滚动位置 */
    scrollTop: 0,
    recipePageSize: 25,    // 每页25道菜
    recipeStep: 25,        // 每次追加25道
    recipeDisplayCount: 25, // 默认显示25道
    recipesMoreVisible: false,
    recipesMoreText: '显示更多',
    mealTimeOptions: [
      { value: 'breakfast', label: '早餐', selected: false, icon: '/assets/早餐.png', iconUnselected: '/assets/包子.png' },
      { value: 'lunch', label: '午餐', selected: false, icon: '/assets/午餐.png', iconUnselected: '/assets/中午.png' },
      { value: 'dinner', label: '晚餐', selected: false, icon: '/assets/晚餐.png', iconUnselected: '/assets/月亮.png' },
      { value: 'late_night', label: '夜宵', selected: false, icon: '/assets/夜宵.png' }
    ],
    dishTypeOptions: [
      { value: 'main', label: '主食', selected: false, icon: '/assets/通用主食.png' },
      { value: 'stir_fry', label: '小炒菜', selected: false, icon: '/assets/小炒.png' },
      { value: 'soup', label: '汤品', selected: false, icon: '/assets/汤品.png' },
      { value: 'boiled', label: '煮食', selected: false, icon: '/assets/煮食.png' },
      { value: 'stir_fried_staple', label: '炒食', selected: false, icon: '/assets/炒食.png' },
      { value: 'cold', label: '凉菜', selected: false, icon: '/assets/凉菜.png' },
      { value: 'porridge', label: '粥', selected: false, icon: '/assets/粥.png' },
      { value: 'noodles', label: '面食', selected: false, icon: '/assets/面食.png' },
      { value: 'dessert', label: '甜品', selected: false, icon: '/assets/甜品.png' },
      { value: 'drink', label: '饮品', selected: false, icon: '/assets/饮品.png' },
      { value: 'braised', label: '卤味', selected: false, icon: '/assets/卤味.png' },
      { value: 'bbq', label: '烧烤', selected: false, icon: '/assets/烧烤.png' },
      { value: 'hotpot', label: '火锅', selected: false, icon: '/assets/火锅.png' },
      { value: 'fried', label: '油炸', selected: false, icon: '/assets/油炸.png' },
      { value: 'baked', label: '烘焙', selected: false, icon: '/assets/烘焙.png' },
      { value: 'sashimi', label: '刺身', selected: false, icon: '/assets/刺身.png' },
      { value: 'western', label: '西餐', selected: false, icon: '/assets/西餐.png' },
      { value: 'diet', label: '减脂餐', selected: false, icon: '/assets/减脂餐.png' },
      { value: 'children', label: '儿童餐', selected: false, icon: '/assets/儿童餐.png' }
    ],
    // 菜品类型分页（每页 10 个，5×2 网格）
    dishTypePages: [] as Array<Array<{ value: string; label: string; selected: boolean; icon?: string }>>,
    currentDishTypePage: 0,
    dishTypeScrollIntoView: '',
    loading: false,
    // 页面初始加载状态（用于显示全部菜谱时的加载指示）
    pageLoading: true,
    // 趣味彩蛋提示文案（例如：只选了调料的时候）
    seasoningEasterEgg: '',
    // Toast 提示状态
    toastShow: false,
    toastMessage: '',
    toastType: 'info' as 'info' | 'success' | 'warning',
    toastShowButton: false,
    toastButtonText: '去看看',
    toastDuration: 2000,
    toastIcon: '',
    toastSubtitle: ''
  },

  // 滑到底自动"加载更多"（只增不减，避免触发"收起"造成误解）
  onRecipesScrollToLower() {
    const { allRecipes, recipeDisplayCount, recipePageSize } = this.data as {
      allRecipes: Array<
        Recipe & {
          owned: number;
          total: number;
          missing: number;
          difficultyLabel: string;
          mealTimeLabel: string;
          primaryCategoryLabel: string;
          secondaryCategoryLabels: string[];
          matchedMealTimes: string[];
          matchedDishTypes: string[];
          calories: string | null;
          isFavorite: boolean;
          steps: string[];
        }
      >;
      recipeDisplayCount: number;
      recipePageSize: number;
    };

    const total = allRecipes.length;
    const pageSize = recipePageSize || 10;
    const current = recipeDisplayCount || pageSize;

    if (current >= total) return;

    const nextCount = Math.min(current + pageSize, total);
    const moreVisible = total > pageSize;
    const hasMore = nextCount < total;
    const moreText = hasMore ? '显示更多' : '收起';

    this.setData({
      recipeDisplayCount: nextCount,
      displayRecipes: allRecipes.slice(0, nextCount),
      recipesMoreVisible: moreVisible,
      recipesMoreText: moreVisible ? moreText : '显示更多'
    });
  },

  async onLoad(query: Record<string, string>) {
    const hasIngredientsParam = !!(query && query.ingredients);
    if (hasIngredientsParam) {
      this.setData({ fromIngredientsSelection: true });
    }

    // 保存拍照识别的 sessionId（用于传递到详情页）
    if (query.sessionId) {
      this.setData({ scanSessionId: query.sessionId });
    }

    if (query.ingredients) {
      try {
        const decoded = decodeURIComponent(query.ingredients);
        const userIngredients = JSON.parse(decoded) as string[];
        const effectiveIngredientCount = userIngredients.filter(
          (name) => !SEASONING_INGREDIENTS.includes(name)
        ).length;
        // 当已选"有效食材"较多时，默认折叠顶部标签，仅展示一小部分 + 汇总数量
        const AUTO_COLLAPSE_THRESHOLD = 10;
        const shouldCollapse = effectiveIngredientCount >= AUTO_COLLAPSE_THRESHOLD;
        this.setData({
          userIngredients,
          effectiveIngredientCount,
          showSelectedIngredients: !shouldCollapse
        });
      } catch (e) {
        handleWarning(e, '解析食材参数');
      }
    }

    // 加载收藏状态
    this.updateFavoriteStatus();

    // 主菜谱（本地优先）
    let recipes: Recipe[] = [];
    try {
      // 使用本地 JSON 加载菜谱数据
      recipes = await loadRecipesAsync();
      
      if (recipes.length > 0) {
        handleInfo(`已加载菜谱数据，共 ${recipes.length} 道`, 'RecipesList');
      }
    } catch (e: any) {
      handleWarning(e, '加载菜谱失败');
    }

    // 兜底：本地 JSON
    let rawRecipes = recipes;
    if (!rawRecipes.length) {
      rawRecipes = loadRecipesJson();
    }
    if (!rawRecipes.length) {
      handleWarning(null, '菜谱数据加载失败，请检查 /data/recipes.json 文件');
    }
    if (!rawRecipes.length) {
      rawRecipes = getFallbackRecipes();
    }

    let initialSearch = '';
    const qRaw = query.q || query.keyword;
    if (qRaw) {
      try {
        initialSearch = decodeURIComponent(qRaw).trim();
      } catch (e) {
        initialSearch = String(qRaw || '').trim();
      }
    }

    const presetMeal = query.presetMeal;
    const presetDish = query.presetDish;

    let mealTimeOptions = this.data.mealTimeOptions as Array<{ value: string; label: string; selected: boolean; icon?: string; iconUnselected?: string }>;
    if (presetMeal) {
      mealTimeOptions = mealTimeOptions.map((opt) => ({
        ...opt,
        selected: opt.value === presetMeal
      }));
    }

    let dishTypeOptions = this.data.dishTypeOptions as Array<{ value: string; label: string; selected: boolean; icon?: string }>;
    let presetDishPageIndex = 0; // 默认滚动到第一页
    
    if (presetDish) {
      dishTypeOptions = dishTypeOptions.map((opt) => ({
        ...opt,
        selected: opt.value === presetDish
      }));
      
      // 计算预设分类所在的页面索引
      const presetIndex = dishTypeOptions.findIndex((opt) => opt.value === presetDish);
      if (presetIndex !== -1) {
        presetDishPageIndex = Math.floor(presetIndex / 10);
      }
    }

    const opts = dishTypeOptions;
    const pages: typeof opts[] = [];
    for (let i = 0; i < opts.length; i += 10) {
      pages.push(opts.slice(i, i + 10));
    }

    const nextData: Record<string, unknown> = {
      rawRecipes,
      mealTimeOptions,
      dishTypeOptions,
      dishTypePages: pages,
      currentDishTypePage: presetDishPageIndex,
      dishTypeScrollIntoView: `dish-type-page-${presetDishPageIndex}`
    };
    if (initialSearch) {
      nextData.searchKeyword = initialSearch;
    }
    this.setData(nextData);

    // 如果有预设分类，延迟清除 scroll-into-view 以便触发滚动
    if (presetDish) {
      setTimeout(() => {
        this.setData({ dishTypeScrollIntoView: '' });
      }, 500);
    }

    // 确保数据已设置后再筛选
    if (rawRecipes.length === 0) {
      console.warn('警告：未加载到菜谱数据');
    }

    this.applyFilterAndScore(true);
  },

  // 搜索输入
  onSearchInput(e: WechatMiniprogram.Input) {
    const value = e.detail.value || '';
    this.setData({ searchKeyword: value });
  },

  // 点击搜索按钮
  onSearchTap() {
    const { searchKeyword } = this.data;
    if (searchKeyword && searchKeyword.trim()) {
      this.saveSearchHistory(searchKeyword.trim());
    }
    this.applyFilterAndScore(true);
  },

  // 搜索确认
  onSearchConfirm(e: WechatMiniprogram.Input) {
    const value = e.detail.value || '';
    if (value.trim()) {
      // 保存搜索历史
      this.saveSearchHistory(value.trim());
    }
    this.applyFilterAndScore(true);
  },

  // 清除搜索
  onClearSearch() {
    this.setData({ searchKeyword: '' });
    this.applyFilterAndScore(true);
  },

  saveSearchHistory(keyword: string) {
    saveRecipeSearchHistory(keyword);
  },

  // 综合搜索匹配：支持名称/别名/描述/标签中文名/拼音全拼/拼音首字母
  recipeMatchesKeyword(keyword: string, recipe: Recipe, aliasList: string[]): boolean {
    const kw = keyword.trim().toLowerCase();

    // 1. 名称 + 别名精确包含
    if (recipe.name.toLowerCase().includes(kw)) return true;
    if (aliasList.some((a) => a.toLowerCase().includes(kw))) return true;

    // 2. 拼音匹配（全拼 or 首字母）
    if (matchKeyword(kw, recipe.name)) return true;
    if (aliasList.some((a) => matchKeyword(kw, a))) return true;

    // 3. 描述文字匹配
    const desc = (recipe as any).description || '';
    if (desc.toLowerCase().includes(kw)) return true;

    // 4. 菜品类型标签中文名匹配（如 "减脂" → 匹配所有 dishTypes 含 "diet" 的菜）
    for (const [key, label] of Object.entries(DISH_TYPE_LABELS)) {
      if (label.toLowerCase().includes(kw)) {
        if (recipe.dishTypes.includes(key)) return true;
      }
    }

    // 5. 用餐时段标签中文名匹配
    const MEAL_TIME_LABELS: Record<string, string> = {
      breakfast: '早餐', lunch: '午餐', dinner: '晚餐', late_night: '夜宵'
    };
    for (const [key, label] of Object.entries(MEAL_TIME_LABELS)) {
      if (label.toLowerCase().includes(kw)) {
        if (recipe.mealTimes.includes(key)) return true;
      }
    }

    return false;
  },

  onFilterTap(e: WechatMiniprogram.BaseEvent) {
    const value = e.currentTarget.dataset.value as string;
    const type = e.currentTarget.dataset.type as 'mealTime' | 'dishType';
    if (!value || !type) return;

    const key = type === 'mealTime' ? 'mealTimeOptions' : 'dishTypeOptions';
    const options = (this.data as any)[key] as Array<{ value: string; label: string; selected: boolean; icon?: string }>;

    const updated = options.map((opt) => {
      if (opt.value === value) {
        return { ...opt, selected: !opt.selected };
      }
      return { ...opt, selected: false };
    });

    const setDataPayload: Record<string, unknown> = { [key]: updated };
    if (type === 'dishType') {
      const pages: typeof updated[] = [];
      for (let i = 0; i < updated.length; i += 10) {
        pages.push(updated.slice(i, i + 10));
      }
      setDataPayload.dishTypePages = pages;
    }
    this.setData(setDataPayload);

    this.applyFilterAndScore(true);
  },

  onDishTypeScroll(e: WechatMiniprogram.ScrollViewScroll) {
    const scrollLeft = e.detail.scrollLeft;
    const windowWidth = wx.getSystemInfoSync().windowWidth || 375;
    const pageIndex = Math.round(scrollLeft / windowWidth);
    if (pageIndex !== this.data.currentDishTypePage && pageIndex >= 0) {
      this.setData({ currentDishTypePage: pageIndex });
    }
  },

  onDishTypePageTap(e: WechatMiniprogram.BaseEvent) {
    const index = e.currentTarget.dataset.index as number;
    this.setData({
      currentDishTypePage: index,
      dishTypeScrollIntoView: `dish-type-page-${index}`
    });
    // 清除 scroll-into-view 以便再次点击同一页仍可触发滚动
    setTimeout(() => {
      this.setData({ dishTypeScrollIntoView: '' });
    }, 400);
  },

  applyFilterAndScore(resetLimit = false) {
    const { rawRecipes, userIngredients, mealTimeOptions, dishTypeOptions, searchKeyword } = this.data as {
      rawRecipes: Recipe[];
      userIngredients: string[];
      mealTimeOptions: Array<{ value: string; label: string; selected: boolean }>;
      dishTypeOptions: Array<{ value: string; label: string; selected: boolean }>;
      searchKeyword: string;
    };

    // 搜索关键词（忽略大小写）
    const keyword = (searchKeyword || '').trim().toLowerCase();

    // 用户真实选择的食材（不含任何自动补全）
    const userIngredientsArray = Array.isArray(userIngredients) ? userIngredients : [];

    // 剔除掉纯调料，只保留"真正的食材"（肉/菜/主食/蛋奶等）作为筛选依据
    const mainUserIngredients = userIngredientsArray.filter(
      (name) =>
        SEASONING_INGREDIENTS.indexOf(name) === -1 &&
        LIST_OPTIONAL_SEASONING_INGREDIENTS.indexOf(name) === -1
    );
    const hasRealIngredientSelected = mainUserIngredients.length > 0;

    // 只针对用户勾选的"真正食材"做弱扩展（大米 <-> 米饭 / 挂面 <-> 面条 等），
    // 不再自动补任何默认调料，避免调料参与匹配或影响结果集合。
    const baseForExpansion = hasRealIngredientSelected ? mainUserIngredients : [];

    const expandedUserIngredients = expandUserIngredients(baseForExpansion);

    // 辣椒家族：用于在"只勾选青椒"时，优先展示用青椒的菜
    const PEPPER_INGREDIENTS: readonly string[] = [
      '青椒',
      '红椒',
      '彩椒',
      '小米辣',
      '灯笼椒',
      '尖椒',
      '螺丝椒'
    ];

    // 虾类筛选：用于在用户勾选基围虾/大虾/虾仁时，确保能匹配到虾类菜品
    // 严格匹配逻辑在 isIngredientOwnedWithChickenExceptions 中处理
    const SHRIMP_INGREDIENTS: readonly string[] = [
      '基围虾',
      '大虾',
      '虾仁'
    ];

    const selectedPeppers = userIngredientsArray.filter((name) =>
      PEPPER_INGREDIENTS.includes(name)
    );
    const onlyGreenPepperSelected =
      selectedPeppers.length === 1 && selectedPeppers[0] === '青椒';

    const selectedMealTimes = mealTimeOptions.filter((o) => o.selected).map((o) => o.value);
    const selectedDishTypes = dishTypeOptions.filter((o) => o.selected).map((o) => o.value);

    // 如果用户勾选的全是调味料（盐、糖、酱油等），则视为没有有效食材：不返回任何菜品，并展示趣味彩蛋
    if (userIngredientsArray.length > 0 && !hasRealIngredientSelected) {
      this.setData({
        allRecipes: [],
        displayRecipes: [],
        recipesMoreVisible: false,
        recipesMoreText: '显示更多',
        seasoningEasterEgg: '你这是想吃"盐拌盐""酱油盖浇饭"吗？先去买点真食材吧～'
      });
      return;
    }

    // 普通筛选逻辑前，清空彩蛋文案，避免误显示
    if (this.data.seasoningEasterEgg) {
      this.setData({ seasoningEasterEgg: '' });
    }

    let filtered = rawRecipes.filter((recipe) => {
      const matchMealTime =
        !selectedMealTimes.length ||
        recipe.mealTimes.some((t) => selectedMealTimes.indexOf(t) !== -1);
      const matchDishType =
        !selectedDishTypes.length ||
        recipe.dishTypes.some((t) => selectedDishTypes.indexOf(t) !== -1);

      // 搜索关键词匹配（支持：菜谱名称、别名、描述、标签中文名、拼音）
      const aliasList: string[] = Array.isArray((recipe as any).aliases)
        ? (recipe as any).aliases
        : [];
      const matchKeyword = !keyword || this.recipeMatchesKeyword(keyword, recipe, aliasList);

      return matchMealTime && matchDishType && matchKeyword;
    });

    const scored = filtered.map((recipe) => {
      // 方案一：所有"调味料类食材"一律不计入核心食材：
      // - 不会因为少酱油/香油/葱花而把菜排得很靠后
      // - 是否展示、缺少食材数量，仅由主食材（肉/菜/蛋奶/主食等）决定
      const rawCoreIngredients = recipe.ingredients.filter((ing) => {
        const name = ing as any;
        // 所有在 SEASONING_INGREDIENTS 列表中的调料，直接视为非核心
        if (SEASONING_INGREDIENTS.indexOf(name) !== -1) {
          return false;
        }
        // 兼容历史：部分调料在 OPTIONAL_SEASONING_INGREDIENTS 中做了更细的"可选增香"划分
        if (LIST_OPTIONAL_SEASONING_INGREDIENTS.indexOf(name) !== -1) {
          return false;
        }
        return true;
      });

      // 方案一扩展：对"辣椒家族"做成一组，只算 1 样
      // 例如：爆炒牛肉需要青椒 + 红椒，实际上你家里只要有一两种辣椒就能做，
      // 所以这里把它们压缩成一个"辣椒类"核心食材，避免出现"缺 4 样里有 2 个都是辣椒"的情况。
      const recipePeppers = rawCoreIngredients.filter((ing) =>
        PEPPER_INGREDIENTS.includes(ing as any)
      );
      const hasPepperGroup = recipePeppers.length > 0;
      const hasPepperOwned = recipePeppers.some((ing) =>
        expandedUserIngredients.includes(ing)
      );
      const hasExplicitPepperOwned = recipePeppers.some((ing) =>
        userIngredientsArray.includes(ing)
      );

      // 虾类处理：在 isIngredientOwnedWithChickenExceptions 中统一处理基围虾/大虾的互通和严格匹配逻辑

      const coreIngredients: string[] = [];
      if (hasPepperGroup) {
        // 只在菜谱里真的用到了辣椒时，才创建一个"辣椒类"占位
        const PEPPER_GROUP_KEY = '__(PEPPER_GROUP)__';
        for (const ing of rawCoreIngredients) {
          if (PEPPER_INGREDIENTS.includes(ing as any)) {
            if (coreIngredients.indexOf(PEPPER_GROUP_KEY) === -1) {
              coreIngredients.push(PEPPER_GROUP_KEY);
            }
          } else {
            coreIngredients.push(ing as any);
          }
        }
      } else {
        coreIngredients.push(...(rawCoreIngredients as any[]));
      }



      const total = coreIngredients.length;
      const owned = total
        ? coreIngredients.filter((ing) => {
            if (ing === '__(PEPPER_GROUP)__') {
              return hasPepperOwned;
            }

            // 对鸡肉家族做一个更精细的判断：鸡里脊可以做大部分鸡胸/鸡腿菜，
            // 但像"日式照烧鸡腿饭""清蒸鸡腿""清爽鸡胸蔬菜沙拉"这类名字里
            // 明确强调部位的菜，仍然要求真·鸡腿/鸡胸。
            return isIngredientOwnedWithChickenExceptions(
              ing as string,
              recipe.name,
              userIngredientsArray,
              expandedUserIngredients
            );
          }).length
        : 0;
      const missing = total - owned;

      // 进一步区分："命中扩展后的食材"（owned）和"命中用户亲自勾选的主食材"
      // 这样在你只勾选"猪肉"时，优先把真正用到"猪肉"的菜排在前面，
      // 而不是让"只缺一根生菜"的菜（比如蒜蓉生菜）抢到最上面。
      // 虾类单向兼容：整虾（基围虾/大虾）可以做虾仁菜，但虾仁不能做整虾菜
      // 用户有整虾 → 可以看虾仁菜和整虾菜
      // 用户只有虾仁 → 只能看虾仁菜
      const WHOLE_SHRIMP_GROUP = ['基围虾', '大虾'];
      const ALL_SHRIMP_GROUP = ['基围虾', '大虾', '虾仁'];
      // 蜂蜜与甜味饮品的关联
      const HONEY_INGREDIENTS = ['柠檬', '柚子', '百香果', '金桔'];
      // 葱类关联：小葱/香葱/葱/细葱 → 葱花
      const SCALLION_INGREDIENTS = ['小葱', '香葱', '葱', '细葱', '细香葱'];
      // 检查蜂蜜是否与菜谱中的甜味饮品原料匹配
      const userHasHoney = mainUserIngredients.includes('蜂蜜');
      const recipeHasHoneyRelated = coreIngredients.some((ri) => HONEY_INGREDIENTS.includes(ri as string));
      // 检查用户是否有葱类食材
      const userHasScallion = SCALLION_INGREDIENTS.some(sc => mainUserIngredients.includes(sc));
      const explicitOwnedCore = total
        ? coreIngredients.filter((ing) => {
            if (ing === '__(PEPPER_GROUP)__') {
              return hasExplicitPepperOwned;
            }
            // 虾类判断
            if (ALL_SHRIMP_GROUP.includes(ing)) {
              // 用户有整虾 → 可以命中所有虾类菜
              if (mainUserIngredients.some(ui => WHOLE_SHRIMP_GROUP.includes(ui))) {
                return true;
              }
              // 只有虾仁 → 只能命中虾仁菜
              return mainUserIngredients.includes('虾仁');
            }
            // 蜂蜜关联：用户选择蜂蜜，且菜谱有甜味饮品原料（柠檬/柚子等）
            if (ing === '蜂蜜' && userHasHoney) {
              return recipeHasHoneyRelated;
            }
            // 甜味饮品原料：用户选择柠檬/柚子等，菜谱有蜂蜜
            if (HONEY_INGREDIENTS.includes(ing) && mainUserIngredients.includes(ing)) {
              return coreIngredients.includes('蜂蜜' as any) || coreIngredients.includes(ing as any);
            }
            // 葱类关联：用户选择小葱/香葱/葱等，菜谱需要葱花
            if (ing === '葱花' && userHasScallion) {
              return true;
            }
            // 葱花反向关联：用户选择葱花，菜谱有其他葱类食材
            if (SCALLION_INGREDIENTS.includes(ing) && mainUserIngredients.includes(ing)) {
              return coreIngredients.includes('葱花' as any) || coreIngredients.includes(ing as any);
            }
            return (
              userIngredientsArray.indexOf(ing) !== -1 &&
              SEASONING_INGREDIENTS.indexOf(ing) === -1 &&
              LIST_OPTIONAL_SEASONING_INGREDIENTS.indexOf(ing) === -1
            );
          }).length
        : 0;
      const difficultyLabel = getDifficultyLabel(recipe.difficulty);
      const mealTimeLabel = getMealTimeLabelString(recipe.mealTimes);
      const primaryCategoryLabel = getPrimaryCategoryLabel(recipe.dishTypes, recipe.mealTimes);
      const secondaryCategoryLabels = getSecondaryCategoryLabels(
        recipe.dishTypes,
        recipe.mealTimes,
        primaryCategoryLabel
      );

      const calories = extractCalories(recipe.description);
      const isFavoriteValue = isFavorite(recipe.id);

      const desc = (recipe.description || '').trim();
      const steps = normalizeStepsForDisplay(recipe.steps, desc);

      return {
        ...recipe,
        owned,
        explicitOwnedCore,
        total,
        missing,
        difficultyLabel,
        mealTimeLabel,
        primaryCategoryLabel,
        secondaryCategoryLabels,
        calories,
        isFavorite: isFavoriteValue,
        matchedMealTimes: recipe.mealTimes || [],
        matchedDishTypes: recipe.dishTypes || [],
        steps
      };
    });

    // 食材命中规则（优化版）：
    // - 用户没选食材：不过滤，展示所有菜（只受早晚饭/菜品类型影响）
    // - 用户选了任意非调味料食材：使用动态阈值筛选，避免"命中1个就展示"导致推荐不靠谱
    //
    // 筛选逻辑：
    // 1. 硬门槛：命中率门槛 + 缺少数上限 + 显式命中要求（用户选>=2时）
    // 2. 自适应兜底：若结果过少，逐步放宽阈值确保不为空
    let scoredWithIngredientFilter: typeof scored;

    // 筛选器：判断某道菜是否通过食材门槛
    const passIngredientGate = (
      item: typeof scored[0],
      options: {
        userMainCount: number;
        missingMax: number;
        ratioMin: number;
        requireExplicit: boolean;
        minExplicitOwned: number;
      }
    ): boolean => {
      const { total, owned, explicitOwnedCore, missing, ingredients } = item;

      // 纯调料菜品（如暖姜茶）：只有当用户选择了菜品所需的调料时才通过
      if (total <= 0) {
        const recipeIngredients = ingredients || [];
        const hasGinger = recipeIngredients.includes('姜');
        const hasBrownSugar = recipeIngredients.includes('红糖');
        const userHasGinger = expandedUserIngredients.includes('姜');
        const userHasBrownSugar = expandedUserIngredients.includes('红糖');
        
        // 如果用户选择了菜品所需的所有调料，则通过筛选
        let allOwned = true;
        if (hasGinger && !userHasGinger) allOwned = false;
        if (hasBrownSugar && !userHasBrownSugar) allOwned = false;
        
        return allOwned;
      }

      const ratio = owned / total;

      // 规则A：命中率/命中数门槛
      const passA =
        (total === 1 && owned === 1) ||
        (total >= 2 && ratio >= options.ratioMin) ||
        owned >= 2;
      if (!passA) return false;

      // 规则C：缺少数上限
      if (missing > options.missingMax) return false;

      // 规则B：显式命中要求（必须至少命中用户选择的1个核心食材）
      if (options.minExplicitOwned > 0 && explicitOwnedCore < options.minExplicitOwned) return false;

      return true;
    };

    if (hasRealIngredientSelected && expandedUserIngredients && expandedUserIngredients.length > 0) {
      const userMainCount = mainUserIngredients.length;

      // 核心食材命中判定：必须至少包含用户选择的1个核心食材
      // 使用用户原始选择（不含扩展），避免"扩展命中但原始没选"的情况
      // 虾类单向兼容：整虾可以做虾仁菜，但虾仁不能做整虾菜
      const WHOLE_SHRIMP_GROUP = ['基围虾', '大虾'];
      const ALL_SHRIMP_GROUP = ['基围虾', '大虾', '虾仁'];
      // 蜂蜜可以与甜味饮品原料关联：蜂蜜 + 柠檬 = 蜂蜜柠檬水，蜂蜜 + 柚子 = 蜂蜜柚子茶
      const HONEY_INGREDIENTS = ['柠檬', '柚子', '百香果', '金桔'];
      // 葱类关联：小葱/香葱/葱/细葱 → 葱花
      const SCALLION_INGREDIENTS = ['小葱', '香葱', '葱', '细葱', '细香葱'];
      const hasExplicitCoreMatch = (item: typeof scored[0]): boolean => {
        if (userMainCount <= 0) return true; // 无主食材用户，全部通过
        const recipeCoreIngredients = item.ingredients.filter((ing: string) => {
          return SEASONING_INGREDIENTS.indexOf(ing) === -1 &&
                 LIST_OPTIONAL_SEASONING_INGREDIENTS.indexOf(ing) === -1;
        });

        // 检查是否至少有一个用户选择的核心食材能匹配到菜谱
        return mainUserIngredients.some((userIng: string) => {
          // 虾类单向兼容判断
          if (WHOLE_SHRIMP_GROUP.includes(userIng)) {
            // 有整虾 → 可以匹配所有虾类菜谱
            return recipeCoreIngredients.some((ri) => ALL_SHRIMP_GROUP.includes(ri));
          }
          if (userIng === '虾仁') {
            // 只有虾仁 → 只能匹配虾仁菜谱
            return recipeCoreIngredients.includes('虾仁');
          }
          // 蜂蜜关联判断：用户有蜂蜜，菜谱需要甜味饮品原料（柠檬/柚子等）
          if (userIng === '蜂蜜') {
            return recipeCoreIngredients.some((ri) => HONEY_INGREDIENTS.includes(ri));
          }
          // 甜味饮品原料反向关联：用户有柠檬/柚子等，菜谱需要蜂蜜
          if (HONEY_INGREDIENTS.includes(userIng)) {
            return recipeCoreIngredients.includes('蜂蜜') ||
                   recipeCoreIngredients.includes(userIng);
          }
          // 葱类关联：用户有小葱/香葱/葱等，菜谱需要葱花
          if (SCALLION_INGREDIENTS.includes(userIng)) {
            return recipeCoreIngredients.includes('葱花');
          }
          // 葱花反向关联：用户选择葱花，菜谱有其他葱类食材
          if (userIng === '葱花') {
            return SCALLION_INGREDIENTS.some((sc) => recipeCoreIngredients.includes(sc)) ||
                   recipeCoreIngredients.includes('葱花');
          }
          return recipeCoreIngredients.includes(userIng);
        });
      };

      // 自适应兜底配置：按优先级尝试放宽
      // 注意：必须至少命中1个显式核心食材，且缺少数有限制
      const FALLBACK_CONFIGS = [
        // 第1档：较严格（默认）
        // 要求：命中率>=50% 或 命中>=2，且缺少数<=2，且至少1个显式命中
        { userMainCount, missingMax: 2, ratioMin: 0.5, requireExplicit: true, minExplicitOwned: 1 },
        // 第2档：放宽缺少数
        { userMainCount, missingMax: 3, ratioMin: 0.5, requireExplicit: true, minExplicitOwned: 1 },
        // 第3档：放宽命中率
        { userMainCount, missingMax: 3, ratioMin: 0.4, requireExplicit: true, minExplicitOwned: 1 },
        // 第4档：放宽显式命中要求（但仍需至少1个）
        { userMainCount, missingMax: 4, ratioMin: 0.35, requireExplicit: true, minExplicitOwned: 1 },
        // 第5档：最低限度 - 必须有显式核心命中
        { userMainCount, missingMax: 5, ratioMin: 0.2, requireExplicit: false, minExplicitOwned: 1 }
      ];

      let finalConfig = FALLBACK_CONFIGS[0];
      let matchedRecipes = scored.filter((item) => {
        // 必须包含至少1个用户选择的核心食材
        if (!hasExplicitCoreMatch(item)) return false;
        return passIngredientGate(item, finalConfig);
      });

      // 自适应兜底：如果结果太少，逐步放宽
      const MIN_RESULTS = 20;
      for (let i = 1; i < FALLBACK_CONFIGS.length && matchedRecipes.length < MIN_RESULTS; i++) {
        finalConfig = FALLBACK_CONFIGS[i];
        matchedRecipes = scored.filter((item) => {
          if (!hasExplicitCoreMatch(item)) return false;
          return passIngredientGate(item, finalConfig);
        });
      }

      scoredWithIngredientFilter = matchedRecipes;
    } else {
      scoredWithIngredientFilter = scored;
    }

    // 调试日志
    console.log('食材筛选后结果数量:', scoredWithIngredientFilter.length);
    if (selectedDishTypes.includes('diet') && scoredWithIngredientFilter.length === 0) {
      console.warn('减脂餐筛选后为空，可能原因:', {
        filteredCount: filtered.length,
        scoredCount: scored.length,
        hasUserIngredients: expandedUserIngredients.length > 0,
        sampleRecipe: filtered.length > 0 ? {
          name: filtered[0].name,
          ingredients: filtered[0].ingredients,
          userIngredients: expandedUserIngredients
        } : null
      });
    }

    // =====================================================
    // 排序规则（智能推荐版）
    // 核心思路：只按核心食材的"缺多少"来排序，调料不参与排序
    // 优先级：
    // 1) 核心食材缺少数（升序，缺得少排前面）
    // 2) 核心食材命中数（降序，有的多排前面）
    // 3) 显式命中数量（用户亲自勾选的）
    // 4) 耗时（易做的排前面）
    // =====================================================

    const finalList = [...scoredWithIngredientFilter].sort((a, b) => {
      // 若用户勾选了食材，应用优化后的排序逻辑
      if (hasRealIngredientSelected) {
        // 辅助函数：计算 effective missing，处理特殊菜品（如暖姜茶）
        // 当用户选择了姜或红糖时，暖姜茶这类纯调料饮品应该视为完全匹配
        const getEffectiveMissing = (item: typeof scored[0]): number => {
          if (item.total > 0) {
            return item.missing; // 正常菜品直接返回
          }
          // 纯调料菜品（total = 0）：检查用户是否选择了姜或红糖
          const recipeIngredients = item.ingredients || [];
          const hasGinger = recipeIngredients.includes('姜');
          const hasBrownSugar = recipeIngredients.includes('红糖');
          const userHasGinger = expandedUserIngredients.includes('姜');
          const userHasBrownSugar = expandedUserIngredients.includes('红糖');
          
          // 如果用户选择了菜品所需的所有调料，则视为完全匹配
          let allOwned = true;
          if (hasGinger && !userHasGinger) allOwned = false;
          if (hasBrownSugar && !userHasBrownSugar) allOwned = false;
          
          return allOwned ? 0 : 1; // 全部有则 missing=0，否则 missing=1
        };

        const aMissing = getEffectiveMissing(a);
        const bMissing = getEffectiveMissing(b);

        // 0) 纯调料菜品（total = 0）应该排在有核心食材的菜品后面
        //    只有当 missing 相同时才比较 total
        const aIsOnlySeasoning = a.total === 0;
        const bIsOnlySeasoning = b.total === 0;
        if (aIsOnlySeasoning !== bIsOnlySeasoning) {
          // 如果纯调料菜品已经满足用户选择的调料，应该和正常菜品一起排序
          if (aIsOnlySeasoning && aMissing === 0) return 0;
          if (bIsOnlySeasoning && bMissing === 0) return 0;
          return aIsOnlySeasoning ? 1 : -1;
        }

        // 1) 首先按核心食材缺少数升序（缺得少的优先）- 这是最重要的排序因素
        if (aMissing !== bMissing) {
          return aMissing - bMissing;
        }

        // 2) 缺少数相同时，total 大的优先（食材多的菜更值得推荐）
        if (a.total !== b.total) {
          return b.total - a.total;
        }

        // 3) 仍然相同时，按显式命中数量降序
        const aExplicit = (a as any).explicitOwnedCore || 0;
        const bExplicit = (b as any).explicitOwnedCore || 0;
        if (aExplicit !== bExplicit) {
          return bExplicit - aExplicit;
        }
      }

      // 5) 若用户只勾选了青椒，则在上述条件相同的前提下，
      //    对"辣椒相关"的菜优先展示含青椒的版本
      if (onlyGreenPepperSelected) {
        const aHasAnyPepper =
          Array.isArray(a.ingredients) &&
          a.ingredients.some((ing) => PEPPER_INGREDIENTS.includes(ing));
        const bHasAnyPepper =
          Array.isArray(b.ingredients) &&
          b.ingredients.some((ing) => PEPPER_INGREDIENTS.includes(ing));

        if (aHasAnyPepper || bHasAnyPepper) {
          const aHasGreen =
            Array.isArray(a.ingredients) && a.ingredients.includes('青椒');
          const bHasGreen =
            Array.isArray(b.ingredients) && b.ingredients.includes('青椒');

          if (aHasGreen !== bHasGreen) {
            return aHasGreen ? -1 : 1;
          }
        }
      }

      // 6) 其它情况：按耗时从少到多（null 排最后）
      const timeA = a.timeCost || 99999;
      const timeB = b.timeCost || 99999;
      return timeA - timeB;
    });

    // 去重：如果同名菜在当前筛选结果中出现多次，只保留一条（通常是最省食材/耗时更短的那条）
    const seenNames = new Set<string>();
    const dedupedList: typeof finalList = [];
    for (const item of finalList) {
      if (!seenNames.has(item.name)) {
        seenNames.add(item.name);
        dedupedList.push(item);
      }
    }

    // 结果上限：避免一次渲染过多卡片导致性能/滚动异常
    // 当前菜谱约 200 道，适当提高上限，保证"查看全部菜谱"能看到全部
    const MAX_RENDER = 400;

    const all = dedupedList.slice(0, MAX_RENDER);

    const pageSize = this.data.recipePageSize || 10;
    const currentCount = this.data.recipeDisplayCount || pageSize;
    const nextCountBase = resetLimit ? pageSize : currentCount;
    const nextCount = Math.min(Math.max(nextCountBase, pageSize), all.length);

    const moreVisible = all.length > pageSize;
    const hasMore = nextCount < all.length;
    const moreText = hasMore ? '显示更多' : '收起';

    this.setData({
      allRecipes: all,
      recipeDisplayCount: nextCount,
      displayRecipes: all.slice(0, nextCount),
      recipesMoreVisible: moreVisible,
      recipesMoreText: moreVisible ? moreText : '显示更多',
      pageLoading: false  // 加载完成
    });
  },

  onToggleRecipeMore() {
    const { allRecipes, recipeDisplayCount, recipePageSize } = this.data as {
      allRecipes: Array<
        Recipe & {
          owned: number;
          total: number;
          missing: number;
          difficultyLabel: string;
          mealTimeLabel: string;
          primaryCategoryLabel: string;
          secondaryCategoryLabels: string[];
          matchedMealTimes: string[];
          matchedDishTypes: string[];
          calories: string | null;
          isFavorite: boolean;
          steps: string[];
        }
      >;
      recipeDisplayCount: number;
      recipePageSize: number;
      recipeStep: number;
    };

    const total = allRecipes.length;
    const pageSize = recipePageSize || 10;
    let nextCount = recipeDisplayCount || pageSize;

    if (nextCount < total) {
      nextCount = Math.min(nextCount + pageSize, total);
    } else {
      nextCount = Math.min(pageSize, total);
    }

    const moreVisible = total > pageSize;
    const hasMore = nextCount < total;
    const moreText = hasMore ? '显示更多' : '收起';

    this.setData({
      recipeDisplayCount: nextCount,
      displayRecipes: allRecipes.slice(0, nextCount),
      recipesMoreVisible: moreVisible,
      recipesMoreText: moreVisible ? moreText : '显示更多'
    });
  },

  onToggleSelectedIngredients() {
    this.setData({
      showSelectedIngredients: !this.data.showSelectedIngredients
    });
  },

  onShow() {
    // 每次显示页面时重新检查收藏状态
    this.updateFavoriteStatus();
  },

  /** 点击卡片：直接跳转详情页 */
  onRecipeTap(e: WechatMiniprogram.BaseEvent) {
    const id = e.currentTarget.dataset.id as string;
    if (!id) return;
    const from = this.data.fromIngredientsSelection ? 'ingredients' : 'list';
    const sessionId = this.data.scanSessionId;
    let url = `/pages/recipes/detail?id=${encodeURIComponent(id)}&from=${from}`;
    if (sessionId) {
      url += `&sessionId=${sessionId}`;
    }
    wx.navigateTo({ url });
  },

  // 更新所有菜谱的收藏状态
  updateFavoriteStatus() {
    const favorites = getFavorites();
    const { allRecipes, displayRecipes } = this.data as {
      allRecipes: Array<Recipe & { owned: number; total: number; missing: number; difficultyLabel: string; mealTimeLabel: string; primaryCategoryLabel: string; secondaryCategoryLabels: string[]; matchedMealTimes: string[]; matchedDishTypes: string[]; calories: string | null; isFavorite: boolean; steps: string[] }>;
      displayRecipes: Array<Recipe & { owned: number; total: number; missing: number; difficultyLabel: string; mealTimeLabel: string; primaryCategoryLabel: string; secondaryCategoryLabels: string[]; matchedMealTimes: string[]; matchedDishTypes: string[]; calories: string | null; isFavorite: boolean; steps: string[] }>;
    };

    // 更新 allRecipes 的收藏状态
    const updatedAllRecipes = allRecipes.map((recipe) => ({
      ...recipe,
      isFavorite: favorites.includes(recipe.id)
    }));

    // 更新 displayRecipes 的收藏状态
    const updatedDisplayRecipes = displayRecipes.map((recipe) => ({
      ...recipe,
      isFavorite: favorites.includes(recipe.id)
    }));

    this.setData({
      allRecipes: updatedAllRecipes,
      displayRecipes: updatedDisplayRecipes
    });
  },

  // 切换收藏状态
  onToggleFavorite(e: WechatMiniprogram.BaseEvent) {
    const id = e.currentTarget.dataset.id as string;
    if (!id) return;

    // 获取当前活跃收藏夹
    const activeCollection = getActiveCollection();
    if (!activeCollection) {
      this.showToast(
        '请先创建收藏夹',
        'warning',
        false,
        '',
        2500,
        '⚠️'
      );
      return;
    }

    // 检查当前菜谱是否已在活跃收藏夹中
    const isInActiveCollection = isRecipeInCollection(activeCollection.id, id);

    if (isInActiveCollection) {
      // 已在当前收藏夹中，直接取消收藏
      this.removeFromActiveCollection(id);
      // 取消收藏：info类型，显示2秒，用删除图标
      this.showToast('已取消收藏', 'info', false, '', 2000, 'delete');
    } else {
      // 不在当前收藏夹中，直接添加
      const result = toggleRecipeInCollection(id, activeCollection.id);

      if (result.success && result.added) {
        // 更新UI
        this.updateRecipeFavoriteStatus(id, true);

        // 显示轻量级提示，带"修改"按钮
        this.showToast(
          `已添加到"${result.collectionName}"`,
          'success',
          true,
          '修改',
          3000,
          'success'
        );

        // 触发云端同步
        syncDebounced();
      }
    }
  },

  // 长按收藏按钮 - 显示收藏夹选择器
  onFavoriteLongPress(e: WechatMiniprogram.BaseEvent) {
    const id = e.currentTarget.dataset.id as string;
    if (!id) return;

    const collections = getCollections();
    if (collections.length === 0) {
      wx.showToast({ title: '请先创建收藏夹', icon: 'none' });
      return;
    }

    // 获取当前菜品所在的所有收藏夹
    const containingCollections = collections.filter(c =>
      c.recipeIds && c.recipeIds.includes(id)
    );

    // 构建选择列表
    const itemList = collections.map(c => {
      const isIn = containingCollections.some(cc => cc.id === c.id);
      return {
        id: c.id,
        name: c.name,
        isIn,
        coverImage: c.coverImage
      };
    });

    // 添加"新建收藏夹"选项
    itemList.push({
      id: '__create_new__',
      name: '+ 新建收藏夹',
      isIn: false
    });

    // 显示操作菜单
    wx.showActionSheet({
      itemList: itemList.map((item) => {
        if (item.id === '__create_new__') {
          return item.name;
        }
        return item.isIn ? `✓ ${item.name}` : item.name;
      }),
      success: (res) => {
        const selectedItem = itemList[res.tapIndex];
        if (!selectedItem) return;

        if (selectedItem.id === '__create_new__') {
          // 创建新收藏夹
          this.showCreateCollectionDialog(id);
        } else {
          // 切换该收藏夹的收藏状态
          this.toggleCollectionForRecipe(id, selectedItem.id, selectedItem.isIn);
        }
      }
    });
  },

  // 显示创建新收藏夹对话框
  showCreateCollectionDialog(recipeId: string) {
    wx.showModal({
      title: '创建新收藏夹',
      editable: true,
      placeholderText: '请输入收藏夹名称',
      success: (res) => {
        if (res.confirm && res.content) {
          const { createCollection, addRecipeToCollection } = require('../../utils/collections');
          const name = res.content.trim();

          if (!name) {
            this.showToast('名称不能为空', 'warning', false, '', 2500, 'warning');
            return;
          }

          const newCollection = createCollection({ name });
          if (newCollection) {
            // 创建成功后，将菜谱添加到新收藏夹
            addRecipeToCollection(recipeId, newCollection.id);

            // 更新UI
            this.updateRecipeFavoriteStatus(recipeId, true);

            // 显示轻量级提示，带"修改"按钮
            this.showToast(
              `已添加到"${name}"`,
              'success',
              true,
              '修改',
              3000,
              'success'
            );

            syncDebounced();
          } else {
            this.showToast('创建失败', 'warning', false, '', 2500, 'warning');
          }
        }
      }
    });
  },

  // 切换菜谱在某个收藏夹的收藏状态
  toggleCollectionForRecipe(recipeId: string, collectionId: string, currentlyIn: boolean) {
    const { addRecipeToCollection, removeRecipeFromCollection } = require('../../utils/collections');

    if (currentlyIn) {
      // 移除
      removeRecipeFromCollection(collectionId, recipeId);
      this.showToast('已取消收藏', 'info', false, '', 2000, 'delete');
    } else {
      // 添加
      addRecipeToCollection(collectionId, recipeId);
      this.showToast('已添加', 'success', false, '', 2000, 'success');
    }

    // 检查是否还在任何收藏夹中
    const { isRecipeInAnyCollection } = require('../../utils/collections');
    const isFavorited = isRecipeInAnyCollection(recipeId);
    this.updateRecipeFavoriteStatus(recipeId, isFavorited);
    syncDebounced();
  },

  // 从活跃收藏夹中移除
  removeFromActiveCollection(recipeId: string) {
    const activeCollection = getActiveCollection();
    if (!activeCollection) return;

    const { removeRecipeFromCollection } = require('../../utils/collections');
    removeRecipeFromCollection(activeCollection.id, recipeId);

    this.updateRecipeFavoriteStatus(recipeId, false);
    this.showToast('已取消收藏', 'info', false, '', 2000, 'delete');
    syncDebounced();
  },

  // 更新菜谱的收藏状态
  updateRecipeFavoriteStatus(recipeId: string, isFavorite: boolean) {
    const { displayRecipes, allRecipes } = this.data as any;

    // 更新 displayRecipes
    const updatedDisplayRecipes = displayRecipes.map((recipe: any) => {
      if (recipe.id === recipeId) {
        return { ...recipe, isFavorite };
      }
      return recipe;
    });

    // 更新 allRecipes
    const updatedAllRecipes = allRecipes.map((recipe: any) => {
      if (recipe.id === recipeId) {
        return { ...recipe, isFavorite };
      }
      return recipe;
    });

    this.setData({
      displayRecipes: updatedDisplayRecipes,
      allRecipes: updatedAllRecipes
    });
  },

  onImageError(e: WechatMiniprogram.BaseEvent) {
    const idx = e.currentTarget.dataset.index as number;
    const errUrl = e.detail && e.detail.errMsg;
    if (idx == null || !errUrl) return;
    const clear = (recipes: typeof this.data.displayRecipes) =>
      recipes.map((r, i) => {
        if (i === idx && r.coverImage === errUrl) {
          return { ...r, coverImage: '' };
        }
        return r;
      });
    this.setData({
      displayRecipes: clear(this.data.displayRecipes),
      allRecipes: clear(this.data.allRecipes)
    } as any);
  },

  // 显示轻量级提示
  showToast(
    message: string,
    type: 'info' | 'success' | 'warning' = 'info',
    showButton: boolean = false,
    buttonText: string = '去看看',
    duration: number = 2000,
    iconType: string = '',
    subtitle: string = ''
  ) {
    this.setData({
      toastShow: true,
      toastMessage: message,
      toastType: type,
      toastShowButton: showButton,
      toastButtonText: buttonText,
      toastDuration: duration,
      toastIcon: iconType,
      toastSubtitle: subtitle
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
    // 打开收藏夹选择器（需要传入当前菜谱ID）
    // 由于无法获取当前点击的菜谱ID，这里只是关闭提示
  }
});
