/**
 * 页面跳转工具
 */

/**
 * 跳转到指定页面（保留当前页）
 */
export function navigateTo(url: string, params?: Record<string, string | number>): void {
  const query = params
    ? '?' + Object.entries(params)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join('&')
    : '';
  uni.navigateTo({ url: `${url}${query}` });
}

/**
 * 跳转到指定页面（关闭当前页）
 */
export function redirectTo(url: string, params?: Record<string, string | number>): void {
  const query = params
    ? '?' + Object.entries(params)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join('&')
    : '';
  uni.redirectTo({ url: `${url}${query}` });
}

/**
 * 跳转到 TabBar 页面
 */
export function switchTab(url: string): void {
  uni.switchTab({ url });
}

/**
 * 关闭所有页面，跳转到指定页面
 */
export function reLaunch(url: string, params?: Record<string, string | number>): void {
  const query = params
    ? '?' + Object.entries(params)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join('&')
    : '';
  uni.reLaunch({ url: `${url}${query}` });
}

/**
 * 关闭当前页面，返回上一页
 */
export function navigateBack(delta = 1): void {
  uni.navigateBack({ delta });
}

/**
 * 获取页面参数
 */
export function getPageParams<T = Record<string, string>>(): T {
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  return (currentPage as any)?.options || {};
}

/**
 * 获取当前页面路径
 */
export function getCurrentPagePath(): string {
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  return currentPage?.route || '';
}
