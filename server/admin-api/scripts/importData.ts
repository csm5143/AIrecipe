import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface RecipeData {
  id: string;
  name: string;
  coverImage?: string;
  description?: string;
  ingredients: string[];
  mealTimes?: string[];
  timeCost?: number;
  difficulty?: 'easy' | 'normal' | 'hard';
  usage?: Record<string, string>;
  steps?: string[];
  fitnessMeal?: boolean;
  fitnessCategory?: string;
  goal?: string;
  childrenMeal?: boolean;
  ageBand?: string;
  dishTypes?: string[];
  nutrition?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
  };
  macros?: { protein: number; carb: number; fat: number };
}

function mapDifficulty(difficulty?: string): 'EASY' | 'MEDIUM' | 'HARD' {
  switch (difficulty?.toLowerCase()) {
    case 'easy':
      return 'EASY';
    case 'hard':
      return 'HARD';
    default:
      return 'MEDIUM';
  }
}

function buildIngredients(ingredients: string[], usage?: Record<string, string>): any[] {
  return ingredients.map(name => ({
    name,
    amount: usage?.[name] || '',
    unit: '',
    isOptional: false,
  }));
}

function buildSteps(steps: string[]): any[] {
  return steps.map((content, index) => ({
    order: index + 1,
    content,
    image: '',
  }));
}

async function importRecipes(): Promise<void> {
  console.log('🚀 开始导入食谱数据...\n');

  const dataPath = path.join(__dirname, '../../../miniprogram/data/recipes.json');

  if (!fs.existsSync(dataPath)) {
    console.error(`❌ 文件不存在: ${dataPath}`);
    console.log('请确保 miniprogram/data/recipes.json 文件存在');
    process.exit(1);
  }

  const fileContent = fs.readFileSync(dataPath, 'utf-8');
  const recipes: RecipeData[] = JSON.parse(fileContent);

  console.log(`📊 共找到 ${recipes.length} 条食谱\n`);

  let successCount = 0;
  let errorCount = 0;
  let skipCount = 0;

  for (const recipe of recipes) {
    try {
      const recipeId = parseInt(recipe.id) || successCount + errorCount + 1;

      const existing = await prisma.recipe.findFirst({
        where: {
          title: recipe.name,
          isDeleted: false,
        },
      });

      if (existing) {
        skipCount++;
        continue;
      }

      const tags: string[] = [...(recipe.dishTypes || [])];
      if (recipe.mealTimes?.length) {
        tags.push(...recipe.mealTimes);
      }
      if (recipe.fitnessMeal) {
        tags.push('diet');
      }
      if (recipe.childrenMeal) {
        tags.push('children');
      }

      const ingredients = buildIngredients(recipe.ingredients, recipe.usage);
      const steps = buildSteps(recipe.steps || []);

      await prisma.recipe.create({
        data: {
          title: recipe.name,
          coverImage: recipe.coverImage || undefined,
          description: recipe.description || undefined,
          difficulty: mapDifficulty(recipe.difficulty),
          cookingTime: recipe.timeCost || undefined,
          tags,
          ingredients,
          steps,
          tips: undefined,
          nutrition: recipe.nutrition || undefined,
          cuisine: undefined,
          category: recipe.dishTypes?.[0] || undefined,
          isAiGenerated: false,
          viewCount: 0,
          collectCount: 0,
          shareCount: 0,
          status: 'PUBLISHED',
          isFeatured: false,
          isDeleted: false,
          publishedAt: new Date(),
          fitnessMeal: recipe.fitnessMeal || false,
          fitnessCategory: recipe.fitnessCategory || undefined,
          goal: recipe.goal || undefined,
          childrenMeal: recipe.childrenMeal || false,
          ageBand: recipe.ageBand || undefined,
        },
      });

      successCount++;

      if (successCount % 100 === 0) {
        console.log(`  已导入 ${successCount} 条...`);
      }
    } catch (error: any) {
      errorCount++;
      console.error(`  ❌ 导入失败 [${recipe.id}] ${recipe.name}: ${error.message}`);
    }
  }

  console.log('\n========================================');
  console.log('📋 导入完成');
  console.log(`  ✅ 成功: ${successCount}`);
  console.log(`  ⏭️  跳过: ${skipCount}`);
  console.log(`  ❌ 失败: ${errorCount}`);
  console.log('========================================\n');
}

async function importIngredients(): Promise<void> {
  console.log('🥬 开始导入食材数据...\n');

  const dataPath = path.join(__dirname, '../../../miniprogram/data/ingredients.json');

  if (!fs.existsSync(dataPath)) {
    console.log('⚠️  食材文件不存在，跳过');
    return;
  }

  const fileContent = fs.readFileSync(dataPath, 'utf-8');
  const ingredients: any[] = JSON.parse(fileContent);

  console.log(`📊 共找到 ${ingredients.length} 条食材\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const ing of ingredients) {
    try {
      const existing = await prisma.ingredient.findFirst({
        where: { name: ing.name, isDeleted: false },
      });

      if (existing) continue;

      await prisma.ingredient.create({
        data: {
          name: ing.name,
          alias: ing.alias || undefined,
          coverImage: ing.coverImage || undefined,
          category: ing.category || undefined,
          subCategory: ing.subCategory || undefined,
          unit: ing.unit || undefined,
          status: 'ACTIVE',
          isDeleted: false,
        },
      });

      successCount++;
    } catch (error: any) {
      errorCount++;
      console.error(`  ❌ 导入失败: ${ing.name}`);
    }
  }

  console.log('\n========================================');
  console.log('📋 食材导入完成');
  console.log(`  ✅ 成功: ${successCount}`);
  console.log(`  ❌ 失败: ${errorCount}`);
  console.log('========================================\n');
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const mode = args[0] || 'all';

  try {
    await prisma.$connect();
    console.log('✅ 数据库连接成功\n');

    switch (mode) {
      case 'recipes':
        await importRecipes();
        break;
      case 'ingredients':
        await importIngredients();
        break;
      case 'all':
      default:
        await importIngredients();
        await importRecipes();
        break;
    }

    const stats = await prisma.recipe.count({
      where: { isDeleted: false },
    });
    console.log(`📈 当前数据库共有 ${stats} 条食谱`);

  } catch (error: any) {
    console.error('\n❌ 发生错误:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('未处理的错误:', error);
    process.exit(1);
  });
