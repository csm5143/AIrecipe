/**
 * 全局类型声明
 */

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

declare global {
  interface Uni {
    request(options: any): any;
    showToast(options: any): void;
    showLoading(options: any): void;
    hideLoading(): void;
    navigateTo(options: any): void;
    switchTab(options: any): void;
    reLaunch(options: any): void;
    navigateBack(options?: any): void;
    getStorageSync(key: string): any;
    setStorageSync(key: string, value: any): void;
    removeStorageSync(key: string): void;
  }

  const uni: Uni;
}
