/**
 * 菜谱搜索工具（云开发移除后的本地实现）
 * 提供按名称/关键词搜索菜谱的能力，替代原 cloudService 中的云端搜索
 */

import { Recipe } from '../types/index';
import { loadRecipesJson } from './dataLoader';

/**
 * 按菜谱名称搜索（本地实现）
 * @param name 菜谱名称或关键词
 * @returns 匹配的菜谱，未找到返回 null
 */
export async function getRecipeByNameFromCloud(name: string): Promise<Recipe | null> {
  const recipes = loadRecipesJson();
  const kw = name.trim().toLowerCase();

  if (!kw) return null;

  // 优先精确匹配 id
  const byId = recipes.find(r => String(r.id) === kw);
  if (byId) return byId;

  // 再按名称模糊匹配
  const matched = recipes.find(r =>
    (r.name || '').toLowerCase().includes(kw) ||
    ((r as any).title || '').toLowerCase().includes(kw) ||
    ((r as any).aliases || []).some((a: string) => a.toLowerCase().includes(kw))
  );

  return matched || null;
}
