/**
 * 环境配置
 */

interface EnvConfig {
  // API 配置
  apiBaseUrl: string;

  // 微信小程序配置
  wxAppId: string;

  // AI 配置
  aiApiKey: string;
}

const development: EnvConfig = {
  apiBaseUrl: 'http://localhost:3000/api/v1',
  wxAppId: '',
  aiApiKey: '',
};

const production: EnvConfig = {
  apiBaseUrl: 'https://api.airecipe.com/api/v1',
  wxAppId: '',
  aiApiKey: '',
};

const config = import.meta.env.PROD ? production : development;

export default config;

// 快捷访问
export const { apiBaseUrl, wxAppId, aiApiKey } = config;
