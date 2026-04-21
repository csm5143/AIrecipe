/**
 * 小菜篮：按菜品分组的采购食材清单（本地持久化）
 * 数据结构：每道菜一个 entry，内含该菜所需的食材列表
 */

import {
  mergeIngredients,
  formatMergedAmount,
  type MergedIngredient
} from './ingredientMerge';
import { SEASONING_INGREDIENTS } from './constants';

/** 与菜谱列表一致的调料判定，并补充常见写法（蒜末、代糖等） */
const EXTRA_SEASONING_NAMES: string[] = [
  '蒜末',
  '蒜蓉',
  '姜末',
  '代糖',
  '代盐',
  '白芝麻',
  '黑芝麻',
  '芥末',
  '辣椒油',
  '花椒油',
  '藤椒油',
  '黑胡椒粉',
  '白芝麻粉'
];

function isSeasoningName(name: string): boolean {
  const n = norm(name);
  if (!n) return false;
  if (SEASONING_INGREDIENTS.indexOf(n) !== -1) return true;
  if (EXTRA_SEASONING_NAMES.indexOf(n) !== -1) return true;
  return false;
}

export interface MergedSplit {
  core: BasketIngredient[];
  seasoning: BasketIngredient[];
}

const STORAGE_KEY = 'littleBasketV2';

export interface BasketIngredient {
  name: string;
  amount: string;
}

export interface BasketRecipeEntry {
  recipeId: string;
  recipeName: string;
  ingredients: BasketIngredient[];
}

function norm(s: unknown): string {
  return String(s != null ? s : '').trim();
}

function parse(raw: unknown): BasketRecipeEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((x: any) => ({
      recipeId: norm(x.recipeId),
      recipeName: norm(x.recipeName),
      ingredients: Array.isArray(x.ingredients)
        ? x.ingredients
            .map((ing: any) => ({
              name: norm(ing && ing.name),
              amount: String((ing && ing.amount != null && ing.amount !== '') ? ing.amount : '适量')
            }))
            .filter((ing: BasketIngredient) => ing.name)
        : []
    }))
    .filter((entry) => entry.recipeName && entry.ingredients.length > 0);
}

function load(): BasketRecipeEntry[] {
  try {
    const raw = wx.getStorageSync(STORAGE_KEY);
    if (!raw) return [];
    return parse(typeof raw === 'string' ? JSON.parse(raw) : raw);
  } catch (e) {
    return [];
  }
}

function save(entries: BasketRecipeEntry[]) {
  wx.setStorageSync(STORAGE_KEY, JSON.stringify(entries));
}

// ── 公开 API ─────────────────────────────────────────────

/** 读取全部条目 */
export function getBasket(): BasketRecipeEntry[] {
  return load();
}

/** 全局食材总数（去重计数） */
export function getTotalIngredientCount(): number {
  const all: string[] = [];
  load().forEach((e) => e.ingredients.forEach((ing) => all.push(ing.name)));
  return new Set(all).size;
}

/** 全局涉及菜谱道数 */
export function getRecipeCount(): number {
  return load().length;
}

/**
 * 加入一道菜的食材清单
 * 同一道菜重复添加会替换（即更新为最新传入的食材列表）
 */
export function addRecipeIngredients(
  recipeId: string,
  recipeName: string,
  ingredients: BasketIngredient[]
): BasketRecipeEntry[] {
  const basket = load();
  const idx = basket.findIndex((e) => e.recipeId === recipeId);
  const entry: BasketRecipeEntry = {
    recipeId: norm(recipeId),
    recipeName: norm(recipeName),
    ingredients: ingredients.map((ing) => ({
      name: norm(ing.name),
      amount: ing.amount || '适量'
    }))
  };
  if (idx !== -1) {
    basket[idx] = entry;
  } else {
    basket.push(entry);
  }
  save(basket);
  return basket;
}

/** 查询某道菜是否已在小菜篮 */
export function isRecipeInBasket(recipeId: string): boolean {
  const basket = load();
  return basket.some((e) => e.recipeId === recipeId);
}

/** 删除整道菜的清单 */
export function removeRecipeById(recipeId: string): BasketRecipeEntry[] {
  const basket = load().filter((e) => e.recipeId !== recipeId);
  save(basket);
  return basket;
}

/** 删除某道菜里的指定食材 */
export function removeIngredientFromRecipe(
  recipeId: string,
  ingredientName: string
): BasketRecipeEntry[] {
  const n = norm(ingredientName);
  const basket = load().map((entry) => {
    if (entry.recipeId === recipeId) {
      return {
        ...entry,
        ingredients: entry.ingredients.filter((ing) => ing.name !== n)
      };
    }
    return entry;
  });
  save(basket);
  return basket;
}

/** 清空全部 */
export function clearBasket(): void {
  save([]);
}

/**
 * 合并所有食材（去除跨菜重复），保留用量信息
 * 合并时：同名食材用量取第一个出现的值
 */
export function mergeAllIngredients(): BasketIngredient[] {
  const seen = new Map<string, BasketIngredient>();
  load().forEach((entry) =>
    entry.ingredients.forEach((ing) => {
      if (!seen.has(ing.name)) {
        seen.set(ing.name, { name: ing.name, amount: ing.amount || '适量' });
      }
    })
  );
  return Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
}

/**
 * 智能合并所有食材（按数量相加）
 * 
 * 合并规则：
 * 1. 同名食材、同单位 → 数值相加（如 3个 + 2个 = 5个）
 * 2. 同名食材、不同单位 → 保留多条（如 3个 + 150g = 两条）
 * 3. 无法解析的用量（"适量"、"少许"）→ 保留原值
 * 
 * 返回格式支持直接用于 UI 展示
 */
export function mergeAllIngredientsSmart(): MergedIngredient[] {
  const basket = load();
  const allIngredients = basket.flatMap(entry => entry.ingredients);
  return mergeIngredients(allIngredients);
}

/**
 * 导出智能合并后的食材列表（扁平格式，用于购物清单页面）
 * 每个食材只保留一条，带格式化后的用量字符串
 */
export function getMergedIngredientList(): Array<{ name: string; amount: string }> {
  return mergeAllIngredientsSmart().map(item => ({
    name: item.name,
    amount: formatMergedAmount(item)
  }));
}

/**
 * 智能合并后按「核心食材 / 调料辅料」分组（核心在上、调料在下）
 */
export function getMergedIngredientsSplit(): MergedSplit {
  const merged = mergeAllIngredientsSmart();
  const list: BasketIngredient[] = merged.map((item) => ({
    name: item.name,
    amount: formatMergedAmount(item)
  }));
  const core: BasketIngredient[] = [];
  const seasoning: BasketIngredient[] = [];
  list.forEach((ing) => {
    if (isSeasoningName(ing.name)) {
      seasoning.push(ing);
    } else {
      core.push(ing);
    }
  });
  core.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
  seasoning.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
  return { core, seasoning };
}

/** 复制为纯文本（带来源菜名分组） */
export function formatBasketCopyText(): string {
  const basket = load();
  if (!basket.length) return '';
  const lines: string[] = ['【小菜篮 · 采购清单】', ''];
  basket.forEach((entry) => {
    lines.push(`◇ ${entry.recipeName}`);
    entry.ingredients.forEach((ing) => {
      lines.push(`  · ${ing.name}　${ing.amount}`);
    });
    lines.push('');
  });
  return lines.join('\n');
}

/** 复制合并后的纯文本（支持数量相加；核心食材在上、调料在下） */
export function formatMergedCopyText(): string {
  const { core, seasoning } = getMergedIngredientsSplit();
  if (!core.length && !seasoning.length) return '';
  const lines: string[] = ['【小菜篮 · 合并采购清单】', ''];
  if (core.length) {
    lines.push('【核心食材】');
    core.forEach((ing) => {
      lines.push(`· ${ing.name}　${ing.amount}`);
    });
    lines.push('');
  }
  if (seasoning.length) {
    lines.push('【调料 / 辅料】');
    seasoning.forEach((ing) => {
      lines.push(`· ${ing.name}　${ing.amount}`);
    });
  }
  return lines.join('\n').replace(/\n+$/, '');
}
