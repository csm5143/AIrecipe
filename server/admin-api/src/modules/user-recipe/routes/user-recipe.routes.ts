import { Router } from 'express';
import { asyncHandler } from '../../../utils/helper';
import {
  submitRecipe,
  getMyRecipes,
  getCommunityRecipes,
  getRecipeDetail,
  deleteMyRecipe,
  toggleLike,
  increaseViewCount
} from '../controllers/user-recipe.controller';

const router = Router();

// 提交菜谱（需登录）
router.post('/', asyncHandler(submitRecipe));

// 获取我的上传列表
router.get('/my', asyncHandler(getMyRecipes));

// 获取社区菜谱列表
router.get('/community', asyncHandler(getCommunityRecipes));

// 获取菜谱详情
router.get('/:id', asyncHandler(getRecipeDetail));

// 删除我的菜谱
router.delete('/:id', asyncHandler(deleteMyRecipe));

// 点赞/取消点赞
router.post('/:id/like', asyncHandler(toggleLike));

// 增加浏览量
router.post('/:id/view', asyncHandler(increaseViewCount));

export default router;
