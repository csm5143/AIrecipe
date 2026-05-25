import type { Recipe } from '@airecipe/shared-types';

export interface RecipeRow {
  id: string;
  title?: string;
  name?: string;
  coverImage: string;
  description: string;
  ingredients: string[];
  usage: Record<string, string>;
  timeCost: number;
  difficulty: string;
  mealTimes: string[];
  dishTypes: string[];
  fitnessMeal: boolean;
  fitnessCategory?: string;
  goal?: string;
  ageBand?: string;
  childrenMeal: boolean;
  steps: string[];
  viewCount?: number;
  collectCount?: number;
}

function mapDifficulty(d: string): string {
  const map: Record<string, string> = {
    easy: 'EASY', normal: 'MEDIUM', medium: 'MEDIUM', hard: 'HARD',
  };
  return map[d] || 'MEDIUM';
}

function mapDishType(t: string): string {
  const map: Record<string, string> = {
    staple: '主食', stir_fry: '小炒菜', soup: '汤品', boiled: '煮食',
    stir_fried_staple: '炒食', cold: '凉菜', porridge: '粥', noodles: '面食',
    dessert: '甜品', drink: '饮品', braised: '卤味', bbq: '烧烤',
    hotpot: '火锅', fried: '油炸', baked: '烘焙', sashimi: '刺身',
    western: '西餐', diet: '减脂餐', children: '儿童餐',
  };
  return map[t] || t;
}

export function normalizeRecipe(raw: RecipeRow): Recipe {
  const recipeTitle = raw.title || raw.name || '';
  return {
    id: Number(raw.id) || 0,
    title: recipeTitle,
    coverImage: raw.coverImage || '',
    description: raw.description || '',
    difficulty: mapDifficulty(raw.difficulty) as any,
    cookingTime: raw.timeCost || 0,
    servings: 2,
    calories: 0,
    tags: raw.dishTypes?.map(mapDishType) || [],
    ingredients: Object.entries(raw.usage || {}).map(([name, amount]) => ({
      id: 0,
      name,
      amount,
      unit: '',
      isOptional: false,
    })),
    steps: (raw.steps || []).map((content, i) => ({
      order: i + 1,
      content,
      image: '',
      duration: 0,
    })),
    tips: '',
    nutrition: { calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0, sodium: 0 },
    cuisine: '',
    category: raw.dishTypes?.[0] ? mapDishType(raw.dishTypes[0]) : '',
    isAiGenerated: false,
    viewCount: raw.viewCount ?? 0,
    collectCount: raw.collectCount ?? 0,
    shareCount: raw.shareCount ?? 0,
    status: 'PUBLISHED' as any,
    isFeatured: false,
    publishedAt: '',
    createdAt: raw.createdAt || new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString().split('T')[0],
  };
}

export function normalizeDishType(t: string): string {
  const map: Record<string, string> = {
    staple: '主食', stir_fry: '小炒菜', soup: '汤品', boiled: '煮食',
    stir_fried_staple: '炒食', cold: '凉菜', porridge: '粥', noodles: '面食',
    dessert: '甜品', drink: '饮品', braised: '卤味', bbq: '烧烤',
    hotpot: '火锅', fried: '油炸', baked: '烘焙', sashimi: '刺身',
    western: '西餐', diet: '减脂餐', children: '儿童餐',
  };
  return map[t] || t;
}

export function normalizeMealTime(t: string): string {
  const map: Record<string, string> = {
    breakfast: '早餐', lunch: '午餐', dinner: '晚餐', late_night: '夜宵',
    '早餐': '早餐', '午餐': '午餐', '晚餐': '晚餐', '夜宵': '夜宵',
  };
  return map[t] || t;
}

export function normalizeDifficulty(d: string): string {
  const map: Record<string, string> = {
    easy: 'EASY', normal: 'MEDIUM', medium: 'MEDIUM', hard: 'HARD',
  };
  return map[d] || 'MEDIUM';
}

export const DISH_TYPE_OPTIONS = [
  { value: 'staple', label: '主食' },
  { value: 'stir_fry', label: '小炒菜' },
  { value: 'soup', label: '汤品' },
  { value: 'boiled', label: '煮食' },
  { value: 'stir_fried_staple', label: '炒食' },
  { value: 'cold', label: '凉菜' },
  { value: 'porridge', label: '粥' },
  { value: 'noodles', label: '面食' },
  { value: 'dessert', label: '甜品' },
  { value: 'drink', label: '饮品' },
  { value: 'braised', label: '卤味' },
  { value: 'bbq', label: '烧烤' },
  { value: 'hotpot', label: '火锅' },
  { value: 'fried', label: '油炸' },
  { value: 'baked', label: '烘焙' },
  { value: 'sashimi', label: '刺身' },
  { value: 'western', label: '西餐' },
  { value: 'diet', label: '减脂餐' },
  { value: 'children', label: '儿童餐' },
];

export const MEAL_TIME_OPTIONS = [
  { value: 'breakfast', label: '早餐' },
  { value: 'lunch', label: '午餐' },
  { value: 'dinner', label: '晚餐' },
  { value: 'late_night', label: '夜宵' },
];

export const DIFFICULTY_OPTIONS = [
  { value: 'EASY', label: '简单' },
  { value: 'MEDIUM', label: '中等' },
  { value: 'HARD', label: '困难' },
];

export const AGE_BAND_OPTIONS = [
  { value: '1-2y', label: '1-2岁' },
  { value: '3-6y', label: '3-6岁' },
  { value: '7-12y', label: '7-12岁' },
];

export const FITNESS_CATEGORY_OPTIONS = [
  { value: 'proteins', label: '蛋白质类' },
  { value: 'vegetables', label: '蔬菜类' },
  { value: 'carbs', label: '碳水类' },
  { value: 'soups', label: '汤品类' },
  { value: 'cold_dishes', label: '凉菜类' },
  { value: 'balanced', label: '均衡搭配' },
  { value: 'salads', label: '沙拉类' },
];

export const GOAL_OPTIONS = [
  { value: 'lose', label: '减脂' },
  { value: 'gain', label: '增肌' },
  { value: 'maintain', label: '维持' },
];

export const STATUS_OPTIONS = [
  { value: 'PUBLISHED', label: '已发布' },
  { value: 'DRAFT', label: '草稿' },
  { value: 'OFFLINE', label: '已下线' },
];

export const SOURCE_OPTIONS = [
  { value: 'OFFICIAL', label: '官方' },
  { value: 'USER', label: '用户上传' },
];
