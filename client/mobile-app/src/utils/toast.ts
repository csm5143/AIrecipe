/**
 * Toast 提示工具
 */

/**
 * 显示成功提示
 */
export function showSuccessToast(message: string) {
  uni.showToast({
    title: message,
    icon: 'success',
    duration: 2000,
  });
}

/**
 * 显示失败提示
 */
export function showErrorToast(message: string) {
  uni.showToast({
    title: message,
    icon: 'error',
    duration: 2000,
  });
}

/**
 * 显示加载中
 */
export function showLoading(title = '加载中...') {
  uni.showLoading({ title, mask: true });
}

/**
 * 隐藏加载
 */
export function hideLoading() {
  uni.hideLoading();
}

/**
 * 显示消息提示
 */
export function showToast(message: string, icon: 'success' | 'error' | 'none' | 'loading' = 'none') {
  uni.showToast({
    title: message,
    icon,
    duration: 2000,
  });
}

/**
 * 显示确认对话框
 */
export function showConfirm(options: {
  title?: string;
  content: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: string;
}): Promise<boolean> {
  return new Promise((resolve) => {
    uni.showModal({
      title: options.title || '提示',
      content: options.content,
      confirmText: options.confirmText || '确定',
      cancelText: options.cancelText || '取消',
      confirmColor: options.confirmColor || '#FF9500',
      success: (res) => {
        resolve(res.confirm);
      },
      fail: () => {
        resolve(false);
      },
    });
  });
}

/**
 * 显示操作菜单
 */
export function showActionSheet(options: {
  itemList: string[];
  itemColor?: string;
}): Promise<number> {
  return new Promise((resolve) => {
    uni.showActionSheet({
      itemList: options.itemList,
      itemColor: options.itemColor || '#333333',
      success: (res) => {
        resolve(res.tapIndex);
      },
      fail: () => {
        resolve(-1);
      },
    });
  });
}
