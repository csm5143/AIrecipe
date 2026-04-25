import { Router } from 'express';
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
import { authenticate } from '../../auth/middleware/auth.middleware';

const router = Router();
router.use(authenticate);

router.get('/', asyncHandler(getCollections));
router.get('/:id', asyncHandler(getCollectionById));
router.post('/', asyncHandler(createCollection));
router.put('/:id', asyncHandler(updateCollection));
router.delete('/:id', asyncHandler(deleteCollection));
router.post('/:id/items', asyncHandler(addCollectionItem));
router.delete('/:id/items/:recipeId', asyncHandler(removeCollectionItem));

export default router;
