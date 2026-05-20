/**
 * 食材兜底数据（基于本地 ingredients.json）
 * 提供离线状态下可用的食材列表
 */

import { getGlobalRecipes } from './httpServices/recipeService.js';

/** 获取所有食材名称列表 */
export function getFallbackIngredients(): Array<{ name: string; category: string }> {
  return loadIngredientsJson();
}

/** 按关键词搜索食材 */
export function searchFallbackIngredients(keyword: string): Array<{ name: string; category: string }> {
  const kw = keyword.toLowerCase();
  return getFallbackIngredients().filter(i =>
    i.name.toLowerCase().includes(kw) ||
    (i.category && i.category.toLowerCase().includes(kw))
  );
}
