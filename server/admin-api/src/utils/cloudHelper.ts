/**
 * 云函数调用辅助工具
 * 用于服务端调用微信云函数
 */

import config from '../config';

interface CloudFunctionResult {
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
}

/**
 * 调用微信云函数
 */
export async function callCloudFunction(
  functionName: string,
  action: string,
  data: Record<string, any> = {}
): Promise<CloudFunctionResult> {
  try {
    const url = `https://api.weixin.qq.com/tcb/invokecloudfunction?access_token=${await getAccessToken()}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        env: config.cloud.envId,
        function_name: functionName,
        data: JSON.stringify({ action, data }),
      }),
    });

    const result = await response.json();

    if (result.errcode && result.errcode !== 0) {
      console.error(`[CloudHelper] 云函数调用失败:`, result);
      return {
        success: false,
        message: result.errmsg || '云函数调用失败',
      };
    }

    // 解析返回数据
    const responseData = typeof result.response === 'string' 
      ? JSON.parse(result.response) 
      : result.response;

    return {
      success: responseData?.success ?? true,
      data: responseData,
      message: responseData?.message,
    };
  } catch (error: any) {
    console.error(`[CloudHelper] 调用云函数 ${functionName} 失败:`, error);
    return {
      success: false,
      message: error.message || '网络请求失败',
    };
  }
}

// 简单的 access_token 缓存
let accessTokenCache: { token: string; expireTime: number } | null = null;

/**
 * 获取 access_token
 */
async function getAccessToken(): Promise<string> {
  // 检查缓存
  if (accessTokenCache && Date.now() < accessTokenCache.expireTime) {
    return accessTokenCache.token;
  }

  const { appId, appSecret } = config.cloud;

  if (!appId || !appSecret) {
    throw new Error('缺少微信云开发配置');
  }

  try {
    const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`;
    const response = await fetch(url);
    const result = await response.json();

    if (result.access_token) {
      // 缓存 2 小时（提前 5 分钟过期）
      accessTokenCache = {
        token: result.access_token,
        expireTime: Date.now() + (result.expires_in - 300) * 1000,
      };
      return result.access_token;
    } else {
      throw new Error(result.errmsg || '获取 access_token 失败');
    }
  } catch (error: any) {
    console.error('[CloudHelper] 获取 access_token 失败:', error);
    throw error;
  }
}
