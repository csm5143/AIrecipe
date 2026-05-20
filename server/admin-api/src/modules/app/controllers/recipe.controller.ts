import { Request, Response } from 'express';
import { prisma } from '../../../lib/prisma';
import { success, paginated, notFound, badRequest } from '../../../types/response';
import { mapRecipeToAppFormat } from '../utils/recipeMapper';
import { stableQueryKey } from '../utils/appQuery';
import { cache } from '../../../lib/cache';
import { cacheKeys } from '../../../lib/cacheKeys';

export function buildWhereClause(query: any): any {
  const where: any = {
    isDeleted: false,
    status: 'PUBLISHED',
  };

  if (query.isHot === '1' || query.isHot === 'true') {
    where.isHot = true;
  }

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
  const queryKey = stableQueryKey(req.query as Record<string, unknown>);

  try {
    const result = await cache.getOrSet(
      cacheKeys.appRecipesList(queryKey),
      60,
      async () => {
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
        return { total, recipes: list.map(mapRecipeToAppFormat) };
      }
    );

    res.json(paginated(result.recipes, { page, pageSize, total: result.total }));
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
    const mapped = await cache.getOrSet(
      cacheKeys.appRecipeDetail(id),
      120,
      async () => {
        const recipe = await prisma.recipe.findUnique({
          where: { id, isDeleted: false, status: 'PUBLISHED' },
        });
        if (!recipe) return null;
        return mapRecipeToAppFormat(recipe);
      }
    );

    if (!mapped) {
      res.status(404).json(notFound('菜谱不存在'));
      return;
    }

    await prisma.recipe.update({ where: { id }, data: { viewCount: { increment: 1 } } });
    res.json(success(mapped));
  } catch (error) {
    console.error('[AppRecipe] 查询食谱详情失败:', error);
    res.status(500).json(badRequest('查询失败'));
  }
}

export async function getCategories(req: Request, res: Response) {
  try {
    const categories = await cache.getOrSet(
      cacheKeys.appRecipesCategories(),
      300,
      async () => {
        const recipes = await prisma.recipe.findMany({
          where: {
            isDeleted: false,
            status: 'PUBLISHED',
            category: { not: null },
          },
          select: { category: true },
          distinct: ['category'],
        });

        return recipes
          .map(r => r.category)
          .filter(Boolean)
          .map(name => ({
            id: name,
            name,
            icon: getCategoryIcon(name as string),
          }));
      }
    );

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

  const queryKey = stableQueryKey(req.query as Record<string, unknown>);

  try {
    const matchedRecipes = await cache.getOrSet(
      cacheKeys.appRecipesByIngredients(queryKey),
      60,
      async () => {
        const recipes = await prisma.recipe.findMany({
          where: {
            isDeleted: false,
            status: 'PUBLISHED',
          },
          include: {
            recipeIngredients: true,
          },
        });

        return recipes
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
      }
    );

    res.json(success(matchedRecipes));
  } catch (error) {
    console.error('[AppRecipe] 按食材搜索失败:', error);
    res.status(500).json(badRequest('查询失败'));
  }
}
