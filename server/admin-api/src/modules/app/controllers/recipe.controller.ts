import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../../../lib/prisma';
import { success, paginated, notFound, badRequest } from '../../../types/response';

interface AppRecipe {
  id: number;
  name: string;
  coverImage: string;
  description: string;
  ingredients: string[];
  usage: Record<string, string>;
  steps: string[];
  difficulty: 'easy' | 'normal' | 'hard';
  timeCost: number | null;
  calories: number | null;
  nutrition: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
  } | null;
  cuisine: string | null;
  category: string | null;
  mealTimes: string[];
  dishTypes: string[];
  fitnessMeal: boolean;
  fitnessCategory: string | null;
  goal: string | null;
  childrenMeal: boolean;
  ageBand: string | null;
  tags: string[];
  isFeatured: boolean;
  viewCount: number;
  collectCount: number;
}

function mapRecipeToAppFormat(recipe: any): AppRecipe {
  const rawIngredients: any[] = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
  const rawSteps: any[] = Array.isArray(recipe.steps) ? recipe.steps : [];
  const rawUsage: Record<string, string> = {};

  rawIngredients.forEach((ing: any) => {
    if (typeof ing === 'string') {
      rawUsage[ing] = '';
    } else if (ing.name) {
      rawUsage[ing.name] = ing.amount || '';
    }
  });

  const ingredientsList = rawIngredients.map((ing: any) =>
    typeof ing === 'string' ? ing : ing.name || ''
  ).filter(Boolean);

  const mealTimeSet = new Set<string>();
  const dishTypeSet = new Set<string>();
  const tagsSet = new Set<string>();

  if (recipe.tags && Array.isArray(recipe.tags)) {
    recipe.tags.forEach((tag: string) => {
      if (['breakfast', 'lunch', 'dinner', 'late_night'].includes(tag)) {
        mealTimeSet.add(tag);
      } else {
        dishTypeSet.add(tag);
        tagsSet.add(tag);
      }
    });
  }

  const isFitness = tagsSet.has('diet') || recipe.fitnessMeal;
  const isChildren = tagsSet.has('children') || recipe.childrenMeal;

  return {
    id: recipe.id,
    name: recipe.title || recipe.name,
    coverImage: recipe.coverImage || '',
    description: recipe.description || '',
    ingredients: ingredientsList,
    usage: rawUsage,
    steps: rawSteps.map((s: any, i: number) =>
      typeof s === 'string' ? s : s.content || ''
    ).filter(Boolean),
    difficulty: mapDifficulty(recipe.difficulty),
    timeCost: recipe.cookingTime || recipe.timeCost || null,
    calories: recipe.calories || null,
    nutrition: recipe.nutrition || null,
    cuisine: recipe.cuisine || null,
    category: recipe.category || null,
    mealTimes: Array.from(mealTimeSet),
    dishTypes: Array.from(dishTypeSet),
    fitnessMeal: isFitness,
    fitnessCategory: recipe.fitnessCategory || null,
    goal: recipe.goal || null,
    childrenMeal: isChildren,
    ageBand: recipe.ageBand || null,
    tags: Array.from(tagsSet),
    isFeatured: recipe.isFeatured || false,
    viewCount: recipe.viewCount || 0,
    collectCount: recipe.collectCount || 0,
  };
}

function mapDifficulty(difficulty: string): 'easy' | 'normal' | 'hard' {
  switch (difficulty?.toUpperCase()) {
    case 'EASY':
      return 'easy';
    case 'HARD':
      return 'hard';
    default:
      return 'normal';
  }
}

function buildWhereClause(query: any): any {
  const where: any = {
    isDeleted: false,
    status: 'PUBLISHED',
  };

  if (query.category) {
    where.category = query.category;
  }

  if (query.dishType) {
    where.tags = { has: query.dishType };
  }

  if (query.mealTime) {
    where.tags = { has: query.mealTime };
  }

  if (query.fitnessMeal === 'true' || query.fitnessMeal === '1') {
    where.tags = { has: 'diet' };
  }

  if (query.childrenMeal === 'true' || query.childrenMeal === '1') {
    where.tags = { has: 'children' };
  }

  if (query.goal) {
    where.OR = [
      { goal: query.goal },
      { tags: { has: query.goal } },
    ];
  }

  if (query.ageBand) {
    where.ageBand = query.ageBand;
  }

  if (query.keyword) {
    const keyword = query.keyword as string;
    where.OR = [
      { title: { contains: keyword, mode: 'insensitive' } },
      { description: { contains: keyword, mode: 'insensitive' } },
      { tags: { has: keyword } },
      { cuisine: { contains: keyword, mode: 'insensitive' } },
    ];
  }

  if (query.ids) {
    const idArray = query.ids.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
    if (idArray.length > 0) {
      where.id = { in: idArray };
    }
  }

  return where;
}

export async function getAppRecipes(req: Request, res: Response) {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = Math.min(parseInt(req.query.pageSize as string) || 20, 100);
  const orderBy = req.query.sort as string || 'createdAt';

  try {
    const where = buildWhereClause(req.query);

    const [total, list] = await Promise.all([
      prisma.recipe.count({ where }),
      prisma.recipe.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { [orderBy]: 'desc' },
      }),
    ]);

    const recipes = list.map(mapRecipeToAppFormat);

    res.json(paginated(recipes, { page, pageSize, total }));
  } catch (error) {
    console.error('[AppRecipe] 查询食谱列表失败:', error);
    res.status(500).json(badRequest('查询失败'));
  }
}

export async function getAppRecipeById(req: Request, res: Response) {
  const id = parseInt(req.params.id);

  if (isNaN(id)) {
    res.status(400).json(badRequest('无效的食谱 ID'));
    return;
  }

  try {
    const recipe = await prisma.recipe.findUnique({
      where: { id, isDeleted: false, status: 'PUBLISHED' },
    });

    if (!recipe) {
      res.status(404).json(notFound('食谱不存在'));
      return;
    }

    await prisma.recipe.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    res.json(success(mapRecipeToAppFormat(recipe)));
  } catch (error) {
    console.error('[AppRecipe] 查询食谱详情失败:', error);
    res.status(500).json(badRequest('查询失败'));
  }
}

export async function getFeaturedRecipes(req: Request, res: Response) {
  const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

  try {
    const recipes = await prisma.recipe.findMany({
      where: {
        isDeleted: false,
        status: 'PUBLISHED',
        isFeatured: true,
      },
      take: limit,
      orderBy: { publishedAt: 'desc' },
    });

    res.json(success(recipes.map(mapRecipeToAppFormat)));
  } catch (error) {
    console.error('[AppRecipe] 查询推荐食谱失败:', error);
    res.status(500).json(badRequest('查询失败'));
  }
}

export async function getCategories(req: Request, res: Response) {
  try {
    const recipes = await prisma.recipe.findMany({
      where: {
        isDeleted: false,
        status: 'PUBLISHED',
        category: { not: null },
      },
      select: { category: true },
      distinct: ['category'],
    });

    const categories = recipes
      .map(r => r.category)
      .filter(Boolean)
      .map(name => ({
        id: name,
        name,
        icon: getCategoryIcon(name as string),
      }));

    res.json(success(categories));
  } catch (error) {
    console.error('[AppRecipe] 查询分类失败:', error);
    res.status(500).json(badRequest('查询失败'));
  }
}

function getCategoryIcon(category: string): string {
  const iconMap: Record<string, string> = {
    '家常菜': 'home',
    '快手菜': 'lightning',
    '早餐': 'sunrise',
    '午餐': 'sun',
    '晚餐': 'moon',
    '甜点': 'cake',
    '汤': 'soup',
    '主食': 'rice',
    '凉菜': 'leaf',
    '热菜': 'fire',
  };
  return iconMap[category] || 'food';
}

export async function getRecipesByIngredients(req: Request, res: Response) {
  const { ingredients } = req.query;

  if (!ingredients) {
    res.status(400).json(badRequest('请提供食材列表'));
    return;
  }

  const ingredientList = (ingredients as string).split(',').map(i => i.trim()).filter(Boolean);

  if (ingredientList.length === 0) {
    res.status(400).json(badRequest('食材列表不能为空'));
    return;
  }

  try {
    const recipes = await prisma.recipe.findMany({
      where: {
        isDeleted: false,
        status: 'PUBLISHED',
      },
      include: {
        recipeIngredients: true,
      },
    });

    const matchedRecipes = recipes
      .map(recipe => {
        const recipeIngredients = recipe.recipeIngredients.map(ri => ri.name.toLowerCase());
        const matched = ingredientList.filter(ing =>
          recipeIngredients.some(ri => ri.includes(ing.toLowerCase()))
        );
        return {
          recipe: mapRecipeToAppFormat(recipe),
          matchedCount: matched.length,
          matchedIngredients: matched,
        };
      })
      .filter(item => item.matchedCount > 0)
      .sort((a, b) => b.matchedCount - a.matchedCount)
      .slice(0, 20);

    res.json(success(matchedRecipes));
  } catch (error) {
    console.error('[AppRecipe] 按食材搜索失败:', error);
    res.status(500).json(badRequest('查询失败'));
  }
}
