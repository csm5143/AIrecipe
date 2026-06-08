/**
 * AI 文本生成服务
 * 用于公告创作等文本场景
 */
import { prisma } from '../lib/prisma';
import { logAiUsage } from './aiUsageLog.service';

/**
 * 生成公告文案
 */
export async function generateNoticeContent(topic: string, length: 'short' | 'medium' = 'medium'): Promise<string> {
  const key = await prisma.aiApiKey.findFirst({
    where: {
      isActive: true,
      AND: [
        { OR: [{ usage: 'chat' }, { usage: null }] },
        { OR: [{ keyType: { in: ['text', 'multimodal'] } }, { keyType: null }] },
      ],
    },
  });
  if (!key) throw new Error('没有激活的 AI Key（需要 usage=chat 或 null，且 keyType=text 或 multimodal）');

  const lengthHint = length === 'short' ? '80-120字' : '150-250字';
  const systemPrompt = `你是一个美食类小程序的运营编辑。你的任务是撰写适合推送的公告文案。
要求：口语化、有温度、${lengthHint}、可包含适当的emoji、分段清晰。
直接输出公告正文，不要加任何前缀说明。`;

  const userPrompt = `请为以下主题撰写一则公告：${topic}`;

  const url = `${key.baseUrl}/chat/completions`;
  const start = Date.now();
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key.apiKey}` },
      body: JSON.stringify({
        model: key.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 400,
        temperature: 0.8,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      void logAiUsage({
        apiKeyId: key.id,
        model: key.model,
        usage: 'chat',
        purpose: '公告文案生成',
        input: topic,
        duration: Date.now() - start,
        success: false,
        error: `AI API [${res.status}]: ${err.slice(0, 200)}`,
      });
      throw new Error(`AI API [${res.status}]: ${err.slice(0, 200)}`);
    }

    const data = await res.json() as any;
    const content = data?.choices?.[0]?.message?.content || '';

    // 扣减 token
    const tokens = (data?.usage?.total_tokens) || 300;
    await prisma.aiApiKey.update({
      where: { id: key.id },
      data: { usedTokens: { increment: tokens } },
    }).catch(() => {});

    void logAiUsage({
      apiKeyId: key.id,
      model: key.model,
      usage: 'chat',
      purpose: '公告文案生成',
      tokensIn: data?.usage?.prompt_tokens || Math.max(0, tokens - (data?.usage?.completion_tokens || 0)),
      tokensOut: data?.usage?.completion_tokens || 0,
      input: topic,
      output: content,
      duration: Date.now() - start,
      success: true,
    });

    return content.trim();
  } catch (err: any) {
    if (!String(err?.message || '').startsWith('AI API [')) {
      void logAiUsage({
        apiKeyId: key.id,
        model: key.model,
        usage: 'chat',
        purpose: '公告文案生成',
        input: topic,
        duration: Date.now() - start,
        success: false,
        error: err?.message || String(err),
      });
    }
    throw err;
  }
}
