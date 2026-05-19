import { Router } from 'express';
import { asyncHandler } from '../../../utils/helper';
import { wxAuthenticate } from '../../wx/middleware/wxAuth.middleware';
import {
  getFridgeItems,
  addFridgeItem,
  addFridgeItemsBatch,
  updateFridgeItem,
  deleteFridgeItem,
  clearFridge,
} from '../controllers/fridge.controller';

const router = Router();

// 所有路由需要微信用户身份
router.use(wxAuthenticate);

router.get('/', asyncHandler(getFridgeItems));
router.post('/', asyncHandler(addFridgeItem));
router.post('/batch', asyncHandler(addFridgeItemsBatch));
router.put('/:id', asyncHandler(updateFridgeItem));
router.delete('/:id', asyncHandler(deleteFridgeItem));
router.delete('/', asyncHandler(clearFridge));

export default router;
