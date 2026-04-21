/**
 * 云端反馈管理
 * 将用户反馈数据存储到云数据库，支持图片上传到COS
 * 环境 ID: cloud1-3gyq7jzx76f46edc
 */

import { getUserIdentifier, getUserType, getUserInfo } from './userAuth';

// 云数据库集合名称
const FEEDBACK_COLLECTION = 'feedback';

// 云存储基础URL (COS)
const COS_BASE_URL = 'https://dish-1367781796.cos.ap-guangzhou.myqcloud.com';

/**
 * 检查云开发是否可用
 */
function isCloudAvailable(): boolean {
  try {
    return !!(wx.cloud && typeof wx.cloud.init === 'function');
  } catch (e) {
    return false;
  }
}

/**
 * 反馈类型枚举
 */
export type FeedbackType = 'bug' | 'suggest' | 'error' | 'other';

/**
 * 反馈状态枚举
 */
export type FeedbackStatus = 'pending' | 'processing' | 'resolved' | 'rejected';

/**
 * 反馈数据接口
 */
export interface FeedbackData {
  _id?: string;                 // 云数据库记录ID
  feedbackId: string;           // 本地生成的唯一ID
  userIdentifier: string | null; // 用户标识
  userType: 'user' | 'visitor' | 'guest'; // 用户类型
  nickname?: string;           // 用户昵称（如果有）
  avatar?: string;             // 用户头像（新增）
  type: FeedbackType;          // 反馈类型
  typeLabel: string;           // 反馈类型标签
  content: string;             // 反馈内容
  contact: string;             // 联系方式
  images: string[];            // 图片临时路径（本地）
  cloudImageUrls: string[];     // COS URL 数组（云端可访问）
  createTime: number;          // 创建时间
  status: FeedbackStatus;      // 处理状态
  appVersion?: string;         // 小程序版本
  phoneModel?: string;         // 手机型号
  systemInfo?: string;         // 系统信息
}

/**
 * 上传图片到 COS（通过云函数）
 * @param imagePath 临时文件路径
 * @param feedbackId 反馈ID
 * @param index 图片索引
 * @returns COS URL
 */
async function uploadImageToCOS(imagePath: string, feedbackId: string, index: number): Promise<string | null> {
  try {
    // 读取文件为 Base64
    const fileContent = await new Promise<string>((resolve, reject) => {
      wx.getFileSystemManager().readFile({
        filePath: imagePath,
        encoding: 'base64',
        success: res => resolve(res.data as string),
        fail: err => reject(err)
      });
    });

    // 调用云函数上传
    const result = await wx.cloud.callFunction({
      name: 'uploadAvatar',
      data: {
        action: 'uploadFeedbackImages',
        data: {
          images: [{
            fileBuffer: fileContent,
            fileName: `feedback_${index}.jpg`
          }]
        }
      }
    });

    if (result && (result as any).success) {
      const data = (result as any).data;
      const urls = (data && data.urls) ? data.urls : [];
      return urls[0] || null;
    }
    return null;
  } catch (e) {
    console.warn('[CloudFeedback] 图片上传COS失败', e);
    return null;
  }
}

/**
 * 提交反馈到云端
 * @param feedback 反馈数据
 * @returns 是否提交成功
 */
export async function submitFeedbackToCloud(feedback: Omit<FeedbackData, 'feedbackId' | 'userIdentifier' | 'userType' | 'createTime' | 'status'>): Promise<{ success: boolean; feedbackId?: string; error?: string }> {
  if (!isCloudAvailable()) {
    console.warn('[CloudFeedback] 云开发不可用');
    return { success: false, error: '云开发不可用' };
  }

  try {
    const identifier = getUserIdentifier();
    const userType = getUserType();
    const userInfo = getUserInfo();

    // 生成唯一反馈ID
    const feedbackId = `fb_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

    // 获取系统信息
    const sysInfo = wx.getSystemInfoSync();

    // 上传图片到 COS，获取可访问的 URL
    const cloudImageUrls: string[] = [];
    if (feedback.images && feedback.images.length > 0) {
      for (let i = 0; i < feedback.images.length; i++) {
        const cosUrl = await uploadImageToCOS(feedback.images[i], feedbackId, i);
        if (cosUrl) {
          cloudImageUrls.push(cosUrl);
          console.log('[CloudFeedback] 图片上传COS成功:', cosUrl);
        } else {
          console.warn('[CloudFeedback] 图片上传COS失败，保留本地路径');
        }
      }
    }

    // 构建完整的反馈数据
    const cloudFeedback: FeedbackData = {
      feedbackId: feedbackId,
      userIdentifier: identifier,
      userType: userType,
      nickname: (userInfo && userInfo.nickname) || '',
      avatar: (userInfo && userInfo.avatar) || '',
      type: feedback.type,
      typeLabel: feedback.typeLabel,
      content: feedback.content,
      contact: feedback.contact,
      images: feedback.images,
      cloudImageUrls: cloudImageUrls,
      createTime: Date.now(),
      status: 'pending',
      appVersion: sysInfo.version || '',
      phoneModel: sysInfo.model || '',
      systemInfo: `${sysInfo.platform} ${sysInfo.system}`
    };

    // 保存到云数据库
    const db = wx.cloud.database();
    const result = await db.collection(FEEDBACK_COLLECTION).add({
      data: cloudFeedback
    });

    console.log('[CloudFeedback] 反馈已提交到云端', result);

    // 保存到本地记录
    saveFeedbackToLocal(cloudFeedback);

    return { success: true, feedbackId };
  } catch (e: any) {
    console.error('[CloudFeedback] 提交反馈失败', e);
    return { success: false, error: e.message || '提交失败' };
  }
}

/**
 * 获取用户的反馈历史（从本地）
 */
export function getLocalFeedbackHistory(): FeedbackData[] {
  try {
    const raw = wx.getStorageSync('feedback_history');
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('[CloudFeedback] 获取反馈历史失败', e);
  }
  return [];
}

/**
 * 获取用户的反馈历史（从云端）
 */
export async function getFeedbackHistoryFromCloud(): Promise<FeedbackData[]> {
  if (!isCloudAvailable()) {
    return getLocalFeedbackHistory();
  }

  const identifier = getUserIdentifier();
  if (!identifier) {
    return [];
  }

  try {
    const db = wx.cloud.database();
    const result = await db.collection(FEEDBACK_COLLECTION)
      .where({
        userIdentifier: identifier
      })
      .orderBy('createTime', 'desc')
      .limit(50)
      .get();

    return result.data as FeedbackData[];
  } catch (e) {
    console.error('[CloudFeedback] 获取云端反馈历史失败', e);
    return getLocalFeedbackHistory();
  }
}

/**
 * 保存反馈到本地记录
 */
function saveFeedbackToLocal(feedback: FeedbackData): void {
  try {
    const history = getLocalFeedbackHistory();
    history.unshift(feedback);
    // 只保留最近100条
    const trimmed = history.slice(0, 100);
    wx.setStorageSync('feedback_history', JSON.stringify(trimmed));
  } catch (e) {
    console.error('[CloudFeedback] 保存本地反馈记录失败', e);
  }
}

/**
 * 获取反馈的处理状态
 */
export async function getFeedbackStatus(feedbackId: string): Promise<FeedbackStatus | null> {
  if (!isCloudAvailable()) {
    return null;
  }

  try {
    const db = wx.cloud.database();
    const result = await db.collection(FEEDBACK_COLLECTION)
      .where({ feedbackId: feedbackId })
      .limit(1)
      .get();

    if (result.data && result.data.length > 0) {
      return (result.data[0] as FeedbackData).status;
    }
    return null;
  } catch (e) {
    console.error('[CloudFeedback] 获取反馈状态失败', e);
    return null;
  }
}

/**
 * 删除本地反馈记录
 */
export function deleteLocalFeedback(feedbackId: string): void {
  try {
    const history = getLocalFeedbackHistory();
    const filtered = history.filter(f => f.feedbackId !== feedbackId);
    wx.setStorageSync('feedback_history', JSON.stringify(filtered));
  } catch (e) {
    console.error('[CloudFeedback] 删除本地反馈失败', e);
  }
}

/**
 * 清除所有本地反馈记录
 */
export function clearLocalFeedbackHistory(): void {
  try {
    wx.removeStorageSync('feedback_history');
  } catch (e) {
    console.error('[CloudFeedback] 清除本地反馈历史失败', e);
  }
}

/**
 * 反馈类型映射
 */
export const FEEDBACK_TYPE_MAP: Record<FeedbackType, string> = {
  bug: 'Bug反馈',
  suggest: '功能建议',
  error: '内容纠错',
  other: '其他问题'
};

/**
 * 反馈状态映射
 */
export const FEEDBACK_STATUS_MAP: Record<FeedbackStatus, string> = {
  pending: '待处理',
  processing: '处理中',
  resolved: '已解决',
  rejected: '已驳回'
};
