/**
 * 云函数入口：微信登录 + 手机号绑定
 * 核心功能：
 * 1. 获取用户 openid
 * 2. 通过手机号 code 获取手机号并绑定
 * 3. 一个微信一个账号（手机号 + openid 双重绑定）
 */

const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

exports.main = async (event, context) => {
  const { code, phoneCode } = event;
  
  try {
    // 1. 通过云函数上下文获取 openid（云开发环境自动获取）
    const wxContext = cloud.getWXContext();
    const openid = wxContext.OPENID;
    const unionid = wxContext.UNIONID || null;

    if (!openid) {
      return {
        success: false,
        error: '无法获取用户身份'
      };
    }

    let phoneNumber = null;
    
    // 2. 如果有手机号 code，则获取手机号
    if (phoneCode) {
      try {
        // 调用微信手机号获取接口
        // 方式一：使用云开发自带的能力（需要云开发控制台开通手机号功能）
        const phoneResult = await cloud.getPhoneNumber({
          code: phoneCode
        });
        
        if (phoneResult && phoneResult.data) {
          phoneNumber = phoneResult.data.phoneNumber;
          console.log('[Login] 获取手机号成功:', phoneNumber);
        }
      } catch (phoneErr) {
        console.warn('[Login] 获取手机号失败（非必选）:', phoneErr.message || phoneErr);
        // 手机号获取失败不影响登录，继续使用 openid 登录
      }
    }

    // 3. 查询或创建用户记录
    let userRecord = null;
    let isNewUser = false;

    // 优先通过手机号查找用户
    if (phoneNumber) {
      const phoneUser = await db.collection('users')
        .where({ phoneNumber: phoneNumber })
        .limit(1)
        .get();
      
      if (phoneUser.data && phoneUser.data.length > 0) {
        userRecord = phoneUser.data[0];
        console.log('[Login] 通过手机号找到用户:', userRecord._id);
      }
    }

    // 如果没通过手机号找到，通过 openid 查找
    if (!userRecord) {
      const openidUser = await db.collection('users')
        .where({ identifier: openid })
        .limit(1)
        .get();
      
      if (openidUser.data && openidUser.data.length > 0) {
        userRecord = openidUser.data[0];
        console.log('[Login] 通过 openid 找到用户:', userRecord._id);
      }
    }

    // 4. 创建或更新用户记录
    const now = Date.now();
    
    if (userRecord) {
      // 更新已有用户
      const updateData = {
        lastLoginTime: now,
        loginCount: (userRecord.loginCount || 0) + 1
      };
      
      // 如果有新手机号，更新手机号绑定
      if (phoneNumber && !userRecord.phoneNumber) {
        updateData.phoneNumber = phoneNumber;
      }
      
      // 如果有新 openid，更新 identifier
      if (openid && userRecord.identifier !== openid) {
        updateData.identifier = openid;
      }
      
      await db.collection('users').doc(userRecord._id).update({
        data: updateData
      });
      
      userRecord = {
        ...userRecord,
        ...updateData
      };
      
      console.log('[Login] 更新用户信息成功:', userRecord._id);
      
    } else {
      // 创建新用户
      const newUser = {
        identifier: openid,
        unionid: unionid,
        phoneNumber: phoneNumber,
        userType: phoneNumber ? 'user' : 'temp',
        nickname: '',
        avatar: '',
        createTime: now,
        lastLoginTime: now,
        loginCount: 1,
        status: 'active'
      };
      
      const addResult = await db.collection('users').add({
        data: newUser
      });
      
      userRecord = {
        _id: addResult._id,
        ...newUser
      };
      
      isNewUser = true;
      console.log('[Login] 创建新用户成功:', addResult._id);
    }

    // 5. 生成简单的会话标识（用于后续 API 验证）
    // 在生产环境中应使用 JWT，这里使用简化的 token 方案
    const sessionToken = generateSessionToken(openid, userRecord._id, now);

    // 6. 返回登录结果
    return {
      success: true,
      openid: openid,
      unionid: unionid,
      phoneNumber: phoneNumber,
      isNewUser: isNewUser,
      token: sessionToken,
      userId: userRecord._id,
      userType: userRecord.userType
    };

  } catch (error) {
    console.error('[Login] 登录失败:', error);
    return {
      success: false,
      error: error.message || '登录失败'
    };
  }
};

/**
 * 生成会话 Token
 * 注意：这是简化实现，生产环境应使用 JWT 或服务端会话
 */
function generateSessionToken(openid: string, userId: string, timestamp: number): string {
  // 使用简单的 Base64 编码（生产环境应使用加密）
  const payload = `${openid}:${userId}:${timestamp}`;
  const base64 = Buffer.from(payload).toString('base64');
  return base64;
}
