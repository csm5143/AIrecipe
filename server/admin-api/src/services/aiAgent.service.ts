/**
 * AIRecipe Agent Service
 *
 * LLM-driven agent with OpenAI-compatible function calling.
 * Tools are classified as:
 *   - auto:      executed immediately, result fed back to LLM
 *   - confirm:   paused, returned to client for user confirmation
 *
 * The agent loop runs multiple turns of LLM → tool-call → result
 * until the LLM responds with text (no tool calls) or hits a
 * confirmation-required tool.
 */

import { AIMessage, HumanMessage, SystemMessage, ToolMessage } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';
import { prisma } from '../lib/prisma';
import { logAiUsage } from './aiUsageLog.service';
import { checkAiQuota } from './aiQuota.service';
import { hasColumn, hasTable } from './databaseCapability.service';

// ─── Types ───────────────────────────────────────────────────

export type AgentToolName =
  | 'search_recipes'
  | 'get_recipe_detail'
  | 'list_fridge_items'
  | 'list_shopping_lists'
  | 'get_user_context'
  | 'add_to_shopping_list'
  | 'add_to_fridge'
  | 'schedule_reminder'
  | 'save_preference'
  | 'generate_recipe_draft';

export interface AgentToolDef {
  name: AgentToolName;
  description: string;
  parameters: Record<string, unknown>;
  requiresConfirmation: boolean;
  /** Human-readable summary for confirmation UI */
  confirmationLabel?: (args: Record<string, unknown>) => { title: string; body: string };
}

export interface AgentToolCall {
  id: string;
  name: AgentToolName;
  args: Record<string, unknown>;
}

export interface AgentToolResult {
  callId: string;
  name: AgentToolName;
  success: boolean;
  result?: unknown;
  error?: string;
}

export interface PendingAction {
  id: string;
  toolName: AgentToolName;
  title: string;
  body: string;
  args: Record<string, unknown>;
}

interface AgentState {
  sessionId: number;
  userId: number;
  assistantMessageId: number;
  llmMessages: Array<AIMessage | HumanMessage | SystemMessage | ToolMessage>;
  executedTools: AgentToolResult[];
  pendingActions: PendingAction[];
  recommendations: ChatRecommendation[];
}

export interface AgentResponse {
  sessionId: number;
  userMessageId?: number;
  assistantMessageId: number;
  message: string;
  model: string;
  recommendations: ChatRecommendation[];
  pendingActions: PendingAction[];
  executedTools: AgentToolResult[];
  tokensUsed: number;
}

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

// ─── Tool Definitions ────────────────────────────────────────

const AGENT_TOOLS: AgentToolDef[] = [
  {
    name: 'search_recipes',
    description:
      '搜索菜谱库。根据关键词、菜系、口味、食材、难度等条件查找菜谱。当用户问"有什么菜"、"推荐菜谱"、"找菜"、"麻辣"、"清淡"、"川菜"等时调用此工具。',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: '搜索关键词，如"麻辣火锅"、"清淡汤"、"牛肉"、"川菜"' },
        cuisine: { type: 'string', description: '菜系类型，如川菜、粤菜、鲁菜、湘菜' },
        flavor: { type: 'string', description: '口味偏好，如麻辣、清淡、酸甜、重口味' },
        difficulty: { type: 'string', enum: ['EASY', 'MEDIUM', 'HARD'] },
        maxCookingTime: { type: 'number', description: '最长烹饪时间（分钟）' },
        ingredients: { type: 'array', items: { type: 'string' }, description: '想用到的食材' },
      },
      required: ['query'],
    },
    requiresConfirmation: false,
  },
  {
    name: 'get_recipe_detail',
    description: '获取指定菜谱的详细信息，包括完整食材清单和制作步骤。',
    parameters: {
      type: 'object',
      properties: {
        recipeId: { type: 'number', description: '菜谱ID' },
        recipeTitle: { type: 'string', description: '菜谱名称（如不知道ID时使用）' },
      },
    },
    requiresConfirmation: false,
  },
  {
    name: 'list_fridge_items',
    description: '查看用户小冰箱里已有的食材。用于判断"用现有食材能做什么"。',
    parameters: { type: 'object', properties: {} },
    requiresConfirmation: false,
  },
  {
    name: 'list_shopping_lists',
    description: '查看用户当前的购物清单（小菜篮）。',
    parameters: { type: 'object', properties: {} },
    requiresConfirmation: false,
  },
  {
    name: 'get_user_context',
    description: '获取用户画像、饮食偏好、长期记忆。用于个性化推荐。',
    parameters: { type: 'object', properties: {} },
    requiresConfirmation: false,
  },
  {
    name: 'add_to_shopping_list',
    description:
      '将菜谱的食材加入购物清单（小菜篮）。该操作需要用户确认。在用户明确说"加入菜篮"、"帮我买菜"时调用；如果只是推荐，先说明建议让用户决定。',
    parameters: {
      type: 'object',
      properties: {
        recipeTitle: { type: 'string', description: '菜谱名称' },
        recipeId: { type: 'number', description: '菜谱ID（如有）' },
      },
      required: ['recipeTitle'],
    },
    requiresConfirmation: true,
    confirmationLabel: (args: Record<string, unknown>) => ({
      title: '加入小菜篮',
      body: `将「${args.recipeTitle}」的食材清单加入小菜篮？`,
    }),
  },
  {
    name: 'add_to_fridge',
    description:
      '将食材加入小冰箱。在用户说"加入冰箱"、"放进冰箱"或有明确的食材需要保存时调用。需要用户确认。',
    parameters: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              amount: { type: 'string' },
              unit: { type: 'string' },
            },
          },
          description: '食材列表',
        },
        source: { type: 'string', description: '来源说明，如"最近识别"或"用户输入"' },
      },
      required: ['items'],
    },
    requiresConfirmation: true,
    confirmationLabel: (args: Record<string, unknown>) => {
      const items = (args.items as Array<{ name: string }>) || [];
      const names = items.map((i) => i.name).join('、');
      return { title: '放入小冰箱', body: `将 ${names} 放入小冰箱？` };
    },
  },
  {
    name: 'schedule_reminder',
    description:
      '设置买菜或做饭提醒。用户说"提醒我"、"明天买菜"、"晚上做菜"时调用。需要用户确认时间。',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: '提醒标题' },
        triggerDescription: { type: 'string', description: '触发时间描述，如"明天上午9点"、"晚上6点"' },
        shoppingListName: { type: 'string', description: '关联的菜篮名称（如有）' },
      },
      required: ['title', 'triggerDescription'],
    },
    requiresConfirmation: true,
    confirmationLabel: (args: Record<string, unknown>) => ({
      title: '设置提醒',
      body: `设置「${args.title}」提醒，时间：${args.triggerDescription || '稍后'}？`,
    }),
  },
  {
    name: 'save_preference',
    description:
      '保存用户的饮食偏好或忌口信息。用户说"记住我不吃..."、"我喜欢..."时调用。需要用户确认。',
    parameters: {
      type: 'object',
      properties: {
        content: { type: 'string', description: '偏好内容，如"不吃香菜"、"喜欢麻辣味"' },
        type: { type: 'string', enum: ['preference', 'restriction', 'allergy'], description: '偏好类型' },
      },
      required: ['content', 'type'],
    },
    requiresConfirmation: true,
    confirmationLabel: (args: Record<string, unknown>) => ({
      title: '记住偏好',
      body: `记住：${args.content}？`,
    }),
  },
  {
    name: 'generate_recipe_draft',
    description:
      '当菜谱库没有匹配结果时，根据用户描述生成AI菜谱草稿供采购使用。用户说"生成菜谱"、"创建菜谱"时调用。需要用户确认。',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: '菜谱名称' },
        description: { type: 'string', description: '用户对这道菜的口味、做法描述' },
      },
      required: ['title'],
    },
    requiresConfirmation: true,
    confirmationLabel: (args: Record<string, unknown>) => ({
      title: '生成菜谱',
      body: `菜谱库暂无「${args.title}」，由AI生成采购草稿？`,
    }),
  },
];

function getToolDefsForLLM(): Array<{ type: 'function'; function: Record<string, unknown> }> {
  return AGENT_TOOLS.map((tool) => ({
    type: 'function' as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  }));
}

function getToolDef(name: string): AgentToolDef | undefined {
  return AGENT_TOOLS.find((t) => t.name === name);
}

// ─── Agent State Store (in-memory, per session) ──────────────

const agentStates = new Map<number, AgentState>();

export function clearAgentState(sessionId: number) {
  agentStates.delete(sessionId);
}

// ─── Helpers ─────────────────────────────────────────────────

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/$/, '').replace(/\/chat\/completions$/, '').replace(/\/responses$/, '');
}

function contentToString(content: unknown): string {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return (content as Array<{ type?: string; text?: string }>)
      .map((item) => (item && typeof item === 'object' && 'text' in item ? String(item.text || '') : ''))
      .filter(Boolean)
      .join('\n');
  }
  return String(content || '');
}

function keywordsFromText(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[\s,，。.!！?？、;；:：()（）[\]{}"'""'']+/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 2)
    .slice(0, 8);
}

function titleFromText(text: string): string {
  const compact = text
    .replace(/<\/?tool[-_]?calls?>/gi, '')
    .replace(/<\/?function[^>]*>/gi, '')
    .replace(/<function\s*=\s*[^>]+>/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!compact) return '新的对话';
  return compact.length > 24 ? `${compact.slice(0, 24)}...` : compact;
}

// ─── System Prompt Builder ───────────────────────────────────

async function buildAgentSystemPrompt(userId: number): Promise<string> {
  const [user, fridgeItems, shoppingLists, memories] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { nickname: true } }),
    prisma.fridgeItem.findMany({ where: { userId }, orderBy: { updatedAt: 'desc' }, take: 30 }),
    prisma.shoppingList.findMany({
      where: { userId, status: 'ACTIVE' as any },
      include: { items: { orderBy: { createdAt: 'asc' } } },
      take: 3,
    }),
    (hasTable('user_memories').then((ok) =>
      ok
        ? (prisma as any).userMemory.findMany({
            where: { userId },
            orderBy: { lastUsedAt: 'desc' },
            take: 6,
          })
        : Promise.resolve([]),
    )),
  ]);

  const fridgeText =
    fridgeItems.length > 0
      ? fridgeItems.map((item) => `${item.name}${item.amount || ''}${item.unit || ''}`).join('、')
      : '暂无食材';

  const shoppingText =
    shoppingLists.length > 0
      ? shoppingLists
          .map(
            (list) =>
              `${list.name}：${list.items.map((item) => `${item.name}${item.amount || ''}${item.unit || ''}`).join('、')}`,
          )
          .join('\n')
      : '暂无小菜篮';

  const memoryText =
    memories.length > 0
      ? memories.map((m: any) => `- ${m.type === 'diet_restriction' ? '忌口' : '偏好'}：${m.content}`).join('\n')
      : '暂无记忆';

  const now = new Date();
  const currentTime = now.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  return [
    '你是 AIRecipe 的小厨子，一个智能饮食助手 Agent。你可以使用工具来搜索菜谱、查看食材、管理菜篮和设置提醒。',
    '',
    `当前时间：${currentTime}。所有时间相关的操作（提醒、明天、几点）都必须基于这个当前时间来计算。`,
    '',
    '核心规则：',
    '1. 用简体中文回答，短小清晰，像一个懂做饭的朋友',
    '2. 搜索菜谱(search_recipes)是你最常用的工具，用户提到任何食物相关的话题都应该先搜索',
    '3. 推荐菜谱时，必须基于搜索结果，不要凭空编造菜谱名称',
    '4. 没有搜到匹配菜谱时，如实告诉用户，可以用 generate_recipe_draft 生成草稿',
    '5. 修改数据（加菜篮、放冰箱、设提醒、保存偏好）的操作需要用户确认',
    '6. 用户明确要求执行操作时（"帮我加入菜篮"），直接调用对应工具',
    '7. 主动建议时（用户没明确要求），先用文字说明建议，等待用户回应',
    '8. 一次回复只调用必要的工具，不要过度调用',
    '9. 食品安全相关要坚持保守建议（生熟分开、彻底加热、过期勿用）',
    '',
    `当前用户：${user?.nickname || '用户'}`,
    `小冰箱食材：${fridgeText}`,
    `小菜篮：${shoppingText}`,
    `长期记忆：${memoryText}`,
    '',
    '回答格式：不要用 Markdown 标题符号(###, ***, ---)。用小标题和 1. 2. 3. 编号。',
  ].join('\n');
}

// ─── Tool Executors ──────────────────────────────────────────

async function executeSearchRecipes(args: Record<string, unknown>): Promise<unknown> {
  const query = String(args.query || '');
  const cuisine = String(args.cuisine || '');
  const flavor = String(args.flavor || '');
  const ingredients = (args.ingredients as string[]) || [];
  const maxCookingTime = Number(args.maxCookingTime) || 0;
  const difficulty = String(args.difficulty || '');

  // Build search terms from all dimensions
  const terms = new Set<string>();
  if (query) {
    // Expand flavor keywords
    const flavorMap: Record<string, string[]> = {
      麻辣: ['麻辣', '辣', '花椒', '辣椒', '火锅', '水煮', '干锅'],
      重口味: ['麻辣', '辣', '咸', '红烧', '卤', '干锅', '水煮', '火锅', '回锅'],
      清淡: ['清淡', '蒸', '煮', '汤', '粥', '白灼', '清炒', '少油'],
      酸辣: ['酸辣', '醋', '泡椒', '酸汤'],
      酸甜: ['酸甜', '糖醋', '番茄', '咕咾'],
      蒜香: ['蒜香', '蒜蓉', '蒜泥'],
      酱香: ['酱香', '酱', '卤', '焖'],
      甜辣: ['甜辣', '韩式'],
    };

    const expanded = flavorMap[flavor] || flavorMap[query] || [];
    [query, cuisine, flavor, ...expanded, ...ingredients]
      .filter(Boolean)
      .forEach((t) => terms.add(t));
    keywordsFromText(query).forEach((t) => terms.add(t));
  }

  const searchTerms = Array.from(terms).filter(Boolean).slice(0, 12);

  const whereConditions: any[] = [{ isDeleted: false, status: { in: ['ACTIVE', 'PUBLISHED'] } }];

  if (searchTerms.length > 0) {
    whereConditions.push({
      OR: searchTerms.flatMap((term) => [
        { title: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
        { category: { contains: term, mode: 'insensitive' } },
        { cuisine: { contains: term, mode: 'insensitive' } },
        { tips: { contains: term, mode: 'insensitive' } },
      ]),
    });
  }

  if (difficulty) {
    whereConditions.push({ difficulty });
  }

  const recipes = await prisma.recipe.findMany({
    where: { AND: whereConditions },
    orderBy: [{ isFeatured: 'desc' }, { isHot: 'desc' }, { viewCount: 'desc' }, { publishedAt: 'desc' }],
    take: 30,
  });

  // Score and rank results
  const scored = recipes
    .map((recipe) => {
      const haystack = [
        recipe.title,
        recipe.description || '',
        recipe.category || '',
        recipe.cuisine || '',
        recipe.tips || '',
        JSON.stringify(recipe.ingredients || ''),
      ].join(' ');
      let score = 0;
      for (const term of searchTerms) {
        if (term.length < 2) continue;
        if (recipe.title.includes(term)) score += 40;
        if (recipe.cuisine?.includes(term)) score += 25;
        if (recipe.category?.includes(term)) score += 20;
        if (haystack.includes(term)) score += 10;
      }
      if (recipe.isFeatured) score += 6;
      if (recipe.isHot) score += 5;
      if (recipe.cookingTime && maxCookingTime > 0 && recipe.cookingTime <= maxCookingTime) score += 15;
      return { recipe, score };
    })
    .filter((item) => searchTerms.length === 0 || item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  return {
    query,
    cuisine,
    flavor,
    count: scored.length,
    results: scored.map(({ recipe }) => ({
      id: recipe.id,
      title: recipe.title,
      description: recipe.description || '',
      cuisine: recipe.cuisine || '',
      category: recipe.category || '',
      cookingTime: recipe.cookingTime,
      difficulty: recipe.difficulty,
      coverImage: recipe.coverImage || '',
    })),
  };
}

async function executeGetRecipeDetail(args: Record<string, unknown>): Promise<unknown> {
  const recipeId = Number(args.recipeId) || 0;
  const recipeTitle = String(args.recipeTitle || '');

  const where = recipeId
    ? { id: recipeId, isDeleted: false }
    : { title: { contains: recipeTitle, mode: 'insensitive' as any }, isDeleted: false };

  const recipe = await prisma.recipe.findFirst({ where });
  if (!recipe) return { found: false, message: `未找到菜谱「${recipeTitle || recipeId}」` };

  return {
    found: true,
    id: recipe.id,
    title: recipe.title,
    description: recipe.description,
    cuisine: recipe.cuisine,
    category: recipe.category,
    cookingTime: recipe.cookingTime,
    difficulty: recipe.difficulty,
    servings: recipe.servings,
    ingredients: recipe.ingredients,
    steps: recipe.steps,
    tips: recipe.tips,
  };
}

async function executeListFridge(userId: number): Promise<unknown> {
  const items = await prisma.fridgeItem.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    take: 30,
  });
  return {
    count: items.length,
    items: items.map((item) => ({
      name: item.name,
      amount: item.amount || '',
      unit: item.unit || '',
    })),
  };
}

async function executeListShoppingLists(userId: number): Promise<unknown> {
  const lists = await prisma.shoppingList.findMany({
    where: { userId, status: 'ACTIVE' as any },
    include: { items: true },
    take: 3,
  });
  return {
    count: lists.length,
    lists: lists.map((list) => ({
      id: list.id,
      name: list.name,
      recipeId: list.recipeId,
      items: list.items.map((item) => ({ name: item.name, amount: item.amount || '', unit: item.unit || '' })),
    })),
  };
}

async function executeGetUserContext(userId: number): Promise<unknown> {
  const [user, memories] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { nickname: true } }),
    hasTable('user_memories').then((ok) =>
      ok
        ? (prisma as any).userMemory.findMany({ where: { userId }, orderBy: { lastUsedAt: 'desc' }, take: 6 })
        : [],
    ),
  ]);
  return {
    nickname: user?.nickname || '',
    preferences: memories.map((m: any) => ({ type: m.type, content: m.content })),
  };
}

async function executeAddToShoppingList(userId: number, args: Record<string, unknown>): Promise<unknown> {
  const recipeId = Number(args.recipeId) || 0;
  const recipeTitle = String(args.recipeTitle || '');

  let recipe: any = null;
  if (recipeId) {
    recipe = await prisma.recipe.findFirst({ where: { id: recipeId, isDeleted: false } });
  }
  if (!recipe && recipeTitle) {
    recipe = await prisma.recipe.findFirst({
      where: { title: { contains: recipeTitle, mode: 'insensitive' as any }, isDeleted: false },
    });
  }
  if (!recipe) throw new Error(`未找到菜谱「${recipeTitle}」`);

  const ingredients = (recipe.ingredients as any[]) || [];
  const items = ingredients
    .filter((item: any) => item.name)
    .map((item: any) => ({
      name: String(item.name),
      amount: String(item.amount || ''),
      unit: String(item.unit || ''),
      category: String(item.category || 'other'),
    }));

  if (items.length === 0) throw new Error('该菜谱没有食材清单');

  const listName = `${recipe.title}食材清单`;
  const existing = await prisma.shoppingList.findFirst({ where: { userId, name: listName } });

  const list = existing
    ? await prisma.shoppingList.update({
        where: { id: existing.id },
        data: {
          recipeId: recipe.id,
          source: 'ai_agent',
          updatedAt: new Date(),
          items: { deleteMany: {}, create: items },
        },
        include: { items: true },
      })
    : await prisma.shoppingList.create({
        data: {
          userId,
          name: listName,
          source: 'ai_agent',
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
    items: list.items.map((item) => ({ name: item.name, amount: item.amount || '', unit: item.unit || '' })),
  };
}

async function executeAddToFridge(userId: number, args: Record<string, unknown>): Promise<unknown> {
  const items = (args.items as Array<{ name: string; amount?: string; unit?: string }>) || [];
  if (items.length === 0) throw new Error('没有可放入小冰箱的食材');

  const results = [];
  for (const item of items) {
    const existing = await prisma.fridgeItem.findFirst({ where: { userId, name: item.name } });
    const saved = existing
      ? await prisma.fridgeItem.update({
          where: { id: existing.id },
          data: { amount: item.amount || existing.amount, unit: item.unit || existing.unit },
        })
      : await prisma.fridgeItem.create({
          data: { userId, name: item.name, amount: item.amount || '', unit: item.unit || null, category: 'other' },
        });
    results.push({ id: saved.id, name: saved.name, amount: saved.amount || '', unit: saved.unit || '' });
  }
  return { count: results.length, items: results };
}

async function executeScheduleReminder(userId: number, args: Record<string, unknown>): Promise<unknown> {
  if (!(await hasTable('scheduled_tasks'))) throw new Error('提醒功能暂不可用');

  const title = String(args.title || '');
  const triggerDesc = String(args.triggerDescription || '');
  const listName = String(args.shoppingListName || '');

  // Parse time from description
  const now = new Date();
  const triggerAt = new Date(now);
  const hourMatch = triggerDesc.match(/(\d{1,2})\s*[:：]\s*(\d{1,2})/) || triggerDesc.match(/(\d{1,2})\s*(?:点|时)/);
  let hour = hourMatch ? Number(hourMatch[1]) : 9;
  const minuteMatch = triggerDesc.match(/[:：](\d{1,2})/) || triggerDesc.match(/(\d{1,2})\s*分/);
  const minute = minuteMatch ? Number(minuteMatch[1]) : 0;
  if (/(?:下午|晚上|今晚|明晚)/.test(triggerDesc) && hour < 12) hour += 12;
  if (/(?:凌晨|早上|上午|明早)/.test(triggerDesc) && hour === 12) hour = 0;
  triggerAt.setHours(Math.min(hour, 23), Math.min(minute, 59), 0, 0);

  if (/(?:明天|明早|明晚|明日)/.test(triggerDesc)) triggerAt.setDate(triggerAt.getDate() + 1);
  else if (/后天/.test(triggerDesc)) triggerAt.setDate(triggerAt.getDate() + 2);
  else if (triggerAt.getTime() <= now.getTime()) triggerAt.setDate(triggerAt.getDate() + 1);

  const task = await (prisma as any).scheduledTask.create({
    data: {
      userId,
      type: 'SHOPPING_REMINDER',
      title,
      body: listName ? `查看小菜篮「${listName}」` : '该去采购了',
      data: { source: 'ai_agent', shoppingListName: listName },
      triggerAt,
    },
  });

  return { id: task.id, title, triggerAt: triggerAt.toLocaleString('zh-CN', { hour12: false }) };
}

async function executeSavePreference(userId: number, args: Record<string, unknown>): Promise<unknown> {
  const content = String(args.content || '').slice(0, 240);
  if (!content) throw new Error('没有可保存的内容');
  if (!(await hasTable('user_memories'))) throw new Error('记忆功能暂不可用');

  const type = String(args.type || 'preference');
  const memory = await (prisma as any).userMemory.create({
    data: { userId, type, content, metadata: { source: 'ai_agent' }, lastUsedAt: new Date() },
  });
  return { id: memory.id, type, content };
}

async function executeGenerateRecipeDraft(args: Record<string, unknown>): Promise<unknown> {
  const title = String(args.title || '');
  const description = String(args.description || '');
  return {
    title,
    description: description || `AI生成的「${title}」菜谱草稿`,
    cookingTime: 25,
    difficulty: 'MEDIUM',
    servings: 2,
    source: 'ai_draft',
    message: `已为「${title}」生成菜谱草稿，可用于创建采购清单。`,
  };
}

// ─── Tool Executor Router ────────────────────────────────────

async function executeTool(
  name: AgentToolName,
  args: Record<string, unknown>,
  userId: number,
): Promise<{ success: boolean; result?: unknown; error?: string }> {
  try {
    let result: unknown;
    switch (name) {
      case 'search_recipes':
        result = await executeSearchRecipes(args);
        break;
      case 'get_recipe_detail':
        result = await executeGetRecipeDetail(args);
        break;
      case 'list_fridge_items':
        result = await executeListFridge(userId);
        break;
      case 'list_shopping_lists':
        result = await executeListShoppingLists(userId);
        break;
      case 'get_user_context':
        result = await executeGetUserContext(userId);
        break;
      case 'add_to_shopping_list':
        result = await executeAddToShoppingList(userId, args);
        break;
      case 'add_to_fridge':
        result = await executeAddToFridge(userId, args);
        break;
      case 'schedule_reminder':
        result = await executeScheduleReminder(userId, args);
        break;
      case 'save_preference':
        result = await executeSavePreference(userId, args);
        break;
      case 'generate_recipe_draft':
        result = await executeGenerateRecipeDraft(args);
        break;
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
    return { success: true, result };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

// ─── Agent Loop ──────────────────────────────────────────────

const MAX_AGENT_TURNS = 5;

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

function buildUserContent(text: string, imageUrls: string[]) {
  if (imageUrls.length === 0) return text;
  return [
    { type: 'text', text },
    ...imageUrls.map((url) => ({ type: 'image_url', image_url: { url } })),
  ];
}

function sanitizeReply(text: string): string {
  return text
    // Strip leaked tool-call XML/function markers
    .replace(/<\/?tool[-_]?calls?>/gi, '')
    .replace(/<\/?function[^>]*>/gi, '')
    .replace(/<function\s*=\s*[^>]+>/gi, '')
    .replace(/<parameter[^>]*>[\s\S]*?<\/parameter>/gi, '')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/\*\*/g, '')
    .replace(/^\s*[-*_]{3,}\s*$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Run the agent loop for a new user message.
 * May return with pending actions if confirmation-required tools are triggered.
 */
export async function runAgent(input: {
  userId: number;
  text: string;
  imageUrls?: string[];
  sessionId?: number;
  continueFromMessageId?: number; // when continuing after confirmation
  confirmedActions?: Array<{ id: string; confirmed: boolean }>;
}): Promise<AgentResponse> {
  const text = input.text.trim();
  const imageUrls = input.imageUrls || [];

  // Check quota
  const quota = await checkAiQuota(input.userId);
  if (!quota.allowed) throw new Error(quota.reason || '今日 AI 额度已用完');

  // Get or create session
  let sessionId: number;
  if (input.sessionId) {
    const existing = await prisma.aiChatSession.findFirst({
      where: { id: input.sessionId, userId: input.userId, status: { not: 'DELETED' as any } },
    });
    if (existing) sessionId = existing.id;
    else {
      const created = await prisma.aiChatSession.create({
        data: { userId: input.userId, title: titleFromText(text), lastMessageAt: new Date() },
      });
      sessionId = created.id;
    }
  } else {
    const created = await prisma.aiChatSession.create({
      data: { userId: input.userId, title: titleFromText(text), lastMessageAt: new Date() },
    });
    sessionId = created.id;
  }

  // Save user message to DB
  const messageMetadata = imageUrls.length > 0 ? { imageUrls } : undefined;
  const userMessage = await prisma.aiChatMessage.create({
    data: {
      sessionId,
      userId: input.userId,
      role: 'USER' as any,
      content: text,
      metadata: messageMetadata,
    },
  });

  // Get active API key
  const activeKey = await getActiveChatKey(imageUrls.length > 0);
  if (!activeKey) {
    const fallback = 'AI API Key 还没有配置好。请在后台配置 text 或 multimodal 类型的 Key。';
    const msg = await prisma.aiChatMessage.create({
      data: {
        sessionId,
        userId: input.userId,
        role: 'ASSISTANT' as any,
        content: fallback,
        model: '',
        tokensUsed: 0,
        metadata: { recommendations: [], pendingActions: [], executedTools: [] },
      },
    });
    return {
      sessionId,
      userMessageId: userMessage.id,
      assistantMessageId: msg.id,
      message: fallback,
      model: '',
      recommendations: [],
      pendingActions: [],
      executedTools: [],
      tokensUsed: 0,
    };
  }

  // Create LLM instance
  const model = new ChatOpenAI({
    model: activeKey.model,
    apiKey: activeKey.apiKey,
    temperature: 0.7,
    maxTokens: 2048,
    configuration: { baseURL: normalizeBaseUrl(activeKey.baseUrl) },
  } as any);

  const modelWithTools = model.bindTools(getToolDefsForLLM());

  // Build message history
  const systemPrompt = await buildAgentSystemPrompt(input.userId);
  const llmMessages: Array<AIMessage | HumanMessage | SystemMessage | ToolMessage> = [new SystemMessage(systemPrompt)];

  // Load recent messages for context
  const recentMessages = await prisma.aiChatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  for (const msg of recentMessages.reverse()) {
    if (msg.role === 'USER') {
      llmMessages.push(new HumanMessage(msg.content));
    } else if (msg.role === 'ASSISTANT') {
      // Strip tool summary from history
      const cleanContent = msg.content.replace(/\n\n---\n[\s\S]*$/g, '').trim();
      llmMessages.push(new AIMessage(cleanContent));
    }
  }

  // Add current user message
  llmMessages.push(new HumanMessage(buildUserContent(text, imageUrls) as any));

  // Handle continuation (confirmed actions)
  if (input.confirmedActions && input.confirmedActions.length > 0 && input.continueFromMessageId) {
    for (const action of input.confirmedActions) {
      const pendingMsg = llmMessages.find(
        (m) => m instanceof AIMessage && (m as any).tool_calls?.some((tc: any) => tc.id === action.id),
      );
      if (pendingMsg) {
        const tc = (pendingMsg as any).tool_calls.find((t: any) => t.id === action.id);
        if (tc) {
          if (action.confirmed) {
            const result = await executeTool(tc.name as AgentToolName, tc.args, input.userId);
            llmMessages.push(
              new ToolMessage({
                tool_call_id: tc.id,
                content: JSON.stringify(result),
              }),
            );
          } else {
            llmMessages.push(
              new ToolMessage({
                tool_call_id: tc.id,
                content: JSON.stringify({ skipped: true, reason: '用户选择不执行此操作' }),
              }),
            );
          }
        }
      }
    }
  }

  // ── Agent Loop ──
  const executedTools: AgentToolResult[] = [];
  const pendingActions: PendingAction[] = [];
  let finalMessage = '';
  let totalTokens = 0;

  const start = Date.now();
  try {
    for (let turn = 0; turn < MAX_AGENT_TURNS; turn++) {
      const response = await modelWithTools.invoke(llmMessages);
      const usage = (response as any).response_metadata?.tokenUsage || (response as any).usage_metadata || {};
      totalTokens += usage.totalTokens || usage.total_tokens || 0;

      const toolCalls = (response as any).tool_calls || [];
      // Strip leaked XML from text content (model may emit raw <tool-call> text alongside function calls)
      const cleanContent = sanitizeReply(contentToString(response.content));

      if (toolCalls.length > 0) {
        // Add assistant message with tool calls (use cleaned content, not leaked XML)
        llmMessages.push(new AIMessage({ content: cleanContent, tool_calls: toolCalls } as any));

        let hasConfirmationRequired = false;

        for (const toolCall of toolCalls) {
          const def = getToolDef(toolCall.name);
          const args = toolCall.args || {};

          if (def?.requiresConfirmation) {
            // Pause for user confirmation
            hasConfirmationRequired = true;
            const label = def.confirmationLabel?.(args) || { title: toolCall.name, body: JSON.stringify(args) };
            pendingActions.push({
              id: toolCall.id!,
              toolName: toolCall.name as AgentToolName,
              title: label.title,
              body: label.body,
              args,
            });
          } else {
            // Auto-execute
            const result = await executeTool(toolCall.name as AgentToolName, args, input.userId);
            executedTools.push({
              callId: toolCall.id!,
              name: toolCall.name as AgentToolName,
              success: result.success,
              result: result.result,
              error: result.error,
            });
            llmMessages.push(
              new ToolMessage({
                tool_call_id: toolCall.id!,
                content: JSON.stringify(result.success ? result.result : { error: result.error }),
              }),
            );
          }
        }

        if (hasConfirmationRequired) {
          // Generate a brief interim response while waiting for confirmation
          const interimResponse = await model.invoke(llmMessages);
          const usage2 = (interimResponse as any).response_metadata?.tokenUsage || {};
          totalTokens += usage2.totalTokens || usage2.total_tokens || 0;
          finalMessage = sanitizeReply(contentToString(interimResponse.content));
          break;
        }
        // Continue loop with tool results
      } else {
        // Final text response
        finalMessage = sanitizeReply(contentToString(response.content));
        break;
      }
    }
  } catch (err: any) {
    void logAiUsage({
      apiKeyId: activeKey.id,
      model: activeKey.model,
      usage: 'chat',
      purpose: 'AI Agent',
      userId: input.userId,
      userName: '',
      input: JSON.stringify({ text, imageUrls }),
      duration: Date.now() - start,
      success: false,
      error: err?.message || String(err),
    });
    throw err;
  }

  if (!finalMessage) {
    finalMessage = pendingActions.length > 0 ? '好的，请确认以下操作：' : '我暂时没有生成有效回复，请换个说法再试一次。';
  }

  // Extract recommendations from search results
  const searchResult = executedTools.find((t) => t.name === 'search_recipes' && t.success);
  const recommendations: ChatRecommendation[] = searchResult
    ? ((searchResult.result as any)?.results || []).map((r: any) => ({
        id: String(r.id),
        type: 'recipe' as const,
        title: r.title,
        description: r.description || '',
        coverImage: r.coverImage || '',
        authorName: '小厨子官方',
        cookingTime: r.cookingTime || null,
        difficulty: r.difficulty || '',
        route: `/recipe/${r.id}`,
      }))
    : [];

  // Save assistant message
  const canPersistToolCalls = await hasColumn('ai_chat_messages', 'toolCalls');
  const assistantMessage = await (prisma as any).aiChatMessage.create({
    data: {
      sessionId,
      userId: input.userId,
      role: 'ASSISTANT' as any,
      content: finalMessage,
      model: activeKey.model,
      tokensUsed: totalTokens || null,
      metadata: {
        recommendations,
        pendingActions,
        executedTools,
      },
      ...(canPersistToolCalls && { toolCalls: [...executedTools, ...pendingActions] as any }),
    },
  });

  // Update session
  await prisma.aiChatSession.update({
    where: { id: sessionId },
    data: { lastMessageAt: assistantMessage.createdAt },
  });

  // Update token usage
  if (totalTokens) {
    await prisma.aiApiKey.update({
      where: { id: activeKey.id },
      data: { usedTokens: { increment: totalTokens } },
    });
  }

  // Log usage
  void logAiUsage({
    apiKeyId: activeKey.id,
    model: activeKey.model,
    usage: 'chat',
    purpose: 'AI Agent',
    tokensIn: 0,
    tokensOut: totalTokens,
    userId: input.userId,
    userName: '',
    input: JSON.stringify({ text, imageUrls }),
    output: finalMessage,
    duration: Date.now() - start,
    success: true,
  });

  // if (pendingActions.length > 0) {
  //   agentStates.set(sessionId, {
  //     sessionId,
  //     userId: input.userId,
  //     assistantMessageId: assistantMessage.id,
  //     llmMessages,
  //     executedTools,
  //     pendingActions,
  //     recommendations,
  //   });
  // }

  return {
    sessionId,
    userMessageId: userMessage.id,
    assistantMessageId: assistantMessage.id,
    message: finalMessage,
    model: activeKey.model,
    recommendations,
    pendingActions,
    executedTools,
    tokensUsed: totalTokens || 0,
  };
}

/**
 * Continue agent loop after user confirmed/rejected pending actions.
 */
export async function continueAgent(input: {
  userId: number;
  sessionId: number;
  messageId: number;
  confirmedActions: Array<{ id: string; confirmed: boolean }>;
}): Promise<AgentResponse> {
  // Reload the message to get pending actions
  const message = await prisma.aiChatMessage.findFirst({
    where: { id: input.messageId, sessionId: input.sessionId, userId: input.userId },
    include: { session: true },
  });
  if (!message) throw new Error('Message not found');

  const metadata = (message.metadata || {}) as any;
  const pendingActions: PendingAction[] = metadata.pendingActions || [];

  // Match confirmed actions with pending actions
  const confirmed = input.confirmedActions
    .filter((a) => pendingActions.some((p) => p.id === a.id))
    .map((a) => {
      const pending = pendingActions.find((p) => p.id === a.id)!;
      return { ...a, toolName: pending.toolName, args: pending.args };
    });

  if (confirmed.length === 0) throw new Error('No matching pending actions');

  // Re-run agent with confirmed actions
  // We need to rebuild the agent state from the conversation history
  // For now, use a simpler approach: execute confirmed tools and let LLM respond

  const executedTools: AgentToolResult[] = [];
  for (const action of confirmed) {
    if (action.confirmed) {
      const result = await executeTool(action.toolName, action.args, input.userId);
      executedTools.push({
        callId: action.id,
        name: action.toolName,
        success: result.success,
        result: result.result,
        error: result.error,
      });
    }
  }

  // Get API key
  const activeKey = await getActiveChatKey();
  if (!activeKey) {
    throw new Error('AI API Key 未配置');
  }

  const model = new ChatOpenAI({
    model: activeKey.model,
    apiKey: activeKey.apiKey,
    temperature: 0.7,
    maxTokens: 2048,
    configuration: { baseURL: normalizeBaseUrl(activeKey.baseUrl) },
  } as any);

  // Build context with tool results
  const systemPrompt = await buildAgentSystemPrompt(input.userId);
  const llmMessages: Array<any> = [new SystemMessage(systemPrompt)];

  // Load history
  const history = await prisma.aiChatMessage.findMany({
    where: { sessionId: input.sessionId, id: { lt: input.messageId } },
    orderBy: { createdAt: 'asc' },
  });

  for (const msg of history) {
    if (msg.role === 'USER') llmMessages.push(new HumanMessage(msg.content));
    else if (msg.role === 'ASSISTANT')
      llmMessages.push(new AIMessage(msg.content.replace(/\n\n---\n[\s\S]*$/g, '').trim()));
  }

  // Add the message with confirmed tools
  const toolResultsText = executedTools
    .map((t) => `${t.name}: ${t.success ? '已执行' : '失败'}`)
    .join('\n');

  llmMessages.push(
    new HumanMessage(`用户已确认以下操作：\n${toolResultsText}\n\n请根据操作结果更新回复，告知用户执行情况。`),
  );

  const response = await model.invoke(llmMessages);
  const reply = sanitizeReply(contentToString(response.content));

  // Update the existing message
  const updatedMetadata = {
    ...metadata,
    pendingActions: [], // Clear pending
    executedTools: [...(metadata.executedTools || []), ...executedTools],
    confirmed: true,
  };

  await (prisma as any).aiChatMessage.update({
    where: { id: input.messageId },
    data: {
      content: reply,
      metadata: updatedMetadata,
    },
  });

  const searchResult = executedTools.find((t) => t.name === 'search_recipes' && t.success);
  const recommendations: ChatRecommendation[] = searchResult
    ? ((searchResult.result as any)?.results || []).map((r: any) => ({
        id: String(r.id),
        type: 'recipe' as const,
        title: r.title,
        description: r.description || '',
        coverImage: r.coverImage || '',
        authorName: '小厨子官方',
        cookingTime: r.cookingTime || null,
        difficulty: r.difficulty || '',
        route: `/recipe/${r.id}`,
      }))
    : [];

  return {
    sessionId: input.sessionId,
    assistantMessageId: input.messageId,
    message: reply,
    model: activeKey.model,
    recommendations,
    pendingActions: [],
    executedTools,
    tokensUsed: 0,
  };
}
