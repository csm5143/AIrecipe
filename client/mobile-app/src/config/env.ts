// 服务器端点配置
const DEV_API = 'http://localhost:3000/api/v1';
const PROD_API = 'https://api.airecipe.com/api/v1';

export const API_BASE_URL = import.meta.env.PROD ? PROD_API : DEV_API;

// AI 服务配置
export const AI_CONFIG = {
  enable: true,
  model: 'gpt-4',
  maxTokens: 2000,
  temperature: 0.7,
};

// 微信配置
export const WX_CONFIG = {
  appId: process.env.WX_APP_ID || '',
  appSecret: process.env.WX_APP_SECRET || '',
};

// 应用配置
export const APP_CONFIG = {
  name: '吃了么-AI菜谱',
  version: '1.0.0',
  updateUrl: 'https://api.airecipe.com/app/update',
};

// 存储键名
export const STORAGE_KEYS = {
  TOKEN: 'auth_token',
  USER_INFO: 'user_info',
  SEARCH_HISTORY: 'search_history',
  RECIPE_CACHE: 'recipe_cache',
};
