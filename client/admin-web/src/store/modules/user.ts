import { defineStore } from 'pinia';
import { ref } from 'vue';
import { authApi } from '@/api';
import type { AdminUser, LoginDto } from '@airecipe/shared-types';

export const useUserStore = defineStore('user', () => {
  const token = ref<string>(localStorage.getItem('token') || '');
  const profile = ref<AdminUser | null>(null);

  async function login(credentials: LoginDto) {
    const res = await authApi.login(credentials);
    const data = res.data as any;
    token.value = data.token;
    profile.value = data.admin;
    localStorage.setItem('token', data.token);
    localStorage.setItem('refreshToken', data.refreshToken);
  }

  async function logout() {
    try {
      await authApi.logout();
    } finally {
      token.value = '';
      profile.value = null;
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    }
  }

  async function fetchProfile() {
    if (!token.value) return;
    try {
      const res = await authApi.getProfile();
      profile.value = res.data as AdminUser;
    } catch {
      // 网络不可用时静默降级，不中断业务流程
    }
  }

  async function updateProfile(data: { nickname?: string; phone?: string }) {
    const res = await authApi.updateProfile(data);
    if (profile.value) {
      const updateData = res.data as any;
      profile.value.nickname = updateData.nickname;
      if ('phone' in updateData) {
        (profile.value as any).phone = updateData.phone;
      }
    }
  }

  async function updateAvatar(avatar: string) {
    const res = await authApi.updateAvatar({ avatar });
    if (profile.value) {
      profile.value.avatar = (res.data as any).avatar;
    }
  }

  async function changePassword(data: { oldPassword: string; newPassword: string }) {
    await authApi.changePassword(data);
  }

  return {
    token,
    profile,
    login,
    logout,
    fetchProfile,
    updateProfile,
    updateAvatar,
    changePassword,
  };
});
