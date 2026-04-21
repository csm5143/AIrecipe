/**
 * 食材名与 usage 里常见键名不一致时的别名（如清单写「食用油」、用量里只有「油」） */
const USAGE_NAME_ALIASES: Record<string, readonly string[]> = {
  食用油: ['油', '植物油'],
  植物油: ['油'],
  色拉油: ['油'],
  花生油: ['油'],
  橄榄油: ['油'],
  葱段: ['葱', '大葱', '葱花'],
  葱段儿: ['葱', '大葱'],
  生姜: ['姜'],
  老姜: ['姜'],
  大蒜: ['蒜', '蒜瓣'],
  蒜头: ['蒜', '蒜瓣'],
  白砂糖: ['糖', '白糖'],
  冰糖块: ['冰糖'],
  鸡精粉: ['鸡精'],
  生抽酱油: ['生抽'],
  老抽酱油: ['老抽'],
  香醋或陈醋: ['香醋', '醋', '陈醋'],
  淀粉水: ['淀粉'],
  水淀粉: ['淀粉']
};

/**
 * 根据食材名从 usage 中取用量，支持常见别名
 */
export function resolveUsageAmount(
  ingredientName: string,
  usage: Record<string, string> | undefined
): string {
  const name = String(ingredientName || '').trim();
  if (!name || !usage) return '适量';
  const direct = usage[name];
  if (direct) return direct;
  const alts = USAGE_NAME_ALIASES[name];
  if (alts) {
    for (const a of alts) {
      const v = usage[a];
      if (v) return v;
    }
  }
  return '适量';
}

/**
 * 从简介或单条长句拆成多步（支持中文逗号、顿号、分号、句号）
 */
export function parseStepsFromText(text: string): string[] {
  const raw = (text || '').trim();
  if (!raw) return [];
  const byStrong = raw.split(/[；。\n]/).map((s) => s.trim()).filter(Boolean);
  if (byStrong.length > 1) return byStrong;
  const blob = byStrong[0] || raw;
  // 只按「，」拆，避免把「生抽、老抽」等顿号列举拆碎
  const byComma = blob.split(/，/).map((s) => s.trim()).filter((s) => s.length >= 2);
  if (byComma.length > 1) return byComma;
  return [blob];
}

/**
 * 若 steps 只有 1 条且为「逗号串起来的流程」，拆成多步；否则沿用 JSON 中的 steps
 */
export function normalizeStepsForDisplay(
  steps: string[] | undefined,
  description: string
): string[] {
  const desc = (description || '').trim();
  const list = (steps || [])
    .map((s) => String(s || '').trim())
    .filter(Boolean);
  if (list.length === 0) return parseStepsFromText(desc);
  if (list.length === 1) {
    const one = list[0];
    const commaCount = (one.match(/，/g) || []).length;
    if (commaCount >= 2 || (one.length > 36 && commaCount >= 1)) {
      return parseStepsFromText(one);
    }
  }
  return list;
}

/**
 * 从 description 中提取卡路里信息（例如："约400kcal/份" 或 "约280–320kcal/份"）
 * 支持多种分隔符：en dash (–)、hyphen (-)、全角横线（—）
 * @param description 描述文本
 * @returns 卡路里字符串（如 "400kcal"），如果未找到则返回null
 */
export function extractCalories(description: any): string | null {
  if (!description || typeof description !== 'string') return null;
  // 匹配格式：约XXXkcal/份 或 约XXX–XXXkcal/份 或 约XXX-XXXkcal/份
  // 使用更宽泛的匹配，支持 en dash (– U+2013)、hyphen-minus (- U+002D)、em dash (— U+2014)
  const match = description.match(/约\s*(\d+(?:[–\-\—]\d+)?)\s*kcal\/份/);
  if (match && match[1]) {
    return match[1] + 'kcal';
  }
  return null;
}

/**
 * 将"原始菜谱对象列表"转换为页面使用的标准 Recipe 结构，
 * 做一层宽松解析 + 默认值，避免 JSON 中少字段或类型不对导致页面报错。
 * @param rawList 原始菜谱数据数组
 * @returns 标准化后的菜谱数组
 */
export function normalizeRecipesFromRaw(rawList: any[]): Recipe[] {
  if (!Array.isArray(rawList)) return [];

  const result: Recipe[] = [];

  for (let index = 0; index < rawList.length; index++) {
    const raw = rawList[index];
    const safe = raw || {};

    const idSource =
      safe.id != null && String(safe.id).trim() ? safe.id : index + 1;
    const id = String(idSource).trim();

    const nameSource = safe.name != null ? safe.name : '';
    const name = String(nameSource).trim();

    if (!id || !name) {
      // id 或 name 缺失就跳过这条，避免后面页面渲染出错
      continue;
    }

    const descSource = safe.description != null ? safe.description : '';
    const description = String(descSource).trim();

    let ingredients: string[] = [];
    if (Array.isArray(safe.ingredients)) {
      ingredients = safe.ingredients
        .map(function (x: any) {
          return String(x != null ? x : '').trim();
        })
        .filter(function (x: string) {
          return !!x;
        });
    }

    let mealTimes: string[] = [];
    if (Array.isArray(safe.mealTimes)) {
      mealTimes = safe.mealTimes
        .map(function (x: any) {
          return String(x != null ? x : '').trim();
        })
        .filter(function (x: string) {
          return !!x;
        });
    }

    let dishTypes: string[] = [];
    if (Array.isArray(safe.dishTypes)) {
      dishTypes = safe.dishTypes
        .map(function (x: any) {
          return String(x != null ? x : '').trim();
        })
        .filter(function (x: string) {
          return !!x;
        });
    }

    const timeCostRaw = safe.timeCost;
    const timeCost: number | null =
      timeCostRaw === null || timeCostRaw === undefined
        ? null
        : Number(timeCostRaw);

    const rawDifficulty = String(
      safe.difficulty != null ? safe.difficulty : ''
    ).trim() as Recipe['difficulty'] | '' | 'medium';
    const difficulty: Recipe['difficulty'] =
      rawDifficulty === 'easy' || rawDifficulty === 'normal' || rawDifficulty === 'hard'
        ? rawDifficulty
        : rawDifficulty === 'medium'
        ? 'normal'
        : 'easy';

    const coverImageRaw = String(
      safe.coverImage != null ? safe.coverImage : ''
    ).trim();
    // 有真实 COS 图片才展示，否则当作没有图片（隐藏占位符 dummyimage）
    const isDummyImage = !coverImageRaw || coverImageRaw.indexOf('dummyimage.com') !== -1;
    const coverImage = isDummyImage ? '' : coverImageRaw;

    let steps: string[] | undefined;
    if (Array.isArray(safe.steps)) {
      const sl = safe.steps
        .map(function (x: any) {
          return String(x != null ? x : '').trim();
        })
        .filter(function (x: string) {
          return !!x;
        });
      if (sl.length > 0) steps = sl;
    }

    let usage: Record<string, string> | undefined;
    if (safe.usage != null && typeof safe.usage === 'object' && !Array.isArray(safe.usage)) {
      const u: Record<string, string> = {};
      for (const k of Object.keys(safe.usage)) {
        const key = String(k || '').trim();
        if (!key) continue;
        const val = String((safe.usage as Record<string, unknown>)[k] != null ? (safe.usage as Record<string, unknown>)[k] : '').trim();
        if (val) u[key] = val;
      }
      if (Object.keys(u).length > 0) usage = u;
    }

    // 处理别名
    let aliases: string[] | undefined;
    if (Array.isArray(safe.aliases) && safe.aliases.length > 0) {
      aliases = safe.aliases
        .map(function (x: any) {
          return String(x != null ? x : '').trim();
        })
        .filter(function (x: string) {
          return !!x;
        });
      if (aliases.length === 0) aliases = undefined;
    }

    // 处理营养信息
    let nutrition: Recipe['nutrition'] | undefined;
    if (safe.nutrition != null && typeof safe.nutrition === 'object') {
      const n = safe.nutrition;
      const hasNutrition = Object.keys(n).some(k => n[k] != null && n[k] !== 0);
      if (hasNutrition) {
        nutrition = {
          calories: n.calories != null ? n.calories : undefined,
          protein: n.protein != null ? n.protein : undefined,
          carbs: n.carbs != null ? n.carbs : undefined,
          fat: n.fat != null ? n.fat : undefined,
          fiber: n.fiber != null ? n.fiber : undefined
        };
      }
    }

    const item: Recipe = {
      id,
      name,
      coverImage,
      description,
      ingredients,
      mealTimes,
      dishTypes,
      timeCost,
      difficulty
    };
    if (steps) item.steps = steps;
    if (usage) item.usage = usage;
    if (aliases) item.aliases = aliases;
    if (nutrition) item.nutrition = nutrition;
    // 保留儿童餐/健身餐专属字段
    if (safe.childrenMeal === true) item.childrenMeal = true;
    if (safe.ageBand) item.ageBand = String(safe.ageBand);
    if (safe.macros) item.macros = safe.macros;
    if (safe.fitnessMeal === true) item.fitnessMeal = true;
    if (safe.fitnessCategory) item.fitnessCategory = String(safe.fitnessCategory);
    if (safe.goal) item.goal = String(safe.goal);
    result.push(item);
  }

  return result;
}
