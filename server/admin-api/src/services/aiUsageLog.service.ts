import { prisma } from '../lib/prisma';

interface LogUsageInput {
  apiKeyId: number;
  model: string;
  usage?: string | null;
  purpose: string;
  tokensIn?: number;
  tokensOut?: number;
  userId?: number;
  userName?: string | null;
  input?: string | null;
  output?: string | null;
  duration?: number;
  success?: boolean;
  error?: string;
}

function truncateText(value: unknown, max = 500) {
  if (value === undefined || value === null) return null;
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

/**
 * 记录每次 AI API 调用的 token 消耗和费用
 */
export async function logAiUsage(params: LogUsageInput) {
  try {
    // 计算费用：pricePerMTok 是每百万 token 的美元价格
    let cost: number | null = null;
    const key = await (prisma.aiApiKey as any).findUnique({
      where: { id: params.apiKeyId },
      select: { pricePerMTok: true },
    });

    if (key?.pricePerMTok) {
      const totalTokens = (params.tokensIn || 0) + (params.tokensOut || 0);
      cost = (totalTokens / 1_000_000) * key.pricePerMTok;
    }

    await (prisma as any).aiUsageLog.create({
      data: {
        apiKeyId: params.apiKeyId,
        model: params.model,
        usage: params.usage || null,
        purpose: params.purpose,
        tokensIn: params.tokensIn || 0,
        tokensOut: params.tokensOut || 0,
        cost,
        userId: params.userId || null,
        userName: truncateText(params.userName, 100),
        input: truncateText(params.input),
        output: truncateText(params.output),
        duration: params.duration || null,
        success: params.success !== false,
        error: truncateText(params.error),
      },
    });
  } catch (err) {
    console.error('[AiUsageLog] 日志写入失败:', err);
  }
}
