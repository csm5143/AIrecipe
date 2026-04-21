/**
 * 云函数入口：收藏夹管理
 * 提供收藏夹和收藏记录的CRUD操作
 */

const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

// COS 配置
const COS = require('cos-wx-sdk-v5');
const cos = new COS({
  SecretId: process.env.TENCENT_SECRET_ID || '',
  SecretKey: process.env.TENCENT_SECRET_KEY || '',
});

const COS_BUCKET = process.env.COS_BUCKET || 'dish-1367781796';
const COS_REGION = process.env.COS_REGION || 'ap-guangzhou';
const COS_BASE_URL = `https://${COS_BUCKET}.cos.${COS_REGION}.myqcloud.com`;

// 集合名称
const COLLECTIONS_COLLECTION = 'collections';
const FAVORITES_COLLECTION = 'favorites';
const USERS_COLLECTION = 'users';
const VISITORS_COLLECTION = 'visitors';

exports.main = async (event, context) => {
  const { action, data } = event;
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
      case 'createCollection':
        return await createCollection(openid, data);
      case 'updateCollection':
        return await updateCollection(openid, data);
      case 'deleteCollection':
        return await deleteCollection(openid, data);
      case 'getCollections':
        return await getCollections(openid, data);
      case 'addFavorite':
        return await addFavorite(openid, data);
      case 'removeFavorite':
        return await removeFavorite(openid, data);
      case 'getCollectionFavorites':
        return await getCollectionFavorites(openid, data);
      case 'moveFavorite':
        return await moveFavorite(openid, data);
      case 'batchAddFavorites':
        return await batchAddFavorites(openid, data);
      case 'batchRemoveFavorites':
        return await batchRemoveFavorites(openid, data);
      case 'uploadCollectionCover':
        return await uploadCollectionCover(openid, data);
      case 'autoSetCoverFromFirstRecipe':
        return await autoSetCoverFromFirstRecipe(openid, data);
      default:
        return {
          success: false,
          message: '未知的操作类型'
        };
    }
  } catch (error) {
    console.error('收藏夹操作失败:', error);
    return {
      success: false,
      message: '操作失败',
      error: error.message || String(error)
    };
  }
};

// ==================== 收藏夹操作 ====================

/**
 * 创建收藏夹
 */
async function createCollection(openid, data) {
  const { name, coverImage, description, isDefault } = data;
  const userId = openid;

  if (!name || !name.trim()) {
    return { success: false, message: '收藏夹名称不能为空' };
  }

  try {
    // 检查是否达到上限（最多10个）
    const countResult = await db.collection(COLLECTIONS_COLLECTION)
      .where({ userId })
      .count();
    if (countResult.total >= 10) {
      return { success: false, message: '最多创建10个收藏夹' };
    }

    // 检查名称是否重复
    const nameResult = await db.collection(COLLECTIONS_COLLECTION)
      .where({ userId, name: name.trim() })
      .limit(1)
      .get();
    if (nameResult.data && nameResult.data.length > 0) {
      return { success: false, message: '收藏夹名称已存在' };
    }

    const collectionId = 'col_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10);
    const now = Date.now();

    await db.collection(COLLECTIONS_COLLECTION).add({
      data: {
        collectionId,
        userId,
        name: name.trim(),
        coverImage: coverImage || '',
        description: description || '',
        recipeCount: 0,
        isDefault: isDefault || false,
        sortOrder: countResult.total,
        createdAt: now,
        updatedAt: now
      }
    });

    return {
      success: true,
      message: '收藏夹创建成功',
      collectionId
    };
  } catch (error) {
    throw error;
  }
}

/**
 * 更新收藏夹
 */
async function updateCollection(openid, data) {
  const { collectionId, name, coverImage, description, sortOrder } = data;
  const userId = openid;

  if (!collectionId) {
    return { success: false, message: '收藏夹ID不能为空' };
  }

  try {
    // 检查权限
    const existResult = await db.collection(COLLECTIONS_COLLECTION)
      .where({ collectionId, userId })
      .limit(1)
      .get();

    if (!existResult.data || existResult.data.length === 0) {
      return { success: false, message: '收藏夹不存在或无权限' };
    }

    const record = existResult.data[0];
    const updateData: any = { updatedAt: Date.now() };

    if (name !== undefined) {
      if (!name.trim()) {
        return { success: false, message: '收藏夹名称不能为空' };
      }
      // 检查名称重复
      const nameResult = await db.collection(COLLECTIONS_COLLECTION)
        .where({ userId, name: name.trim() })
        .limit(1)
        .get();
      if (nameResult.data && nameResult.data.length > 0 && nameResult.data[0]._id !== record._id) {
        return { success: false, message: '收藏夹名称已存在' };
      }
      updateData.name = name.trim();
    }

    if (coverImage !== undefined) updateData.coverImage = coverImage;
    if (description !== undefined) updateData.description = description;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;

    await db.collection(COLLECTIONS_COLLECTION)
      .doc(record._id)
      .update({ data: updateData });

    return {
      success: true,
      message: '收藏夹更新成功'
    };
  } catch (error) {
    throw error;
  }
}

/**
 * 删除收藏夹
 */
async function deleteCollection(openid, data) {
  const { collectionId } = data;
  const userId = openid;

  if (!collectionId) {
    return { success: false, message: '收藏夹ID不能为空' };
  }

  try {
    // 检查权限并获取收藏夹信息
    const collectionResult = await db.collection(COLLECTIONS_COLLECTION)
      .where({ collectionId, userId })
      .limit(1)
      .get();

    if (!collectionResult.data || collectionResult.data.length === 0) {
      return { success: false, message: '收藏夹不存在或无权限' };
    }

    const collection = collectionResult.data[0];

    // 默认收藏夹不能删除
    if (collection.isDefault) {
      return { success: false, message: '默认收藏夹不能删除' };
    }

    // 检查是否有菜品
    if (collection.recipeCount > 0) {
      return { success: false, message: '请先移除收藏夹中的菜品' };
    }

    // 删除收藏夹
    await db.collection(COLLECTIONS_COLLECTION)
      .doc(collection._id)
      .remove();

    return {
      success: true,
      message: '收藏夹删除成功'
    };
  } catch (error) {
    throw error;
  }
}

/**
 * 获取用户的收藏夹列表
 */
async function getCollections(openid, data) {
  const { includeFavorites } = data;
  const userId = openid;

  try {
    const result = await db.collection(COLLECTIONS_COLLECTION)
      .where({ userId })
      .orderBy('sortOrder', 'asc')
      .get();

    const collections = result.data;

    // 如果需要包含收藏菜品ID
    if (includeFavorites) {
      const favoritesResult = await db.collection(FAVORITES_COLLECTION)
        .where({ userId })
        .get();
      const favoritesByCollection = new Map();
      for (const fav of favoritesResult.data) {
        if (!favoritesByCollection.has(fav.collectionId)) {
          favoritesByCollection.set(fav.collectionId, []);
        }
        favoritesByCollection.get(fav.collectionId).push(fav.recipeId);
      }

      return {
        success: true,
        data: collections.map(col => ({
          ...col,
          recipeIds: favoritesByCollection.get(col.collectionId) || []
        }))
      };
    }

    return {
      success: true,
      data: collections
    };
  } catch (error) {
    throw error;
  }
}

// ==================== 收藏记录操作 ====================

/**
 * 添加收藏
 */
async function addFavorite(openid, data) {
  const { recipeId, collectionId } = data;
  const userId = openid;

  if (!recipeId || !collectionId) {
    return { success: false, message: '参数不完整' };
  }

  try {
    // 检查收藏夹是否存在且属于该用户
    const collectionResult = await db.collection(COLLECTIONS_COLLECTION)
      .where({ collectionId, userId })
      .limit(1)
      .get();

    if (!collectionResult.data || collectionResult.data.length === 0) {
      return { success: false, message: '收藏夹不存在' };
    }

    // 检查是否已收藏
    const existResult = await db.collection(FAVORITES_COLLECTION)
      .where({ userId, recipeId, collectionId })
      .limit(1)
      .get();

    if (existResult.data && existResult.data.length > 0) {
      return { success: true, message: '已在收藏夹中', alreadyExists: true };
    }

    // 添加收藏
    await db.collection(FAVORITES_COLLECTION).add({
      data: {
        userId,
        recipeId,
        collectionId,
        createdAt: Date.now()
      }
    });

    // 更新收藏夹的菜品数量
    const collection = collectionResult.data[0];
    await db.collection(COLLECTIONS_COLLECTION)
      .doc(collection._id)
      .update({
        data: {
          recipeCount: (collection.recipeCount || 0) + 1,
          updatedAt: Date.now()
        }
      });

    return {
      success: true,
      message: '收藏成功'
    };
  } catch (error) {
    throw error;
  }
}

/**
 * 移除收藏
 */
async function removeFavorite(openid, data) {
  const { recipeId, collectionId } = data;
  const userId = openid;

  if (!recipeId || !collectionId) {
    return { success: false, message: '参数不完整' };
  }

  try {
    // 查找收藏记录
    const favoriteResult = await db.collection(FAVORITES_COLLECTION)
      .where({ userId, recipeId, collectionId })
      .limit(1)
      .get();

    if (!favoriteResult.data || favoriteResult.data.length === 0) {
      return { success: true, message: '未找到收藏记录' };
    }

    const favorite = favoriteResult.data[0];

    // 删除收藏记录
    await db.collection(FAVORITES_COLLECTION)
      .doc(favorite._id)
      .remove();

    // 更新收藏夹的菜品数量
    const collectionResult = await db.collection(COLLECTIONS_COLLECTION)
      .where({ collectionId, userId })
      .limit(1)
      .get();

    if (collectionResult.data && collectionResult.data.length > 0) {
      const collection = collectionResult.data[0];
      const newCount = Math.max(0, (collection.recipeCount || 0) - 1);
      await db.collection(COLLECTIONS_COLLECTION)
        .doc(collection._id)
        .update({
          data: {
            recipeCount: newCount,
            updatedAt: Date.now()
          }
        });
    }

    return {
      success: true,
      message: '取消收藏成功'
    };
  } catch (error) {
    throw error;
  }
}

/**
 * 获取收藏夹的收藏列表
 */
async function getCollectionFavorites(openid, data) {
  const { collectionId } = data;
  const userId = openid;

  if (!collectionId) {
    return { success: false, message: '收藏夹ID不能为空' };
  }

  try {
    const result = await db.collection(FAVORITES_COLLECTION)
      .where({ userId, collectionId })
      .orderBy('createdAt', 'desc')
      .get();

    return {
      success: true,
      data: result.data
    };
  } catch (error) {
    throw error;
  }
}

/**
 * 移动收藏（从一个收藏夹移到另一个）
 */
async function moveFavorite(openid, data) {
  const { recipeId, fromCollectionId, toCollectionId } = data;
  const userId = openid;

  if (!recipeId || !fromCollectionId || !toCollectionId) {
    return { success: false, message: '参数不完整' };
  }

  try {
    // 在新收藏夹中添加
    await addFavorite(openid, { recipeId, collectionId: toCollectionId });

    // 从旧收藏夹中移除
    await removeFavorite(openid, { recipeId, collectionId: fromCollectionId });

    return {
      success: true,
      message: '移动成功'
    };
  } catch (error) {
    throw error;
  }
}

/**
 * 批量添加收藏
 */
async function batchAddFavorites(openid, data) {
  const { favorites } = data; // favorites: Array<{ recipeId, collectionId }>
  const userId = openid;

  if (!favorites || !Array.isArray(favorites) || favorites.length === 0) {
    return { success: false, message: '参数不完整' };
  }

  let successCount = 0;

  try {
    for (const fav of favorites) {
      try {
        const { recipeId, collectionId } = fav;

        // 检查收藏夹
        const collectionResult = await db.collection(COLLECTIONS_COLLECTION)
          .where({ collectionId, userId })
          .limit(1)
          .get();

        if (!collectionResult.data || collectionResult.data.length === 0) {
          continue;
        }

        // 检查是否已存在
        const existResult = await db.collection(FAVORITES_COLLECTION)
          .where({ userId, recipeId, collectionId })
          .limit(1)
          .get();

        if (existResult.data && existResult.data.length > 0) {
          successCount++;
          continue;
        }

        // 添加
        await db.collection(FAVORITES_COLLECTION).add({
          data: {
            userId,
            recipeId,
            collectionId,
            createdAt: Date.now()
          }
        });

        // 更新数量
        const collection = collectionResult.data[0];
        await db.collection(COLLECTIONS_COLLECTION)
          .doc(collection._id)
          .update({
            data: {
              recipeCount: (collection.recipeCount || 0) + 1,
              updatedAt: Date.now()
            }
          });

        successCount++;
      } catch (e) {
        console.error('[Collections] 批量添加失败，跳过', fav, e);
      }
    }

    return {
      success: true,
      message: `批量添加完成：${successCount}/${favorites.length}`,
      successCount
    };
  } catch (error) {
    throw error;
  }
}

/**
 * 批量移除收藏
 */
async function batchRemoveFavorites(openid, data) {
  const { favorites } = data; // favorites: Array<{ recipeId, collectionId }>
  const userId = openid;

  if (!favorites || !Array.isArray(favorites) || favorites.length === 0) {
    return { success: false, message: '参数不完整' };
  }

  let successCount = 0;

  try {
    for (const fav of favorites) {
      try {
        const { recipeId, collectionId } = fav;

        // 查找并删除
        const favoriteResult = await db.collection(FAVORITES_COLLECTION)
          .where({ userId, recipeId, collectionId })
          .limit(1)
          .get();

        if (favoriteResult.data && favoriteResult.data.length > 0) {
          await db.collection(FAVORITES_COLLECTION)
            .doc(favoriteResult.data[0]._id)
            .remove();

          // 更新数量
          const collectionResult = await db.collection(COLLECTIONS_COLLECTION)
            .where({ collectionId, userId })
            .limit(1)
            .get();

          if (collectionResult.data && collectionResult.data.length > 0) {
            const collection = collectionResult.data[0];
            const newCount = Math.max(0, (collection.recipeCount || 0) - 1);
            await db.collection(COLLECTIONS_COLLECTION)
              .doc(collection._id)
              .update({
                data: {
                  recipeCount: newCount,
                  updatedAt: Date.now()
                }
              });
          }

          successCount++;
        }
      } catch (e) {
        console.error('[Collections] 批量删除失败，跳过', fav, e);
      }
    }

    return {
      success: true,
      message: `批量删除完成：${successCount}/${favorites.length}`,
      successCount
    };
  } catch (error) {
    throw error;
  }
}

// ==================== 封面操作 ====================

/**
 * 上传收藏夹封面到COS
 */
async function uploadCollectionCover(openid, data) {
  const { collectionId, filePath } = data;
  const userId = openid;

  if (!collectionId || !filePath) {
    return { success: false, message: '参数不完整' };
  }

  try {
    // 检查权限
    const collectionResult = await db.collection(COLLECTIONS_COLLECTION)
      .where({ collectionId, userId })
      .limit(1)
      .get();

    if (!collectionResult.data || collectionResult.data.length === 0) {
      return { success: false, message: '收藏夹不存在或无权限' };
    }

    // 上传到COS
    const cloudPath = `collection-covers/${userId}/${collectionId}/${Date.now()}.jpg`;
    
    return new Promise((resolve, reject) => {
      cos.uploadFile({
        Bucket: COS_BUCKET,
        Region: COS_REGION,
        Key: cloudPath,
        FilePath: filePath,
        SuccessAction: 'allow',
        onProgress: function(progressData) {
          console.log('[COS] 上传进度:', progressData.percent);
        }
      }, function(err, data) {
        if (err) {
          console.error('[COS] 上传失败:', err);
          reject(err);
          return;
        }
        
        const fileID = `cloud://${COS_BUCKET}.cos.${COS_REGION}.myqcloud.com/${cloudPath}`;
        console.log('[COS] 上传成功:', fileID);
        
        resolve({
          success: true,
          url: fileID,
          message: '封面上传成功'
        });
      });
    });
  } catch (error) {
    console.error('[Collections] 上传封面失败:', error);
    throw error;
  }
}

/**
 * 自动设置收藏夹封面（使用第一道菜的图片）
 */
async function autoSetCoverFromFirstRecipe(openid, data) {
  const { collectionId } = data;
  const userId = openid;

  if (!collectionId) {
    return { success: false, message: '收藏夹ID不能为空' };
  }

  try {
    // 检查收藏夹是否存在
    const collectionResult = await db.collection(COLLECTIONS_COLLECTION)
      .where({ collectionId, userId })
      .limit(1)
      .get();

    if (!collectionResult.data || collectionResult.data.length === 0) {
      return { success: false, message: '收藏夹不存在' };
    }

    const collection = collectionResult.data[0];
    
    // 如果已有封面，跳过
    if (collection.coverImage && collection.coverImage.trim() !== '') {
      return { 
        success: true, 
        message: '收藏夹已有封面',
        hasCover: true,
        coverImage: collection.coverImage
      };
    }

    // 获取收藏夹中的第一个菜谱
    const favoritesResult = await db.collection(FAVORITES_COLLECTION)
      .where({ userId, collectionId })
      .orderBy('createdAt', 'asc')
      .limit(1)
      .get();

    if (!favoritesResult.data || favoritesResult.data.length === 0) {
      return { success: false, message: '收藏夹为空，无法设置封面' };
    }

    const firstFavorite = favoritesResult.data[0];
    const recipeId = firstFavorite.recipeId;

    // 从 recipes 集合获取菜谱信息
    const recipesResult = await db.collection('recipes')
      .where({ _id: recipeId })
      .limit(1)
      .get();

    if (!recipesResult.data || recipesResult.data.length === 0) {
      return { success: false, message: '未找到菜谱信息' };
    }

    const recipe = recipesResult.data[0];
    const coverImage = recipe.coverImage || recipe.cover || '';

    if (!coverImage) {
      return { success: false, message: '该菜谱没有封面图片' };
    }

    // 更新收藏夹封面
    await db.collection(COLLECTIONS_COLLECTION)
      .doc(collection._id)
      .update({
        data: {
          coverImage: coverImage,
          updatedAt: Date.now()
        }
      });

    return {
      success: true,
      message: '封面设置成功',
      coverImage: coverImage
    };
  } catch (error) {
    console.error('[Collections] 自动设置封面失败:', error);
    throw error;
  }
}
