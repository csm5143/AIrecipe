/**
 * 儿童餐年龄段：定制页存储为 toddler/preschool/school，
 * recipes.json 中为 1-2y / 3-6y / 7-12y，需统一后再比较。
 */
export type ChildStageKey = 'toddler' | 'preschool' | 'school';

export function normalizeChildStage(raw: string | undefined | null): ChildStageKey | null {
  const s = String(raw || '').trim();
  if (!s) return null;
  if (s === 'toddler' || s === '1-2y') return 'toddler';
  if (s === 'preschool' || s === '3-6y') return 'preschool';
  if (s === 'school' || s === '7-12y') return 'school';
  return null;
}

export function childStageMatchesRecipe(
  uiStage: string | undefined | null,
  recipeAgeBand: string | undefined | null
): boolean {
  const a = normalizeChildStage(uiStage);
  const b = normalizeChildStage(recipeAgeBand);
  if (!a || !b) return false;
  return a === b;
}

/** 角标文案：兼容两种 ageBand 写法 */
export function childStageBadgeText(band: string | undefined | null): string {
  const k = normalizeChildStage(band);
  if (k === 'toddler') return '辅食期';
  if (k === 'preschool') return '幼童餐';
  if (k === 'school') return '学龄餐';
  return '推荐';
}

/** 菜谱是否适用于某餐段（早餐/午餐/晚餐） */
export function recipeAppliesToMealSlot(m: { mealTime?: string; mealTimes?: string[] }, slot: string): boolean {
  if (m.mealTime === slot) return true;
  if (Array.isArray(m.mealTimes) && m.mealTimes.indexOf(slot) !== -1) return true;
  return false;
}

/** 用户勾选的用餐时段与菜谱是否有交集 */
export function recipeMatchesSelectedMealTimes(
  m: { mealTime?: string; mealTimes?: string[] },
  selected: string[]
): boolean {
  if (!selected || selected.length === 0) return true;
  const slots: string[] = [];
  if (m.mealTime) slots.push(m.mealTime);
  if (Array.isArray(m.mealTimes)) slots.push(...m.mealTimes);
  return slots.some((t) => selected.indexOf(t) !== -1);
}
