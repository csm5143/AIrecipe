/**
 * 云函数入口：提交用户反馈
 * 将反馈数据存储到云数据库，支持图片上传到云存储
 */

const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

// 集合名称
const FEEDBACK_COLLECTION = 'feedback';

// 云存储基础URL
const COS_BASE_URL = 'https://dish-1367781796.cos.ap-guangzhou.myqcloud.com';

exports.main = async (event, context) => {
  const { action, data } = event;

  // 获取用户身份
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  try {
    switch (action) {
      case 'submit':
        return await submitFeedback(openid, data);
      
      case 'getHistory':
        return await getFeedbackHistory(openid, data);
      
      case 'getStatus':
        return await getFeedbackStatus(openid, data);
      
      case 'delete':
        return await deleteFeedback(openid, data);
      
      default:
        return {
          success: false,
          message: '未知的操作类型'
        };
    }
  } catch (error) {
    console.error('反馈操作失败:', error);
    return {
      success: false,
      message: '操作失败',
      error: error.message || String(error)
    };
  }
};

/**
 * 提交反馈
 * images 现在接收 COS URL 链接（由前端上传后传入）
 */
async function submitFeedback(openid, data) {
  const { 
    feedbackId,
    type,
    typeLabel,
    content,
    contact,
    images,         // 云存储文件ID数组（可以是 COS URL 或云存储fileID）
    isVisitor,
    anonymousId,
    nickname,
    avatar,
    appVersion,
    phoneModel,
    systemInfo
  } = data;

  // 验证必填字段
  if (!type || !content) {
    return {
      success: false,
      message: '缺少必填字段'
    };
  }

  // 生成唯一反馈ID
  const fbId = feedbackId || `fb_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  
  const userIdentifier = isVisitor ? anonymousId : openid;
  const userType = isVisitor ? 'visitor' : 'user';

  // 处理图片链接：如果是云存储fileID，转换为COS URL
  let processedImages = [];
  if (images && Array.isArray(images)) {
    processedImages = images.map(img => {
      // 如果已经是完整URL，直接使用
      if (img.startsWith('http')) {
        return img;
      }
      // 如果是云存储fileID，拼接基���URL
      return `${COS_BASE_URL}/${img}`;
    });
  }

  const feedbackData = {
    feedbackId: fbId,
    userIdentifier: userIdentifier,
    userType: userType,
    nickname: nickname || '',
    avatar: avatar || '',
    type: type,
    typeLabel: typeLabel || '',
    content: content,
    contact: contact || '',
    images: processedImages,
    createTime: Date.now(),
    status: 'pending',
    appVersion: appVersion || '',
    phoneModel: phoneModel || '',
    systemInfo: systemInfo || '',
    // 管理端可见字段
    adminReply: '',
    adminReplyTime: null,
    adminNote: ''
  };

  try {
    const result = await db.collection(FEEDBACK_COLLECTION)
      .add({
        data: feedbackData
      });

    return {
      success: true,
      message: '反馈提交成功',
      feedbackId: fbId,
      _id: result._id
    };
  } catch (error) {
    throw error;
  }
}

/**
 * 获取反馈历史
 */
async function getFeedbackHistory(openid, data) {
  const { isVisitor, anonymousId, page = 1, pageSize = 20 } = data;
  const userIdentifier = isVisitor ? anonymousId : openid;

  if (!userIdentifier) {
    return {
      success: false,
      message: '用户未登录'
    };
  }

  try {
    const skip = (page - 1) * pageSize;
    
    // 获取总数
    const countResult = await db.collection(FEEDBACK_COLLECTION)
      .where({ userIdentifier: userIdentifier })
      .count();

    // 获取列表
    const result = await db.collection(FEEDBACK_COLLECTION)
      .where({ userIdentifier: userIdentifier })
      .orderBy('createTime', 'desc')
      .skip(skip)
      .limit(pageSize)
      .get();

    return {
      success: true,
      data: {
        list: result.data,
        total: countResult.total,
        page: page,
        pageSize: pageSize,
        hasMore: skip + result.data.length < countResult.total
      }
    };
  } catch (error) {
    throw error;
  }
}

/**
 * 获取单条反馈状态
 */
async function getFeedbackStatus(openid, data) {
  const { feedbackId, isVisitor, anonymousId } = data;
  const userIdentifier = isVisitor ? anonymousId : openid;

  if (!feedbackId) {
    return {
      success: false,
      message: '缺少反馈ID'
    };
  }

  try {
    const result = await db.collection(FEEDBACK_COLLECTION)
      .where({ 
        feedbackId: feedbackId,
        userIdentifier: userIdentifier
      })
      .limit(1)
      .get();

    if (result.data && result.data.length > 0) {
      return {
        success: true,
        data: result.data[0]
      };
    }

    return {
      success: false,
      message: '未找到该反馈'
    };
  } catch (error) {
    throw error;
  }
}

/**
 * 删除反馈（仅能删除自己的反馈，且状态为待处理时）
 */
async function deleteFeedback(openid, data) {
  const { feedbackId, isVisitor, anonymousId } = data;
  const userIdentifier = isVisitor ? anonymousId : openid;

  if (!userIdentifier) {
    return {
      success: false,
      message: '用户未登录'
    };
  }

  if (!feedbackId) {
    return {
      success: false,
      message: '缺少反馈ID'
    };
  }

  try {
    // 先查询该反馈是否存在且属于当前用户
    const existResult = await db.collection(FEEDBACK_COLLECTION)
      .where({ 
        feedbackId: feedbackId,
        userIdentifier: userIdentifier
      })
      .limit(1)
      .get();

    if (!existResult.data || existResult.data.length === 0) {
      return {
        success: false,
        message: '未找到该反馈或无权删除'
      };
    }

    const record = existResult.data[0];
    
    // 仅能删除待处理的反馈
    if (record.status !== 'pending') {
      return {
        success: false,
        message: '只能删除待处理的反馈'
      };
    }

    // 删除记录
    await db.collection(FEEDBACK_COLLECTION)
      .doc(record._id)
      .remove();

    return {
      success: true,
      message: '反馈已删除'
    };
  } catch (error) {
    throw error;
  }
}
