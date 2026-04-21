import { defineStore } from 'pinia';
import { ref } from 'vue';
import { authApi } from '@/api';
import type { AdminUser, LoginDto } from '@airecipe/shared-types';

export const useUserStore = defineStore('user', () => {
  const token = ref<string>(localStorage.getItem('token') || '');
  const profile = ref<AdminUser | null>(null);

  async function login(credentials: LoginDto) {
    const res = await authApi.login(credentials);
    token.value = res.data.token;
    profile.value = res.data.admin;
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('refreshToken', res.data.refreshToken);
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
    const res = await authApi.getProfile();
    profile.value = res.data;
  }

  return {
    token,
    profile,
    login,
    logout,
    fetchProfile,
  };
});
