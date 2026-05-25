import { ChildMeal, FitnessDish, Recipe } from '../../types/index.js';
import {
  extractCalories,
  normalizeStepsForDisplay,
  resolveUsageAmount
} from '../../utils/recipeUtils.js';
import { getGlobalRecipesAsync, getGlobalRecipes } from '../../utils/httpServices/recipeService.js';
import { SEASONING_INGREDIENTS } from '../../utils/constants.js';
import { expandUserIngredients, isIngredientOwnedWithChickenExceptions } from '../../utils/ingredientUtils.js';
import {
  MEAL_TIME_LABELS,
  getDifficultyLabel,
  getMealTimeLabelString,
  getPrimaryCategoryLabel,
  getSecondaryCategoryLabels
} from '../../utils/labels.js';
import { addRecipeIngredients, isRecipeInBasket, removeRecipeById } from '../../utils/shoppingList.js';
import { getFridgeIngredientNames, isInFridge } from '../../utils/fridgeStore.js';
// 统一收藏接口：所有类型菜品共用同一个收藏列表
import { collectionService } from '../../utils/services/collectionService.js';
import { authService } from '../../utils/services/authService.js';
import { cacheRecipe } from '../../utils/recipeCache.js';
import * as recipeApi from '../../utils/httpApi/recipe.js';
import { post } from '../../utils/httpApi/request.js';

const LIST_OPTIONAL_SEASONING_INGREDIENTS: readonly string[] = [];

function safeBackToList(entryFrom?: string) {
  const pages = getCurrentPages();
  if (pages.length > 1) {
    wx.navigateBack();
    return;
  }
  if (entryFrom === 'fitness') {
    wx.reLaunch({ url: '/subpackages/lowfreq/fitness-menu/index' });
    return;
  }
  if (entryFrom === 'children') {
    wx.reLaunch({ url: '/subpackages/lowfreq/kids-menu/index' });
    return;
  }
  wx.reLaunch({ url: '/pages/recipes/list' });
}

function uniq(list: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const x of list) {
    const v = (x || '').trim();
    if (!v) continue;
    if (seen.has(v)) continue;
    seen.add(v);
    out.push(v);
  }
  return out;
}

/** 详情页已有绿色用餐时段汇总 chip 时，去掉灰色次要标签里重复的早餐/午餐/晚餐/夜宵 */
function stripMealTimeFromSecondary(mealTimeSummary: string, secondary: string[]): string[] {
  if (!(mealTimeSummary || '').trim()) return secondary;
  const mealTexts = new Set(
    Object.keys(MEAL_TIME_LABELS).map((k) => MEAL_TIME_LABELS[k]).filter(Boolean) as string[]
  );
  return secondary.filter((l) => !mealTexts.has(l));
}

/** 从后端 API 加载全部菜谱 */
async function loadAllRecipesAsync(): Promise<Recipe[]> {
  try {
    const recipes = await getGlobalRecipesAsync();
    if (recipes && recipes.length > 0) {
      console.log('[detail] 从API加载了', recipes.length, '条菜谱');
      return recipes;
    }
  } catch (e) {
    console.warn('[detail] API加载菜谱失败', e);
  }
  return getGlobalRecipes() || [];
}

/** 从菜谱中查找健身菜品（fitnessMeal=true 或有 fitnessCategory） */
async function loadFitnessDishByIdAsync(id: string): Promise<FitnessDish | null> {
  const recipes = await loadAllRecipesAsync();
  const matched = recipes.find(r =>
    String(r.id || '').trim() === id &&
    (r.fitnessMeal === true || !!(r as any).fitnessCategory)
  );
  if (!matched) return null;
  const r = matched;
  return {
    id: String(r.id || '').trim(),
    name: r.name || '',
    coverImage: String(r.coverImage || '').trim(),
    description: r.description || '',
    ingredients: Array.isArray(r.ingredients) ? r.ingredients : [],
    mealTimes: Array.isArray(r.mealTimes) ? r.mealTimes : [],
    dishTypes: Array.isArray(r.dishTypes) ? r.dishTypes : [],
    timeCost: r.timeCost != null ? r.timeCost : null,
    difficulty: r.difficulty || 'medium',
    calories: (r.nutrition && r.nutrition.calories) || (r as any).calories || 0,
    usage: r.usage || {},
    steps: r.steps || [],
    fitnessMeal: true,
    fitnessCategory: String((r as any).fitnessCategory || ''),
    goal: String((r as any).goal || 'all'),
    nutrition: r.nutrition || {
      calories: (r as any).calories || 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0
    }
  } as FitnessDish;
}

function fitnessDishToRecipe(fd: FitnessDish): Recipe {
  const usage: Record<string, string> = {};
  const ingredients: string[] = [];

  // 新格式：usage 为对象 {食材名: 用量}
  if (fd.usage && typeof fd.usage === 'object') {
    for (const [name, amount] of Object.entries(fd.usage)) {
      if (!name) continue;
      usage[name] = String(amount || '适量').trim();
      if (!ingredients.includes(name)) {
        ingredients.push(name);
      }
    }
  } else {
    // 旧格式：从 usage 字符串解析
    const usageStr = String(fd.usage || '').trim();

    // 逐个逗号分割后提取
    const parts = usageStr.split(/[,，]/);
    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed) continue;

      // 跳过纯调料
      if (/^(盐|蒜|蒜末|香油|橄榄油|生抽|老抽|蚝油|料酒|醋|黑胡椒|白胡椒|胡椒粉|水|牛奶|热水|冷水)$/.test(trimmed)) {
        continue;
      }

      // 尝试匹配 "食材名 + 数字 + 单位" 格式
      const textFirstMatch = trimmed.match(/^(.+?)\s*([\d\.]+)\s*(g|克|个|根|条|块|颗|把|片|ml|ML)(.*)/);
      if (textFirstMatch && textFirstMatch[1]) {
        const ingredientName = textFirstMatch[1].trim();
        const cleanName = ingredientName.replace(/\(.*?\)|（.*?）/g, '').trim();
        if (cleanName && !ingredients.includes(cleanName)) {
          ingredients.push(cleanName);
          usage[cleanName] = trimmed;
        }
        continue;
      }

      // 尝试匹配 "数字 + 单位 + 食材名" 格式
      const numFirstMatch = trimmed.match(/^([\d\.]+)\s*(g|克|个|根|条|块|颗|把|片|ml|ML)\s*(.+)/);
      if (numFirstMatch && numFirstMatch[3]) {
        const ingredientName = numFirstMatch[3].trim();
        const cleanName = ingredientName.replace(/\(.*?\)|（.*?）/g, '').trim();
        if (cleanName && !ingredients.includes(cleanName)) {
          ingredients.push(cleanName);
          usage[cleanName] = trimmed;
        }
        continue;
      }

      // 直接使用原字符串作为食材名
      const cleanName = trimmed.replace(/\(.*?\)|（.*?）/g, '').trim();
      if (cleanName && !ingredients.includes(cleanName)) {
        ingredients.push(cleanName);
        usage[cleanName] = trimmed;
      }
    }
  }

  const protein = fd.protein != null ? fd.protein : 0;
  const carbs = fd.carbs != null ? fd.carbs : 0;
  const fat = fd.fat != null ? fd.fat : 0;
  const fiber = fd.fiber != null ? fd.fiber : 0;
  const macroLine = (protein > 0 ? `蛋白质约${protein}g` : '') +
    (carbs > 0 ? `，碳水约${carbs}g` : '') +
    (fat > 0 ? `，脂肪约${fat}g` : '') +
    (fiber > 0 ? `，膳食纤维约${fiber}g` : '');
  const goalLabel = fd.goal === 'lose' ? '减脂' : fd.goal === 'keep' ? '维持' : '增肌';
  return {
    id: fd.id,
    name: fd.name,
    coverImage: String(fd.coverImage || '').trim(),
    description: `${fd.description || ''}。${goalLabel}餐。约${fd.calories}kcal。${macroLine}`,
    ingredients: ingredients.length > 0 ? ingredients : [fd.name],
    mealTimes: ['breakfast', 'lunch', 'dinner'],
    dishTypes: ['diet'],
    timeCost: 15,
    difficulty: fd.difficulty,
    steps: fd.steps || [],
    usage: Object.keys(usage).length > 0 ? usage : null
  };
}

/** 从菜谱中查找儿童餐（ageBand 非空，或 childrenMeal=true） */
async function loadChildMealByIdAsync(id: string): Promise<ChildMeal | null> {
  const recipes = await loadAllRecipesAsync();
  const matched = recipes.find(r =>
    String(r.id || '').trim() === id &&
    (!!(r as any).childrenMeal || !!(r as any).ageBand)
  );
  if (!matched) return null;
  return matched as unknown as ChildMeal;
}

function fitnessGoalPrimaryLabel(goal: string): string {
  if (goal === 'lose') return '减脂餐';
  if (goal === 'gain') return '增肌餐';
  if (goal === 'keep') return '维持餐';
  return '健身餐';
}

function childMealToRecipe(cm: ChildMeal): Recipe {
  const usage: Record<string, string> = {};
  let ingredients: string[] = [];

  // 新格式优先用 items（有数据时），否则用 ingredients + usage
  const hasItems = Array.isArray(cm.items) && cm.items.some((it: any) => it && it.name && String(it.name).trim());
  if (hasItems) {
    for (const it of cm.items || []) {
      const n = String(it.name || '').trim();
      if (!n) continue;
      usage[n] = (it.amount && String(it.amount).trim()) || '适量';
    }
    ingredients = (cm.items || []).map((i: any) => String(i.name || '').trim()).filter(Boolean);
  } else {
    // 新格式：ingredients + usage
    const ingArr = Array.isArray(cm.ingredients) ? cm.ingredients : [];
    ingredients = ingArr.map(String).filter(Boolean);
    if (cm.usage && typeof cm.usage === 'object') {
      for (const [k, v] of Object.entries(cm.usage)) {
        usage[k] = String(v || '适量').trim();
      }
    }
  }
  const macros = cm.macros || { protein: 0, carb: 0, fat: 0 };
  const macroLine = `蛋白质约${macros.protein}g，碳水约${macros.carb}g，脂肪约${macros.fat}g`;
  const mealTime = cm.mealTime && String(cm.mealTime).trim()
    ? [cm.mealTime]
    : (Array.isArray(cm.mealTimes) && cm.mealTimes.length > 0 ? cm.mealTimes : ['lunch']);
  return {
    id: cm.id,
    name: cm.name,
    coverImage: cm.coverImage || '',
    description: `约${cm.calories || 0}kcal/份。${macroLine}。\n${cm.description || ''}`,
    ingredients,
    mealTimes: mealTime,
    dishTypes: ['children'],
    timeCost: 20,
    difficulty: cm.difficulty,
    steps: cm.steps || [],
    usage
  };
}

function childAgePrimaryLabel(ageBand: string): string {
  if (ageBand === 'toddler' || ageBand === '1-2y') return '1-2岁辅食';
  if (ageBand === 'preschool' || ageBand === '3-6y') return '3-6岁幼童餐';
  if (ageBand === 'school' || ageBand === '7-12y') return '7-12岁学龄餐';
  return '儿童餐';
}

Page({
  data: {
    entryFrom: 'list',
    isFitnessMeal: false,
    isChildrenMeal: false,
    recipeId: '',
    recipeName: '',
    recipe: null as Recipe | null,
    coverUrl: '',
    timeCost: 0,
    difficultyLabel: '',
    mealTimeLabel: '',
    primaryCategoryLabel: '',
    secondaryCategoryLabels: [] as string[],
    calories: '' as string | null,
    allIngredients: [] as Array<{ name: string; amount: string }>,
    steps: [] as string[],
    showIngredientCompare: false,
    userIngredients: [] as string[],
    ownedCore: [] as string[],
    missingCore: [] as string[],
    ownedOptional: [] as string[],
    missingOptional: [] as string[],
    missingForBasket: [] as string[],
    isFavorited: false,
    isInBasket: false,
    sessionId: '' as string,
    // Toast 提示状态
    toastShow: false,
    toastMessage: '',
    toastType: 'info' as 'info' | 'success' | 'warning',
    toastShowButton: false,
    toastButtonText: '去看看',
    toastDuration: 2000,
    toastIcon: '',
    toastSubtitle: '',
    // 冰箱状态
    hasFridge: false
  },

    async onLoad(query: Record<string, string>) {
    const id = query && query.id ? String(query.id).trim() : '';
    const from = query && query.from ? String(query.from).trim() : 'list';
    const sessionId = query && query.sessionId ? String(query.sessionId).trim() : '';

    // 保存 sessionId 用于拍照识别会话判断
    this.setData({ sessionId });

    if (!id) {
      console.warn('[detail] id 为空，无法加载详情');
      safeBackToList(from);
      return;
    }

    if (from === 'fitness') {
      const fd = await loadFitnessDishByIdAsync(id);
      if (!fd) {
        safeBackToList('fitness');
        return;
      }
      const recipe = fitnessDishToRecipe(fd);
      try {
        wx.setNavigationBarTitle({ title: recipe.name });
      } catch (_e) {}

      const difficultyLabel = getDifficultyLabel(recipe.difficulty);
      const mealTimeLabel = getMealTimeLabelString(recipe.mealTimes);
      const primaryCategoryLabel = fitnessGoalPrimaryLabel(fd.goal);
      const secondaryCategoryLabels = stripMealTimeFromSecondary(mealTimeLabel, []);
      const calories = extractCalories(recipe.description);
      const steps = normalizeStepsForDisplay(recipe.steps, recipe.description);
      const allIngredients = uniq(recipe.ingredients || []).map((name) => ({
        name,
        amount:
          recipe.usage && Object.keys(recipe.usage).length > 0
            ? resolveUsageAmount(name, recipe.usage)
            : '适量'
      }));

      // 获取用户食材进行对比
      // 只有用户至少勾选了一个食材（storage 非空）才显示对比
      const userIngredients = this._loadUserIngredients();
      const hasUserData = userIngredients.length > 0;
      const { ownedCore, missingCore, ownedOptional, missingOptional } = this._compareIngredientsWithRecipe(userIngredients, recipe.ingredients || []);
      // 有用户数据且至少有一个分类有内容时才显示对比
      const showCompare = hasUserData && (ownedCore.length > 0 || missingCore.length > 0 || ownedOptional.length > 0 || missingOptional.length > 0);

      this.setData({
        entryFrom: 'fitness',
        isFitnessMeal: true,
        isChildrenMeal: false,
        recipeId: id,
        recipeName: recipe.name,
        recipe,
        coverUrl: (recipe && recipe.coverImage) ? String(recipe.coverImage).trim() : '',
        timeCost: recipe.timeCost ?? null,
        difficultyLabel,
        mealTimeLabel,
        primaryCategoryLabel,
        secondaryCategoryLabels,
        calories,
        allIngredients,
        steps,
        showIngredientCompare: showCompare,
        userIngredients,
        ownedCore,
        missingCore,
        ownedOptional,
        missingOptional,
        missingForBasket: [...missingCore],
        isFavorited: false,
        isInBasket: isRecipeInBasket(id),
        hasFridge: hasUserData
      });
      // 后台静默更新收藏状态
      collectionService.isRecipeCollected(Number(id)).then(fav => {
        if (fav) this.setData({ isFavorited: true });
      }).catch(() => {});
      return;
    }

    if (from === 'children') {
      const cm = await loadChildMealByIdAsync(id);
      if (!cm) {
        safeBackToList('children');
        return;
      }
      const recipe = childMealToRecipe(cm);
      try {
        wx.setNavigationBarTitle({ title: recipe.name });
      } catch (_e) {}

      const difficultyLabel = getDifficultyLabel(recipe.difficulty);
      const mealTimeLabel = getMealTimeLabelString(recipe.mealTimes);
      const primaryCategoryLabel = childAgePrimaryLabel(cm.ageBand);
      const secondaryCategoryLabels = stripMealTimeFromSecondary(mealTimeLabel, []);
      const calories = extractCalories(recipe.description);
      const steps = normalizeStepsForDisplay(recipe.steps, recipe.description);
      const allIngredients = uniq(recipe.ingredients || []).map((name) => ({
        name,
        amount:
          recipe.usage && Object.keys(recipe.usage).length > 0
            ? resolveUsageAmount(name, recipe.usage)
            : '适量'
      }));

      // 获取用户食材进行对比
      const userIngredients = this._loadUserIngredients();
      const hasUserData = userIngredients.length > 0;
      const { ownedCore, missingCore, ownedOptional, missingOptional } = this._compareIngredientsWithRecipe(userIngredients, recipe.ingredients || []);
      const showCompare = hasUserData && (ownedCore.length > 0 || missingCore.length > 0 || ownedOptional.length > 0 || missingOptional.length > 0);

      // 收藏状态先设 false，后台静默更新
      collectionService.isRecipeCollected(Number(id)).then(fav => {
        if (fav) this.setData({ isFavorited: true });
      }).catch(() => {});

      this.setData({
        entryFrom: 'children',
        isFitnessMeal: false,
        isChildrenMeal: true,
        recipeId: id,
        recipeName: recipe.name,
        recipe,
        coverUrl: (recipe && recipe.coverImage) ? String(recipe.coverImage).trim() : '',
        timeCost: recipe.timeCost ?? null,
        difficultyLabel,
        mealTimeLabel,
        primaryCategoryLabel,
        secondaryCategoryLabels,
        calories,
        allIngredients,
        steps,
        showIngredientCompare: showCompare,
        userIngredients,
        ownedCore,
        missingCore,
        ownedOptional,
        missingOptional,
        missingForBasket: [...missingCore],
        isFavorited: false,
        isInBasket: isRecipeInBasket(id),
        hasFridge: hasUserData
      });
      return;
    }

    // 从后端 API 加载菜谱数据
    console.log('[detail] 从API加载菜谱, id:', id);

    wx.showLoading({ title: '加载中...' });

    try {
      const recipes = await loadAllRecipesAsync();
      wx.hideLoading();

      let recipe = recipes.find((r) => String(r.id).trim() === id);

      if (!recipe) {
        console.warn('[detail] 未找到菜谱 id:', id);
        safeBackToList(from);
        return;
      }

      console.log('[detail] 找到菜谱:', recipe.name);
      cacheRecipe(recipe);
      this._updateRecipeDisplay(recipe, id, from);

      // 后台上报浏览量（fire-and-forget）
      recipeApi.getRecipeDetail(Number(id)).catch(() => {});
    } catch (e) {
      wx.hideLoading();
      console.error('[detail] 菜谱加载失败', e);
      safeBackToList(from);
    }
  },

  // 用完整数据更新页面显示
  async _updateRecipeDisplay(recipe: Recipe, id: string, from: string) {
    const usage = recipe.usage;
    const allIngredients = uniq(recipe.ingredients || []).map((name) => ({
      name,
      amount: usage && Object.keys(usage).length > 0 ? resolveUsageAmount(name, usage) : '适量'
    }));
    const steps = normalizeStepsForDisplay(recipe.steps, recipe.description);

    // 重新计算食材对比
    const userIngredients = this._loadUserIngredients();
    const hasUserData = userIngredients.length > 0;
    const recipeIngredients = recipe.ingredients || [];
    const { ownedCore, missingCore, ownedOptional, missingOptional } = this._compareIngredientsWithRecipe(userIngredients, recipeIngredients);
    const showCompare = hasUserData && (ownedCore.length > 0 || missingCore.length > 0 || ownedOptional.length > 0 || missingOptional.length > 0);

    // 检查收藏状态（静默失败，不影响页面加载）
    let isFavorited = false;
    try {
      isFavorited = await collectionService.isRecipeCollected(Number(id));
    } catch (_e) { /* 401 或网络错误时保持 false */ }

    this.setData({
      recipeId: String(id),
      recipeName: recipe.name,
      recipe,
      coverUrl: (recipe && recipe.coverImage) ? String(recipe.coverImage).trim() : '',
      timeCost: recipe.timeCost ?? null,
      difficultyLabel: getDifficultyLabel(recipe.difficulty),
      mealTimeLabel: getMealTimeLabelString(recipe.mealTimes),
      primaryCategoryLabel: getPrimaryCategoryLabel(recipe.dishTypes, recipe.mealTimes),
      secondaryCategoryLabels: stripMealTimeFromSecondary(
        getMealTimeLabelString(recipe.mealTimes),
        getSecondaryCategoryLabels(recipe.dishTypes, recipe.mealTimes, getPrimaryCategoryLabel(recipe.dishTypes, recipe.mealTimes))
      ),
      calories: extractCalories(recipe.description),
      allIngredients,
      steps,
      showIngredientCompare: showCompare,
      userIngredients,
      ownedCore,
      missingCore,
      ownedOptional,
      missingOptional,
      missingForBasket: [...missingCore],
      isFavorited,
      isInBasket: isRecipeInBasket(id),
      hasFridge: hasUserData
    });

    // 静默记录浏览历史
    if (authService.isLoggedIn()) {
      post('/v1/wx/app/browse-history', { recipeId: Number(id), source: from }, { withToken: true }).catch(() => {});
    }
  },

  onGoBack() {
    safeBackToList(this.data.entryFrom);
  },

  onAddAllToBasket() {
    const recipe = this.data.recipe as Recipe | null;
    if (!recipe) return;

    const isInBasket = this.data.isInBasket;

    if (isInBasket) {
      // 移出小菜篮
      removeRecipeById(recipe.id);
      this.setData({ isInBasket: false });
      wx.showToast({ title: '已移出小菜篮', icon: 'none' });
    } else {
      // 加入小菜篮：优先使用 recipe.usage 中的精确用量，其次用"适量"
      const ingredients = uniq(recipe.ingredients || []).map((name) => ({
        name,
        amount: (recipe.usage && recipe.usage[name]) ? recipe.usage[name] : '适量'
      }));

      if (!ingredients.length) {
        wx.showToast({ title: '暂无食材数据', icon: 'none' });
        return;
      }
      addRecipeIngredients(recipe.id, recipe.name, ingredients);
      this.setData({ isInBasket: true });
      wx.showToast({ title: '已加入小菜篮', icon: 'success' });
    }
  },

  onAddMissingToBasket() {
    const recipe = this.data.recipe as Recipe | null;
    if (!recipe) return;
    const missing = (this.data.missingForBasket || []) as string[];
    if (!missing.length) {
      wx.showToast({ title: '没有缺少的食材', icon: 'none' });
      return;
    }
    const ingredients = missing.map((name) => ({ name, amount: '适量' }));
    addRecipeIngredients(recipe.id, recipe.name, ingredients);
    wx.showToast({ title: '缺少的已加入小菜篮', icon: 'success' });
  },

  // 检查食材是否在冰箱中
  isIngredientOwned(name: string): boolean {
    const userIngredients = this.data.userIngredients || [];
    const normalized = name.trim().toLowerCase();
    return userIngredients.some((ing: string) =>
      ing.trim().toLowerCase() === normalized
    );
  },

  // 添加食材到冰箱
  onAddToFridge() {
    const recipe = this.data.recipe as Recipe | null;
    if (!recipe || !recipe.ingredients || recipe.ingredients.length === 0) {
      wx.showToast({ title: '暂无食材数据', icon: 'none' });
      return;
    }

    // 获取用户已有的食材
    const userIngredients = this._loadUserIngredients();
    const fridgeNames = new Set(userIngredients);

    // 简单别名匹配
    const aliases: Record<string, string> = {
      '西红柿': '番茄',
      '马铃薯': '土豆',
      '姜': '姜',
      '生姜': '姜',
      '蒜': '蒜',
      '大蒜': '蒜',
    };

    // 找出冰箱里没有的食材
    const notInFridge = recipe.ingredients.filter((name: string) => {
      const normalized = name.trim();
      if (fridgeNames.has(normalized)) return false;
      // 检查别名
      for (const [alias, standard] of Object.entries(aliases)) {
        if (normalized.includes(alias) || alias.includes(normalized)) {
          if (fridgeNames.has(standard)) return false;
        }
      }
      return true;
    });

    if (notInFridge.length === 0) {
      wx.showToast({ title: '食材已在冰箱中', icon: 'none' });
      return;
    }

    wx.showModal({
      title: '添加到冰箱',
      content: `将 ${notInFridge.length} 种食材添加到冰箱？`,
      confirmText: '添加',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          const { addMultipleToFridge, getIngredientCategory } = require('../../utils/fridgeStore');

          const ingredients = notInFridge.map((name: string) => ({
            name: name.trim(),
            quantity: 1,
            unit: '个',
            category: getIngredientCategory(name.trim())
          }));

          addMultipleToFridge(ingredients);
          wx.showToast({
            title: `已添加 ${notInFridge.length} 种食材`,
            icon: 'success'
          });

          // 刷新对比数据
          const updatedIngredients = this._loadUserIngredients();
          this._updateIngredientCompare(updatedIngredients, recipe.ingredients || []);
        }
      }
    });
  },

  onToggleFavorite() {
    const id = this.data.recipeId;
    if (!id) return;

    if (!authService.isLoggedIn()) {
      authService.requireAuth();
      return;
    }

    wx.showLoading({ title: '请稍候...' });

    collectionService.getCollectionsWithCache().then(async (collections) => {
      wx.hideLoading();

      // 如果没有收藏夹，自动创建一个默认的
      if (!collections || collections.length === 0) {
        const createResult = await collectionService.createCollectionCached({
          name: '我的收藏',
          description: '默认收藏夹',
          isPublic: false,
        });
        if (!createResult.success) {
          this.showToast('创建收藏夹失败，请稍后重试', 'warning', false, '', 2000, 'warning');
          return;
        }
        // 重新获取收藏夹列表
        collections = await collectionService.getCollectionsWithCache();
        if (!collections || collections.length === 0) {
          this.showToast('创建收藏夹失败', 'warning', false, '', 2000, 'warning');
          return;
        }
      }

      const defaultCollection = (collections as any[])[0];

      if (this.data.isFavorited) {
        // 取消收藏：从所有收藏夹中移除
        for (const col of collections as any[]) {
          await collectionService.removeFavoriteCached(Number(col.id), Number(id)).catch(() => {});
        }
        this.setData({ isFavorited: false });
        this.showToast('已取消收藏', 'success', false, '', 2000, 'success');
      } else {
        // 添加收藏：加入默认收藏夹
        const result = await collectionService.addFavoriteCached(Number(defaultCollection.id), Number(id));
        if (result.success) {
          this.setData({ isFavorited: true });
          this.showToast(`已收藏到"${defaultCollection.name}"`, 'success', false, '', 2500, 'success');
        } else {
          this.showToast(result.message || '收藏失败', 'warning', false, '', 2000, 'warning');
        }
      }
    }).catch((e) => {
      wx.hideLoading();
      console.error('[Detail] 收藏操作失败:', e);
      this.showToast('网络异常，请稍后重试', 'warning', false, '', 2000, 'warning');
    });
  },

  // 长按收藏按钮 - 显示收藏夹选择器
  onFavoriteLongPress() {
    const id = this.data.recipeId;
    if (!id) return;

    if (!authService.isLoggedIn()) {
      authService.requireAuth();
      return;
    }

    wx.showLoading({ title: '加载中...' });

    collectionService.getCollectionsWithCache().then(async (collections) => {
      wx.hideLoading();

      if (!collections || collections.length === 0) {
        wx.showToast({ title: '请先创建收藏夹', icon: 'none' });
        return;
      }

      const itemList = [
        ...(collections as any[]).map(c => c.name),
        '+ 新建收藏夹'
      ];

      wx.showActionSheet({
        itemList,
        itemColor: '#111111',
        success: async (res) => {
          if (res.tapIndex === collections.length) {
            this.showCreateCollectionDialog();
          } else {
            wx.showLoading({ title: '收藏中...' });
            const targetCollection = (collections as any[])[res.tapIndex];
            const result = await collectionService.addFavoriteCached(Number(targetCollection.id), Number(id));
            wx.hideLoading();
            if (result.success) {
              this.setData({ isFavorited: true });
              this.showToast(`已添加到"${targetCollection.name}"`, 'success', false, '', 2000, 'success');
            } else {
              this.showToast(result.message || '收藏失败', 'warning', false, '', 2000, 'warning');
            }
          }
        },
        fail: () => {},
      });
    }).catch((e) => {
      wx.hideLoading();
      console.error('[Detail] 长按收藏失败:', e);
      this.showToast('网络异常，请稍后重试', 'warning', false, '', 2000, 'warning');
    });
  },

  // 显示创建新收藏夹对话框
  showCreateCollectionDialog() {
    const id = this.data.recipeId;
    if (!id) return;

    wx.showModal({
      title: '创建新收藏夹',
      editable: true,
      placeholderText: '请输入收藏夹名称',
      success: async (res) => {
        if (res.confirm && res.content) {
          const name = res.content.trim();
          if (!name) {
            this.showToast('名称不能为空', 'warning', false, '', 2500, 'warning');
            return;
          }

          const result = await collectionService.createCollectionCached({ name, isPublic: false });
          if (result.success && result.collectionId) {
            await collectionService.addFavoriteCached(result.collectionId, Number(id));
            this.setData({ isFavorited: true });
            this.showToast(`已添加到"${name}"`, 'success', false, '', 3000, 'success');
          } else {
            this.showToast(result.message || '创建失败', 'warning', false, '', 2500, 'warning');
          }
        }
      }
    });
  },

  // 切换菜谱在指定收藏夹的收藏状态
  async toggleCollectionForRecipe(recipeId: string, collectionId: string, currentlyIn: boolean) {
    if (currentlyIn) {
      await collectionService.removeFavoriteCached(Number(collectionId), Number(recipeId));
      this.showToast('已取消收藏', 'info', false, '', 2000, 'delete');
    } else {
      await collectionService.addFavoriteCached(Number(collectionId), Number(recipeId));
    }

    const isFavorited = await collectionService.isRecipeCollected(Number(recipeId));
    this.setData({ isFavorited });
  },

  onShare() {
    const recipe = this.data.recipe as Recipe | null;
    if (!recipe) return;
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
    wx.showToast({ title: '点击右上角分享', icon: 'none' });
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
    // 打开收藏夹选择器
    this.onFavoriteLongPress();
  },

  onPreviewCover() {
    const url = this.data.coverUrl;
    if (!url) return;
    wx.previewImage({
      urls: [url],
      current: url
    });
  },

  // 读取用户已有的食材（手动勾选 或 拍照识别会话 或 冰箱数据）
  _loadUserIngredients(): string[] {
    const sessionId = this.data.sessionId;

    // 1. 拍照识别会话（只在当前会话有效）
    if (sessionId && sessionId.startsWith('scan_')) {
      const storedSession = wx.getStorageSync('scanSessionId');
      if (storedSession === sessionId) {
        try {
          const scanIngredients = wx.getStorageSync('scanIngredients');
          if (Array.isArray(scanIngredients) && scanIngredients.length > 0) {
            console.log('[detail] 从拍照会话读取到', scanIngredients.length, '个食材');
            return scanIngredients;
          }
        } catch (_e) {}
      }
    }

    // 2. 手动勾选会话（只在当前会话有效）
    if (sessionId && sessionId.startsWith('select_')) {
      const storedSession = wx.getStorageSync('selectSessionId');
      if (storedSession === sessionId) {
        try {
          const selectIngredients = wx.getStorageSync('selectIngredients');
          if (Array.isArray(selectIngredients) && selectIngredients.length > 0) {
            console.log('[detail] 从勾选会话读取到', selectIngredients.length, '个食材');
            return selectIngredients;
          }
        } catch (_e) {}
      }
    }

    // 3. Fallback: 从冰箱读取用户食材
    const fridgeIngredients = getFridgeIngredientNames();
    if (fridgeIngredients.length > 0) {
      console.log('[detail] 从冰箱读取到', fridgeIngredients.length, '个食材');
      return fridgeIngredients;
    }

    return [];
  },

  // 对比菜谱食材与用户食材，计算已备/缺少
  _compareIngredientsWithRecipe(userIngredients: string[], recipeIngredients: string[]) {
    if (!userIngredients.length) {
      return {
        ownedCore: [] as string[],
        missingCore: [] as string[],
        ownedOptional: [] as string[],
        missingOptional: [] as string[]
      };
    }

    const userSet = new Set(userIngredients.map(i => i.trim()).filter(Boolean));
    const expandedUserSet = new Set([
      ...userSet,
      ...expandUserIngredients(Array.from(userSet))
    ]);

    // 核心食材 vs 可选调料的划分
    const { coreIngredients, optionalIngredients } = this._getIngredientCategories();

    const ownedCoreSet = new Set<string>();
    const missingCore: string[] = [];
    const ownedOptionalSet = new Set<string>();
    const missingOptional: string[] = [];

    for (const ing of recipeIngredients) {
      const name = ing.trim();
      if (!name) continue;

      // 检查是否匹配（包括扩展匹配）
      const isOwned = expandedUserSet.has(name);

      if (coreIngredients.has(name)) {
        if (isOwned) ownedCoreSet.add(name);
        else missingCore.push(name);
      } else if (optionalIngredients.has(name)) {
        if (isOwned) ownedOptionalSet.add(name);
        else missingOptional.push(name);
      } else {
        // 默认当作核心食材
        if (isOwned) ownedCoreSet.add(name);
        else missingCore.push(name);
      }
    }

    const ownedCore = Array.from(ownedCoreSet);
    const ownedOptional = Array.from(ownedOptionalSet);

    return { ownedCore, missingCore, ownedOptional, missingOptional };
  },

  // 获取核心食材和可选调料的集合
  _getIngredientCategories(): { coreIngredients: Set<string>; optionalIngredients: Set<string> } {
    // 核心食材：必须有的（主料、配菜）
    const coreIngredients = new Set<string>([
      '鸡蛋', '番茄', '土豆', '洋葱', '大葱', '蒜瓣', '姜',
      '猪肉', '牛肉', '鸡肉', '羊肉', '鱼肉', '虾仁', '虾',
      '豆腐', '豆芽', '豆皮', '腐竹', '北豆腐', '南豆腐',
      '白菜', '青菜', '菠菜', '芹菜', '生菜', '油菜',
      '黄瓜', '胡萝卜', '青椒', '红椒', '辣椒',
      '香菇', '金针菇', '木耳', '银耳',
      '大米', '面粉', '面条', '挂面', '米饭'
    ]);

    // 可选调料：可以没有的（调味品）
    const optionalIngredients = new Set<string>([
      '油', '盐', '酱油', '生抽', '老抽', '醋', '糖', '白糖', '红糖', '冰糖', '蜂蜜',
      '食用油', '花生油', '芝麻油', '香油', '橄榄油', '玉米油',
      '料酒', '黄酒', '白酒',
      '黑胡椒', '白胡椒', '胡椒粉', '花椒', '八角', '桂皮', '香叶', '香草精',
      '蚝油', '蒸鱼豉油', '番茄酱', '沙拉酱', '芥末', '咖喱', '咖喱粉', '咖喱块',
      '小米椒', '干辣椒', '豆瓣酱', '辣椒酱', '甜面酱', '辣椒油',
      '玉米淀粉', '淀粉', '生粉', '红薯淀粉', '土豆淀粉',
      '鸡精', '味精', '浓汤宝', '高汤', '高汤或清水',
      '牛奶', '奶油', '酸奶', '淡奶油', '奶酪', '芝士', '马苏里拉奶酪',
      '面包糠', '鸡蛋液', '淀粉水',
      '椰浆', '椰奶', '燕麦', '西米', '坚果碎', '葡萄干', '海苔碎', '肉松',
      '柠檬', '柠檬汁', '薄荷', '桂花', '枸杞', '红枣', '桂圆',
      '山楂干', '乌梅', '百合', '莲子', '芡实', '薏米', '银耳'
    ]);

    return { coreIngredients, optionalIngredients };
  },

  // 更新食材对比显示
  _updateIngredientCompare(userIngredients: string[], recipeIngredients: string[]) {
    const { ownedCore, missingCore, ownedOptional, missingOptional } = 
      this._compareIngredientsWithRecipe(userIngredients, recipeIngredients);

    // 只有用户至少勾选了一个食材才显示对比
    const hasCompareData = userIngredients.length > 0 && (ownedCore.length > 0 || missingCore.length > 0 || ownedOptional.length > 0 || missingOptional.length > 0);

    console.log('[detail] 食材对比结果：', {
      userIngredientsCount: userIngredients.length,
      ownedCore: ownedCore.length,
      missingCore: missingCore.length,
      ownedOptional: ownedOptional.length,
      missingOptional: missingOptional.length,
      hasCompareData
    });

    this.setData({
      userIngredients,
      ownedCore,
      missingCore,
      ownedOptional,
      missingOptional,
      missingForBasket: [...missingCore],
      showIngredientCompare: hasCompareData
    });
  }
});
