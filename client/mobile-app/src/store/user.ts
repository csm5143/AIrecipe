/**
 * 用户状态管理
 */
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { getUserInfo, setUserInfo, clearToken, isLoggedIn as checkLoggedIn } from '@/utils/auth';
import { login as loginApi, getUserProfile, logout as logoutApi } from '@/api/auth';
import type { User, LoginDto } from '@/types';

export const useUserStore = defineStore('user', () => {
  // 状态
  const userInfo = ref<User | null>(null);
  const isLoading = ref(false);

  // 计算属性
  const isLoggedIn = computed(() => !!userInfo.value || checkLoggedIn());

  const nickname = computed(() => userInfo.value?.nickname || '用户');

  const avatar = computed(() => userInfo.value?.avatar || '');

  const userId = computed(() => userInfo.value?.id);

  // 初始化用户信息（从本地存储恢复）
  function initUserInfo() {
    const localInfo = getUserInfo();
    if (localInfo) {
      userInfo.value = localInfo;
    }
  }

  // 检查登录状态
  function checkLoginStatus(): boolean {
    return checkLoggedIn();
  }

  // 登录
  async function login(loginData: LoginDto) {
    isLoading.value = true;
    try {
      const res = await loginApi(loginData);
      if (res.data) {
        userInfo.value = res.data.user;
        setUserInfo(res.data.user);
        return true;
      }
      return false;
    } catch (error) {
      console.error('[UserStore] Login failed:', error);
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  // 获取用户信息（从服务器）
  async function fetchUserProfile() {
    if (!checkLoggedIn()) return null;

    try {
      const res = await getUserProfile();
      if (res.data) {
        userInfo.value = res.data;
        setUserInfo(res.data);
        return res.data;
      }
      return null;
    } catch (error) {
      console.error('[UserStore] Fetch profile failed:', error);
      return null;
    }
  }

  // 更新用户信息
  function updateUserInfo(info: Partial<User>) {
    if (userInfo.value) {
      userInfo.value = { ...userInfo.value, ...info };
      setUserInfo(userInfo.value);
    }
  }

  // 退出登录
  async function logout() {
    try {
      await logoutApi();
    } catch (error) {
      // 忽略退出登录 API 错误
    }
    clearUserInfo();
  }

  // 清除用户信息
  function clearUserInfo() {
    userInfo.value = null;
    clearToken();
  }

  return {
    // 状态
    userInfo,
    isLoading,
    // 计算属性
    isLoggedIn,
    nickname,
    avatar,
    userId,
    // 方法
    initUserInfo,
    checkLoginStatus,
    login,
    fetchUserProfile,
    updateUserInfo,
    logout,
    clearUserInfo,
  };
});
