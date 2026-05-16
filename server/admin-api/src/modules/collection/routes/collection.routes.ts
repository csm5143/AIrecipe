import { Router, Router as ExpressRouter } from 'express';
import { asyncHandler } from '../../../utils/helper';
import {
  getCollections,
  getCollectionById,
  createCollection,
  updateCollection,
  deleteCollection,
  addCollectionItem,
  removeCollectionItem,
} from '../controllers/collection.controller';
import { authenticate, authorize } from '../../auth/middleware/auth.middleware';

const router: ExpressRouter = Router();
router.use(asyncHandler(authenticate));

// 收藏管理：SUPER_ADMIN / ADMIN / EDITOR 可操作
router.get('/', asyncHandler(authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR')), asyncHandler(getCollections));
router.get('/:id', asyncHandler(authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR')), asyncHandler(getCollectionById));
router.post('/', asyncHandler(authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR')), asyncHandler(createCollection));
router.put('/:id', asyncHandler(authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR')), asyncHandler(updateCollection));
router.delete('/:id', asyncHandler(authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR')), asyncHandler(deleteCollection));
router.post('/:id/items', asyncHandler(authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR')), asyncHandler(addCollectionItem));
router.delete('/:id/items/:recipeId', asyncHandler(authorize('SUPER_ADMIN', 'ADMIN', 'EDITOR')), asyncHandler(removeCollectionItem));

export default router;
