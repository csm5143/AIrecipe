/**
 * 云函数入口：微信登录
 * 获取用户 openid
 */

const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

exports.main = async (event, context) => {
  try {
    // 通过云函数上下文获取 openid
    const wxContext = cloud.getWXContext();
    const openid = wxContext.OPENID;

    if (!openid) {
      return {
        success: false,
        message: '无法获取用户身份'
      };
    }

    // 查询是否为已注册用户
    const existUser = await db.collection('users')
      .where({ identifier: openid })
      .limit(1)
      .get();

    return {
      success: true,
      openid: openid,
      isNewUser: !(existUser.data && existUser.data.length > 0)
    };

  } catch (error) {
    console.error('获取 openid 失败:', error);
    return {
      success: false,
      message: error.message || '获取失败'
    };
  }
};