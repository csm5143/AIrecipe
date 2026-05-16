import { Router, Router as ExpressRouter } from 'express';
import { asyncHandler } from '../../../utils/helper';
import {
  getFeaturedRecipes,
  addFeaturedRecipe,
  removeFeaturedRecipe,
  updateFeaturedWeight,
  batchUpdateWeight,
  getHotRecipes,
  toggleHot,
  batchToggleHot,
  searchRecipesForAdmin,
  getAllRecipesForHot,
} from '../controllers/featured.controller';
import { authenticate, authorize } from '../../auth/middleware/auth.middleware';

const router: ExpressRouter = Router();
router.use(asyncHandler(authenticate));

// 精选菜谱
router.get('/', asyncHandler(authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUDITOR')), asyncHandler(getFeaturedRecipes));
router.post('/', asyncHandler(authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR')), asyncHandler(addFeaturedRecipe));
router.delete('/:id', asyncHandler(authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR')), asyncHandler(removeFeaturedRecipe));
router.put('/:id/weight', asyncHandler(authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR')), asyncHandler(updateFeaturedWeight));
router.put('/batch', asyncHandler(authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR')), asyncHandler(batchUpdateWeight));

// 热门菜谱
router.get('/hot', asyncHandler(authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUDITOR')), asyncHandler(getHotRecipes));
router.patch('/hot/:id', asyncHandler(authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR')), asyncHandler(toggleHot));
router.patch('/hot/batch', asyncHandler(authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR')), asyncHandler(batchToggleHot));

// 搜索可添加的菜谱
router.get('/search', asyncHandler(authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUDITOR')), asyncHandler(searchRecipesForAdmin));

// 获取全部菜谱（用于热门管理「设置热门」Tab）
router.get('/all', asyncHandler(authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUDITOR')), asyncHandler(getAllRecipesForHot));

export default router;
