import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';
import { prisma } from '../lib/prisma';

type RagContextItem = {
  sourceType: string;
  sourceId?: string;
  title: string;
  content: string;
};

type SendAiChatInput = {
  userId: number;
  text: string;
  sessionId?: number;
};

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

function buildSystemPrompt(context: RagContextItem[]) {
  const contextText = context.length
    ? context
        .map((item, index) => {
          return `[${index + 1}] ${item.title} (${item.sourceType}:${item.sourceId || ''})\n${item.content}`;
        })
        .join('\n\n')
    : '暂无可用检索资料。';

  return [
    '你是 AIRecipe 的小厨子，一个面向中文用户的做饭助手。',
    '请用简体中文回答，优先给出可执行的菜谱建议、替代食材、步骤、采购清单或营养提醒。',
    '如果检索资料不足，请明确说明是基于通用烹饪经验，不要假装系统里有不存在的菜谱。',
    '涉及食品安全时要保守，比如生熟分开、彻底加热、过期食材不要使用。',
    '',
    '可参考的 RAG 检索资料：',
    contextText,
  ].join('\n');
}

async function getRecentLangChainMessages(sessionId: number, beforeMessageId: number) {
  const recent = await prisma.aiChatMessage.findMany({
    where: { sessionId, id: { lt: beforeMessageId } },
    orderBy: { createdAt: 'desc' },
    take: 8,
  });

  return recent.reverse().map((message) => {
    if (message.role === 'ASSISTANT') return new AIMessage(message.content);
    if (message.role === 'USER') return new HumanMessage(message.content);
    return new SystemMessage(message.content);
  });
}

async function getActiveTextKey() {
  return prisma.aiApiKey.findFirst({
    where: {
      isActive: true,
      OR: [{ keyType: { in: ['text', 'multimodal'] } }, { keyType: null }],
    },
    orderBy: { updatedAt: 'desc' },
  });
}

export async function sendAiChatMessage(input: SendAiChatInput) {
  const text = input.text.trim();
  if (!text) throw new Error('Missing chat message');

  const session = await getOrCreateSession(input.userId, text, input.sessionId);
  const userMessage = await prisma.aiChatMessage.create({
    data: {
      sessionId: session.id,
      userId: input.userId,
      role: 'USER' as any,
      content: text,
    },
  });

  const [activeKey, ragContext, recentMessages] = await Promise.all([
    getActiveTextKey(),
    retrieveRagContext(text),
    getRecentLangChainMessages(session.id, userMessage.id),
  ]);

  if (!activeKey) {
    const fallback = 'AI API Key 还没有配置好。我已经保存了这次对话，等你在后台配置 text 或 multimodal 类型的 Key 后，就可以继续测试真实回复。';
    const assistantMessage = await prisma.aiChatMessage.create({
      data: {
        sessionId: session.id,
        userId: input.userId,
        role: 'ASSISTANT' as any,
        content: fallback,
        ragContext,
      },
    });
    await prisma.aiChatSession.update({
      where: { id: session.id },
      data: { lastMessageAt: assistantMessage.createdAt },
    });
    return {
      sessionId: session.id,
      message: fallback,
      model: '',
      tokensUsed: 0,
      ragContext,
    };
  }

  const model = new ChatOpenAI({
    model: activeKey.model,
    apiKey: activeKey.apiKey,
    temperature: 0.7,
    maxTokens: 900,
    configuration: { baseURL: normalizeBaseUrl(activeKey.baseUrl) },
  } as any);

  const response = await model.invoke([
    new SystemMessage(buildSystemPrompt(ragContext)),
    ...recentMessages,
    new HumanMessage(text),
  ]);

  const reply = contentToString(response.content).trim() || '我暂时没有生成有效回复，请换个说法再试一次。';
  const usage = (response as any).response_metadata?.tokenUsage || (response as any).usage_metadata || {};
  const tokensUsed =
    usage.totalTokens ||
    usage.total_tokens ||
    ((usage.promptTokens || usage.input_tokens || 0) + (usage.completionTokens || usage.output_tokens || 0));

  const assistantMessage = await prisma.aiChatMessage.create({
    data: {
      sessionId: session.id,
      userId: input.userId,
      role: 'ASSISTANT' as any,
      content: reply,
      model: activeKey.model,
      tokensUsed: tokensUsed || null,
      ragContext,
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

  return {
    sessionId: session.id,
    message: reply,
    model: activeKey.model,
    tokensUsed: tokensUsed || 0,
    ragContext,
  };
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
    return {
      id: String(session.id),
      title: session.title || '新的对话',
      preview: latest?.content || '',
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

  return messages.map((message) => ({
    id: String(message.id),
    is_user: message.role === 'USER',
    text: message.content,
    timestamp: message.createdAt.toISOString(),
  }));
}
