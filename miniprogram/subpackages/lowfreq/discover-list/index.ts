import { Recipe } from '../../../types/index';
import { loadRecipesJson, loadRecipesAsync } from '../../../utils/dataLoader';
import { extractCalories } from '../../../utils/recipeUtils';
import { getDifficultyLabel, getPrimaryCategoryLabel } from '../../../utils/labels';

type DiscoverType = 'internet' | 'new' | 'home' | 'solo' | 'cuisine';

interface DisplayRecipe {
  id: string;
  name: string;
  description: string;
  coverImage: string;
  timeCost: number;
  difficulty: string;
  difficultyLabel: string;
  difficultyClass: string;
  primaryCategoryLabel: string;
  calories: string | null;
  _index: number;
}

const FALLBACK_IMAGE = 'https://dummyimage.com/400x400/f5f5f5/cccccc&text=暂无图片';

// ---------- 辅助函数 ----------

function hasRealImage(recipe: Recipe): boolean {
  const img = recipe.coverImage || '';
  return img.length > 0 && !img.includes('dummyimage');
}

function shuffleWithSeed<T>(arr: T[], seed: number): T[] {
  const result = [...arr];
  let random = seed;
  for (let i = result.length - 1; i > 0; i--) {
    random = (random * 9301 + 49297) % 233280;
    const j = Math.floor((random / 233280) * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function scoreByKeywords(text: string, keywords: string[]): number {
  let score = 0;
  for (const key of keywords) {
    if (text.includes(key)) score += 1;
  }
  return score;
}

// 按菜名去重，保留每个名字的第一个（打乱后靠前的）
function _dedupByName(arr: Recipe[]): Recipe[] {
  const seen = new Set<string>();
  return arr.filter(r => {
    const key = r.name.trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function toDisplayRecipe(recipe: Recipe, index: number, showWesternTag: boolean): DisplayRecipe {
  const difficulty = recipe.difficulty || 'easy';
  return {
    id: recipe.id,
    name: recipe.name,
    description: recipe.description || '',
    coverImage: recipe.coverImage || FALLBACK_IMAGE,
    timeCost: recipe.timeCost || 20,
    difficulty,
    difficultyLabel: getDifficultyLabel(difficulty),
    difficultyClass: difficulty,
    primaryCategoryLabel: getPrimaryCategoryLabel(recipe.dishTypes || [], recipe.mealTimes || [], showWesternTag),
    calories: extractCalories(recipe.description || ''),
    _index: index
  };
}

// ---------- 分类筛选函数 ----------

// 本周热门：dishTypes 含 internet，或名称含网红/爆款/热门
function matchInternet(r: Recipe): boolean {
  const tags = (r.dishTypes || []).map((t: string) => t.toLowerCase());
  const name = (r.name || '').toLowerCase();
  return tags.includes('internet') || name.includes('网红') || name.includes('爆款') || name.includes('热门');
}

// 新菜首发：dishTypes 含 new，或名称含新/首发/新品
function matchNew(r: Recipe): boolean {
  const tags = (r.dishTypes || []).map((t: string) => t.toLowerCase());
  const name = (r.name || '').toLowerCase();
  return tags.includes('new') || name.includes('新') || name.includes('首发') || name.includes('新品');
}

// 家常菜：快炒/小炒类，或名称/描述含家常/下饭/小炒
function matchHome(r: Recipe): boolean {
  const tags = (r.dishTypes || []).map((t: string) => t.toLowerCase());
  const name = (r.name || '').toLowerCase();
  const desc = (r.description || '').toLowerCase();
  if (tags.includes('stir_fry') || tags.includes('stir_fried_staple')) return true;
  if (name.includes('家常') || name.includes('下饭') || name.includes('小炒')) return true;
  if (desc.includes('家常') || desc.includes('下饭')) return true;
  return false;
}

// 一人食：名称含一人/快手/单人/懒人
function matchSolo(r: Recipe): boolean {
  const name = (r.name || '').toLowerCase();
  return name.includes('一人') || name.includes('快手') || name.includes('单人') || name.includes('懒人');
}

// 地域菜系
function matchCuisine(r: Recipe): boolean {
  const tags = (r.dishTypes || []).map((t: string) => t.toLowerCase());
  const cuisineTypes = new Set(['stir_fry', 'soup', 'western', 'hotpot', 'bbq', 'noodles', 'main']);
  return (r.dishTypes || []).some((t) => cuisineTypes.has(t));
}

Page({
  data: {
    title: '发现菜谱',
    type: '' as DiscoverType | '',
    recipes: [] as DisplayRecipe[],
    leftColRecipes: [] as DisplayRecipe[],
    rightColRecipes: [] as DisplayRecipe[]
  },

  onLoad(query: Record<string, string>) {
    const rawType = String((query && query.type) || '').trim() as DiscoverType | '';
    const titleParam = query && query.title ? decodeURIComponent(query.title) : '';
    const title = titleParam.trim() || '发现菜谱';
    this.setData({ type: rawType, title });

    try {
      wx.setNavigationBarTitle({ title });
    } catch (_e) {}

    this.loadList(rawType);
  },

  async loadList(type: DiscoverType | '') {
    const now = new Date();
    const todaySeed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();

    // 本地加载菜谱，自动带缓存兜底
    let all: Recipe[] = [];
    try {
      all = await loadRecipesAsync();
    } catch (e) {
      console.warn('[发现列表] 加载失败', e);
    }
    if (!all || !all.length) {
      all = loadRecipesJson();
    }
    if (!all.length) {
      this.setData({ recipes: [], leftColRecipes: [], rightColRecipes: [] });
      return;
    }

    // 只保留有真实图片的菜谱
    const withImage = all.filter(hasRealImage);
    if (!withImage.length) {
      this.setData({ recipes: [], leftColRecipes: [], rightColRecipes: [] });
      return;
    }

    // 打乱全量有图菜谱（按日期种子，保证每日结果稳定）
    const shuffled = shuffleWithSeed(withImage, todaySeed);

    let selected: Recipe[] = [];

    if (type === 'internet') {
      // 本周热门：优先匹配热门关键词，按菜名去重后不够则随机补足
      const hotMatches = shuffled.filter(matchInternet);
      const rest = shuffled.filter((r) => !matchInternet(r));
      const hotDeduped = _dedupByName(hotMatches);
      selected = hotDeduped.length >= 12
        ? hotDeduped.slice(0, 16)
        : [...hotDeduped, ...shuffleWithSeed(rest, todaySeed + 1)].slice(0, 16);
    } else if (type === 'new') {
      // 新菜首发：优先匹配新菜关键词，按菜名去重后不够则随机补足
      const newMatches = shuffled.filter(matchNew);
      const rest = shuffled.filter((r) => !matchNew(r));
      const newDeduped = _dedupByName(newMatches);
      selected = newDeduped.length >= 12
        ? newDeduped.slice(0, 16)
        : [...newDeduped, ...shuffleWithSeed(rest, todaySeed + 2)].slice(0, 16);
    } else if (type === 'home') {
      // 家常菜：优先匹配家常关键词，按菜名去重后不够则随机补足
      const homeMatches = shuffled.filter(matchHome);
      const rest = shuffled.filter((r) => !matchHome(r));
      const homeDeduped = _dedupByName(homeMatches);
      selected = homeDeduped.length >= 12
        ? homeDeduped.slice(0, 16)
        : [...homeDeduped, ...shuffleWithSeed(rest, todaySeed + 3)].slice(0, 16);
    } else if (type === 'solo') {
      // 一人食：优先匹配一人食关键词，按菜名去重后不够则随机补足
      const soloMatches = shuffled.filter(matchSolo);
      const rest = shuffled.filter((r) => !matchSolo(r));
      const soloDeduped = _dedupByName(soloMatches);
      selected = soloDeduped.length >= 12
        ? soloDeduped.slice(0, 16)
        : [...soloDeduped, ...shuffleWithSeed(rest, todaySeed + 4)].slice(0, 16);
    } else if (type === 'cuisine') {
      selected = _dedupByName(shuffled.filter(matchCuisine)).slice(0, 16);
      if (!selected.length) selected = shuffled.slice(0, 16);
    } else {
      selected = shuffled.slice(0, 16);
    }

    const recipes = selected.map((r, i) => toDisplayRecipe(r, i, type === 'cuisine'));

    // 瀑布流左右分列
    const leftColRecipes: DisplayRecipe[] = [];
    const rightColRecipes: DisplayRecipe[] = [];
    recipes.forEach((recipe, index) => {
      if (index % 2 === 0) {
        leftColRecipes.push(recipe);
      } else {
        rightColRecipes.push(recipe);
      }
    });

    this.setData({ recipes, leftColRecipes, rightColRecipes });
  },

  onRecipeTap(e: WechatMiniprogram.BaseEvent) {
    const id = String((e.currentTarget.dataset.id as string) || '').trim();
    if (!id) return;
    wx.navigateTo({ url: `/pages/recipes/detail?id=${encodeURIComponent(id)}&from=list` });
  },

  onImageError(e: WechatMiniprogram.BaseEvent) {
    const index = e.currentTarget.dataset.index as number;
    const recipes = this.data.recipes;
    if (recipes[index]) {
      recipes[index].coverImage = FALLBACK_IMAGE;
      this.setData({ recipes });
    }
  },

  onShareAppMessage() {
    return {
      title: '发现更多美味菜谱',
      path: '/pages/custom/index'
    };
  }
});
