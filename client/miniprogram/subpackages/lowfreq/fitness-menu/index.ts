// pages/custom/fitness-menu/index.ts
// 健身餐专属菜单页面（单品组合视角）

import { FitnessDish, FitnessMealDisplay, Recipe } from '../../../types/index';
import { loadRecipesJson, loadRecipesAsync } from '../../../utils/dataLoader';
// 统一收藏接口
import { getFavorites, toggleFavorite } from '../../../utils/favorites';

interface NutritionTip {
  icon: string;
  label: string;
  value: string;
  highlight: string;
}

const NUTRITION_DB: Record<string, NutritionTip[]> = {
  lose: [
    { icon: '/assets/鸡蛋2.png', label: '高蛋白摄入', value: '每餐必有优质蛋白，如鸡胸、鱼虾、鸡蛋', highlight: '120g+/天' },
    { icon: '/assets/20_米饭.png', label: '碳水聪明吃', value: '午多早少，优先粗粮替代精制米面', highlight: '粗细搭配' },
    { icon: '/assets/零食_坚果.png', label: '选对脂肪', value: '牛油果、坚果、橄榄油，拒绝肥肉油炸', highlight: '优质脂肪' },
    { icon: '/assets/香菇.png', label: '膳食纤维必补', value: '每餐一份蔬菜，增加饱腹感延缓血糖', highlight: '300g+/天' },
    { icon: '/assets/鱼.png', label: 'Omega-3 护心', value: '每周至少两次深海鱼，降低炎症反应', highlight: '2次+/周' },
    { icon: '/assets/鸡蛋.png', label: '蛋白质优先早餐', value: '早起先吃蛋白，激活一天的代谢消耗', highlight: '早餐加蛋' },
    { icon: '/assets/煮食.png', label: '少油烹饪', value: '蒸、煮、炖、烤为主，减少煎炸用油', highlight: '蒸煮为主' },
    { icon: '/assets/粥.png', label: '主食放在训练后', value: '运动结束后 30 分钟内补充碳水，效率最高', highlight: '训练后吃' },
    { icon: '/assets/凉菜.png', label: '多喝水少糖饮', value: '每天 2000ml 白水，戒掉奶茶和甜饮料', highlight: '戒糖饮水' },
    { icon: '/assets/面食.png', label: '避免隐形碳水', value: '酱料、薯片、饼干等零食碳水很高', highlight: '零食戒断' },
  ],
  keep: [
    { icon: '/assets/鸡蛋2.png', label: '蛋白质要均衡', value: '每餐一拳大小蛋白，稳定肌肉不流失', highlight: '100g+/天' },
    { icon: '/assets/20_米饭.png', label: '粗细粮各半', value: '主食粗细搭配，粗粮占一半更健康', highlight: '粗细各半' },
    { icon: '/assets/零食_坚果.png', label: '每天一小把坚果', value: '补充优质脂肪和微量元素，不贪多', highlight: '一手量' },
    { icon: '/assets/香菇.png', label: '蔬菜颜色丰富', value: '每天至少两种颜色的蔬菜，营养更全', highlight: '多色蔬菜' },
    { icon: '/assets/油炸.png', label: '控制加工食品', value: '少吃香肠、腊肉等加工肉，减少添加剂', highlight: '少加工' },
    { icon: '/assets/鱼.png', label: '每周吃一次鱼', value: '补充优质蛋白和 DHA，有益大脑健康', highlight: '1次+/周' },
    { icon: '/assets/煮食.png', label: '少盐少酱油', value: '用天然香料替代酱油，减少钠摄入', highlight: '少盐多香' },
    { icon: '/assets/汤品.png', label: '饭前喝碗汤', value: '餐前喝一小碗汤，有效降低总进食量', highlight: '饭前汤法' },
    { icon: '/assets/面食.png', label: '全谷物替代白米', value: '燕麦、糙米、全麦面包升糖更平稳', highlight: '全谷优先' },
    { icon: '/assets/饮品.png', label: '少喝含糖饮料', value: '果汁、奶茶热量高且饱腹感差', highlight: '白水为主' },
  ],
  gain: [
    { icon: '/assets/鸡蛋2.png', label: '蛋白质要翻倍', value: '每公斤体重摄入 2g 蛋白，肌肉合成所需', highlight: '150g+/天' },
    { icon: '/assets/20_米饭.png', label: '碳水要管够', value: '训练前后大量补充碳水，保证训练状态', highlight: '高碳水' },
    { icon: '/assets/主食.png', label: '训练前补碳水', value: '训练前 1 小时进食，保证血糖稳定供能', highlight: '训前补碳' },
    { icon: '/assets/鸡蛋.png', label: '增肌期多吃蛋黄', value: '蛋黄富含胆固醇，是合成雄激素的原料', highlight: '不弃蛋黄' },
    { icon: '/assets/鱼.png', label: '深海鱼 Omega-3', value: '减少训练后的炎症，加速肌肉修复', highlight: '抗炎修复' },
    { icon: '/assets/零食_坚果.png', label: '加餐补充热量', value: '两餐之间加餐，避免热量缺口导致掉肌', highlight: '加餐策略' },
    { icon: '/assets/煮食.png', label: '烹饪不用水煮', value: '增肌期适量用油，健康油脂也是热量来源', highlight: '健康油脂' },
    { icon: '/assets/豆制品.png', label: '植物蛋白辅助', value: '豆腐、豆浆提供额外蛋白和氨基酸', highlight: '动植物双补' },
    { icon: '/assets/汉堡包.png', label: '可用增肌粉补齐', value: '日常饮食无法满足时，用补剂弥补缺口', highlight: '补剂辅助' },
    { icon: '/assets/饮品.png', label: '训练期补电解质', value: '大强度训练后喝运动饮料，防止抽筋', highlight: '电解质补充' },
  ],
};

/** 当天固定顺序 */
function pickTipsForDay(goal: string, count = 3): NutritionTip[] {
  const pool = NUTRITION_DB[goal] || NUTRITION_DB.lose;
  const seed = getTodaySeed(goal);
  const result: NutritionTip[] = [];
  const shuffled = seededShuffle(pool, seed);
  for (let i = 0; result.length < count && i < shuffled.length; i++) {
    if (!result.some(r => r.label === shuffled[i].label)) {
      result.push(shuffled[i]);
    }
  }
  return result;
}

function pickTipsShuffle(goal: string, count: number, excludeLabels: string[]): NutritionTip[] {
  const pool = NUTRITION_DB[goal] || NUTRITION_DB.lose;
  const seed = getTodaySeed(goal) + Date.now() % 1000;
  const exclude = new Set(excludeLabels.filter(Boolean));
  const novel = pool.filter((t) => !exclude.has(t.label));
  let ordered: NutritionTip[];
  if (novel.length >= count) {
    ordered = seededShuffle(novel, seed);
  } else {
    ordered = seededShuffle([...novel, ...pool.filter((t) => exclude.has(t.label))], seed);
  }
  return ordered.slice(0, Math.min(count, pool.length));
}

/** 根据 fitnessCategory 将一餐的菜品分为碳水/蛋白质/蔬菜 */
function splitMealByCategory(meal: FitnessMealDisplay | null): {
  carbs: FitnessDish[];
  proteins: FitnessDish[];
  veggies: FitnessDish[];
} {
  if (!meal) return { carbs: [], proteins: [], veggies: [] };
  const carbs: FitnessDish[] = [];
  const proteins: FitnessDish[] = [];
  const veggies: FitnessDish[] = [];
  const veggieCategories = ['vegetables', 'soups', 'salads', 'cold_dishes', 'stir_fry'];
  const proteinKeywords = ['鸡腿', '鸡胸', '鸡翅', '虾', '鱼', '肉', '牛', '猪', '蛋', '豆腐', '牛肉', '猪肉'];
  meal.dishes.forEach(d => {
    const cat = d.fitnessCategory || '';
    if (cat === 'carbs') {
      carbs.push(d);
    } else if (cat === 'proteins') {
      proteins.push(d);
    } else if (veggieCategories.includes(cat)) {
      veggies.push(d);
    } else {
      const name = d.name || '';
      const isProtein = proteinKeywords.some(k => name.includes(k));
      if (isProtein) {
        proteins.push(d);
      } else {
        veggies.push(d);
      }
    }
  });
  return { carbs, proteins, veggies };
}

/** 计算营养区标题 */
interface MealSectionTitles {
  mergedTitle: string;
  mergedDot: string;
  mergedSubs: string[];
  showCarbs: boolean;
  showProteins: boolean;
  showVeggies: boolean;
}

function calcSectionTitles(sections: { carbs: FitnessDish[]; proteins: FitnessDish[]; veggies: FitnessDish[] }): MealSectionTitles {
  const { carbs, proteins, veggies } = sections;
  const hasCarbs = carbs.length > 0;
  const hasProteins = proteins.length > 0;
  const hasVeggies = veggies.length > 0;
  const mergedSubs: string[] = [];
  if (hasCarbs) mergedSubs.push('能量供给');
  if (hasProteins) mergedSubs.push('肌肉修复');
  if (hasVeggies) mergedSubs.push('膳食纤维');
  return {
    mergedTitle: '',
    mergedDot: '#333333',
    mergedSubs,
    showCarbs: hasCarbs,
    showProteins: hasProteins,
    showVeggies: hasVeggies
  };
}

/** 基于日期的种子随机数生成器（每天固定） */
function createSeededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/** 当天日期种子：年 * 10000 + 月 * 100 + 日 */
function getTodaySeed(goal: string): number {
  const now = new Date();
  const datePart = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
  const goalCode = goal.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return datePart + goalCode * 31;
}

/** 确定性洗牌（每天固定顺序） */
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const a = arr.slice();
  const rand = createSeededRandom(seed);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const t = a[i];
    a[i] = a[j];
    a[j] = t;
  }
  return a;
}

/** 随机选 n 个（使用当天固定种子） */
function pickRandom<T>(arr: T[], n: number, seed: number, exclude: Set<string> = new Set()): T[] {
  const pool = arr.filter(a => !exclude.has((a as any).id));
  const shuffled = seededShuffle(pool, seed);
  return shuffled.slice(0, Math.min(n, shuffled.length));
}

function goalBadgeText(goal: string): string {
  if (goal === 'lose') return '减脂';
  if (goal === 'keep') return '维持';
  if (goal === 'gain') return '增肌';
  return '推荐';
}

function goalStrategyLine(goal: string): string {
  if (goal === 'lose') return '低脂低碳水，高蛋白，优先粗粮和优质蛋白';
  if (goal === 'keep') return '热量适中，三大营养素均衡搭配';
  if (goal === 'gain') return '热量充足，碳水蛋白双高，促进肌肉合成';
  return '';
}

function overviewIconForGoal(goal: string): string {
  if (goal === 'lose') return '/assets/运动减肥中.png';
  if (goal === 'keep') return '/assets/健身房.png';
  if (goal === 'gain') return '/assets/健身.png';
  return '/assets/减脂餐.png';
}

/** 过敏原黑名单 */
const ALLERGY_EXCLUDE_MAP: Record<string, string[]> = {
  seafood: ['虾', '蟹', '鱼', '三文鱼', '鳕鱼', '鲈鱼', '虾仁', '海鲜'],
  nuts: ['花生', '核桃', '杏仁', '腰果', '榛子', '坚果'],
  dairy: ['牛奶', '奶酪', '芝士', '酸奶', '黄油'],
  peanut: ['花生'],
  wheat: ['面粉', '面条', '馒头', '面包', '意面', '饺子皮'],
  soy: ['豆腐', '豆干', '豆浆']
};

function allergiesForFilter(raw: unknown): string[] {
  const arr = Array.isArray(raw) ? (raw as string[]) : [];
  return arr.filter((a) => String(a || '').trim() && a !== 'none');
}

/** 将 usage 格式化为列表展示文案 */
function formatUsageForDisplay(usage: unknown): string {
  if (usage == null) return '';
  if (typeof usage === 'string') return usage.trim();
  if (typeof usage === 'object' && !Array.isArray(usage)) {
    const parts: string[] = [];
    for (const [k, v] of Object.entries(usage as Record<string, unknown>)) {
      const name = String(k || '').trim();
      if (!name) continue;
      const amt = v != null ? String(v).trim() : '';
      parts.push(amt ? `${name} ${amt}` : name);
    }
    return parts.join('，');
  }
  return '';
}

const MACRO_PHRASES_PROTEIN = ['偏高蛋白', '优质蛋白向', '肌肉友好型', '蛋白补给为主', '蛋白质占比较高'];
const MACRO_PHRASES_CARB = ['偏主食碳水', '碳水补能向', '能量以碳水为主', '主食担当型', '主食向补给'];
const MACRO_PHRASES_BALANCED = ['三大营养素较均衡', '搭配相对温和', '营养比例适中', '均衡搭配向'];
const MACRO_PHRASES_VEG = ['膳食纤维丰富', '清爽蔬菜向', '维生素与纤维', '轻负担搭配', '蔬菜为主'];

function hashString(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h) ^ s.charCodeAt(i);
  }
  return Math.abs(h);
}

function pickMacroPhrase(phrases: readonly string[], seed: number): string {
  if (!phrases.length) return '';
  return phrases[seed % phrases.length];
}

function dishMacroNumbers(d: FitnessDish): { p: number; c: number } {
  const n = d.nutrition;
  const p = (d.protein != null ? d.protein : n && n.protein != null ? n.protein : 0) || 0;
  const c = (d.carbs != null ? d.carbs : n && n.carbs != null ? n.carbs : 0) || 0;
  return { p, c };
}

function macroHintForDish(d: FitnessDish): string {
  const cat = String(d.fitnessCategory || '');
  const seed = hashString(`${d.id}|${d.name}`);
  const { p, c } = dishMacroNumbers(d);
  const veggieCats = ['vegetables', 'soups', 'salads', 'cold_dishes', 'stir_fry'];

  if (cat === 'proteins') {
    return pickMacroPhrase(MACRO_PHRASES_PROTEIN, seed);
  }
  if (cat === 'carbs') {
    return pickMacroPhrase(MACRO_PHRASES_CARB, seed);
  }

  if (veggieCats.includes(cat)) {
    if (cat === 'stir_fry' && p >= 10 && c >= 6 && p >= c * 0.65) {
      return pickMacroPhrase(['蛋蔬搭配、偏蛋白质', '蛋白与蔬菜兼有', '小炒、蛋白感更明显'], seed);
    }
    if (cat === 'stir_fry' && c >= 14 && c > p * 1.15) {
      return pickMacroPhrase(['蔬菜为主、略带碳水', '配菜有一定主食感', '碳水辅助型小炒'], seed);
    }
    if (p >= 12 && p > c) {
      return pickMacroPhrase(['蛋白与纤维兼有', '高蛋白佐蔬菜感', '偏蛋白的蔬菜料理'], seed);
    }
    return pickMacroPhrase(MACRO_PHRASES_VEG, seed);
  }

  if (p > 0 || c > 0) {
    if (p >= 12 && p >= c * 0.75) return pickMacroPhrase(MACRO_PHRASES_PROTEIN, seed);
    if (c >= 18 && c > p * 1.1) return pickMacroPhrase(MACRO_PHRASES_CARB, seed);
    return pickMacroPhrase(MACRO_PHRASES_BALANCED, seed);
  }

  return pickMacroPhrase(MACRO_PHRASES_BALANCED, seed);
}

function annotateDishesMacroHints(dishes: FitnessDish[]): FitnessDish[] {
  return dishes.map((d) => ({ ...d, macroHint: macroHintForDish(d) }));
}

function annotateMealSections(sections: { carbs: FitnessDish[]; proteins: FitnessDish[]; veggies: FitnessDish[] }) {
  return {
    carbs: annotateDishesMacroHints(sections.carbs),
    proteins: annotateDishesMacroHints(sections.proteins),
    veggies: annotateDishesMacroHints(sections.veggies)
  };
}

/** 根据菜品名称和类型推断 fitnessCategory */
function inferFitnessCategory(name: string, _dishTypes: string[]): string {
  const proteinKeywords = ['鸡', '肉', '鱼', '虾', '蛋', '豆腐', '牛', '猪', '羊', '鸭'];
  const carbKeywords = ['饭', '米', '面', '包', '馒头', '粥', '薯', '玉米', '麦', '豆'];
  const soupKeywords = ['汤'];
  const saladKeywords = ['沙拉', '凉拌'];
  const stirFryKeywords = ['炒'];

  if (proteinKeywords.some(k => name.includes(k))) return 'proteins';
  if (carbKeywords.some(k => name.includes(k))) return 'carbs';
  if (soupKeywords.some(k => name.includes(k))) return 'soups';
  if (saladKeywords.some(k => name.includes(k))) return 'salads';
  if (stirFryKeywords.some(k => name.includes(k))) return 'stir_fry';
  return 'vegetables';
}

/** 加载健身单品数据（本地优先，自动缓存兜底） */
let _cachedDishes: FitnessDish[] | null = null;
async function loadFitnessDishesAsync(): Promise<FitnessDish[]> {
  if (_cachedDishes) {
    return _cachedDishes;
  }

  // 本地加载
  let recipes: Recipe[] = [];
  try {
    recipes = await loadRecipesAsync();
  } catch (e) {
    console.warn('[fitness-menu] 加载失败', e);
  }
  if (!recipes.length) {
    recipes = loadRecipesJson();
  }

  const all: FitnessDish[] = [];

  for (const recipe of recipes) {
    if (!recipe.fitnessMeal && !(recipe as any).fitnessCategory) continue;

    const dishTypes = recipe.dishTypes || [];
    const name = recipe.name || '';
    const id = String(recipe.id || '');
    const cat = String((recipe as any).fitnessCategory || inferFitnessCategory(name, dishTypes));

    const dish: FitnessDish = {
      id,
      name,
      coverImage: recipe.coverImage || '',
      description: recipe.description || '',
      ingredients: recipe.ingredients || [],
      mealTimes: recipe.mealTimes || ['lunch', 'dinner'],
      dishTypes,
      timeCost: recipe.timeCost || 15,
      difficulty: recipe.difficulty || 'easy',
      calories: (recipe.nutrition && recipe.nutrition.calories) || (recipe as any).calories || 0,
      usage: recipe.usage || {},
      steps: recipe.steps || [],
      fitnessMeal: true,
      fitnessCategory: cat,
      goal: (recipe as any).goal || 'all',
      nutrition: recipe.nutrition || {
        calories: (recipe as any).calories || 0,
        protein: (recipe as any).protein || 0,
        carbs: (recipe as any).carbs || 0,
        fat: (recipe as any).fat || 0,
        fiber: (recipe as any).fiber || 0
      }
    };
    dish.usageDisplay = formatUsageForDisplay(dish.usage);
    all.push(dish);
  }
  
  _cachedDishes = all;
  return all;
}

/** 过滤单品（根据过敏原） */
function filterDishes(dishes: FitnessDish[], allergies: string[]): FitnessDish[] {
  if (allergies.length === 0) return dishes;
  return dishes.filter(d => {
    for (const allergy of allergies) {
      const blacklist = ALLERGY_EXCLUDE_MAP[allergy];
      if (!blacklist) continue;
      const usageStr = typeof d.usage === 'string' ? d.usage
        : (d.usage && typeof d.usage === 'object') ? Object.values(d.usage).join(' ')
        : '';
      if (blacklist.some(b => usageStr.includes(b) || d.name.includes(b))) {
        return false;
      }
    }
    return true;
  });
}

/** 根据用餐时段构建一餐 */
function buildMealSet(
  mealTime: 'breakfast' | 'lunch' | 'dinner',
  proteins: FitnessDish[],
  carbs: FitnessDish[],
  vegetables: FitnessDish[],
  extras: FitnessDish[],
  seed: number
): FitnessDish[] {
  const result: FitnessDish[] = [];
  const rand = createSeededRandom(seed);

  const roll = (threshold: number) => rand() > threshold;
  const rollN = (max: number) => Math.floor(rand() * (max + 1));

  if (mealTime === 'breakfast') {
    const c = pickRandom(carbs, 1, seed, new Set());
    c.forEach(x => { result.push(x); });
    const pc = rollN(1) + 1;
    const p = pickRandom(proteins, pc, seed + 1, new Set(result.map(x => x.id)));
    p.forEach(x => { result.push(x); });
    if (vegetables.length > 0) {
      const v = pickRandom(vegetables, 1, seed + 2, new Set(result.map(x => x.id)));
      v.forEach(x => { result.push(x); });
    }
    if (roll(0.5)) {
      const e = pickRandom(extras, 1, seed + 3, new Set(result.map(x => x.id)));
      e.forEach(x => { result.push(x); });
    }
  } else if (mealTime === 'lunch') {
    const c = pickRandom(carbs, 1, seed, new Set());
    c.forEach(x => { result.push(x); });
    const p = pickRandom(proteins, 1, seed + 1, new Set(result.map(x => x.id)));
    p.forEach(x => { result.push(x); });
    const vc = rollN(1) + 1;
    const v = pickRandom(vegetables, vc, seed + 2, new Set(result.map(x => x.id)));
    v.forEach(x => { result.push(x); });
  } else {
    const p = pickRandom(proteins, 1, seed, new Set());
    p.forEach(x => { result.push(x); });
    if (roll(0.4)) {
      const c = pickRandom(carbs, 1, seed + 1, new Set(result.map(x => x.id)));
      c.forEach(x => { result.push(x); });
    }
    const v = pickRandom(vegetables, 2, seed + 2, new Set(result.map(x => x.id)));
    v.forEach(x => { result.push(x); });
  }

  return result;
}

function calcMealTotals(dishes: FitnessDish[]): { calories: number; protein: number } {
  return dishes.reduce(
    (acc, d) => ({
      calories: acc.calories + d.calories,
      protein: acc.protein + (d.protein || 0)
    }),
    { calories: 0, protein: 0 }
  );
}

Page({
  data: {
    hasSettings: false,
    fitnessGoal: { goal: '', goalLabel: '' },
    selectedMealTimes: [] as string[],
    excludedAllergies: [] as string[],
    overviewGoalIcon: '/assets/减脂餐.png',
    mealTimesLabel: '',
    goalStrategyLine: '',
    goalBadge: '减脂',

    breakfastMeal: null as FitnessMealDisplay | null,
    lunchMeal: null as FitnessMealDisplay | null,
    dinnerMeal: null as FitnessMealDisplay | null,
    currentMeal: null as FitnessMealDisplay | null,
    currentMealCarbs: [] as FitnessDish[],
    currentMealProteins: [] as FitnessDish[],
    currentMealVeggies: [] as FitnessDish[],
    mergedTitle: '',
    mergedDot: '#333333',
    mergedSubs: [] as string[],
    showCarbs: false,
    showProteins: false,
    showVeggies: false,
    mealTabKey: 'breakfast',
    showTabBreakfast: true,
    showTabLunch: true,
    showTabDinner: true,

    totalMealCount: 0,

    nutritionTips: [] as NutritionTip[],
  },

  onLoad() {
    this.loadFitnessSettings();
  },

  onShow() {
    // 不重新加载数据
  },

  async loadFitnessSettings() {
    const goalData = wx.getStorageSync('fitnessGoal');
    const rawAllergies = wx.getStorageSync('fitnessAllergies');
    const mealTimes = wx.getStorageSync('fitnessMealTimes') || [];
    const effectiveAllergies = allergiesForFilter(rawAllergies);

    if (!goalData || !String((goalData as { goal?: string }).goal || '').trim()) {
      this.setData({
        hasSettings: false,
        totalMealCount: 0,
        breakfastMeal: null,
        lunchMeal: null,
        dinnerMeal: null,
        currentMeal: null,
        currentMealCarbs: [],
        currentMealProteins: [],
        currentMealVeggies: [],
        mergedTitle: '',
        mergedDot: '#333333',
        mergedSubs: [],
        showCarbs: false,
        showProteins: false,
        showVeggies: false
      });
      return;
    }

    const g = String((goalData as { goal?: string }).goal || '');
    const showBreakfast = mealTimes.length === 0 || mealTimes.indexOf('breakfast') !== -1;
    const showLunch = mealTimes.length === 0 || mealTimes.indexOf('lunch') !== -1;
    const showDinner = mealTimes.length === 0 || mealTimes.indexOf('dinner') !== -1;

    const mealSets = await this.generateMealSetsSync(goalData.goal, mealTimes, effectiveAllergies);

    this.setData({
      hasSettings: true,
      fitnessGoal: goalData,
      selectedMealTimes: mealTimes,
      excludedAllergies: effectiveAllergies,
      overviewGoalIcon: overviewIconForGoal(g),
      mealTimesLabel: this.getMealTimesLabel(mealTimes),
      showTabBreakfast: showBreakfast,
      showTabLunch: showLunch,
      showTabDinner: showDinner,
      goalStrategyLine: goalStrategyLine(goalData.goal),
      goalBadge: goalBadgeText(goalData.goal),
      breakfastMeal: mealSets.breakfastMeal,
      lunchMeal: mealSets.lunchMeal,
      dinnerMeal: mealSets.dinnerMeal,
      mealTabKey: mealSets.mealTabKey,
      currentMeal: mealSets.currentMeal,
      totalMealCount: mealSets.totalMealCount,
      currentMealCarbs: mealSets.currentMealCarbs,
      currentMealProteins: mealSets.currentMealProteins,
      currentMealVeggies: mealSets.currentMealVeggies,
      mergedTitle: mealSets.mergedTitle,
      mergedDot: mealSets.mergedDot,
      mergedSubs: mealSets.mergedSubs,
      showCarbs: mealSets.showCarbs,
      showProteins: mealSets.showProteins,
      showVeggies: mealSets.showVeggies,
      nutritionTips: pickTipsForDay(g, 3)
    });
  },

  getMealTimesLabel(mealTimes: string[]): string {
    const labels: Record<string, string> = {
      breakfast: '早餐',
      lunch: '午餐',
      dinner: '晚餐'
    };
    if (mealTimes.length === 0) return '全天候';
    return mealTimes.map((t) => labels[t] || t).join(' + ');
  },

  generateNutritionTips(goal: string) {
    this.setData({ nutritionTips: pickTipsForDay(goal, 3) });
  },

  onRefreshNutritionTips() {
    const g = this.data.fitnessGoal as { goal?: string };
    const goal = String(g && g.goal ? g.goal : '').trim();
    if (!goal) return;
    const exclude = (this.data.nutritionTips || []).map((t) => t.label);
    const next = pickTipsShuffle(goal, 3, exclude);
    this.setData({ nutritionTips: next });
    wx.showToast({ title: '已更新要点', icon: 'none', duration: 1200 });
  },

  async generateMealSets(goal: string, mealTimes: string[], allergies: string[]) {
    const allDishes = await loadFitnessDishesAsync();

    const goalPrefix = goal === 'keep' ? 'keep' : goal === 'gain' ? 'gain' : 'lose';
    const veggieCategories = ['vegetables', 'soups', 'salads', 'cold_dishes', 'stir_fry'];
    const matchGoal = (d: FitnessDish) => (d.goal as string) === goalPrefix || d.goal === 'all';
    const proteinsAll = allDishes.filter(d => matchGoal(d) && d.fitnessCategory === 'proteins');
    const carbsAll = allDishes.filter(d => matchGoal(d) && d.fitnessCategory === 'carbs');
    const veggiesAll = allDishes.filter(d => matchGoal(d) && d.fitnessCategory && veggieCategories.includes(d.fitnessCategory));
    const extras: FitnessDish[] = [];

    const proteins = filterDishes(proteinsAll, allergies);
    const carbs = filterDishes(carbsAll, allergies);
    const veggies = filterDishes(veggiesAll, allergies);

    if (proteins.length === 0 || carbs.length === 0 || veggies.length === 0) {
      console.warn('[fitness-menu] 菜品数量不足');
    }

    const goalBadge = goalBadgeText(goal);
    const mealTimeLabels: Record<string, string> = {
      breakfast: '早餐',
      lunch: '午餐',
      dinner: '晚餐'
    };

    const slots: Record<string, FitnessMealDisplay | null> = {
      breakfast: null,
      lunch: null,
      dinner: null
    };

    const pageAny = this as any;
    pageAny._allProteins = proteins;
    pageAny._allCarbs = carbs;
    pageAny._allVeggies = veggies;
    pageAny._allExtras = extras;
    pageAny._goal = goal;

    const baseSeed = getTodaySeed(goal);

    ['breakfast', 'lunch', 'dinner'].forEach((mt: string, idx: number) => {
      const seed = baseSeed + idx * 7;
      const dishes = buildMealSet(
        mt as 'breakfast' | 'lunch' | 'dinner',
        proteins,
        carbs,
        veggies,
        extras,
        seed
      );
      if (dishes.length > 0) {
        const totals = calcMealTotals(dishes);
        slots[mt as keyof typeof slots] = {
          mealTime: mt as 'breakfast' | 'lunch' | 'dinner',
          mealTimeLabel: mealTimeLabels[mt],
          dishes,
          totalCalories: totals.calories,
          totalProtein: totals.protein,
          goalBadge
        };
      }
    });

    const total = (slots.breakfast ? 1 : 0) + (slots.lunch ? 1 : 0) + (slots.dinner ? 1 : 0);

    let initialTab = 'breakfast';
    if (mealTimes.length > 0) {
      if (mealTimes.indexOf('breakfast') !== -1 && slots.breakfast) initialTab = 'breakfast';
      else if (mealTimes.indexOf('lunch') !== -1 && slots.lunch) initialTab = 'lunch';
      else if (mealTimes.indexOf('dinner') !== -1 && slots.dinner) initialTab = 'dinner';
    } else {
      if (slots.breakfast) initialTab = 'breakfast';
      else if (slots.lunch) initialTab = 'lunch';
      else initialTab = 'dinner';
    }

    const sections = splitMealByCategory(slots[initialTab as keyof typeof slots] || null);
    const titled = annotateMealSections(sections);
    const titles = calcSectionTitles(sections);

    this.setData({
      breakfastMeal: slots.breakfast,
      lunchMeal: slots.lunch,
      dinnerMeal: slots.dinner,
      mealTabKey: initialTab,
      currentMeal: slots[initialTab as keyof typeof slots] || null,
      totalMealCount: total,
      currentMealCarbs: titled.carbs,
      currentMealProteins: titled.proteins,
      currentMealVeggies: titled.veggies,
      mergedTitle: titles.mergedTitle,
      mergedDot: titles.mergedDot,
      mergedSubs: titles.mergedSubs,
      showCarbs: titles.showCarbs,
      showProteins: titles.showProteins,
      showVeggies: titles.showVeggies
    });
  },

  async generateMealSetsSync(goal: string, mealTimes: string[], allergies: string[]) {
    const allDishes = await loadFitnessDishesAsync();
    const goalPrefix = goal === 'keep' ? 'keep' : goal === 'gain' ? 'gain' : 'lose';
    const matchGoal = (d: FitnessDish) => (d.goal as string) === goalPrefix || d.goal === 'all';
    const veggieCategories = ['vegetables', 'soups', 'salads', 'cold_dishes', 'stir_fry'];

    const proteinsAll = allDishes.filter(d => matchGoal(d) && d.fitnessCategory === 'proteins');
    const carbsAll = allDishes.filter(d => matchGoal(d) && d.fitnessCategory === 'carbs');
    const veggiesAll = allDishes.filter(d => matchGoal(d) && d.fitnessCategory && veggieCategories.includes(d.fitnessCategory));
    const extras: FitnessDish[] = [];

    const proteins = filterDishes(proteinsAll, allergies);
    const carbs = filterDishes(carbsAll, allergies);
    const veggies = filterDishes(veggiesAll, allergies);

    const pageAny = this as any;
    pageAny._allProteins = proteins;
    pageAny._allCarbs = carbs;
    pageAny._allVeggies = veggies;
    pageAny._allExtras = extras;
    pageAny._goal = goal;

    const goalBadge = goalBadgeText(goal);
    const mealTimeLabels: Record<string, string> = {
      breakfast: '早餐',
      lunch: '午餐',
      dinner: '晚餐'
    };

    const slots: Record<string, FitnessMealDisplay | null> = {
      breakfast: null,
      lunch: null,
      dinner: null
    };

    const baseSeed = getTodaySeed(goal);

    ['breakfast', 'lunch', 'dinner'].forEach((mt: string, idx: number) => {
      const seed = baseSeed + idx * 7;
      const dishes = buildMealSet(
        mt as 'breakfast' | 'lunch' | 'dinner',
        proteins,
        carbs,
        veggies,
        extras,
        seed
      );
      if (dishes.length > 0) {
        const totals = calcMealTotals(dishes);
        slots[mt as keyof typeof slots] = {
          mealTime: mt as 'breakfast' | 'lunch' | 'dinner',
          mealTimeLabel: mealTimeLabels[mt],
          dishes,
          totalCalories: totals.calories,
          totalProtein: totals.protein,
          goalBadge
        };
      }
    });

    const total = (slots.breakfast ? 1 : 0) + (slots.lunch ? 1 : 0) + (slots.dinner ? 1 : 0);

    let initialTab = 'breakfast';
    if (mealTimes.length > 0) {
      if (mealTimes.indexOf('breakfast') !== -1 && slots.breakfast) initialTab = 'breakfast';
      else if (mealTimes.indexOf('lunch') !== -1 && slots.lunch) initialTab = 'lunch';
      else if (mealTimes.indexOf('dinner') !== -1 && slots.dinner) initialTab = 'dinner';
    } else {
      if (slots.breakfast) initialTab = 'breakfast';
      else if (slots.lunch) initialTab = 'lunch';
      else initialTab = 'dinner';
    }

    const sections = splitMealByCategory(slots[initialTab as keyof typeof slots] || null);
    const titled = annotateMealSections(sections);
    const titles = calcSectionTitles(sections);

    return {
      breakfastMeal: slots.breakfast,
      lunchMeal: slots.lunch,
      dinnerMeal: slots.dinner,
      currentMeal: slots[initialTab as keyof typeof slots] || null,
      totalMealCount: total,
      mealTabKey: initialTab,
      currentMealCarbs: titled.carbs,
      currentMealProteins: titled.proteins,
      currentMealVeggies: titled.veggies,
      mergedTitle: titles.mergedTitle,
      mergedDot: titles.mergedDot,
      mergedSubs: titles.mergedSubs,
      showCarbs: titles.showCarbs,
      showProteins: titles.showProteins,
      showVeggies: titles.showVeggies
    };
  },

  onMealTabTap(e: WechatMiniprogram.BaseEvent) {
    const key = e.currentTarget.dataset.key as string;
    if (!key) return;
    const meal = key === 'breakfast' ? this.data.breakfastMeal
      : key === 'lunch' ? this.data.lunchMeal
      : this.data.dinnerMeal;
    const sections = splitMealByCategory(meal);
    const titled = annotateMealSections(sections);
    const titles = calcSectionTitles(sections);
    this.setData({
      mealTabKey: key,
      currentMeal: meal,
      currentMealCarbs: titled.carbs,
      currentMealProteins: titled.proteins,
      currentMealVeggies: titled.veggies,
      mergedTitle: titles.mergedTitle,
      mergedDot: titles.mergedDot,
      mergedSubs: titles.mergedSubs,
      showCarbs: titles.showCarbs,
      showProteins: titles.showProteins,
      showVeggies: titles.showVeggies
    });
  },

  onRefreshBatch() {
    const mealKey = this.data.mealTabKey;
    const proteins = (this as any)._allProteins as FitnessDish[];
    const carbs = (this as any)._allCarbs as FitnessDish[];
    const veggies = (this as any)._allVeggies as FitnessDish[];
    const extras = (this as any)._allExtras as FitnessDish[];
    const goal = (this as any)._goal as string;

    if (!proteins || !carbs || !veggies) {
      wx.showToast({ title: '数据加载中', icon: 'none', duration: 1500 });
      return;
    }

    const seed = getTodaySeed(goal) + Date.now() % 100000;
    const dishes = buildMealSet(
      mealKey as 'breakfast' | 'lunch' | 'dinner',
      proteins,
      carbs,
      veggies,
      extras,
      seed
    );

    if (dishes.length === 0) {
      wx.showToast({ title: '暂无可换的组合', icon: 'none', duration: 1800 });
      return;
    }

    const totals = calcMealTotals(dishes);
    const newMeal: FitnessMealDisplay = {
      mealTime: mealKey as 'breakfast' | 'lunch' | 'dinner',
      mealTimeLabel: mealKey === 'breakfast' ? '早餐' : mealKey === 'lunch' ? '午餐' : '晚餐',
      dishes,
      totalCalories: totals.calories,
      totalProtein: totals.protein,
      goalBadge: goalBadgeText(goal)
    };

    const sections = splitMealByCategory(newMeal);
    const titled = annotateMealSections(sections);
    const titles = calcSectionTitles(sections);
    const payload: Record<string, FitnessMealDisplay | null | FitnessDish[] | string | string[] | boolean> = {
      currentMeal: newMeal,
      currentMealCarbs: titled.carbs,
      currentMealProteins: titled.proteins,
      currentMealVeggies: titled.veggies,
      mergedTitle: titles.mergedTitle,
      mergedDot: titles.mergedDot,
      mergedSubs: titles.mergedSubs,
      showCarbs: titles.showCarbs,
      showProteins: titles.showProteins,
      showVeggies: titles.showVeggies
    };
    if (mealKey === 'breakfast') payload.breakfastMeal = newMeal;
    else if (mealKey === 'lunch') payload.lunchMeal = newMeal;
    else payload.dinnerMeal = newMeal;

    this.setData(payload as any);
    wx.showToast({ title: '已换一批', icon: 'none', duration: 1200 });
  },

  onDishTap(e: WechatMiniprogram.BaseEvent) {
    const dishId = e.currentTarget.dataset.id as string;
    if (!dishId) return;
    wx.navigateTo({
      url: `/pages/recipes/detail?id=${encodeURIComponent(dishId)}&from=fitness`
    });
  },

  onEditSettings() {
    wx.redirectTo({ url: '/subpackages/lowfreq/fitness/index' });
  },

  onCoverImgError(e: WechatMiniprogram.BaseEvent) {
    const index = e.currentTarget.dataset.index as number | undefined;
    if (index === undefined) return;
    const allDishes = [
      ...(this.data.currentMealCarbs || []),
      ...(this.data.currentMealProteins || []),
      ...(this.data.currentMealVeggies || [])
    ];
    const recipe = allDishes[index];
    if (!recipe) return;
    const url = (recipe as any).coverImage || '';
    if (!url) return;
    const clearFrom = (arr: FitnessDish[]) =>
      arr.map((d) => {
        const cur = (d as any).coverImage || '';
        if (cur === url) return { ...d, coverImage: '' };
        return d;
      });
    this.setData({
      currentMealCarbs: clearFrom(this.data.currentMealCarbs as FitnessDish[]),
      currentMealProteins: clearFrom(this.data.currentMealProteins as FitnessDish[]),
      currentMealVeggies: clearFrom(this.data.currentMealVeggies as FitnessDish[])
    } as any);
  }
});
