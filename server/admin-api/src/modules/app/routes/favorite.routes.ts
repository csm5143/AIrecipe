import { Router, Router as ExpressRouter } from 'express';
import { asyncHandler } from '../../../utils/helper';
import {
  getUserFavorites,
  addFavorite,
  removeFavorite,
  checkFavorite,
  getUserCollections,
  createCollection,
  addToCollection,
  getCollectionDetail,
} from '../controllers/favorite.controller';
import { wxAuthenticate } from '../../wx/middleware/wxAuth.middleware';

const router: ExpressRouter = Router();

router.use(wxAuthenticate);

router.get('/favorites', asyncHandler(getUserFavorites));
router.post('/favorites', asyncHandler(addFavorite));
router.delete('/favorites/:recipeId', asyncHandler(removeFavorite));
router.get('/favorites/check', asyncHandler(checkFavorite));

router.get('/collections', asyncHandler(getUserCollections));
router.post('/collections', asyncHandler(createCollection));
router.post('/collections/items', asyncHandler(addToCollection));
router.get('/collections/:id', asyncHandler(getCollectionDetail));

export default router;
