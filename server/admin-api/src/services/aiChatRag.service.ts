import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';
import { prisma } from '../lib/prisma';
import { logAiUsage } from './aiUsageLog.service';
import { AiToolCallRecord, formatToolCallsForPrompt, formatToolCallsForUser, planAndExecuteAiTools } from './aiToolRegistry.service';
import { checkAiQuota } from './aiQuota.service';
import { hasColumn, hasTable } from './databaseCapability.service';

type RagContextItem = {
  sourceType: string;
  sourceId?: string;
  title: string;
  content: string;
};

type SendAiChatInput = {
  userId: number;
  text?: string;
  imageUrls?: string[];
  sessionId?: number;
};

type ChatRecommendation = {
  id: string;
  type: 'recipe' | 'post';
  title: string;
  description: string;
  coverImage: string;
  authorName: string;
  cookingTime: number | null;
  difficulty: string;
  route: string;
};

type ToolActions = {
  reminders: Array<{
    id: number;
    title: string;
    body: string;
    triggerAt: string;
    items: string[];
    shoppingListId?: number;
    recipeId?: number;
  }>;
};

function normalizeImageUrls(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item || '').trim())
    .filter((item) => item.startsWith('http://') || item.startsWith('https://'))
    .slice(0, 6);
}

function buildUserContent(text: string, imageUrls: string[]) {
  if (imageUrls.length === 0) return text;
  return [
    { type: 'text', text },
    ...imageUrls.map((url) => ({ type: 'image_url', image_url: { url } })),
  ];
}

function getMessageImageUrls(metadata: unknown): string[] {
  if (!metadata || typeof metadata !== 'object') return [];
  return normalizeImageUrls((metadata as { imageUrls?: unknown }).imageUrls);
}

function getMessageRecommendations(metadata: unknown): ChatRecommendation[] {
  if (!metadata || typeof metadata !== 'object') return [];
  const value = (metadata as { recommendations?: unknown }).recommendations;
  if (!Array.isArray(value)) return [];
  return value
    .map((item: any) => ({
      id: String(item?.id || ''),
      type: item?.type === 'post' ? 'post' as const : 'recipe' as const,
      title: String(item?.title || ''),
      description: String(item?.description || ''),
      coverImage: String(item?.coverImage || ''),
      authorName: String(item?.authorName || ''),
      cookingTime: Number.isFinite(Number(item?.cookingTime)) ? Number(item.cookingTime) : null,
      difficulty: String(item?.difficulty || ''),
      route: String(item?.route || ''),
    }))
    .filter((item) => item.id && item.title)
    .slice(0, 6);
}

function buildToolActions(calls: AiToolCallRecord[]): ToolActions {
  const reminders = calls
    .filter((call) => call.name === 'schedule_reminder' && call.success)
    .map((call) => {
      const result = (call.result || {}) as any;
      const data = (result.data || {}) as any;
      const triggerAt = result.triggerAt ? new Date(result.triggerAt) : null;
      return {
        id: Number(result.id || 0),
        title: String(result.title || '买菜提醒'),
        body: String(result.body || '该去买菜了，记得查看小菜篮。'),
        triggerAt: triggerAt && !Number.isNaN(triggerAt.getTime()) ? triggerAt.toISOString() : '',
        items: Array.isArray(data.items) ? data.items.map((item: any) => String(item)).filter(Boolean) : [],
        shoppingListId: data.shoppingListId ? Number(data.shoppingListId) : undefined,
        recipeId: data.recipeId ? Number(data.recipeId) : undefined,
      };
    })
    .filter((item) => item.id && item.triggerAt);

  return { reminders };
}

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl
    .replace(/\/$/, '')
    .replace(/\/chat\/completions$/, '')
    .replace(/\/responses$/, '');
}

function titleFromText(text: string) {
  const compact = text.replace(/\s+/g, ' ').trim();
  if (!compact) return '新的对话';
  return compact.length > 24 ? `${compact.slice(0, 24)}...` : compact;
}

function contentToString(content: unknown) {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object' && 'text' in item) {
          return String((item as { text?: unknown }).text || '');
        }
        return '';
      })
      .filter(Boolean)
      .join('\n');
  }
  return String(content || '');
}

function timeAgo(date?: Date | null) {
  if (!date) return '';
  const diff = Date.now() - date.getTime();
  const minutes = Math.max(1, Math.floor(diff / 60000));
  if (minutes < 60) return `${minutes}分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;
  return `${Math.floor(hours / 24)}天前`;
}

async function getOrCreateSession(userId: number, text: string, sessionId?: number) {
  if (sessionId) {
    const existing = await prisma.aiChatSession.findFirst({
      where: { id: sessionId, userId, status: { not: 'DELETED' as any } },
    });
    if (existing) return existing;
  }

  return prisma.aiChatSession.create({
    data: {
      userId,
      title: titleFromText(text),
      lastMessageAt: new Date(),
    },
  });
}

function keywordsFromText(text: string) {
  const words = text
    .toLowerCase()
    .split(/[\s,，。.!！?？、;；:：()（）[\]{}"'“”‘’]+/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 2)
    .slice(0, 6);

  if (words.length > 0) return words;
  return text.trim() ? [text.trim().slice(0, 12)] : [];
}

function extractDishQuery(text: string) {
  const patterns = [
    /想吃\s*([\u4e00-\u9fa5A-Za-z0-9]{2,24})/,
    /想做\s*([\u4e00-\u9fa5A-Za-z0-9]{2,24})/,
    /推荐\s*([\u4e00-\u9fa5A-Za-z0-9]{2,24})/,
    /找.*?([\u4e00-\u9fa5A-Za-z0-9]{2,24})(?:菜谱|帖子|做法)/,
    /([\u4e00-\u9fa5A-Za-z0-9]{2,24})(?:菜谱|帖子|做法)/,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    const value = match?.[1]?.trim();
    if (value && !/什么|哪些|一点|今天|明天|菜谱|帖子|做法/.test(value)) {
      return value.slice(0, 24);
    }
  }
  return text.replace(/我想吃|想吃|想做|推荐|菜谱|帖子|做法|有没有|帮我|请/g, ' ').trim().slice(0, 24);
}

function recommendationKeywords(text: string) {
  const dish = extractDishQuery(text);
  const words = keywordsFromText(`${dish} ${text}`);
  const extra = new Set<string>([dish, ...words]);
  if (/黄牛肉|小炒牛肉|小炒黄牛肉/.test(text)) {
    ['小炒黄牛肉', '小炒牛肉', '黄牛肉', '牛肉', '青椒'].forEach((item) => extra.add(item));
  }
  if (/清淡|少油|少盐|不油腻|养胃/.test(text)) {
    ['清淡', '少油', '少盐', '蒸', '煮', '汤', '粥', '蔬菜'].forEach((item) => extra.add(item));
  }
  if (/低卡|减脂|减肥|健身/.test(text)) {
    ['低卡', '减脂', '高蛋白', '鸡胸肉', '鱼', '虾', '蔬菜'].forEach((item) => extra.add(item));
  }
  if (/儿童|孩子|宝宝/.test(text)) {
    ['儿童', '孩子', '宝宝', '营养', '不辣'].forEach((item) => extra.add(item));
  }
  if (/番茄/.test(text)) extra.add('西红柿');
  if (/西红柿/.test(text)) extra.add('番茄');
  return Array.from(extra).map((item) => item.trim()).filter((item) => item.length >= 2).slice(0, 8);
}

function normalizeDifficultyLabel(value: unknown) {
  const text = String(value || '').toLowerCase();
  if (text === 'easy') return '简单';
  if (text === 'hard') return '困难';
  if (text === 'medium' || text === 'normal') return '中等';
  return String(value || '');
}

function mapRecommendation(recipe: any): ChatRecommendation {
  const type = recipe.source === 'USER' ? 'post' : 'recipe';
  return {
    id: String(recipe.id),
    type,
    title: recipe.title,
    description: recipe.description || recipe.tips || '',
    coverImage: recipe.coverImage || '',
    authorName: recipe.authorName || (type === 'recipe' ? '小厨子官方' : '美食用户'),
    cookingTime: recipe.cookingTime || null,
    difficulty: normalizeDifficultyLabel(recipe.difficulty),
    route: type === 'post' ? `/post/${recipe.id}` : `/recipe/${recipe.id}`,
  };
}

async function searchChatRecommendations(text: string): Promise<ChatRecommendation[]> {
  const terms = recommendationKeywords(text);
  if (terms.length === 0) return [];

  const recipes = await prisma.recipe.findMany({
    where: {
      isDeleted: false,
      status: { in: ['ACTIVE', 'PUBLISHED'] as any },
      OR: terms.flatMap((term) => [
        { title: { contains: term, mode: 'insensitive' as any } },
        { description: { contains: term, mode: 'insensitive' as any } },
        { tips: { contains: term, mode: 'insensitive' as any } },
        { category: { contains: term, mode: 'insensitive' as any } },
        { cuisine: { contains: term, mode: 'insensitive' as any } },
      ]),
    },
    orderBy: [{ isFeatured: 'desc' }, { isHot: 'desc' }, { viewCount: 'desc' }, { publishedAt: 'desc' }],
    take: 30,
  });

  const fallbackRecipes = recipes.length === 0 && /推荐|菜谱|吃什么|做什么|清淡|低卡|减脂|儿童|营养/.test(text)
    ? await prisma.recipe.findMany({
        where: {
          isDeleted: false,
          status: { in: ['ACTIVE', 'PUBLISHED'] as any },
        },
        orderBy: [{ isFeatured: 'desc' }, { isHot: 'desc' }, { viewCount: 'desc' }, { publishedAt: 'desc' }],
        take: 12,
      })
    : [];

  return [...recipes, ...fallbackRecipes]
    .map((recipe) => {
      const haystack = [
        recipe.title,
        recipe.description || '',
        recipe.tips || '',
        recipe.category || '',
        recipe.cuisine || '',
        JSON.stringify(recipe.ingredients || ''),
      ].join(' ');
      let score = 0;
      for (const term of terms) {
        if (recipe.title.includes(term)) score += 40;
        if (haystack.includes(term)) score += 10;
      }
      if (recipe.source === 'USER') score += 4;
      if (recipe.isFeatured) score += 6;
      if (recipe.isHot) score += 5;
      return { recipe, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((item) => mapRecommendation(item.recipe));
}

async function retrieveRagContext(text: string): Promise<RagContextItem[]> {
  const keywords = keywordsFromText(text);
  const recipeWhere =
    keywords.length > 0
      ? {
          isDeleted: false,
          status: 'ACTIVE' as any,
          OR: keywords.flatMap((keyword) => [
            { title: { contains: keyword, mode: 'insensitive' as any } },
            { description: { contains: keyword, mode: 'insensitive' as any } },
            { category: { contains: keyword, mode: 'insensitive' as any } },
            { tips: { contains: keyword, mode: 'insensitive' as any } },
          ]),
        }
      : { isDeleted: false, status: 'ACTIVE' as any };

  const [ragChunks, recipes] = await Promise.all([
    prisma.aiRagChunk.findMany({
      where:
        keywords.length > 0
          ? {
              document: { status: 'ACTIVE' as any },
              OR: keywords.flatMap((keyword) => [
                { content: { contains: keyword, mode: 'insensitive' as any } },
                {
                  document: {
                    title: { contains: keyword, mode: 'insensitive' as any },
                  },
                },
              ]),
            }
          : { document: { status: 'ACTIVE' as any } },
      include: { document: true },
      orderBy: { createdAt: 'desc' },
      take: 4,
    }),
    prisma.recipe.findMany({
      where: recipeWhere,
      orderBy: [{ isFeatured: 'desc' }, { viewCount: 'desc' }],
      take: 4,
    }),
  ]);

  const fromDocs = ragChunks.map((chunk) => ({
    sourceType: chunk.document.sourceType,
    sourceId: chunk.document.sourceId || String(chunk.document.id),
    title: chunk.document.title,
    content: chunk.content.slice(0, 700),
  }));

  const fromRecipes = recipes.map((recipe) => ({
    sourceType: 'RECIPE',
    sourceId: String(recipe.id),
    title: recipe.title,
    content: [
      recipe.description,
      recipe.category ? `分类：${recipe.category}` : '',
      recipe.cookingTime ? `用时：${recipe.cookingTime}分钟` : '',
      recipe.ingredients ? `食材：${JSON.stringify(recipe.ingredients).slice(0, 500)}` : '',
      recipe.steps ? `步骤：${JSON.stringify(recipe.steps).slice(0, 700)}` : '',
      recipe.tips ? `提示：${recipe.tips}` : '',
    ]
      .filter(Boolean)
      .join('\n'),
  }));

  return [...fromDocs, ...fromRecipes].slice(0, 6);
}

function formatUserContext(context: unknown) {
  if (!context || typeof context !== 'object') return '暂无用户画像。';
  return JSON.stringify(context).slice(0, 1200);
}

function formatMemories(memories: Array<{ type: string; content: string }>) {
  if (memories.length === 0) return '暂无长期记忆。';
  return memories
    .map((memory, index) => `[${index + 1}] ${memory.type}: ${memory.content}`)
    .join('\n');
}

async function buildUserContext(userId: number) {
  const [hasHealthProfile, hasMemories] = await Promise.all([
    hasColumn('users', 'healthProfile'),
    hasTable('user_memories'),
  ]);

  const [user, fridgeItems, shoppingLists, memories] = await Promise.all([
    hasHealthProfile
      ? (prisma as any).user.findUnique({
          where: { id: userId },
          select: { healthProfile: true },
        })
      : Promise.resolve(null),
    prisma.fridgeItem.findMany({
      where: { userId },
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
      take: 30,
    }),
    prisma.shoppingList.findMany({
      where: { userId, status: 'ACTIVE' as any },
      include: { items: { orderBy: { createdAt: 'asc' } } },
      orderBy: { updatedAt: 'desc' },
      take: 3,
    }),
    hasMemories
      ? (prisma as any).userMemory.findMany({
          where: { userId },
          orderBy: [{ lastUsedAt: 'desc' }, { createdAt: 'desc' }],
          take: 8,
        })
      : Promise.resolve([]),
  ]);

  return {
    healthProfile: user?.healthProfile || null,
    fridgeItems: fridgeItems.map((item) => `${item.name}${item.amount || ''}${item.unit || ''}`).slice(0, 30),
    shoppingLists: shoppingLists.map((list) => ({
      id: list.id,
      name: list.name,
      recipeId: list.recipeId,
      items: list.items.map((item) => `${item.name}${item.amount || ''}${item.unit || ''}`).slice(0, 20),
    })),
    memories: memories.map((memory: any) => ({
      type: memory.type,
      content: memory.content,
    })),
  };
}

function buildSystemPrompt(
  context: RagContextItem[],
  userContext?: Awaited<ReturnType<typeof buildUserContext>>,
  toolContextText = '',
  recommendations: ChatRecommendation[] = [],
) {
  const contextText = context.length
    ? context
        .map((item, index) => {
          return `[${index + 1}] ${item.title} (${item.sourceType}:${item.sourceId || ''})\n${item.content}`;
        })
        .join('\n\n')
    : '暂无可用检索资料。';
  const shoppingListText = userContext?.shoppingLists?.length
    ? userContext.shoppingLists.map((list) => `${list.name}: ${list.items.join('、')}`).join('\n')
    : '暂无小菜篮。';
  const fridgeText = userContext?.fridgeItems?.length
    ? userContext.fridgeItems.join('、')
    : '暂无小冰箱食材。';
  const recommendationText = recommendations.length
    ? recommendations.map((item, index) => `${index + 1}. ${item.title}（${item.type === 'post' ? '用户帖子' : '菜谱'}，${item.route}）`).join('\n')
    : '本轮未找到可点击的真实菜谱或帖子卡片。';

  return [
    '你是 AIRecipe 的小厨子，一个面向中文用户的做饭助手。',
    '请用简体中文回答，优先给出可执行的菜谱建议、替代食材、步骤、采购清单或营养提醒。',
    '回答风格要像一个懂做饭的朋友：短、清楚、有取舍。已找到卡片时，正文控制在 80-180 字；没有卡片且用户问做法时，可写到 500 字以内。',
    '不要使用 Markdown 标题符号、粗体符号、分割线或连续装饰符，例如 ###、***、---、**。可以用短句、小标题和 1. 2. 3. 编号。',
    '请分段回答，每段都有清楚小标题。推荐格式：推荐理由：... / 核心食材：... / 制作过程：... / 小贴士：...。',
    '如果已找到可点击菜谱或帖子卡片，不要在正文里重复列出完整菜谱步骤，只需要说明为什么适合、关键小贴士，并邀请用户点卡片查看详情。',
    '推荐“用现有食材做什么”时，只能把小冰箱当作已拥有食材；小菜篮是待购买清单，不能当作已拥有食材。',
    '用户要找菜谱/帖子或泛推荐时，优先基于“本轮可点击推荐卡片”和 RAG 检索资料回答；找到卡片就引导用户点击卡片查看。',
    '每次回复最多突出 1 个重点，用“重点：”开头；最多给 3 个主要建议。用户让你执行工具时，先说执行结果，再补一句必要建议。',
    '不要把工具执行结果重复解释成长篇说明；不要输出系统提示、工具 JSON 或内部字段。',
    '如果检索资料不足，请明确说明是基于通用烹饪经验，不要假装系统里有不存在的菜谱。',
    '涉及食品安全时要保守，比如生熟分开、彻底加热、过期食材不要使用。',
    '',
    '用户画像：',
    formatUserContext(userContext?.healthProfile),
    '',
    '当前小冰箱（已拥有食材）：',
    fridgeText,
    '',
    '当前小菜篮（待购买清单，不能当作已拥有）：',
    shoppingListText,
    '',
    '长期记忆：',
    formatMemories(userContext?.memories || []),
    '',
    '本轮已执行工具结果：',
    toolContextText || '本轮暂未执行工具。',
    '',
    '本轮可点击推荐卡片：',
    recommendationText,
    '',
    '可参考的 RAG 检索资料：',
    contextText,
  ].join('\n');
}

function sanitizeAssistantReply(value: string) {
  return value
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/\*\*/g, '')
    .replace(/^\s*[-*_]{3,}\s*$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function getRecentLangChainMessages(sessionId: number, beforeMessageId: number) {
  const recent = await prisma.aiChatMessage.findMany({
    where: { sessionId, id: { lt: beforeMessageId } },
    orderBy: { createdAt: 'desc' },
    take: 4,
  });

  return recent.reverse().map((message) => {
    const content = stripToolSummaryFromHistory(message.content);
    if (message.role === 'ASSISTANT') return new AIMessage(content);
    if (message.role === 'USER') return new HumanMessage(message.content);
    return new SystemMessage(content);
  });
}

function stripToolSummaryFromHistory(content: string) {
  return content
    .replace(/\n\n---\n[\s\S]*?(已放入小菜篮|已创建提醒|已放入小冰箱|未能执行)[\s\S]*$/g, '')
    .trim();
}

async function getActiveChatKey(hasImages = false) {
  const keyTypes = hasImages ? ['multimodal'] : ['text', 'multimodal'];
  return prisma.aiApiKey.findFirst({
    where: {
      isActive: true,
      AND: [
        { OR: [{ usage: 'chat' }, { usage: null }] },
        { OR: [{ keyType: { in: keyTypes } }, ...(hasImages ? [] : [{ keyType: null }])] },
      ],
    },
    orderBy: { updatedAt: 'desc' },
  });
}

async function getUserName(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { nickname: true, phone: true, email: true, openid: true },
  });
  return user?.nickname || user?.phone || user?.email || user?.openid || `用户${userId}`;
}

async function captureExplicitMemory(userId: number, text: string) {
  if (!/(我不吃|不喜欢|过敏|喜欢吃|爱吃|以后记住|记住我|减脂|控糖|少油|少盐)/.test(text)) return;
  if (!(await hasTable('user_memories'))) return;
  const content = text.slice(0, 240);
  await (prisma as any).userMemory.create({
    data: {
      userId,
      type: 'preference_explicit',
      content,
      metadata: { source: 'ai_chat' },
      lastUsedAt: new Date(),
    },
  });
}

export async function sendAiChatMessage(input: SendAiChatInput) {
  const rawText = String(input.text || '').trim();
  const imageUrls = normalizeImageUrls(input.imageUrls);
  if (!rawText && imageUrls.length === 0) throw new Error('Missing chat message');

  const text = rawText || '请根据我发送的图片，给出适合做饭或食材处理的建议。';
  const messageMetadata = imageUrls.length > 0 ? { imageUrls } : undefined;
  const quota = await checkAiQuota(input.userId);
  if (!quota.allowed) {
    throw new Error(quota.reason || '今日 AI 额度已用完');
  }
  void captureExplicitMemory(input.userId, text).catch((err) => {
    console.error('[AI Memory] capture failed:', err);
  });

  const session = await getOrCreateSession(input.userId, text, input.sessionId);
  const userMessage = await prisma.aiChatMessage.create({
    data: {
      sessionId: session.id,
      userId: input.userId,
      role: 'USER' as any,
      content: text,
      metadata: messageMetadata,
    },
  });

  const recentLangMessages = await getRecentLangChainMessages(session.id, userMessage.id);
  const recentTextMessages = recentLangMessages.map((message: any) => contentToString(message.content)).filter(Boolean);
  const toolCalls = await planAndExecuteAiTools({ userId: input.userId, text, recentMessages: recentTextMessages });
  const toolContextText = formatToolCallsForPrompt(toolCalls);
  const toolUserText = formatToolCallsForUser(toolCalls);
  const toolActions = buildToolActions(toolCalls);
  const canPersistToolCalls = await hasColumn('ai_chat_messages', 'toolCalls');
  if (toolCalls.length > 0 && canPersistToolCalls) {
    await (prisma as any).aiChatMessage.update({
      where: { id: userMessage.id },
      data: { toolCalls: toolCalls as any },
    });
  }

  const [activeKey, ragContext, recentMessages, userName, userContext, recommendations] = await Promise.all([
    getActiveChatKey(imageUrls.length > 0),
    retrieveRagContext(text),
    Promise.resolve(recentLangMessages),
    getUserName(input.userId),
    buildUserContext(input.userId),
    searchChatRecommendations(text),
  ]);

  if (!activeKey) {
    const fallback = 'AI API Key 还没有配置好。我已经保存了这次对话，等你在后台配置 text 或 multimodal 类型的 Key 后，就可以继续测试真实回复。';
    const assistantMessage = await (prisma as any).aiChatMessage.create({
      data: {
        sessionId: session.id,
        userId: input.userId,
        role: 'ASSISTANT' as any,
        content: fallback,
        ragContext,
        metadata: {
          ...(messageMetadata || {}),
          recommendations,
          toolActions,
        },
        ...(canPersistToolCalls && { toolCalls: toolCalls as any }),
      },
    });
    await prisma.aiChatSession.update({
      where: { id: session.id },
      data: { lastMessageAt: assistantMessage.createdAt },
    });
    return {
      sessionId: session.id,
      userMessageId: userMessage.id,
      assistantMessageId: assistantMessage.id,
      message: fallback,
      model: '',
      tokensUsed: 0,
      ragContext,
      toolCalls,
      toolActions,
      recommendations,
    };
  }

  const model = new ChatOpenAI({
    model: activeKey.model,
    apiKey: activeKey.apiKey,
    temperature: 0.7,
    maxTokens: recommendations.length > 0 ? 460 : 900,
    configuration: { baseURL: normalizeBaseUrl(activeKey.baseUrl) },
  } as any);

  const start = Date.now();
  let response: any;
  try {
    response = await model.invoke([
      new SystemMessage(buildSystemPrompt(ragContext, userContext, toolContextText, recommendations)),
      ...recentMessages,
      new HumanMessage({ content: buildUserContent(text, imageUrls) } as any),
    ]);
  } catch (err: any) {
    void logAiUsage({
      apiKeyId: activeKey.id,
      model: activeKey.model,
      usage: 'chat',
      purpose: 'AI聊天',
      userId: input.userId,
      userName,
      input: JSON.stringify({ text, imageUrls }),
      duration: Date.now() - start,
      success: false,
      error: err?.message || String(err),
    });
    throw err;
  }

  const modelText = contentToString(response.content).trim();
  const reply = sanitizeAssistantReply(`${modelText || (toolUserText ? '' : '我暂时没有生成有效回复，请换个说法再试一次。')}${toolUserText}`);
  const usage = (response as any).response_metadata?.tokenUsage || (response as any).usage_metadata || {};
  const tokensIn = usage.promptTokens || usage.prompt_tokens || usage.input_tokens || 0;
  const tokensOut = usage.completionTokens || usage.completion_tokens || usage.output_tokens || 0;
  const tokensUsed =
    usage.totalTokens ||
    usage.total_tokens ||
    (tokensIn + tokensOut);

  const assistantMessage = await (prisma as any).aiChatMessage.create({
    data: {
      sessionId: session.id,
      userId: input.userId,
      role: 'ASSISTANT' as any,
      content: reply,
      model: activeKey.model,
      tokensUsed: tokensUsed || null,
      ragContext,
      metadata: {
        recommendations,
        toolActions,
      },
      ...(canPersistToolCalls && { toolCalls: toolCalls as any }),
    },
  });

  await Promise.all([
    prisma.aiChatSession.update({
      where: { id: session.id },
      data: { lastMessageAt: assistantMessage.createdAt },
    }),
    tokensUsed
      ? prisma.aiApiKey.update({
          where: { id: activeKey.id },
          data: { usedTokens: { increment: tokensUsed } },
        })
      : Promise.resolve(null),
  ]);

  void logAiUsage({
    apiKeyId: activeKey.id,
    model: activeKey.model,
    usage: 'chat',
    purpose: 'AI聊天',
    tokensIn: tokensIn || Math.max(0, tokensUsed - tokensOut),
    tokensOut,
    userId: input.userId,
    userName,
    input: JSON.stringify({ text, imageUrls }),
    output: reply,
    duration: Date.now() - start,
    success: true,
  });

  return {
    sessionId: session.id,
    userMessageId: userMessage.id,
    assistantMessageId: assistantMessage.id,
    message: reply,
    model: activeKey.model,
    tokensUsed: tokensUsed || 0,
    ragContext,
    toolCalls,
    toolActions,
    recommendations,
  };
}

export async function deleteAiChatMessage(userId: number, messageId: number) {
  const message = await prisma.aiChatMessage.findFirst({
    where: { id: messageId, userId },
    include: { session: true },
  });
  if (!message || message.session.status === 'DELETED') return false;

  await prisma.aiChatMessage.delete({ where: { id: messageId } });
  const latest = await prisma.aiChatMessage.findFirst({
    where: { sessionId: message.sessionId },
    orderBy: { createdAt: 'desc' },
  });
  await prisma.aiChatSession.update({
    where: { id: message.sessionId },
    data: { lastMessageAt: latest?.createdAt || new Date() },
  });
  return true;
}

export async function editAiChatUserMessage(input: {
  userId: number;
  messageId: number;
  text: string;
}) {
  const text = input.text.trim();
  if (!text) throw new Error('消息内容不能为空');

  const message = await prisma.aiChatMessage.findFirst({
    where: { id: input.messageId, userId: input.userId, role: 'USER' as any },
    include: { session: true },
  });
  if (!message || message.session.status === 'DELETED') return null;

  await prisma.aiChatMessage.deleteMany({
    where: {
      sessionId: message.sessionId,
      id: { gte: message.id },
    },
  });

  return sendAiChatMessage({
    userId: input.userId,
    sessionId: message.sessionId,
    text,
    imageUrls: getMessageImageUrls(message.metadata),
  });
}

export async function getAiChatSessions(userId: number) {
  const sessions = await prisma.aiChatSession.findMany({
    where: { userId, status: { not: 'DELETED' as any } },
    include: {
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    orderBy: [{ lastMessageAt: 'desc' }, { updatedAt: 'desc' }],
    take: 30,
  });

  return sessions.map((session) => {
    const latest = session.messages[0];
    const cleanPreview = (latest?.content || '')
      .replace(/<\/?tool[-_]?calls?>/gi, '')
      .replace(/<\/?function[^>]*>/gi, '')
      .replace(/<function\s*=\s*[^>]+>/gi, '')
      .replace(/<parameter[^>]*>[\s\S]*?<\/parameter>/gi, '')
      .trim();
    return {
      id: String(session.id),
      title: session.title || '新的对话',
      preview: cleanPreview || '',
      timeAgo: timeAgo(session.lastMessageAt || session.updatedAt),
      recipeCount: 0,
      tag: 'chat',
      updatedAt: (session.lastMessageAt || session.updatedAt).getTime(),
    };
  });
}

export async function getAiChatSessionMessages(userId: number, sessionId: number) {
  const session = await prisma.aiChatSession.findFirst({
    where: { id: sessionId, userId, status: { not: 'DELETED' as any } },
  });
  if (!session) return null;

  const messages = await prisma.aiChatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'asc' },
  });

  const stripToolXml = (text: string) =>
    text
      .replace(/<\/?tool[-_]?calls?>/gi, '')
      .replace(/<\/?function[^>]*>/gi, '')
      .replace(/<function\s*=\s*[^>]+>/gi, '')
      .replace(/<parameter[^>]*>[\s\S]*?<\/parameter>/gi, '')
      .trim();

  return messages.map((message) => ({
    id: String(message.id),
    is_user: message.role === 'USER',
    text: stripToolXml(message.content),
    imageUrls: getMessageImageUrls(message.metadata),
    recommendations: getMessageRecommendations(message.metadata),
    timestamp: message.createdAt.toISOString(),
  }));
}
