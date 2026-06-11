import { prisma } from '../lib/prisma';
import { hasTable } from './databaseCapability.service';
import { loadRecentRecognizedIngredients, RecognizedIngredient } from './ingredientRecognition.service';

export type AiToolName =
  | 'search_recipe'
  | 'get_recipe_detail'
  | 'generate_recipe_draft'
  | 'add_to_fridge'
  | 'add_to_shopping_list'
  | 'schedule_reminder'
  | 'list_fridge'
  | 'list_shopping_list'
  | 'save_user_memory';

export type AiToolCallRecord = {
  name: AiToolName;
  args: Record<string, unknown>;
  result?: unknown;
  success: boolean;
  error?: string;
};

type ToolContext = {
  userId: number;
  text: string;
  recentMessages?: string[];
};

type RecipeSearchResult = {
  id: number;
  title: string;
  description: string;
  cookingTime: number | null;
  difficulty: string;
  ingredients: unknown;
  steps?: unknown;
  matchScore?: number;
};

type FridgeIngredientInput = Pick<RecognizedIngredient, 'name' | 'amount' | 'unit' | 'category'>;

type RecipeDraft = {
  title: string;
  description: string;
  cookingTime: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  servings: number;
  ingredients: Array<{ name: string; amount: string; unit: string; category?: string; isOptional?: boolean }>;
  steps: Array<{ order: number; content: string; duration: number }>;
  tips: string;
  dishTypes: string[];
  source: 'ai_draft';
};

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item || '').trim()).filter(Boolean);
}

function extractKeyword(text: string) {
  const recipeKeyword = extractRecipeKeyword(text);
  if (recipeKeyword) return recipeKeyword;

  return text
    .replace(/加入小菜篮|加入菜篮|添加到小菜篮|添加到菜篮|放到小菜篮|放进小菜篮|放置到小菜篮|放置到小菜蓝|小菜篮|小菜蓝/g, ' ')
    .replace(/加入小冰箱|添加到小冰箱|放到小冰箱|放进小冰箱|放入小冰箱|小冰箱/g, ' ')
    .replace(/提醒|通知|闹钟|准备|食材|帮我|请|怎么做|做法|推荐|菜谱|吃什么/g, ' ')
    .replace(/[，。！？,.!?]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 40);
}

function recipeAliases(keyword: string) {
  const aliases = new Set<string>([keyword]);
  if (/小炒黄牛肉|黄牛肉小炒|小炒牛肉/.test(keyword)) {
    aliases.add('小炒黄牛肉');
    aliases.add('黄牛肉小炒');
    aliases.add('小炒牛肉');
    aliases.add('牛肉小炒');
    aliases.add('炒牛肉');
  }
  if (/沙县鸡腿饭|鸡腿饭|沙县/.test(keyword)) {
    aliases.add('沙县鸡腿饭');
    aliases.add('鸡腿饭');
    aliases.add('卤鸡腿饭');
    aliases.add('鸡腿盖饭');
  }
  if (keyword.includes('西红柿')) aliases.add(keyword.replace(/西红柿/g, '番茄'));
  if (keyword.includes('番茄')) aliases.add(keyword.replace(/番茄/g, '西红柿'));
  return Array.from(aliases).filter(Boolean).slice(0, 8);
}

function splitRecipeKeywords(keyword: string) {
  const parts = new Set<string>();
  for (const part of keyword.split(/[\s+、，,]/)) {
    const clean = part.trim();
    if (clean.length >= 2) parts.add(clean);
  }
  for (const token of ['小炒', '黄牛肉', '牛肉', '青椒', '蒜', '姜', '鸡蛋', '番茄', '西红柿', '沙县', '鸡腿饭', '鸡腿', '米饭']) {
    if (keyword.includes(token)) parts.add(token);
  }
  return Array.from(parts).slice(0, 8);
}

function inferRecipeIngredients(keyword: string) {
  if (/小炒黄牛肉|黄牛肉小炒|小炒牛肉|炒牛肉/.test(keyword)) {
    return ['牛肉', '黄牛肉', '青椒', '小米辣', '蒜', '姜'];
  }
  if (/沙县鸡腿饭|鸡腿饭|卤鸡腿饭|鸡腿盖饭/.test(keyword)) {
    return ['鸡腿', '米饭', '青菜', '鸡蛋', '香菇', '姜', '葱'];
  }
  return splitRecipeKeywords(keyword).filter((item) => !/小炒|红烧|清炒|凉拌|家常/.test(item));
}

function extractRecipeKeyword(text: string) {
  const patterns = [
    /(?:想做|想吃|要做|准备做|打算做|做一份|做个)\s*([\u4e00-\u9fa5A-Za-z0-9]{2,20}?)(?=这道菜|的食材|放|加入|添加|提醒|并|然后|再|顺便|，|。|,|\.|！|？|$)/,
    /(?:把|将)\s*([\u4e00-\u9fa5A-Za-z0-9]{2,20}?)(?:这道菜)?的?食材\s*(?:放|加入|添加)/,
    /准备\s*([\u4e00-\u9fa5A-Za-z0-9]{2,20})\s*这道菜/,
    /([\u4e00-\u9fa5A-Za-z0-9]{2,20})\s*这道菜的食材/,
    /([\u4e00-\u9fa5A-Za-z0-9]{2,20})\s*的食材/,
    /做\s*([\u4e00-\u9fa5A-Za-z0-9]{2,20}?)(?=这道菜|的食材|放|加入|添加|提醒|并|然后|再|顺便|，|。|,|\.|！|？|$)/,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    const keyword = cleanupRecipeKeyword(match?.[1] || '');
    if (keyword && !/这些|明天|今天|提醒|准备|食材|小菜篮|小菜蓝|小冰箱/.test(keyword)) {
      return keyword.slice(0, 20);
    }
  }
  return '';
}

function cleanupRecipeKeyword(value: string) {
  return value
    .replace(/^(我|你|他|她|它|帮我|请|想|要|准备|打算)+/, '')
    .replace(/(这道菜|的食材|食材清单|采购清单|买菜清单)$/g, '')
    .replace(/^(做|吃)/, '')
    .replace(/\s+/g, '')
    .trim();
}

const INGREDIENT_STOP_WORDS = new Set([
  '这些食材',
  '食材',
  '图片',
  '识别结果',
  '推荐',
  '菜谱',
  '做法',
  '小冰箱',
  '小菜篮',
  '小菜蓝',
  '提醒',
  '明天',
  '今天',
  '准备',
]);

function normalizeIngredientItems(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item: any) => {
      if (typeof item === 'string') return { name: item, amount: '', unit: '', category: '' };
      const amount = normalizeAmount(String(item?.amount || item?.quantity || '').trim());
      const unit = String(item?.unit || '').trim();
      return {
        name: String(item?.name || item?.ingredient || '').trim(),
        amount,
        unit: amount && unit && amount.endsWith(unit) ? '' : unit,
        category: String(item?.category || '').trim(),
      };
    })
    .filter((item) => item.name)
    .slice(0, 30);
}

function normalizeAmount(value: string) {
  return value
    .replace(/^(适量)\1+$/, '$1')
    .replace(/^(少许)\1+$/, '$1')
    .replace(/^(若干)\1+$/, '$1')
    .trim();
}

function normalizeIngredientName(value: string) {
  return value
    .replace(/^[-*•\d.、\s]+/, '')
    .replace(/[：:，,。；;！!？?（）()【】[\]"“”‘’]/g, ' ')
    .replace(/\s+/g, '')
    .trim();
}

function extractIngredientItemsFromText(text: string) {
  const items = new Map<string, { name: string; amount: string; unit: string; category: string }>();
  const structuredLines = text
    .split(/\n+/)
    .filter((line) => /识别结果|已识别|识别到|食材列表|食材如下|^[-*•\d.、\s]*[\u4e00-\u9fa5A-Za-z0-9]{1,12}$/.test(line));
  const source = structuredLines
    .join('\n')
    .replace(/(已识别|识别到|图片中|可以看到|包括|有|食材列表|食材如下|这些食材|识别结果)/g, '\n')
    .replace(/[、，,]/g, '\n');

  for (const rawLine of source.split(/\n+/)) {
    const line = rawLine.trim();
    if (!line || line.length > 40) continue;
    const candidate = normalizeIngredientName(line.replace(/^(食材|名称)\s*[:：]?/, ''));
    if (!candidate || candidate.length < 1 || candidate.length > 12) continue;
    if (INGREDIENT_STOP_WORDS.has(candidate)) continue;
    if (/^(第?[一二三四五六七八九十\d]+道|步骤|做法|建议|提醒|清单|标题|口味|小贴士)$/.test(candidate)) continue;
    if (/菜谱|准备|购买|采购|提醒|做法|步骤|建议|口味|小贴士|安全/.test(candidate)) continue;
    items.set(candidate, { name: candidate, amount: '1', unit: '', category: 'other' });
  }

  return Array.from(items.values()).slice(0, 30);
}

async function loadRecentMessages(userId: number, sessionId?: number, take = 6) {
  if (!sessionId) return [];
  const messages = await prisma.aiChatMessage.findMany({
    where: { userId, sessionId },
    orderBy: { createdAt: 'desc' },
    take,
  });
  return messages.reverse().map((message) => message.content).filter(Boolean);
}

async function loadActiveSkills() {
  if (!(await hasTable('ai_skills'))) return [];
  return (prisma as any).aiSkill.findMany({
    where: { isActive: true },
    orderBy: [{ priority: 'desc' }, { updatedAt: 'desc' }],
  });
}

async function findRecipes(keyword: string): Promise<RecipeSearchResult[]> {
  const baseWhere = {
    isDeleted: false,
    status: { in: ['ACTIVE', 'PUBLISHED'] as any },
  };
  const aliases = recipeAliases(keyword);
  const parts = splitRecipeKeywords(keyword);
  const ingredientHints = inferRecipeIngredients(keyword);
  const searchTerms = Array.from(new Set([...aliases, ...parts])).filter(Boolean);

  const initialRecipes = keyword.length > 0
    ? await prisma.recipe.findMany({
        where: {
          ...baseWhere,
          OR: [
            ...searchTerms.flatMap((term) => [
              { title: { contains: term, mode: 'insensitive' as any } },
              { description: { contains: term, mode: 'insensitive' as any } },
              { category: { contains: term, mode: 'insensitive' as any } },
              { cuisine: { contains: term, mode: 'insensitive' as any } },
              { tips: { contains: term, mode: 'insensitive' as any } },
            ]),
          ],
        },
        orderBy: [{ isFeatured: 'desc' }, { isHot: 'desc' }, { viewCount: 'desc' }],
        take: 30,
      })
    : await prisma.recipe.findMany({
        where: baseWhere,
        orderBy: [{ isFeatured: 'desc' }, { isHot: 'desc' }, { viewCount: 'desc' }],
        take: 5,
      });

  const fallbackRecipes = keyword.length > 0 && ingredientHints.length > 0
    ? await prisma.recipe.findMany({
        where: baseWhere,
        orderBy: [{ isFeatured: 'desc' }, { isHot: 'desc' }, { viewCount: 'desc' }],
        take: 80,
      })
    : [];

  const recipeMap = new Map<number, (typeof initialRecipes)[number]>();
  [...initialRecipes, ...fallbackRecipes].forEach((recipe) => recipeMap.set(recipe.id, recipe));

  const rankedItems = Array.from(recipeMap.values())
    .map((recipe) => {
      const haystack = [
        recipe.title,
        recipe.description || '',
        recipe.category || '',
        recipe.cuisine || '',
        JSON.stringify(recipe.ingredients || ''),
      ].join(' ');
      let score = 0;
      if (keyword && recipe.title.includes(keyword)) score += 100;
      for (const alias of aliases) if (alias && recipe.title.includes(alias)) score += 80;
      for (const part of parts) if (part && haystack.includes(part)) score += 18;
      for (const ingredient of ingredientHints) if (ingredient && haystack.includes(ingredient)) score += 12;
      if (recipe.isFeatured) score += 5;
      if (recipe.isHot) score += 4;
      return { recipe, score };
    })
    .filter((item) => !keyword || item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return rankedItems.map(({ recipe, score }) => ({
    id: recipe.id,
    title: recipe.title,
    description: recipe.description || '',
    cookingTime: recipe.cookingTime,
    difficulty: recipe.difficulty,
    ingredients: recipe.ingredients,
    steps: recipe.steps,
    matchScore: score,
  }));
}

function isExactRecipeNameMatch(keyword: string, recipe?: RecipeSearchResult) {
  if (!recipe) return false;
  const title = recipe.title || '';
  return Boolean(keyword && title.includes(keyword));
}

async function addRecipeToShoppingList(userId: number, recipe: RecipeSearchResult) {
  const items = normalizeIngredientItems(recipe.ingredients);
  if (items.length === 0) {
    throw new Error('菜谱没有可加入小菜篮的食材');
  }

  const name = `${recipe.title}食材清单`;
  const existing = await prisma.shoppingList.findFirst({ where: { userId, name } });
  const data = {
    recipeId: recipe.id,
    source: 'ai_chat',
    updatedAt: new Date(),
    items: {
      deleteMany: {},
      create: items,
    },
  };

  const list = existing
    ? await prisma.shoppingList.update({
        where: { id: existing.id },
        data,
        include: { items: true },
      })
    : await prisma.shoppingList.create({
        data: {
          userId,
          name,
          source: 'ai_chat',
          recipeId: recipe.id,
          items: { create: items },
        },
        include: { items: true },
      });

  return {
    id: list.id,
    name: list.name,
    recipeId: list.recipeId,
    itemCount: list.items.length,
    items: list.items.map((item) => ({
      name: item.name,
      amount: item.amount || '',
      unit: item.unit || '',
      category: item.category || '',
    })),
  };
}

function inferDraftIngredients(title: string, currentText: string): RecipeDraft['ingredients'] {
  const explicitItems = extractIngredientItemsFromText(currentText)
    .filter((item) => !/做法|步骤|建议|口味|清单/.test(item.name))
    .map((item) => ({
      name: item.name,
      amount: item.amount || '1',
      unit: item.unit || '',
      category: item.category || 'other',
      isOptional: false,
    }));

  const contains = (keyword: string) => title.includes(keyword);
  if (contains('小炒黄牛肉') || (contains('黄牛肉') && contains('小炒'))) {
    return [
      { name: '黄牛肉', amount: '250', unit: 'g', category: 'meat', isOptional: false },
      { name: '青椒', amount: '2', unit: '个', category: 'vegetable', isOptional: false },
      { name: '小米辣', amount: '2', unit: '个', category: 'vegetable', isOptional: true },
      { name: '蒜', amount: '3', unit: '瓣', category: 'seasoning', isOptional: false },
      { name: '姜', amount: '5', unit: 'g', category: 'seasoning', isOptional: false },
      { name: '生抽', amount: '15', unit: 'ml', category: 'seasoning', isOptional: false },
      { name: '蚝油', amount: '10', unit: 'ml', category: 'seasoning', isOptional: false },
      { name: '料酒', amount: '10', unit: 'ml', category: 'seasoning', isOptional: false },
      { name: '淀粉', amount: '5', unit: 'g', category: 'seasoning', isOptional: false },
      { name: '食用油', amount: '15', unit: 'ml', category: 'seasoning', isOptional: false },
    ];
  }

  if (/沙县鸡腿饭|鸡腿饭|卤鸡腿饭|鸡腿盖饭/.test(title)) {
    return [
      { name: '鸡腿', amount: '2', unit: '只', category: 'meat', isOptional: false },
      { name: '大米', amount: '300', unit: 'g', category: 'staple', isOptional: false },
      { name: '青菜', amount: '200', unit: 'g', category: 'vegetable', isOptional: false },
      { name: '鸡蛋', amount: '2', unit: '个', category: 'egg', isOptional: true },
      { name: '香菇', amount: '4', unit: '朵', category: 'vegetable', isOptional: true },
      { name: '姜', amount: '10', unit: 'g', category: 'seasoning', isOptional: false },
      { name: '葱', amount: '2', unit: '根', category: 'seasoning', isOptional: false },
      { name: '生抽', amount: '20', unit: 'ml', category: 'seasoning', isOptional: false },
      { name: '老抽', amount: '8', unit: 'ml', category: 'seasoning', isOptional: false },
      { name: '料酒', amount: '15', unit: 'ml', category: 'seasoning', isOptional: false },
      { name: '冰糖', amount: '8', unit: 'g', category: 'seasoning', isOptional: false },
    ];
  }

  if (explicitItems.length > 0) {
    return explicitItems.slice(0, 12);
  }

  const main = title.replace(/小炒|红烧|清炒|凉拌|家常|这道菜|的食材/g, '').trim() || title;
  return [
    { name: main, amount: '250', unit: 'g', category: 'other', isOptional: false },
    { name: '蒜', amount: '3', unit: '瓣', category: 'seasoning', isOptional: false },
    { name: '姜', amount: '5', unit: 'g', category: 'seasoning', isOptional: false },
    { name: '生抽', amount: '15', unit: 'ml', category: 'seasoning', isOptional: false },
    { name: '食用油', amount: '15', unit: 'ml', category: 'seasoning', isOptional: false },
  ];
}

function generateRecipeDraft(title: string, currentText: string): RecipeDraft {
  const cleanTitle = title || '家常菜';
  const ingredients = inferDraftIngredients(cleanTitle, currentText);
  const mainIngredient = ingredients.find((item) => !item.isOptional && item.category !== 'seasoning')?.name || ingredients[0]?.name || cleanTitle;
  const dishTypes = /沙县鸡腿饭|鸡腿饭|卤/.test(cleanTitle) ? ['rice_bowl'] : /炒|小炒/.test(cleanTitle) ? ['stir_fry'] : ['fried'];
  const isChickenRice = /沙县鸡腿饭|鸡腿饭|卤鸡腿饭|鸡腿盖饭/.test(cleanTitle);

  return {
    title: cleanTitle,
    description: `系统菜谱库暂未匹配到「${cleanTitle}」，这是按 recipe-generator 专业菜谱标准生成的采购草稿。`,
    cookingTime: isChickenRice ? 35 : /炒|小炒/.test(cleanTitle) ? 15 : 25,
    difficulty: 'EASY',
    servings: 2,
    ingredients,
    steps: isChickenRice
      ? [
          { order: 1, content: '鸡腿洗净划两刀，用料酒、生抽、姜片腌10分钟；大米提前淘洗好。', duration: 10 },
          { order: 2, content: '锅里少油煎鸡腿至两面微黄，加入生抽、老抽、冰糖、姜葱和适量清水。', duration: 8 },
          { order: 3, content: '小火卤煮鸡腿至熟透入味，同时把米饭蒸好，青菜焯熟。', duration: 20 },
          { order: 4, content: '米饭装碗，摆上鸡腿、青菜、鸡蛋或香菇，淋一点卤汁即可。', duration: 3 },
        ]
      : [
          { order: 1, content: `将${mainIngredient}处理成适口大小，加入料酒、生抽和淀粉抓匀，腌制约10分钟。`, duration: 10 },
          { order: 2, content: '蒜和姜切末，青椒或其他配菜切块，所有食材先备齐再开火。', duration: 5 },
          { order: 3, content: `热锅下油，先将${mainIngredient}快速滑炒至变色后盛出，避免久炒变老。`, duration: 3 },
          { order: 4, content: `锅中留底油爆香姜蒜，加入配菜大火快炒，再倒回${mainIngredient}翻匀调味。`, duration: 4 },
        ],
    tips: isChickenRice
      ? '这是 AI 生成的采购草稿，适合先买菜。鸡腿饭的关键是卤汁不要太咸，最后淋饭只需要少量，青菜单独焯熟会更清爽。'
      : '这是 AI 生成的菜谱草稿，适合用于采购清单；正式做菜前建议根据个人口味调整辣度和咸度。肉类下锅前尽量沥干水分，大火快炒能减少出水。',
    dishTypes,
    source: 'ai_draft',
  };
}

async function addDraftToShoppingList(userId: number, draft: RecipeDraft) {
  const name = `${draft.title}食材清单`;
  const existing = await prisma.shoppingList.findFirst({ where: { userId, name } });
  const items = normalizeIngredientItems(draft.ingredients);
  if (items.length === 0) throw new Error('菜谱草稿没有可加入小菜篮的食材');

  const data = {
    recipeId: null,
    source: 'ai_chat_draft',
    updatedAt: new Date(),
    items: {
      deleteMany: {},
      create: items,
    },
  };

  const list = existing
    ? await prisma.shoppingList.update({ where: { id: existing.id }, data, include: { items: true } })
    : await prisma.shoppingList.create({
        data: {
          userId,
          name,
          source: 'ai_chat_draft',
          recipeId: null,
          items: { create: items },
        },
        include: { items: true },
      });

  return {
    id: list.id,
    name: list.name,
    recipeId: list.recipeId,
    source: list.source,
    draft,
    itemCount: list.items.length,
    items: list.items.map((item) => ({
      name: item.name,
      amount: item.amount || '',
      unit: item.unit || '',
      category: item.category || '',
    })),
  };
}

async function addItemsToFridge(userId: number, items: FridgeIngredientInput[]) {
  if (items.length === 0) throw new Error('没有解析到可放入小冰箱的食材');

  const results = [];
  for (const item of items) {
    const existing = await prisma.fridgeItem.findFirst({
      where: { userId, name: item.name },
    });

    const saved = existing
      ? await prisma.fridgeItem.update({
          where: { id: existing.id },
          data: {
            amount: existing.amount || item.amount,
            unit: existing.unit || item.unit || null,
            category: existing.category || item.category || 'other',
          },
        })
      : await prisma.fridgeItem.create({
          data: {
            userId,
            name: item.name,
            amount: item.amount,
            unit: item.unit || null,
            category: item.category || 'other',
          },
        });

    results.push({
      id: saved.id,
      name: saved.name,
      amount: saved.amount || '',
      unit: saved.unit || '',
      category: saved.category || 'other',
    });
  }

  return { itemCount: results.length, items: results };
}

async function addRecentRecognitionToFridge(userId: number) {
  const recent = await loadRecentRecognizedIngredients(userId);
  if (!recent) {
    throw new Error('我没有找到刚才识别到的结构化食材，请重新识别或直接告诉我食材名称。');
  }
  const items = recent.ingredients
    .filter((item) => item.confidence >= 0.5)
    .map((item) => ({
      name: item.name,
      amount: item.amount || '1',
      unit: item.unit || '',
      category: item.category || 'other',
    }));
  if (items.length === 0) {
    throw new Error('最近一次识别结果置信度太低，我没有自动写入小冰箱。请重新识别或直接告诉我食材名称。');
  }
  const result = await addItemsToFridge(userId, items);
  return {
    ...result,
    recognitionLogId: recent.id,
    imageUrl: recent.imageUrl,
  };
}

async function listFridgeItems(userId: number) {
  const items = await prisma.fridgeItem.findMany({
    where: { userId },
    orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
    take: 30,
  });

  return {
    itemCount: items.length,
    items: items.map((item) => ({
      id: item.id,
      name: item.name,
      amount: item.amount || '',
      unit: item.unit || '',
      category: item.category || 'other',
    })),
  };
}

async function listActiveShoppingLists(userId: number) {
  const lists = await prisma.shoppingList.findMany({
    where: { userId, status: 'ACTIVE' as any },
    include: { items: { orderBy: { createdAt: 'asc' } } },
    orderBy: { updatedAt: 'desc' },
    take: 5,
  });

  return {
    listCount: lists.length,
    lists: lists.map((list) => ({
      id: list.id,
      name: list.name,
      recipeId: list.recipeId,
      source: list.source,
      itemCount: list.items.length,
      items: list.items.map((item) => ({
        id: item.id,
        name: item.name,
        amount: item.amount || '',
        unit: item.unit || '',
        category: item.category || '',
        isChecked: item.isChecked,
      })),
    })),
  };
}

async function saveUserMemory(userId: number, text: string) {
  if (!(await hasTable('user_memories'))) {
    throw new Error('用户记忆表尚未初始化，请先执行数据库迁移');
  }
  const content = text
    .replace(/^(请|帮我)?(以后)?记住[:：]?/, '')
    .trim()
    .slice(0, 240);
  if (!content) throw new Error('没有可保存的记忆内容');

  const existing = await (prisma as any).userMemory.findFirst({
    where: { userId, content },
  });
  if (existing) {
    const memory = await (prisma as any).userMemory.update({
      where: { id: existing.id },
      data: { lastUsedAt: new Date() },
    });
    return {
      id: memory.id,
      type: memory.type,
      content: memory.content,
    };
  }

  const memory = await (prisma as any).userMemory.create({
    data: {
      userId,
      type: /过敏|不吃|忌口/.test(content) ? 'diet_restriction' : 'preference_explicit',
      content,
      metadata: { source: 'ai_chat_tool' },
      lastUsedAt: new Date(),
    },
  });

  return {
    id: memory.id,
    type: memory.type,
    content: memory.content,
  };
}

function wantsShoppingList(text: string) {
  return /加入小菜篮|加入菜篮|添加到小菜篮|添加到菜篮|放到小菜篮|放进小菜篮|放置到小菜篮|放置到小菜蓝|小菜篮|小菜蓝|买菜清单|购物清单|帮我买菜|需要买/.test(text);
}

function wantsFridge(text: string) {
  return /加入小冰箱|添加到小冰箱|放到小冰箱|放进小冰箱|放入小冰箱|存到小冰箱|小冰箱/.test(text);
}

function wantsReminder(text: string) {
  return /提醒|闹钟|通知|明天|今天|今晚|上午|下午|晚上/.test(text) && /买菜|采购|购物清单|小菜篮|小菜蓝|食材|准备/.test(text);
}

function wantsFridgeContext(text: string) {
  return /冰箱|小冰箱|现有食材|已有食材|剩下什么|还有什么|用.*食材|根据.*食材|配菜/.test(text);
}

function wantsShoppingListContext(text: string) {
  return /小菜篮|小菜蓝|购物清单|买菜清单|采购清单|还要买|缺什么/.test(text);
}

function wantsMemorySave(text: string) {
  return /记住|以后记得|我不吃|不喜欢|过敏|忌口|喜欢吃|爱吃|少油|少盐|控糖|减脂/.test(text);
}

function parseReminderTime(text: string) {
  const now = new Date();
  const triggerAt = new Date(now);
  const dateMatch = text.match(/(?:(\d{4})[年/-])?(\d{1,2})[月/-](\d{1,2})[日号]?/);
  if (dateMatch) {
    const year = dateMatch[1] ? Number(dateMatch[1]) : now.getFullYear();
    triggerAt.setFullYear(year, Number(dateMatch[2]) - 1, Number(dateMatch[3]));
  } else if (/后天/.test(text)) {
    triggerAt.setDate(triggerAt.getDate() + 2);
  } else if (/明天|明早|明晚|明日/.test(text)) {
    triggerAt.setDate(triggerAt.getDate() + 1);
  }

  const relativeMinuteMatch = text.match(/(\d{1,3})\s*(?:分钟|分)\s*后/);
  if (relativeMinuteMatch) {
    triggerAt.setTime(now.getTime() + Number(relativeMinuteMatch[1]) * 60_000);
    triggerAt.setSeconds(0, 0);
    return triggerAt;
  }

  const relativeHourMatch = text.match(/(\d{1,2})\s*(?:小时|钟头)\s*后/);
  if (relativeHourMatch) {
    triggerAt.setTime(now.getTime() + Number(relativeHourMatch[1]) * 60 * 60_000);
    triggerAt.setSeconds(0, 0);
    return triggerAt;
  }

  const colonMatch = text.match(/(\d{1,2})\s*[:：]\s*(\d{1,2})/);
  const hourMatch = colonMatch || text.match(/(\d{1,2})\s*(?:点|时)/);
  let hour = hourMatch ? Number(hourMatch[1]) : 9;
  if (/下午|晚上|今晚|明晚/.test(text) && hour < 12) hour += 12;
  if (/凌晨|早上|上午|明早/.test(text) && hour === 12) hour = 0;

  const minuteMatch = colonMatch || text.match(/\d{1,2}\s*(?:点|时)\s*(半|一刻|三刻|\d{1,2})?\s*分?/);
  let minute = 0;
  const minuteText = minuteMatch?.[2];
  if (minuteText === '半') minute = 30;
  else if (minuteText === '一刻') minute = 15;
  else if (minuteText === '三刻') minute = 45;
  else if (minuteText) minute = Number(minuteText);
  triggerAt.setHours(Math.min(Math.max(hour, 0), 23), Math.min(Math.max(minute, 0), 59), 0, 0);

  if (!dateMatch && !/后天|明天|明早|明晚|明日/.test(text) && triggerAt.getTime() <= now.getTime()) {
    triggerAt.setDate(triggerAt.getDate() + 1);
  }
  return triggerAt;
}

async function createShoppingReminder(userId: number, text: string, shoppingList?: any) {
  if (!(await hasTable('scheduled_tasks'))) {
    throw new Error('提醒任务表尚未初始化，请先执行数据库迁移');
  }

  const triggerAt = parseReminderTime(text);
  const listName = shoppingList?.name || '小菜篮';
  const itemNames = Array.isArray(shoppingList?.items)
    ? shoppingList.items.map((item: any) => item.name).filter(Boolean).slice(0, 12)
    : [];
  const body = itemNames.length
    ? `该去买菜了：${itemNames.join('、')}`
    : '该去买菜了，记得查看小菜篮里的食材清单。';

  const task = await (prisma as any).scheduledTask.create({
    data: {
      userId,
      type: 'SHOPPING_REMINDER',
      title: `买菜提醒：${listName}`,
      body,
      data: {
        source: 'ai_chat',
        shoppingListId: shoppingList?.id,
        recipeId: shoppingList?.recipeId,
        items: itemNames,
      },
      triggerAt,
    },
  });

  return {
    id: task.id,
    type: task.type,
    title: task.title,
    body: task.body,
    data: task.data,
    triggerAt: task.triggerAt,
  };
}

export async function planAndExecuteAiTools(ctx: ToolContext): Promise<AiToolCallRecord[]> {
  const skills = await loadActiveSkills();
  const enabledTools = new Set<AiToolName>();
  for (const skill of skills) {
    const keywords = asStringArray(skill.triggerKeywords);
    const tools = asStringArray(skill.tools) as AiToolName[];
    if (keywords.length === 0 || keywords.some((keyword) => ctx.text.includes(keyword))) {
      tools.forEach((tool) => enabledTools.add(tool));
    }
  }

  const calls: AiToolCallRecord[] = [];
  const keyword = extractKeyword(ctx.text);
  const recentContext = [ctx.text, ...(ctx.recentMessages || [])].join('\n');

  if (enabledTools.has('list_fridge') && wantsFridgeContext(ctx.text)) {
    try {
      const result = await listFridgeItems(ctx.userId);
      calls.push({ name: 'list_fridge', args: {}, result, success: true });
    } catch (err: any) {
      calls.push({ name: 'list_fridge', args: {}, success: false, error: err?.message || String(err) });
    }
  }

  if (enabledTools.has('list_shopping_list') && wantsShoppingListContext(ctx.text)) {
    try {
      const result = await listActiveShoppingLists(ctx.userId);
      calls.push({ name: 'list_shopping_list', args: {}, result, success: true });
    } catch (err: any) {
      calls.push({ name: 'list_shopping_list', args: {}, success: false, error: err?.message || String(err) });
    }
  }

  if (enabledTools.has('save_user_memory') && wantsMemorySave(ctx.text)) {
    try {
      const result = await saveUserMemory(ctx.userId, ctx.text);
      calls.push({ name: 'save_user_memory', args: { text: ctx.text.slice(0, 120) }, result, success: true });
    } catch (err: any) {
      calls.push({ name: 'save_user_memory', args: { text: ctx.text.slice(0, 120) }, success: false, error: err?.message || String(err) });
    }
  }

  if (enabledTools.has('add_to_fridge') && wantsFridge(ctx.text)) {
    try {
      const shouldUseRecentRecognition = /这些|识别|刚才|上面|图片|刚刚/.test(ctx.text);
      const result = shouldUseRecentRecognition
        ? await addRecentRecognitionToFridge(ctx.userId)
        : await addItemsToFridge(ctx.userId, extractIngredientItemsFromText(recentContext));
      calls.push({
        name: 'add_to_fridge',
        args: { source: shouldUseRecentRecognition ? 'recent_recognition' : 'text' },
        result,
        success: true,
      });
    } catch (err: any) {
      calls.push({ name: 'add_to_fridge', args: { text: ctx.text }, success: false, error: err?.message || String(err) });
    }
  }

  if (enabledTools.has('search_recipe')) {
    try {
      const recipes = await findRecipes(keyword);
      calls.push({
        name: 'search_recipe',
        args: { keyword },
        result: recipes,
        success: true,
      });
    } catch (err: any) {
      calls.push({ name: 'search_recipe', args: { keyword }, success: false, error: err?.message || String(err) });
    }
  }

  let generatedDraft: RecipeDraft | null = null;
  if (enabledTools.has('generate_recipe_draft') && (wantsShoppingList(ctx.text) || /生成菜谱|创建菜谱|菜谱草稿|准备食材/.test(ctx.text))) {
    const recipeResults = calls.find((call) => call.name === 'search_recipe' && call.success)?.result as RecipeSearchResult[] | undefined;
    if (!recipeResults || recipeResults.length === 0 || !isExactRecipeNameMatch(keyword, recipeResults[0])) {
      try {
        generatedDraft = generateRecipeDraft(keyword || extractRecipeKeyword(ctx.text) || '家常菜', ctx.text);
        calls.push({
          name: 'generate_recipe_draft',
          args: { title: generatedDraft.title, source: 'recipe-generator' },
          result: generatedDraft,
          success: true,
        });
      } catch (err: any) {
        calls.push({ name: 'generate_recipe_draft', args: { keyword }, success: false, error: err?.message || String(err) });
      }
    }
  }

  if (enabledTools.has('add_to_shopping_list') && wantsShoppingList(ctx.text)) {
    try {
      const recipeResults =
        (calls.find((call) => call.name === 'search_recipe' && call.success)?.result as RecipeSearchResult[] | undefined) ||
        (await findRecipes(keyword));
      const recipe = isExactRecipeNameMatch(keyword, recipeResults[0]) ? recipeResults[0] : undefined;
      const list = recipe
        ? await addRecipeToShoppingList(ctx.userId, recipe)
        : await addDraftToShoppingList(ctx.userId, generatedDraft || generateRecipeDraft(keyword || '家常菜', ctx.text));
      calls.push({
        name: 'add_to_shopping_list',
        args: recipe
          ? { recipeId: recipe.id, recipeTitle: recipe.title }
          : { recipeId: null, recipeTitle: (list as any).draft?.title, source: 'ai_draft' },
        result: list,
        success: true,
      });
    } catch (err: any) {
      calls.push({ name: 'add_to_shopping_list', args: { keyword }, success: false, error: err?.message || String(err) });
    }
  }

  if (enabledTools.has('schedule_reminder') && wantsReminder(ctx.text)) {
    try {
      const shoppingList = calls.find((call) => call.name === 'add_to_shopping_list' && call.success)?.result;
      const reminder = await createShoppingReminder(ctx.userId, ctx.text, shoppingList);
      calls.push({
        name: 'schedule_reminder',
        args: { text: ctx.text },
        result: reminder,
        success: true,
      });
    } catch (err: any) {
      calls.push({ name: 'schedule_reminder', args: { text: ctx.text }, success: false, error: err?.message || String(err) });
    }
  }

  return calls;
}

export async function planAndExecuteAiToolsWithHistory(ctx: ToolContext & { sessionId?: number }) {
  const recentMessages = ctx.recentMessages || await loadRecentMessages(ctx.userId, ctx.sessionId);
  return planAndExecuteAiTools({ userId: ctx.userId, text: ctx.text, recentMessages });
}

export function formatToolCallsForPrompt(calls: AiToolCallRecord[]) {
  if (calls.length === 0) return '';
  return calls
    .map((call, index) => {
      return `[工具${index + 1}] ${call.name}\n状态：${call.success ? '成功' : '失败'}\n参数：${JSON.stringify(call.args)}\n结果：${JSON.stringify(call.result || call.error || '')}`;
    })
    .join('\n\n');
}

export function formatToolCallsForUser(calls: AiToolCallRecord[]) {
  const successCalls = calls.filter((call) => call.success);
  const failedCalls = calls.filter((call) => !call.success);
  if (successCalls.length === 0 && failedCalls.length === 0) return '';

  const lines: string[] = [];
  for (const call of successCalls) {
    const result: any = call.result || {};
    if (call.name === 'add_to_fridge') {
      const names = Array.isArray(result.items)
        ? result.items.map((item: any) => item.name).filter(Boolean).slice(0, 12)
        : [];
      const sourceText = result.recognitionLogId ? '根据最近一次食材识别结果，' : '';
      lines.push(`${sourceText}已放入小冰箱：共 ${result.itemCount || names.length || 0} 种${names.length ? `，${names.join('、')}` : ''}`);
    } else if (call.name === 'add_to_shopping_list') {
      const names = Array.isArray(result.items)
        ? result.items.map((item: any) => item.name).filter(Boolean).slice(0, 12)
        : [];
      const prefix = result.source === 'ai_chat_draft'
        ? '系统菜谱库暂未找到对应菜谱，已按通用做法生成 AI 采购清单'
        : '已放入小菜篮';
      lines.push(`${prefix}「${result.name || '食材清单'}」：${names.length ? names.join('、') : `${result.itemCount || 0} 项`}`);
    } else if (call.name === 'generate_recipe_draft') {
      lines.push(`已生成菜谱草稿「${result.title || '未命名菜谱'}」，用于补齐无正式菜谱时的小菜篮清单`);
    } else if (call.name === 'schedule_reminder') {
      const triggerAt = result.triggerAt ? new Date(result.triggerAt).toLocaleString('zh-CN', { hour12: false }) : '';
      lines.push(`已创建提醒「${result.title || '买菜提醒'}」${triggerAt ? `，时间：${triggerAt}` : ''}`);
    } else if (call.name === 'save_user_memory') {
      lines.push(`已记住：${result.content || '这条饮食偏好'}`);
    }
  }

  for (const call of failedCalls) {
    if (call.name === 'add_to_fridge' || call.name === 'add_to_shopping_list' || call.name === 'schedule_reminder') {
      lines.push(`未能执行 ${call.name}：${call.error || '未知错误'}`);
    }
  }

  return lines.length ? `\n\n---\n${lines.join('\n')}` : '';
}
