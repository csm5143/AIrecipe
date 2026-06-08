import { Router, Router as ExpressRouter } from 'express';
import { asyncHandler } from '../../../utils/helper';
import {
  getAiKeys,
  createAiKey,
  updateAiKey,
  deleteAiKey,
  activateAiKey,
  getActiveAiKey,
  testAiKey,
} from '../controllers/ai-key.controller';
import { authenticate, authorize } from '../../auth/middleware/auth.middleware';

const router: ExpressRouter = Router();
router.use(asyncHandler(authenticate));

// 仅 SUPER_ADMIN 可管理 Key
router.get('/', asyncHandler(authorize('SUPER_ADMIN')), asyncHandler(getAiKeys));
router.post('/', asyncHandler(authorize('SUPER_ADMIN')), asyncHandler(createAiKey));
router.put('/:id', asyncHandler(authorize('SUPER_ADMIN')), asyncHandler(updateAiKey));
router.delete('/:id', asyncHandler(authorize('SUPER_ADMIN')), asyncHandler(deleteAiKey));
router.patch('/:id/activate', asyncHandler(authorize('SUPER_ADMIN')), asyncHandler(activateAiKey));

// 小程序端获取当前激活 Key（无需认证，直接暴露）
const publicRouter: ExpressRouter = Router();
publicRouter.get('/', asyncHandler(getActiveAiKey));
publicRouter.get('/active', asyncHandler(getActiveAiKey));

// 测试 AI Key 连接（管理员测试用）
router.post('/test', asyncHandler(testAiKey));

export default router;
export { publicRouter as aiKeyPublicRoutes };
