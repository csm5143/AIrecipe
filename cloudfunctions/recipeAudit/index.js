/**
 * 云函数入口：用户菜谱审核管理（后台管理员专用）
 */

const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

// 集合名称
const USER_RECIPES_COLLECTION = 'user_recipes';
const RECIPE_AUDITS_COLLECTION = 'recipe_audits';

exports.main = async (event, context) => {
  const { action, data } = event;
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  try {
    switch (action) {
      case 'getPendingRecipes':
        return await getPendingRecipes(data);
      case 'getProcessedRecipes':
        return await getProcessedRecipes(data);
      case 'getRecipeDetail':
        return await getRecipeDetail(data);
      case 'auditRecipe':
        return await auditRecipe(data);
      default:
        return {
          success: false,
          message: '未知的操作类型'
        };
    }
  } catch (error) {
    console.error('[RecipeAudit] 操作失败:', error);
    return {
      success: false,
      message: '操作失败',
      error: error.message || String(error)
    };
  }
};

// ==================== 获取待审核列表 ====================

async function getPendingRecipes(data) {
  const { page = 1, pageSize = 20 } = data;
  const skip = (page - 1) * pageSize;

  try {
    // 获取待审核总数
    const countResult = await db.collection(USER_RECIPES_COLLECTION)
      .where({ status: 'pending' })
      .count();

    // 获取待审核列表
    const result = await db.collection(USER_RECIPES_COLLECTION)
      .where({ status: 'pending' })
      .orderBy('createdAt', 'asc')
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
    console.error('[RecipeAudit] 获取待审核列表失败:', error);
    throw error;
  }
}

// ==================== 获取已审核列表 ====================

async function getProcessedRecipes(data) {
  const { status, page = 1, pageSize = 20 } = data;
  const skip = (page - 1) * pageSize;

  try {
    let query = db.collection(USER_RECIPES_COLLECTION)
      .where({
        status: db.command.in(['approved', 'rejected'])
      });

    // 获取总数
    let countQuery = db.collection(USER_RECIPES_COLLECTION)
      .where({
        status: db.command.in(['approved', 'rejected'])
      });

    if (status) {
      query = db.collection(USER_RECIPES_COLLECTION)
        .where({ status });
      countQuery = db.collection(USER_RECIPES_COLLECTION)
        .where({ status });
    }

    const countResult = await countQuery.count();

    // 获取列表
    const result = await query
      .orderBy('updatedAt', 'desc')
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
    console.error('[RecipeAudit] 获取已审核列表失败:', error);
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

    const recipe = result.data[0];

    // 获取审核历史
    const auditResult = await db.collection(RECIPE_AUDITS_COLLECTION)
      .where({ recipeId })
      .orderBy('createdAt', 'desc')
      .get();

    return {
      success: true,
      message: '获取成功',
      data: {
        ...recipe,
        auditHistory: auditResult.data
      }
    };
  } catch (error) {
    console.error('[RecipeAudit] 获取菜谱详情失败:', error);
    throw error;
  }
}

// ==================== 审核菜谱 ====================

async function auditRecipe(data) {
  const { recipeId, action, reason, auditorName } = data;

  if (!recipeId) {
    return { success: false, message: '菜谱ID不能为空' };
  }
  if (!action || !['approve', 'reject'].includes(action)) {
    return { success: false, message: '无效的审核操作' };
  }
  if (action === 'reject' && !reason?.trim()) {
    return { success: false, message: '请填写拒绝原因' };
  }

  const now = Date.now();

  try {
    // 查找菜谱
    const recipeResult = await db.collection(USER_RECIPES_COLLECTION)
      .where({ recipeId })
      .limit(1)
      .get();

    if (!recipeResult.data || recipeResult.data.length === 0) {
      return { success: false, message: '菜谱不存在' };
    }

    const recipe = recipeResult.data[0];

    // 检查状态
    if (recipe.status !== 'pending') {
      return { success: false, message: '该菜谱已审核过，请勿重复操作' };
    }

    // 更新菜谱状态
    const updateData: any = {
      status: action === 'approve' ? 'approved' : 'rejected',
      rejectReason: action === 'reject' ? reason.trim() : '',
      updatedAt: now
    };

    if (action === 'approve') {
      updateData.publishedAt = now;
    }

    await db.collection(USER_RECIPES_COLLECTION)
      .doc(recipe._id)
      .update({ data: updateData });

    // 记录审核历史
    await db.collection(RECIPE_AUDITS_COLLECTION).add({
      data: {
        recipeId,
        action,
        reason: reason?.trim() || '',
        auditorName: auditorName || '管理员',
        createdAt: now
      }
    });

    console.log('[RecipeAudit] 审核完成:', recipeId, action);

    return {
      success: true,
      message: action === 'approve' ? '审核通过' : '已拒绝'
    };
  } catch (error) {
    console.error('[RecipeAudit] 审核操作失败:', error);
    throw error;
  }
}
