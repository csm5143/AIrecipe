/**
 * 云函数入口：用户上传菜谱管理
 * 提供菜谱提交、获取、审核、点赞等操作
 */

const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

// 集合名称
const USER_RECIPES_COLLECTION = 'user_recipes';
const RECIPE_AUDITS_COLLECTION = 'recipe_audits';
const USER_RECIPE_LIKES_COLLECTION = 'user_recipe_likes';

exports.main = async (event, context) => {
  const { action, data } = event;
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  try {
    switch (action) {
      case 'submitRecipe':
        return await submitRecipe(openid, data);
      case 'getMyRecipes':
        return await getMyRecipes(openid, data);
      case 'getCommunityRecipes':
        return await getCommunityRecipes(data);
      case 'getRecipeDetail':
        return await getRecipeDetail(data);
      case 'deleteMyRecipe':
        return await deleteMyRecipe(openid, data);
      case 'toggleLike':
        return await toggleLike(openid, data);
      case 'increaseViewCount':
        return await increaseViewCount(data);
      default:
        return {
          success: false,
          message: '未知的操作类型'
        };
    }
  } catch (error) {
    console.error('[UserRecipe] 操作失败:', error);
    return {
      success: false,
      message: '操作失败',
      error: error.message || String(error)
    };
  }
};

// ==================== 提交菜谱 ====================

async function submitRecipe(openid, data) {
  if (!openid) {
    return { success: false, message: '无法获取用户身份' };
  }

  const { title, coverImage, description, difficulty, cookingTime, servings, ingredients, steps, tips, tags, mealTimes, dishTypes, nickname, avatar } = data;

  // 验证必填字段
  if (!title?.trim()) {
    return { success: false, message: '请输入菜谱标题' };
  }
  if (!coverImage) {
    return { success: false, message: '请上传封面图片' };
  }
  if (!ingredients || ingredients.length === 0) {
    return { success: false, message: '请添加食材' };
  }
  if (!steps || steps.length === 0) {
    return { success: false, message: '请添加制作步骤' };
  }

  const now = Date.now();
  const recipeId = 'ur_' + now + '_' + Math.random().toString(36).substring(2, 10);

  const recipeData = {
    recipeId,
    openid,
    nickname: nickname || '美食爱好者',
    avatar: avatar || '',
    title: title.trim(),
    coverImage,
    description: description || '',
    difficulty: difficulty || 'normal',
    cookingTime: parseInt(cookingTime) || 30,
    servings: parseInt(servings) || 2,
    ingredients: ingredients.filter(i => i.name?.trim()),
    steps: steps.filter(s => s.description?.trim()),
    tips: tips || '',
    tags: tags || [],
    mealTimes: mealTimes || [],
    dishTypes: dishTypes || [],
    status: 'pending',
    viewCount: 0,
    likeCount: 0,
    createdAt: now,
    updatedAt: now
  };

  try {
    await db.collection(USER_RECIPES_COLLECTION).add({
      data: recipeData
    });

    console.log('[UserRecipe] 菜谱提交成功:', recipeId);

    return {
      success: true,
      message: '提交成功，等待审核',
      recipeId
    };
  } catch (error) {
    console.error('[UserRecipe] 菜谱提交失败:', error);
    throw error;
  }
}

// ==================== 获取我的菜谱 ====================

async function getMyRecipes(openid, data) {
  if (!openid) {
    return { success: false, message: '无法获取用户身份' };
  }

  const { status, page = 1, pageSize = 20 } = data;
  const skip = (page - 1) * pageSize;

  try {
    let query = db.collection(USER_RECIPES_COLLECTION)
      .where({ openid })
      .orderBy('createdAt', 'desc');

    if (status) {
      query = query.where({ openid, status });
    }

    // 获取总数
    const countResult = await query.count();

    // 获取列表
    const result = await query
      .skip(skip)
      .limit(pageSize)
      .get();

    return {
      success: true,
      message: '获取成功',
      data: result.data,
      total: countResult.total,
      hasMore: skip + result.data.length < countResult.total
    };
  } catch (error) {
    console.error('[UserRecipe] 获取我的菜谱失败:', error);
    throw error;
  }
}

// ==================== 获取社区菜谱 ====================

async function getCommunityRecipes(data) {
  const { page = 1, pageSize = 20, mealTime } = data;
  const skip = (page - 1) * pageSize;

  try {
    let query = db.collection(USER_RECIPES_COLLECTION)
      .where({ status: 'approved' })
      .orderBy('publishedAt', 'desc');

    // 获取总数
    let countQuery = db.collection(USER_RECIPES_COLLECTION)
      .where({ status: 'approved' });

    const countResult = await countQuery.count();

    // 获取列表
    const result = await query
      .skip(skip)
      .limit(pageSize)
      .get();

    return {
      success: true,
      message: '获取成功',
      data: result.data,
      total: countResult.total,
      hasMore: skip + result.data.length < countResult.total
    };
  } catch (error) {
    console.error('[UserRecipe] 获取社区菜谱失败:', error);
    throw error;
  }
}

// ==================== 获取菜谱详情 ====================

async function getRecipeDetail(data) {
  const { recipeId } = data;

  if (!recipeId) {
    return { success: false, message: '菜谱ID不能为空' };
  }

  try {
    const result = await db.collection(USER_RECIPES_COLLECTION)
      .where({ recipeId })
      .limit(1)
      .get();

    if (!result.data || result.data.length === 0) {
      return { success: false, message: '菜谱不存在' };
    }

    return {
      success: true,
      message: '获取成功',
      data: result.data[0]
    };
  } catch (error) {
    console.error('[UserRecipe] 获取菜谱详情失败:', error);
    throw error;
  }
}

// ==================== 删除我的菜谱 ====================

async function deleteMyRecipe(openid, data) {
  if (!openid) {
    return { success: false, message: '无法获取用户身份' };
  }

  const { recipeId } = data;

  if (!recipeId) {
    return { success: false, message: '菜谱ID不能为空' };
  }

  try {
    // 查找菜谱
    const result = await db.collection(USER_RECIPES_COLLECTION)
      .where({ recipeId, openid })
      .limit(1)
      .get();

    if (!result.data || result.data.length === 0) {
      return { success: false, message: '菜谱不存在或无权限删除' };
    }

    const recipe = result.data[0];

    // 只能删除待审核或已拒绝的菜谱
    if (recipe.status === 'approved') {
      return { success: false, message: '已通过的菜谱不能删除' };
    }

    // 删除菜谱
    await db.collection(USER_RECIPES_COLLECTION)
      .doc(recipe._id)
      .remove();

    // 删除相关的点赞记录
    const likesResult = await db.collection(USER_RECIPE_LIKES_COLLECTION)
      .where({ recipeId })
      .get();

    if (likesResult.data && likesResult.data.length > 0) {
      for (const like of likesResult.data) {
        await db.collection(USER_RECIPE_LIKES_COLLECTION)
          .doc(like._id)
          .remove();
      }
    }

    return {
      success: true,
      message: '删除成功'
    };
  } catch (error) {
    console.error('[UserRecipe] 删除菜谱失败:', error);
    throw error;
  }
}

// ==================== 点赞/取消点赞 ====================

async function toggleLike(openid, data) {
  if (!openid) {
    return { success: false, message: '无法获取用户身份' };
  }

  const { recipeId } = data;

  if (!recipeId) {
    return { success: false, message: '菜谱ID不能为空' };
  }

  try {
    // 检查是否已点赞
    const existResult = await db.collection(USER_RECIPE_LIKES_COLLECTION)
      .where({ recipeId, openid })
      .limit(1)
      .get();

    let liked = false;
    let newLikeCount = 0;

    // 查找菜谱
    const recipeResult = await db.collection(USER_RECIPES_COLLECTION)
      .where({ recipeId })
      .limit(1)
      .get();

    if (!recipeResult.data || recipeResult.data.length === 0) {
      return { success: false, message: '菜谱不存在' };
    }

    const recipe = recipeResult.data[0];
    newLikeCount = recipe.likeCount || 0;

    if (existResult.data && existResult.data.length > 0) {
      // 取消点赞
      await db.collection(USER_RECIPE_LIKES_COLLECTION)
        .doc(existResult.data[0]._id)
        .remove();

      newLikeCount = Math.max(0, newLikeCount - 1);
      liked = false;
    } else {
      // 添加点赞
      await db.collection(USER_RECIPE_LIKES_COLLECTION).add({
        data: {
          recipeId,
          openid,
          createdAt: Date.now()
        }
      });

      newLikeCount = newLikeCount + 1;
      liked = true;
    }

    // 更新菜谱点赞数
    await db.collection(USER_RECIPES_COLLECTION)
      .doc(recipe._id)
      .update({
        data: { likeCount: newLikeCount }
      });

    return {
      success: true,
      message: liked ? '点赞成功' : '取消点赞',
      liked,
      likeCount: newLikeCount
    };
  } catch (error) {
    console.error('[UserRecipe] 点赞操作失败:', error);
    throw error;
  }
}

// ==================== 增加浏览量 ====================

async function increaseViewCount(data) {
  const { recipeId } = data;

  if (!recipeId) {
    return { success: false, message: '菜谱ID不能为空' };
  }

  try {
    const result = await db.collection(USER_RECIPES_COLLECTION)
      .where({ recipeId })
      .limit(1)
      .get();

    if (!result.data || result.data.length === 0) {
      return { success: false, message: '菜谱不存在' };
    }

    const recipe = result.data[0];
    const newViewCount = (recipe.viewCount || 0) + 1;

    await db.collection(USER_RECIPES_COLLECTION)
      .doc(recipe._id)
      .update({
        data: { viewCount: newViewCount }
      });

    return {
      success: true,
      message: '浏览量增加成功',
      viewCount: newViewCount
    };
  } catch (error) {
    console.error('[UserRecipe] 增加浏览量失败:', error);
    throw error;
  }
}
