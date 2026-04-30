import { PrismaClient, LinkType, FeedbackType, FeedbackStatus, NoticeType, NoticeTarget, ContentStatus, AdminRole, AccountStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始种子数据初始化...');

  // ============================================
  // 1. 创建管理员账号
  // ============================================
  console.log('📝 创建管理员账号...');

  const hashedPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.admin.upsert({
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
  console.log(`✅ 管理员创建成功: ${admin.username}`);

  // 创建测试编辑账号
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

  for (const banner of banners) {
    await prisma.banner.upsert({
      where: { id: banners.indexOf(banner) + 1 },
      update: banner,
      create: banner,
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
