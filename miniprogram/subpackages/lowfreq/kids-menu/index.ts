// pages/custom/kids-menu/index.ts
// 儿童营养餐专属菜单（与健身餐方案页结构一致）

import { ChildMeal, Recipe } from '../../../types/index';
import { loadRecipesJson, loadRecipesAsync } from '../../../utils/dataLoader';
import { getFavorites, toggleFavorite } from '../../../utils/favorites';
import { CHILDREN_NUTRITION_DB, ChildNutritionTip } from '../../../utils/childrenNutritionTips';
import {
  childStageBadgeText,
  childStageMatchesRecipe,
  recipeAppliesToMealSlot,
  recipeMatchesSelectedMealTimes
} from '../../../utils/childrenStage';

interface DisplayMeal {
  id: string;
  name: string;
  description: string;
  items: ChildMeal['items'];
  calories: number;
  macros: ChildMeal['macros'];
  coverImage: string;
  difficultyLabel: string;
  steps: string[];
  isFavorite: boolean;
  goalBadge: string;
  mealTime: string;
}

type StageKey = 'toddler' | 'preschool' | 'school';

function pickTipsForDay(stage: string, count = 3): ChildNutritionTip[] {
  const key = (stage === 'preschool' || stage === 'school' ? stage : 'toddler') as StageKey;
  const pool = CHILDREN_NUTRITION_DB[key] || CHILDREN_NUTRITION_DB.toddler;
  const now = new Date();
  const seed = (now.getFullYear() * 1000 + (now.getMonth() + 1) * 100 + now.getDate()) % pool.length;
  const result: ChildNutritionTip[] = [];
  let idx = seed;
  while (result.length < count && result.length < pool.length) {
    if (!result.some((r) => r.label === pool[idx].label)) {
      result.push(pool[idx]);
    }
    idx = (idx + 1) % pool.length;
  }
  return result;
}

function shuffleTips<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = a[i];
    a[i] = a[j];
    a[j] = t;
  }
  return a;
}

function pickTipsShuffle(stage: string, count: number, excludeLabels: string[]): ChildNutritionTip[] {
  const key = (stage === 'preschool' || stage === 'school' ? stage : 'toddler') as StageKey;
  const pool = CHILDREN_NUTRITION_DB[key] || CHILDREN_NUTRITION_DB.toddler;
  const exclude = new Set(excludeLabels.filter(Boolean));
  const novel = pool.filter((t) => !exclude.has(t.label));
  let ordered: ChildNutritionTip[];
  if (novel.length >= count) {
    ordered = shuffleTips(novel);
  } else {
    ordered = shuffleTips([...novel, ...pool.filter((t) => exclude.has(t.label))]);
  }
  return ordered.slice(0, Math.min(count, pool.length));
}

const PER_MEAL_LIMIT = 4;
const PER_BATCH = 3;

function stageBadgeText(band: string): string {
  return childStageBadgeText(band);
}

function stageStrategyLine(band: string): string {
  if (band === 'toddler') return '软烂泥/末状、无盐无糖、食材单一，易吞咽好消化';
  if (band === 'preschool') return '碎丁/小块状、少盐少糖、造型可爱，培养自主进食';
  if (band === 'school') return '正常块状、清淡调味，适合学习与运动加餐';
  return '';
}

function getDifficultyLabel(d: ChildMeal['difficulty']): string {
  const map: Record<string, string> = { easy: '简单', normal: '中等', hard: '较难' };
  return map[d] || '简单';
}

function allergiesForFilterAndDisplay(raw: unknown): string[] {
  const arr = Array.isArray(raw) ? (raw as string[]) : [];
  return arr.filter((a) => String(a || '').trim() && a !== 'none');
}

function overviewIconForStage(band: string): string {
  if (band === 'toddler') return '/assets/线性奶瓶婴儿.png';
  if (band === 'preschool') return '/assets/宝宝.png';
  if (band === 'school') return '/assets/儿童.png';
  return '/assets/儿童餐.png';
}

function makeDisplayMeal(m: any, isFav: boolean): DisplayMeal {
  const items: ChildMeal['items'] = (Array.isArray(m.items) && m.items.length > 0)
    ? m.items
    : (Array.isArray(m.ingredients) ? m.ingredients.map((n: string) => ({ name: n, amount: '' })) : []);
  const mealTime: string = m.mealTime || (Array.isArray(m.mealTimes) ? (m.mealTimes[0] || '') : '');
  return {
    id: m.id,
    name: m.name,
    description: m.description,
    items,
    calories: m.calories,
    macros: m.macros,
    coverImage: m.coverImage,
    difficultyLabel: getDifficultyLabel(m.difficulty),
    steps: m.steps,
    isFavorite: isFav,
    goalBadge: stageBadgeText(m.ageBand),
    mealTime
  };
}

Page({
  data: {
    hasSettings: false,
    childrenStage: { stage: '', stageLabel: '' } as { stage: string; stageLabel: string },
    selectedMealTimes: [] as string[],
    excludedAllergies: [] as string[],
    overviewGoalIcon: '/assets/儿童餐.png',
    mealTimesLabel: '',
    goalStrategyLine: '',

    breakfastMeals: [] as DisplayMeal[],
    lunchMeals: [] as DisplayMeal[],
    dinnerMeals: [] as DisplayMeal[],
    currentTabMeals: [] as DisplayMeal[],
    mealTabKey: 'breakfast',
    showTabBreakfast: true,
    showTabLunch: true,
    showTabDinner: true,

    totalMealCount: 0,

    nutritionTip: {
      protein: { desc: '', equivalent: [] },
      carb: { label: '', desc: '', equivalent: [] },
      fat: { label: '', desc: '' }
    } as unknown,
    nutritionTips: [] as ChildNutritionTip[],

    // Toast 提示状态
    toastShow: false,
    toastMessage: '',
    toastButtonText: '',
    toastShowButton: false,
    toastType: 'info'
  },

  onLoad() {
    this.loadChildrenSettings();
  },

  onShow() {
    this.updateFavoriteStatus();
  },

  loadChildrenSettings() {
    const stageData = wx.getStorageSync('childrenStage');
    const rawAllergies = wx.getStorageSync('childrenAllergies');
    const mealTimes = wx.getStorageSync('childrenMealTimes') || [];
    const effectiveAllergies = allergiesForFilterAndDisplay(rawAllergies);

    if (!stageData || !String((stageData as { stage?: string }).stage || '').trim()) {
      this.setData({
        hasSettings: false,
        totalMealCount: 0,
        breakfastMeals: [],
        lunchMeals: [],
        dinnerMeals: [],
        currentTabMeals: []
      });
      return;
    }

    const g = String((stageData as { stage?: string }).stage || '');
    const showBreakfast = mealTimes.length === 0 || mealTimes.indexOf('breakfast') !== -1;
    const showLunch = mealTimes.length === 0 || mealTimes.indexOf('lunch') !== -1;
    const showDinner = mealTimes.length === 0 || mealTimes.indexOf('dinner') !== -1;

    this.setData({
      hasSettings: true,
      childrenStage: stageData,
      selectedMealTimes: mealTimes,
      excludedAllergies: effectiveAllergies,
      overviewGoalIcon: overviewIconForStage(g),
      mealTimesLabel: this.getMealTimesLabel(mealTimes),
      showTabBreakfast: showBreakfast,
      showTabLunch: showLunch,
      showTabDinner: showDinner,
      goalStrategyLine: stageStrategyLine(g)
    });

    this.generateNutritionTips(g);
    this.loadMeals(g, mealTimes, effectiveAllergies);
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

  generateNutritionTips(stage: string) {
    this.setData({ nutritionTips: pickTipsForDay(stage, 3) });
  },

  onRefreshNutritionTips() {
    const s = this.data.childrenStage as { stage?: string };
    const stage = String(s && s.stage ? s.stage : '').trim();
    if (!stage) return;
    const exclude = (this.data.nutritionTips || []).map((t) => t.label);
    const next = pickTipsShuffle(stage, 3, exclude);
    this.setData({ nutritionTips: next });
    wx.showToast({ title: '已更新小贴士', icon: 'none', duration: 1200 });
  },

  async loadMeals(stage: string, mealTimes: string[], allergies: string[]) {
    const favIds = getFavorites();
    const favMap: Record<string, boolean> = {};
    favIds.forEach((id) => { favMap[id] = true; });

    const allergyExcludeMap: Record<string, string[]> = {
      seafood: ['虾', '蟹', '鱼', '三文鱼', '鳕鱼', '鲈鱼', '虾仁', '海鲜'],
      nuts: ['花生', '核桃', '杏仁', '腰果', '榛子', '坚果'],
      dairy: ['牛奶', '奶酪', '芝士', '酸奶', '黄油'],
      peanut: ['花生'],
      wheat: ['面粉', '面条', '馒头', '面包', '意面', '饺子皮'],
      soy: ['豆腐', '豆干', '豆浆']
    };

    // 本地加载菜谱，自动带缓存兜底
    let rawMeals: Recipe[] = [];
    try {
      rawMeals = await loadRecipesAsync();
    } catch (e) {
      console.warn('[儿童菜单] 加载失败', e);
    }
    if (!rawMeals.length) {
      rawMeals = loadRecipesJson() as Recipe[];
    }

    const filteredMeals = rawMeals.filter((r: Recipe) => {
      const band = (r as any).ageBand as string | undefined;
      return band && band.trim() !== '' && band.trim() !== 'null';
    });

    const allMeals = filteredMeals;

    const filtered = allMeals.filter((m: any) => {
      if (!childStageMatchesRecipe(stage, m.ageBand)) return false;
      if (!recipeMatchesSelectedMealTimes(m, mealTimes)) return false;

      for (const allergy of allergies) {
        const blacklist = allergyExcludeMap[allergy];
        if (!blacklist) continue;
        const itemList: any[] = Array.isArray(m.items) && m.items.length > 0 ? m.items : [];
        const itemNames = itemList.length > 0
          ? itemList.map((i: any) => i.name)
          : (Array.isArray(m.ingredients) ? m.ingredients : []);
        for (const ing of itemNames) {
          if (blacklist.some((b) => ing.includes(b))) return false;
        }
      }
      return true;
    });

    const slots: Record<string, DisplayMeal[]> = { breakfast: [], lunch: [], dinner: [] };
    const used: Record<string, boolean> = {};

    const targetSlots = ['breakfast', 'lunch', 'dinner'];
    for (const slot of targetSlots) {
      for (const m of filtered) {
        if (used[m.id]) continue;
        if (slots[slot].length >= PER_MEAL_LIMIT) break;
        const slotMatch =
          recipeAppliesToMealSlot(m, slot) &&
          recipeMatchesSelectedMealTimes(m, mealTimes);
        if (!slotMatch) continue;
        const display = makeDisplayMeal(m, favMap[m.id] || false);
        slots[slot].push(display);
        used[m.id] = true;
      }
    }

    const pageAny = this as any;
    pageAny._allFiltered = filtered;
    pageAny._stage = stage;
    pageAny._shownHistory = {
      breakfast: slots.breakfast.map((m) => m.id),
      lunch: slots.lunch.map((m) => m.id),
      dinner: slots.dinner.map((m) => m.id)
    };

    const total = slots.breakfast.length + slots.lunch.length + slots.dinner.length;

    let initialTab = 'breakfast';
    if (mealTimes.length > 0) {
      if (mealTimes.indexOf('breakfast') !== -1 && slots.breakfast.length > 0) initialTab = 'breakfast';
      else if (mealTimes.indexOf('lunch') !== -1 && slots.lunch.length > 0) initialTab = 'lunch';
      else if (mealTimes.indexOf('dinner') !== -1 && slots.dinner.length > 0) initialTab = 'dinner';
    } else {
      if (slots.breakfast.length > 0) initialTab = 'breakfast';
      else if (slots.lunch.length > 0) initialTab = 'lunch';
      else initialTab = 'dinner';
    }

    this.setData({
      breakfastMeals: slots.breakfast,
      lunchMeals: slots.lunch,
      dinnerMeals: slots.dinner,
      mealTabKey: initialTab,
      currentTabMeals: slots[initialTab] || [],
      totalMealCount: total
    });
  },

  onMealTabTap(e: WechatMiniprogram.BaseEvent) {
    const key = e.currentTarget.dataset.key as string;
    if (!key) return;
    const list = key === 'breakfast' ? this.data.breakfastMeals
      : key === 'lunch' ? this.data.lunchMeals
      : this.data.dinnerMeals;
    this.setData({ mealTabKey: key, currentTabMeals: list });
  },

  pickNextBatch(mealKey: string): DisplayMeal[] {
    const pageAny = this as any;
    const filtered = pageAny._allFiltered as ChildMeal[];
    const shownHistory = pageAny._shownHistory as Record<string, string[]>;
    if (!filtered || !shownHistory) return [];

    const otherIds: Record<string, boolean> = {};
    const b = this.data.breakfastMeals;
    const l = this.data.lunchMeals;
    const d = this.data.dinnerMeals;
    if (mealKey !== 'breakfast') b.forEach((m) => { otherIds[m.id] = true; });
    if (mealKey !== 'lunch') l.forEach((m) => { otherIds[m.id] = true; });
    if (mealKey !== 'dinner') d.forEach((m) => { otherIds[m.id] = true; });

    function doPick(history: string[]): DisplayMeal[] {
      const exclude = new Set([...Object.keys(otherIds), ...history]);
      const favMap: Record<string, boolean> = {};
      getFavorites().forEach((id) => { favMap[id] = true; });

      const result: DisplayMeal[] = [];
      for (const m of filtered) {
        if (exclude.has(m.id)) continue;
        if (!recipeAppliesToMealSlot(m, mealKey)) continue;
        result.push(makeDisplayMeal(m, favMap[m.id] || false));
        exclude.add(m.id);
        if (result.length >= PER_BATCH) break;
      }
      return result;
    }

    const hist = shownHistory[mealKey] || [];
    let batch = doPick(hist);
    if (batch.length < PER_BATCH) {
      shownHistory[mealKey] = [];
      batch = doPick([]);
    }

    if (batch.length > 0) {
      shownHistory[mealKey] = [...hist, ...batch.map((m) => m.id)];
    }

    return batch;
  },

  onRefreshBatch() {
    const mealKey = this.data.mealTabKey;
    const batch = this.pickNextBatch(mealKey);
    if (batch.length === 0) {
      wx.showToast({ title: '暂无可换的餐品', icon: 'none', duration: 1800 });
      return;
    }

    const payload: Record<string, DisplayMeal[]> = { currentTabMeals: batch };
    if (mealKey === 'breakfast') payload.breakfastMeals = batch;
    else if (mealKey === 'lunch') payload.lunchMeals = batch;
    else payload.dinnerMeals = batch;
    this.setData(payload as any);
    wx.showToast({ title: '已换一批', icon: 'none', duration: 1200 });
  },

  onCardTap(e: WechatMiniprogram.BaseEvent) {
    const id = e.currentTarget.dataset.id as string;
    if (!id) return;
    wx.navigateTo({ url: `/pages/recipes/detail?id=${id}&from=children` });
  },

  onFavTap(e: WechatMiniprogram.BaseEvent) {
    const id = e.currentTarget.dataset.id as string;
    if (!id) return;
    const newFav = toggleFavorite(id);
    const patch = (list: DisplayMeal[]) =>
      list.map((m) => (m.id === id ? { ...m, isFavorite: newFav } : m));
    this.setData({
      breakfastMeals: patch(this.data.breakfastMeals),
      lunchMeals: patch(this.data.lunchMeals),
      dinnerMeals: patch(this.data.dinnerMeals),
      currentTabMeals: patch(this.data.currentTabMeals)
    });
    this.showToast(newFav ? '已加入收藏' : '已取消收藏', 'info');
  },

  onEditSettings() {
    wx.redirectTo({ url: '/subpackages/lowfreq/kids/index' });
  },

  updateFavoriteStatus() {
    if (this.data.totalMealCount === 0) return;
    const favSet = new Set(getFavorites());
    const refresh = (list: DisplayMeal[]) =>
      list.map((m) => ({ ...m, isFavorite: favSet.has(m.id) }));
    this.setData({
      breakfastMeals: refresh(this.data.breakfastMeals),
      lunchMeals: refresh(this.data.lunchMeals),
      dinnerMeals: refresh(this.data.dinnerMeals),
      currentTabMeals: refresh(this.data.currentTabMeals)
    });
  },

  onCoverImgError(e: WechatMiniprogram.BaseEvent) {
    const index = e.currentTarget.dataset.index as number | undefined;
    if (index === undefined) return;
    const item = this.data.currentTabMeals[index];
    const url = item ? (item as any).coverImage : '';
    if (!url) return;
    const replace = (list: DisplayMeal[]) =>
      list.map((m) => {
        const curUrl = (m as any).coverImage || '';
        if (curUrl === url) {
          return { ...m, coverImage: '' };
        }
        return m;
      });
    this.setData({
      breakfastMeals: replace(this.data.breakfastMeals),
      lunchMeals: replace(this.data.lunchMeals),
      dinnerMeals: replace(this.data.dinnerMeals),
      currentTabMeals: replace(this.data.currentTabMeals)
    } as any);
  },

  // 显示轻量级提示
  showToast(message: string, type: 'info' | 'success' | 'warning' = 'info', showButton: boolean = false, buttonText: string = '去看看', duration: number = 2000) {
    this.setData({
      toastShow: true,
      toastMessage: message,
      toastType: type,
      toastShowButton: showButton,
      toastButtonText: buttonText,
      toastDuration: duration
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
    // 这里可以添加跳转逻辑
  }
});
