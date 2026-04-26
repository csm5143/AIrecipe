import { ChildMeal, FitnessDish, Recipe } from '../../types/index';
import { loadRecipesJson } from '../../utils/dataLoader';
import { loadRecipesAsync } from '../../utils/dataLoader';
import {
  normalizeRecipesFromRaw,
  extractCalories,
  normalizeStepsForDisplay,
  resolveUsageAmount
} from '../../utils/recipeUtils';
import { getFallbackRecipes } from '../../utils/fallbackRecipes';
import { handleWarning } from '../../utils/errorHandler';
import { SEASONING_INGREDIENTS } from '../../utils/constants';
import { expandUserIngredients, isIngredientOwnedWithChickenExceptions } from '../../utils/ingredientUtils';
import {
  MEAL_TIME_LABELS,
  getDifficultyLabel,
  getMealTimeLabelString,
  getPrimaryCategoryLabel,
  getSecondaryCategoryLabels
} from '../../utils/labels';
import { addRecipeIngredients, isRecipeInBasket, removeRecipeById } from '../../utils/shoppingList';
import { getFridgeIngredientNames, isInFridge } from '../../utils/fridgeStore';
// 统一收藏接口：所有类型菜品共用同一个收藏列表
import { getFavorites, isFavorite, toggleFavorite } from '../../utils/favorites';
// 新的多收藏夹系统
import {
  getActiveCollection,
  toggleRecipeInCollection,
  isRecipeInCollection,
  getCollections,
  addRecipeToCollection,
  isRecipeInAnyCollection
} from '../../utils/collections';
import { cacheRecipe } from '../../utils/recipeCache';
import { getRecipeByNameFromCloud } from '../../utils/cloudService';

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

/** 异步加载全部菜谱（云端优先，自动缓存兜底） */
async function loadAllRecipesAsync(): Promise<Recipe[]> {
  let recipes: Recipe[] = [];
  try {
    recipes = await loadRecipesAsync();
  } catch (e) {
    handleWarning(e, '云端加载菜谱');
  }
  if (!recipes.length) {
    recipes = loadRecipesJson();
  }
  if (!recipes.length) {
    try {
      const recipesData = require('../data/recipes.json') as any;
      const rawList: any[] = Array.isArray(recipesData)
        ? recipesData
        : recipesData && Array.isArray((recipesData as any).recipes)
        ? (recipesData as any).recipes
        : [];
      if (rawList.length > 0) {
        recipes = normalizeRecipesFromRaw(rawList);
      }
    } catch (requireError: any) {
      handleWarning(requireError, 'require 方式加载菜谱');
    }
  }
  if (!recipes.length) {
    return getFallbackRecipes();
  }
  
  // 云数据库的 id 格式是 MD5 哈希（如 "6a0a1fb669db06c803ee086c54f6fe43"）
  // 本地数据的 id 格式是数字字符串（如 "34"）
  // 需要建立 name 映射表来支持跨数据源查找
  console.log('[detail] 加载了', recipes.length, '条菜谱');
  
  return recipes;
}

/** 懒加载单条菜谱：优先从缓存获取，未命中则异步加载全部再查找 */
async function loadRecipeByIdAsync(id: string): Promise<Recipe | null> {
  // 1. 先尝��从缓存获取（仅限单条）
  const cached = getRecipeById(id);
  if (cached) {
    return cached;
  }

  // 2. 缓存未命中，异步加载全部并查找
  const recipes = await loadAllRecipesAsync();
  let recipe = recipes.find(r => String(r.id) === id);

  // 3. 如果云数据库的 id 格式不同（MD5 哈希），尝试通过 name 查找
  // 云数据库的 id 是 "6a0a1fb669db06c803ee086c54f6fe43" 这样的格式
  // 而传入的 id 可能是 "34" 这样的数字字符串
  if (!recipe && id.length < 20) {
    // 如果 id 看起来像数字字符串，在云数据库中搜索
    console.log(`[detail] id "${id}" 未找到，尝试从云数据库按 name 查找...`);
    const cloudRecipe = await getRecipeByNameFromCloud(id);
    if (cloudRecipe) {
      console.log(`[detail] 从云数据库找到菜谱: ${cloudRecipe.name}`);
      cacheRecipe(cloudRecipe);
      return cloudRecipe;
    }
  }

  // 4. 找到后存入缓存
  if (recipe) {
    cacheRecipe(recipe);
  }

  return recipe || null;
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
    usage: Object.keys(usage).length > 0 ? usage : undefined
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
        timeCost: recipe.timeCost != null ? recipe.timeCost : undefined,
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
        isFavorited: isFavorite(id),
        isInBasket: isRecipeInBasket(id),
        hasFridge: hasUserData
      });
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

      // 使用新的多收藏夹系统检查收藏状态
      const { isRecipeInAnyCollection } = require('../../utils/collections');
      const isFavorited = isRecipeInAnyCollection(id);

      this.setData({
        entryFrom: 'children',
        isFitnessMeal: false,
        isChildrenMeal: true,
        recipeId: id,
        recipeName: recipe.name,
        recipe,
        coverUrl: (recipe && recipe.coverImage) ? String(recipe.coverImage).trim() : '',
        timeCost: recipe.timeCost != null ? recipe.timeCost : undefined,
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
        isFavorited,
        isInBasket: isRecipeInBasket(id),
        hasFridge: hasUserData
      });
      return;
    }

    // 步骤1：同步加载本地 recipes.json，立即显示基本数据
    console.log('[detail] 开始加载本地 recipes.json, id:', id);
    const t0 = Date.now();

    // 使用统一的加载函数（内部会自动选择 require 或文件系统读取）
    const localRecipes = loadRecipesJson();
    const t1 = Date.now();
    console.log('[detail] loadRecipesJson() 返回，数量:', localRecipes.length, '耗时:', t1 - t0, 'ms');

    let recipe = localRecipes.find((r) => String(r.id).trim() === id);

    if (recipe) {
      console.log('[detail] 从本地 recipes.json 找到菜品:', recipe.name, '总耗时:', Date.now() - t0, 'ms');
      this._displayRecipeBasic(recipe, id, from);
      cacheRecipe(recipe);
    } else {
      // 本地没有，先显示一个加载中的基本页面
      console.log('[detail] 本地未找到 id:', id, '，将等待异步加载。总耗时:', Date.now() - t0, 'ms');
    }

    // 步骤2：后台异步加载云端数据，更新完整信息
    loadAllRecipesAsync().then(async (cloudRecipes) => {
      // 从云端数据中查找
      let fullRecipe = cloudRecipes.find(r => String(r.id) === id);

      // 如果云端有更完整的数据，或者本地没有，用云端数据更新
      if (fullRecipe && (!recipe || this._isRecipeMoreComplete(fullRecipe, recipe))) {
        recipe = fullRecipe;
        cacheRecipe(fullRecipe);
      }

      // 如果本地和云端都没有，尝试按名称查找
      if (!recipe) {
        const cloudRecipe = await getRecipeByNameFromCloud(id);
        if (cloudRecipe) {
          recipe = cloudRecipe;
          cacheRecipe(cloudRecipe);
        }
      }

      if (!recipe) {
        safeBackToList(from);
        return;
      }

      // 用完整数据更新页面
      this._updateRecipeDisplay(recipe, id, from);
    }).catch(e => {
      handleWarning(e, '详情页加载菜谱');
      if (!recipe) {
        safeBackToList(from);
      }
    });
  },

  // 检查云端数据是否比本地缓存更完整
  _isRecipeMoreComplete(cloud: Recipe, local: Recipe): boolean {
    const hasSteps = (r: Recipe) => Array.isArray(r.steps) && r.steps.length > 0;
    const hasIngredients = (r: Recipe) => Array.isArray(r.ingredients) && r.ingredients.length > 0;
    const hasUsage = (r: Recipe) => r.usage && typeof r.usage === 'object' && Object.keys(r.usage).length > 0;

    const localScore = (hasSteps(local) ? 1 : 0) + (hasIngredients(local) ? 1 : 0) + (hasUsage(local) ? 1 : 0);
    const cloudScore = (hasSteps(cloud) ? 1 : 0) + (hasIngredients(cloud) ? 1 : 0) + (hasUsage(cloud) ? 1 : 0);

    return cloudScore > localScore;
  },

  // 立即显示菜谱基本信息（不含完整steps/usage等）
  _displayRecipeBasic(recipe: Recipe, id: string, from: string) {
    try {
      wx.setNavigationBarTitle({ title: recipe.name });
    } catch (_e) {}

    // 读取用户食材并计算对比
    const userIngredients = this._loadUserIngredients();
    const hasUserData = userIngredients.length > 0;
    const recipeIngredients = recipe.ingredients || [];
    const { ownedCore, missingCore, ownedOptional, missingOptional } = this._compareIngredientsWithRecipe(userIngredients, recipeIngredients);
    const showCompare = hasUserData && (ownedCore.length > 0 || missingCore.length > 0 || ownedOptional.length > 0 || missingOptional.length > 0);

    // 使用新的多收藏夹系统检查收藏状态
    const { isRecipeInAnyCollection } = require('../../utils/collections');
    const isFavorited = isRecipeInAnyCollection(id);

    this.setData({
      entryFrom: from,
      isFitnessMeal: false,
      isChildrenMeal: false,
      recipeId: id,
      recipeName: recipe.name,
      recipe,
      coverUrl: (recipe && recipe.coverImage) ? String(recipe.coverImage).trim() : '',
      timeCost: recipe.timeCost != null ? recipe.timeCost : undefined,
      difficultyLabel: getDifficultyLabel(recipe.difficulty),
      mealTimeLabel: getMealTimeLabelString(recipe.mealTimes),
      primaryCategoryLabel: getPrimaryCategoryLabel(recipe.dishTypes, recipe.mealTimes),
      secondaryCategoryLabels: stripMealTimeFromSecondary(
        getMealTimeLabelString(recipe.mealTimes),
        getSecondaryCategoryLabels(recipe.dishTypes, recipe.mealTimes, getPrimaryCategoryLabel(recipe.dishTypes, recipe.mealTimes))
      ),
      calories: extractCalories(recipe.description),
      allIngredients: uniq(recipe.ingredients || []).map((name) => ({
        name,
        amount: '适量'
      })),
      steps: recipe.steps && recipe.steps.length > 0 ? normalizeStepsForDisplay(recipe.steps, recipe.description) : [],
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
  },

  // 用完整数据更新页面显示
  _updateRecipeDisplay(recipe: Recipe, id: string, from: string) {
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

    // 使用新的多收藏夹系统检查收藏状态
    const { isRecipeInAnyCollection } = require('../../utils/collections');
    const isFavorited = isRecipeInAnyCollection(id);

    this.setData({
      recipe,
      coverUrl: (recipe && recipe.coverImage) ? String(recipe.coverImage).trim() : '',
      timeCost: recipe.timeCost != null ? recipe.timeCost : undefined,
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

    // 获取当前激活的收藏夹
    const activeCollection = getActiveCollection();
    if (!activeCollection) {
      // 警告：没有收藏夹
      this.showToast(
        '请先创建收藏夹',
        'warning',
        false,
        '',
        2500,
        'warning'
      );
      return;
    }

    // 检查当前菜谱是否已在活跃收藏夹中
    const isInActiveCollection = isRecipeInCollection(activeCollection.id, id);

    if (isInActiveCollection) {
      // 菜谱已在当前收藏夹中，直接取消收藏
      this.toggleCollectionForRecipe(id, activeCollection.id, true);
      // 取消收藏：info类型，显示2秒，带删除图标
      this.showToast('已取消收藏', 'info', false, '', 2000, 'delete');
    } else {
      // 菜谱不在当前收藏夹中，直接添加
      const result = toggleRecipeInCollection(id, activeCollection.id);

      if (result.success && result.added) {
        this.setData({ isFavorited: true });

        // 添加收藏成功：success类型，显示3秒（带按钮需要更长时间），带成功图标
        this.showToast(
          `已添加到"${result.collectionName}"`,
          'success',
          true,
          '修改',
          3000,
          'success'
        );

        // 触发云端同步
        const { markCollectionsDirty } = require('../../utils/collections');
        const { syncDebounced } = require('../../utils/dataSync');
        markCollectionsDirty();
        syncDebounced();
      }
    }
  },

  // 长按收藏按钮 - 显示收藏夹选择器
  onFavoriteLongPress() {
    const id = this.data.recipeId;
    if (!id) return;

    // 获取所有收藏夹
    const collections = getCollections();
    if (collections.length === 0) {
      wx.showToast({ title: '请先创建收藏夹', icon: 'none' });
      return;
    }

    // 获取当前菜品所在的所有收藏夹
    const {
      getCollectionsContainingRecipe,
      isRecipeInCollection
    } = require('../../utils/collections');
    const containingCollections = getCollectionsContainingRecipe(id);

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
      itemList: itemList.map((item, index) => {
        if (item.id === '__create_new__') {
          return item.name;
        }
        return item.isIn ? `✓ ${item.name}` : item.name;
      }),
      success: (res) => {
        console.log('[Detail] ActionSheet 选择:', res.tapIndex);
        const selectedItem = itemList[res.tapIndex];
        if (!selectedItem) return;

        if (selectedItem.id === '__create_new__') {
          // 创建新收藏夹
          console.log('[Detail] 创建新收藏夹');
          this.showCreateCollectionDialog(id);
        } else {
          // 切换该收藏夹的收藏状态
          console.log('[Detail] 切换收藏状态:', { recipeId: id, collectionId: selectedItem.id, currentlyIn: selectedItem.isIn });
          this.toggleCollectionForRecipe(id, selectedItem.id, selectedItem.isIn);
        }
      },
      fail: (err) => {
        console.log('[Detail] ActionSheet 取消或失败:', err.errMsg);
      }
    });
  },

  // 显示创建新收藏夹对话框
  showCreateCollectionDialog(recipeId: string) {
    console.log('[Detail] 显示创建收藏夹对话框, recipeId:', recipeId);
    wx.showModal({
      title: '创建新收藏夹',
      editable: true,
      placeholderText: '请输入收藏夹名称',
      defaultText: '',
      success: (res) => {
        if (res.confirm && res.content) {
          const { createCollection, addRecipeToCollection } = require('../../utils/collections');
          const name = res.content.trim();

          if (!name) {
            this.showToast('名称不能为空', 'warning', false, '', 2500, 'warning');
            return;
          }

          console.log('[Detail] 创建收藏夹:', name);
          const newCollection = createCollection({ name });
          console.log('[Detail] 创建结果:', newCollection);

          if (newCollection) {
            // 创建成功后，将菜谱添加到新收藏夹
            const addResult = addRecipeToCollection(newCollection.id, recipeId);
            console.log('[Detail] 添加菜谱到收藏夹结果:', addResult);

            // 更新UI
            this.setData({ isFavorited: true });
            console.log('[Detail] 已设置 isFavorited = true');

            // 显示轻量级提示
            this.showToast(
              `已添加到"${name}"`,
              'success',
              true,
              '修改收藏夹',
              3000,
              'success'
            );

            // 触发云端同步
            const { markCollectionsDirty } = require('../../utils/collections');
            const { syncDebounced } = require('../../utils/dataSync');
            markCollectionsDirty();
            syncDebounced();
          } else {
            this.showToast('创建失败', 'warning', false, '', 2500, 'warning');
            console.error('[Detail] 创建收藏夹失败');
          }
        } else {
          console.log('[Detail] 用户取消创建或输入为空');
        }
      }
    });
  },

  // 切换菜谱在指定收藏夹的收藏状态
  toggleCollectionForRecipe(recipeId: string, collectionId: string, currentlyIn: boolean) {
    console.log('[Detail] toggleCollectionForRecipe:', { recipeId, collectionId, currentlyIn });

    const {
      addRecipeToCollection,
      removeRecipeFromCollection
    } = require('../../utils/collections');

    let success = false;
    if (currentlyIn) {
      // 移除
      success = removeRecipeFromCollection(collectionId, recipeId);
      console.log('[Detail] 移除收藏结果:', success);
      // 显示取消收藏提示（轻量级，自动消失）
      this.showToast('已取消收藏', 'info', false, '', 2000, 'delete');
    } else {
      // 添加
      success = addRecipeToCollection(collectionId, recipeId);
      console.log('[Detail] 添加收藏结果:', success);
      // 添加成功时会触发其他流程，这里不重复显示
    }

    // 检查是否还在任何收藏夹中
    const { isRecipeInAnyCollection } = require('../../utils/collections');
    const isFavorited = isRecipeInAnyCollection(recipeId);
    console.log('[Detail] 检查收藏状态:', { recipeId, isFavorited });

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
