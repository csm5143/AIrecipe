/**
 * 云函数入口：存储用户数据
 * 支持批量更新用户的收藏、小菜篮、健身目标等数据
 */

const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

// 集合名称
const USERS_COLLECTION = 'users';
const VISITORS_COLLECTION = 'visitors';

exports.main = async (event, context) => {
  const { action, data } = event;

  // 获取用户身份
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  if (!openid) {
    return {
      success: false,
      message: '无法获取用户身份'
    };
  }

  try {
    switch (action) {
      case 'saveFavorites':
        return await saveFavorites(openid, data);
      case 'saveCollections':
        return await saveCollections(openid, data);
      case 'saveBasket':
        return await saveBasket(openid, data);
      case 'saveFitnessGoal':
        return await saveFitnessGoal(openid, data);
      case 'saveChildrenStage':
        return await saveChildrenStage(openid, data);
      case 'getUserData':
        return await getUserData(openid, data);
      case 'saveUserProfile':
        return await saveUserProfile(openid, data);
      case 'mergeData':
        return await mergeUserData(openid, data);
      case 'syncAll':
        return await syncAllUserData(openid, data);
      default:
        return {
          success: false,
          message: '未知的操作类型'
        };
    }
  } catch (error) {
    console.error('用户数据操作失败:', error);
    return {
      success: false,
      message: '操作失败',
      error: error.message || String(error)
    };
  }
};

/**
 * 保存收藏列表（旧版兼容）
 */
async function saveFavorites(openid, data) {
  const { favorites, isVisitor } = data;
  const collectionName = isVisitor ? VISITORS_COLLECTION : USERS_COLLECTION;
  const identifier = isVisitor ? data.anonymousId : openid;

  return await updateOrCreateRecord(collectionName, identifier, {
    favorites: favorites || [],
    favoritesUpdatedAt: Date.now()
  });
}

/**
 * 保存收藏夹列表
 */
async function saveCollections(openid, data) {
  const { collections, isVisitor } = data;
  const collectionName = isVisitor ? VISITORS_COLLECTION : USERS_COLLECTION;
  const identifier = isVisitor ? data.anonymousId : openid;

  try {
    // 查询用户现有收藏夹
    const existResult = await db.collection(collectionName)
      .where({ identifier: identifier })
      .limit(1)
      .get();

    const updateData = {
      collections: collections || [],
      collectionsUpdatedAt: Date.now()
    };

    if (existResult.data && existResult.data.length > 0) {
      // 更新
      await db.collection(collectionName)
        .doc(existResult.data[0]._id)
        .update({
          data: updateData
        });
    } else {
      // 创建
      await db.collection(collectionName).add({
        data: {
          identifier: identifier,
          ...updateData,
          createdAt: Date.now()
        }
      });
    }

    return {
      success: true,
      message: '收藏夹保存成功'
    };
  } catch (error) {
    throw error;
  }
}

/**
 * 保存小菜篮数据
 */
async function saveBasket(openid, data) {
  const { basket, isVisitor } = data;
  const collectionName = isVisitor ? VISITORS_COLLECTION : USERS_COLLECTION;
  const identifier = isVisitor ? data.anonymousId : openid;

  return await updateOrCreateRecord(collectionName, identifier, {
    basket: basket || {},
    basketUpdatedAt: Date.now()
  });
}

/**
 * 保存健身目标
 */
async function saveFitnessGoal(openid, data) {
  const { goal, isVisitor } = data;
  const collectionName = isVisitor ? VISITORS_COLLECTION : USERS_COLLECTION;
  const identifier = isVisitor ? data.anonymousId : openid;

  return await updateOrCreateRecord(collectionName, identifier, {
    fitnessGoal: goal || {},
    fitnessGoalUpdatedAt: Date.now()
  });
}

/**
 * 保存儿童阶段信息
 */
async function saveChildrenStage(openid, data) {
  const { stage, isVisitor } = data;
  const collectionName = isVisitor ? VISITORS_COLLECTION : USERS_COLLECTION;
  const identifier = isVisitor ? data.anonymousId : openid;

  return await updateOrCreateRecord(collectionName, identifier, {
    childrenStage: stage || {},
    childrenStageUpdatedAt: Date.now()
  });
}

/**
 * 获取用户数据
 */
async function getUserData(openid, data) {
  const { isVisitor } = data;
  const collectionName = isVisitor ? VISITORS_COLLECTION : USERS_COLLECTION;
  const identifier = isVisitor ? data.anonymousId : openid;

  try {
    const result = await db.collection(collectionName)
      .where({ identifier: identifier })
      .limit(1)
      .get();

    if (result.data && result.data.length > 0) {
      return {
        success: true,
        data: result.data[0]
      };
    }

    return {
      success: true,
      data: null,
      message: '暂无数据'
    };
  } catch (error) {
    throw error;
  }
}

/**
 * 保存用户资料
 */
async function saveUserProfile(openid, data) {
  const { nickname, avatar, isVisitor } = data;
  const collectionName = isVisitor ? VISITORS_COLLECTION : USERS_COLLECTION;
  const identifier = isVisitor ? data.anonymousId : openid;

  return await updateOrCreateRecord(collectionName, identifier, {
    nickname: nickname || '',
    avatar: avatar || '',
    profileUpdatedAt: Date.now()
  });
}

/**
 * 合并用户数据（用于数据迁移）
 */
async function mergeUserData(openid, data) {
  const { mergeData, isVisitor } = data;
  const collectionName = isVisitor ? VISITORS_COLLECTION : USERS_COLLECTION;
  const identifier = isVisitor ? data.anonymousId : openid;

  return await updateOrCreateRecord(collectionName, identifier, {
    ...mergeData,
    mergedAt: Date.now()
  });
}

/**
 * 更新或创建记录
 */
async function updateOrCreateRecord(collectionName, identifier, updateData) {
  try {
    // 查询是否存在记录
    const existResult = await db.collection(collectionName)
      .where({ identifier: identifier })
      .limit(1)
      .get();

    const now = Date.now();

    if (existResult.data && existResult.data.length > 0) {
      // 更新现有记录
      const recordId = existResult.data[0]._id;
      await db.collection(collectionName)
        .doc(recordId)
        .update({
          data: {
            ...updateData,
            updatedAt: now
          }
        });

      return {
        success: true,
        message: '数据已更新',
        isNew: false
      };
    } else {
      // 创建新记录
      await db.collection(collectionName)
        .add({
          data: {
            identifier: identifier,
            ...updateData,
            createdAt: now,
            updatedAt: now
          }
        });

      return {
        success: true,
        message: '数据已创建',
        isNew: true
      };
    }
  } catch (error) {
    throw error;
  }
}
