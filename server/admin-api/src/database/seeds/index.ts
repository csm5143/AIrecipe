import { PrismaClient, LinkType, FeedbackType, FeedbackStatus, NoticeType, NoticeTarget, ContentStatus, AdminRole, AccountStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始种子数据初始化...');

  // ============================================
  // 1. 创建管理员账号（处理软删除状态）
  // ============================================
  console.log('📝 创建管理员账号...');

  const hashedPassword = await bcrypt.hash('admin123', 10);

  const existingAdmin = await prisma.admin.findFirst({ where: { username: 'admin', isDeleted: true } });
  if (existingAdmin) {
    await prisma.admin.update({ where: { id: existingAdmin.id }, data: { isDeleted: false } });
    console.log(`✅ 管理员已恢复: admin`);
  } else {
    await prisma.admin.upsert({
      where: { username: 'admin' },
      update: {},
      create: {
        username: 'admin',
        password: hashedPassword,
        nickname: '超级管理员',
        role: AdminRole.SUPER_ADMIN,
        status: AccountStatus.ACTIVE,
      },
    });
    console.log(`✅ 管理员创建成功: admin`);
  }

  // 创建测试编辑账号（处理软删除状态）
  const existingEditor = await prisma.admin.findFirst({ where: { username: 'editor', isDeleted: true } });
  if (existingEditor) {
    await prisma.admin.update({
      where: { id: existingEditor.id },
      data: { isDeleted: false, password: await bcrypt.hash('editor123', 10) },
    });
    console.log(`✅ 编辑账号已恢复: editor`);
  } else {
    const editor = await prisma.admin.upsert({
      where: { username: 'editor' },
      update: {},
      create: {
        username: 'editor',
        password: await bcrypt.hash('editor123', 10),
        nickname: '内容编辑',
        role: AdminRole.EDITOR,
        status: AccountStatus.ACTIVE,
      },
    });
    console.log(`✅ 编辑账号创建成功: ${editor.username}`);
  }

  // ============================================
  // 2. 创建示例 Banner
  // ============================================
  console.log('📝 创建示例 Banner...');

  const banners: Array<{
    title: string;
    imageUrl: string;
    linkType: LinkType;
    linkValue?: string;
    sortOrder: number;
    status: ContentStatus;
  }> = [
    {
      title: '健康饮食推荐',
      imageUrl: 'https://picsum.photos/seed/banner1/800/400',
      linkType: LinkType.NONE,
      sortOrder: 1,
      status: ContentStatus.ACTIVE,
    },
    {
      title: '春季养生食谱',
      imageUrl: 'https://picsum.photos/seed/banner2/800/400',
      linkType: LinkType.PAGE,
      linkValue: '/pages/recipe/list',
      sortOrder: 2,
      status: ContentStatus.ACTIVE,
    },
    {
      title: '减脂餐专区',
      imageUrl: 'https://picsum.photos/seed/banner3/800/400',
      linkType: LinkType.PAGE,
      linkValue: '/pages/recipe/list?category=fitness',
      sortOrder: 3,
      status: ContentStatus.ACTIVE,
    },
  ];

  for (let i = 0; i < banners.length; i++) {
    const banner = banners[i];
    await prisma.banner.upsert({
      where: { id: i + 1 },
      update: banner,
      create: { ...banner },
    });
  }
  console.log(`✅ 创建了 ${banners.length} 个 Banner`);

  // ============================================
  // 3. 创建示例公告
  // ============================================
  console.log('📝 创建示例公告...');

  const notice = await prisma.notice.upsert({
    where: { id: 1 },
    update: {},
    create: {
      title: '欢迎使用 AIRecipe',
      content: 'AIRecipe 是一款智能食谱推荐应用，支持 AI 扫描食材、智能推荐、健康管理等功能。',
      type: NoticeType.SYSTEM,
      target: NoticeTarget.ALL,
      status: ContentStatus.ACTIVE,
    },
  });
  console.log(`✅ 公告创建成功: ${notice.title}`);

  // ============================================
  // 4. 创建示例反馈记录
  // ============================================
  console.log('📝 创建示例反馈...');

  const feedbacks: Array<{
    userId: number | null;
    type: FeedbackType;
    content: string;
    contact: string | null;
    status: FeedbackStatus;
    reply?: string;
  }> = [
    {
      userId: null,
      type: FeedbackType.FEATURE_REQUEST,
      content: '希望能添加一个"一周食谱规划"功能，可以自动生成一周的菜单。',
      contact: 'user@example.com',
      status: FeedbackStatus.PENDING,
    },
    {
      userId: null,
      type: FeedbackType.CONTENT_ISSUE,
      content: '"番茄炒蛋"食谱中的盐用量标注错误，应该是"适量"而不是"10g"。',
      contact: null,
      status: FeedbackStatus.REPLIED,
      reply: '感谢反馈，已修正食谱内容。',
    },
    {
      userId: null,
      type: FeedbackType.BUG_REPORT,
      content: '在小程序首页点击菜谱卡片有时会无法跳转到详情页。',
      contact: '13800138000',
      status: FeedbackStatus.RESOLVED,
      reply: '问题已修复，请更新到最新版本。',
    },
  ];

  for (const feedback of feedbacks) {
    await prisma.feedback.create({ data: feedback });
  }
  console.log(`✅ 创建了 ${feedbacks.length} 条反馈记录`);

  // ============================================
  // 5. 导入菜谱数据（从旧 JSON 转换格式）
  // ============================================
  console.log('📝 导入菜谱数据...');

  const recipesExist = await prisma.recipe.count();
  if (recipesExist === 0) {
    try {
      const recipesData: any[] = require('../../../../../client/miniprogram/data/recipes.json');

      const diffMap: Record<string, string> = {
        easy: 'EASY', normal: 'MEDIUM', hard: 'HARD',
      };

      const recipes = recipesData.map((r: any) => {
        const tags: string[] = [...(r.dishTypes || [])];
        if (r.fitnessMeal) tags.push('diet');
        if (r.childrenMeal) tags.push('children');
        if (r.goal) tags.push(r.goal);

        const steps: any[] = (r.steps || []).map((s: string, i: number) => ({
          order: i + 1, content: s, image: '',
        }));

        const ingredients: any[] = Object.entries(r.usage || {}).map(([name, amount]) => ({
          name, amount: String(amount), unit: '', isOptional: false,
        }));

        return {
          recipeKey: `r_${r.id}`,
          source: 'OFFICIAL' as const,
          title: r.name,
          coverImage: r.coverImage || '',
          description: r.description || '',
          difficulty: (diffMap[r.difficulty] || 'MEDIUM') as any,
          cookingTime: r.timeCost || null,
          servings: null,
          ingredients,
          steps,
          tips: '',
          cuisine: null,
          category: null,
          mealTimes: r.mealTimes || [],
          dishTypes: r.dishTypes || [],
          tags,
          status: 'PUBLISHED' as any,
          isFeatured: parseInt(r.id) <= 3,
          isHot: parseInt(r.id) <= 5,
          publishedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      });

      await prisma.recipe.createMany({ data: recipes, skipDuplicates: true });
      console.log(`✅ 导入 ${recipes.length} 条菜谱`);
    } catch (recErr) {
      console.warn('⚠️ 菜谱导入失败，继续执行:', recErr);
    }
  }

  // ============================================
  // 6. 导入食材字典数据
  // ============================================
  console.log('📝 导入食材数据...');

  const ingredientsExist = await prisma.ingredient.count();
  if (ingredientsExist === 0) {
    try {
      const ingredientsData: any[] = require('../../../../../client/miniprogram/data/ingredients.json');

      const ingredients = ingredientsData
        .filter(i => i.name && i.name.trim())
        .map((i: any) => ({
          name: i.name.trim(),
          category: i.category || null,
          unit: null,
          calories: null,
          status: 'ACTIVE' as any,
        }));

      // 分批插入（每批 500 条，避免 payload 过大）
      const BATCH_SIZE = 500;
      let imported = 0;
      for (let i = 0; i < ingredients.length; i += BATCH_SIZE) {
        const batch = ingredients.slice(i, i + BATCH_SIZE);
        try {
          await prisma.ingredient.createMany({ data: batch, skipDuplicates: true });
          imported += batch.length;
        } catch (batchErr) {
          console.warn(`⚠️ 食材批次 ${i / BATCH_SIZE + 1} 插入失败，跳过该批次`);
        }
      }
      console.log(`✅ 导入 ${imported} 条食材`);
    } catch (ingErr) {
      console.warn('⚠️ 食材导入失败，继续执行后续步骤:', ingErr);
    }
  }

  console.log('');
  console.log('🎉 种子数据初始化完成！');
  console.log('');
  console.log('📋 登录信息:');
  console.log('   管理员: admin / admin123');
  console.log('   编辑:    editor / editor123');
}

main()
  .catch((e) => {
    console.error('❌ 种子数据初始化失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
