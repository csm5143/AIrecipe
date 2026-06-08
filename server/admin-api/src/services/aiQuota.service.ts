import { prisma } from '../lib/prisma';

type AiQuotaConfig = {
  dailyLimit: number;
  dailyTokenLimit: number;
  whitelist: number[];
};

export type AiQuotaResult = {
  allowed: boolean;
  reason?: string;
  count: number;
  tokens: number;
  dailyLimit: number;
  dailyTokenLimit: number;
};

function startOfLocalDay() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function parseList(value?: string | null): number[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => Number(item)).filter((item) => Number.isFinite(item));
    }
  } catch {
    return value
      .split(',')
      .map((item) => Number(item.trim()))
      .filter((item) => Number.isFinite(item));
  }
  return [];
}

function parsePositiveInt(value: string | null | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

export async function getAiQuotaConfig(): Promise<AiQuotaConfig> {
  const rows = await prisma.systemSetting.findMany({
    where: { category: 'ai_quota' },
  });
  const map = new Map(rows.map((row) => [row.key, row.value]));
  return {
    dailyLimit: parsePositiveInt(map.get('dailyLimit'), 50),
    dailyTokenLimit: parsePositiveInt(map.get('dailyTokenLimit'), 50000),
    whitelist: parseList(map.get('whitelist')),
  };
}

export async function ensureAiQuotaDefaults() {
  const defaults = [
    { key: 'dailyLimit', value: '50', description: '每个用户每天 AI 聊天次数上限' },
    { key: 'dailyTokenLimit', value: '50000', description: '每个用户每天 AI 聊天 Token 上限' },
    { key: 'whitelist', value: '[]', description: 'AI 配额白名单用户 ID 列表' },
  ];

  await Promise.all(
    defaults.map((item) =>
      prisma.systemSetting.upsert({
        where: { category_key: { category: 'ai_quota', key: item.key } },
        update: {},
        create: { category: 'ai_quota', key: item.key, value: item.value, description: item.description },
      }),
    ),
  );
}

export async function checkAiQuota(userId: number): Promise<AiQuotaResult> {
  const config = await getAiQuotaConfig();
  const since = startOfLocalDay();

  const rows = await prisma.aiUsageLog.findMany({
    where: {
      userId,
      usage: 'chat',
      createdAt: { gte: since },
      success: true,
    },
    select: { tokensIn: true, tokensOut: true },
  });

  const count = rows.length;
  const tokens = rows.reduce((sum, row) => sum + row.tokensIn + row.tokensOut, 0);

  if (config.whitelist.includes(userId)) {
    return { allowed: true, count, tokens, dailyLimit: config.dailyLimit, dailyTokenLimit: config.dailyTokenLimit };
  }
  if (count >= config.dailyLimit) {
    return {
      allowed: false,
      reason: `今日 AI 对话次数已用完（${count}/${config.dailyLimit}）`,
      count,
      tokens,
      dailyLimit: config.dailyLimit,
      dailyTokenLimit: config.dailyTokenLimit,
    };
  }
  if (tokens >= config.dailyTokenLimit) {
    return {
      allowed: false,
      reason: `今日 AI Token 额度已用完（${tokens}/${config.dailyTokenLimit}）`,
      count,
      tokens,
      dailyLimit: config.dailyLimit,
      dailyTokenLimit: config.dailyTokenLimit,
    };
  }
  return { allowed: true, count, tokens, dailyLimit: config.dailyLimit, dailyTokenLimit: config.dailyTokenLimit };
}
