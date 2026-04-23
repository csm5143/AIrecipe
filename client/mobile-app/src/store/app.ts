/**
 * 应用全局状态管理
 */
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

interface AppConfig {
  version: string;
  checkUpdate: boolean;
}

export const useAppStore = defineStore('app', () => {
  // 状态
  const appConfig = ref<AppConfig>({
    version: '1.0.0',
    checkUpdate: true,
  });

  const isLoading = ref(false);

  // 全局加载状态
  const globalLoading = ref(false);
  const loadingText = ref('');

  // 计算属性
  const version = computed(() => appConfig.value.version);

  // 设置全局加载状态
  function setLoading(loading: boolean, text = '') {
    globalLoading.value = loading;
    loadingText.value = text;
    if (loading) {
      uni.showLoading({ title: text || '加载中...', mask: true });
    } else {
      uni.hideLoading();
    }
  }

  // 显示 Toast
  function showToast(message: string, icon: 'success' | 'error' | 'none' = 'none') {
    uni.showToast({
      title: message,
      icon,
      duration: 2000,
    });
  }

  // 初始化应用
  function initApp() {
    // 获取系统信息
    const systemInfo = uni.getSystemInfoSync();
    console.log('[AppStore] System info:', systemInfo);

    // 检查更新
    if (appConfig.value.checkUpdate) {
      checkForUpdate();
    }
  }

  // 检查更新
  async function checkForUpdate() {
    // #ifdef APP-PLUS
    const updateManager = uni.getUpdateManager();

    updateManager.onCheckForUpdate((res) => {
      if (res.hasUpdate) {
        console.log('[AppStore]有新版本可用');
      }
    });

    updateManager.onUpdateReady(() => {
      uni.showModal({
        title: '更新提示',
        content: '新版本已准备好，是否重启应用？',
        success: (res) => {
          if (res.confirm) {
            updateManager.applyUpdate();
          }
        },
      });
    });

    updateManager.onUpdateFailed(() => {
      uni.showModal({
        title: '更新失败',
        content: '新版本下载失败，请检查网络后重试',
        showCancel: false,
      });
    });
    // #endif
  }

  return {
    // 状态
    appConfig,
    isLoading,
    globalLoading,
    loadingText,
    // 计算属性
    version,
    // 方法
    setLoading,
    showToast,
    initApp,
    checkForUpdate,
  };
});
