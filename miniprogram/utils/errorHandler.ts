// 统一的错误处理工具

/**
 * 处理错误并显示用户友好的提示
 * @param error 错误对象
 * @param context 错误上下文（用于日志）
 * @param userMessage 用户提示消息（可选，默认使用通用提示）
 */
export function handleError(
  error: any,
  context: string,
  userMessage?: string
): void {
  console.error(`[${context}]`, error);

  wx.showToast({
    title: userMessage || '操作失败，请重试',
    icon: 'none',
    duration: 2000
  });
}

/**
 * 处理警告（不显示用户提示，仅记录日志）
 * @param error 错误对象
 * @param context 错误上下文
 */
export function handleWarning(error: any, context: string): void {
  console.warn(`[${context}]`, error);
}

/**
 * 处理信息（仅记录日志）
 * @param message 信息消息
 * @param context 上下文
 */
export function handleInfo(message: string, context: string): void {
  console.info(`[${context}]`, message);
}
