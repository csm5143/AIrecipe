/**
 * 修复种子数据中的 category 和 isFeatured 字段
 * 运行方式: npx ts-node src/database/migrations/fix-recipe-category.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 根据 dishTypes 映射中文分类
const dishTypeCategoryMap: Record<string, string> = {
  stir_fry: '快手菜',
  soup: '汤类',
  main: '主食',
  salad: '凉菜',
  dessert: '甜点',
  breakfast: '早餐',
  snack: '小吃',
  drink: '饮品',
  hot: '热菜',
  cold: '凉菜',
  vegetarian: '素菜',
  meat: '荤菜',
  seafood: '海鲜',
  diet: '减脂餐',
};

async function main() {
  console.log('🔧 开始修复菜谱 category...');

  // 获取所有 category 为 null 且未删除的菜谱
  const recipes = await prisma.recipe.findMany({
    where: { isDeleted: false, category: null },
    select: { id: true, dishTypes: true, tags: true },
  });

  console.log(`📋 待处理菜谱: ${recipes.length} 条`);

  for (const recipe of recipes) {
    let category: string | null = null;

    // 1. 优先从 dishTypes 推断
    const dishTypes = recipe.dishTypes as string[] | null;
    const tags = recipe.tags as string[] | null;

    if (Array.isArray(dishTypes) && dishTypes.length > 0) {
      for (const dt of dishTypes) {
        if (typeof dt === 'string' && dishTypeCategoryMap[dt]) {
          category = dishTypeCategoryMap[dt];
          break;
        }
      }
    }

    // 2. 再从 tags 推断
    if (!category && Array.isArray(tags) && tags.length > 0) {
      for (const tag of tags) {
        if (typeof tag === 'string' && dishTypeCategoryMap[tag]) {
          category = dishTypeCategoryMap[tag];
          break;
        }
      }
    }

    // 3. 默认为家常菜
    if (!category) {
      category = '家常菜';
    }

    await prisma.recipe.update({
      where: { id: recipe.id },
      data: { category },
    });
  }

  console.log('✅ category 修复完成');

  // 修复 isFeatured：前 20 条设为精选
  console.log('🔧 修复 isFeatured...');
  const allRecipes = await prisma.recipe.findMany({
    where: { isDeleted: false },
    orderBy: { createdAt: 'asc' },
    select: { id: true, isFeatured: true },
  });

  for (let i = 0; i < allRecipes.length; i++) {
    await prisma.recipe.update({
      where: { id: allRecipes[i].id },
      data: { isFeatured: i < 20 },
    });
  }

  console.log(`✅ isFeatured 修复完成 (${allRecipes.length} 条)`);

  // 验证
  const featuredCount = await prisma.recipe.count({ where: { isFeatured: true } });
  const categorizedCount = await prisma.recipe.count({ where: { category: { not: null } } });
  console.log(`📊 精选菜谱: ${featuredCount} 条`);
  console.log(`📊 已分类菜谱: ${categorizedCount} 条`);

  console.log('\n🎉 修复完成！重启后端后首页数据将正常显示。');
}

main()
  .catch(e => { console.error('❌ 失败:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
