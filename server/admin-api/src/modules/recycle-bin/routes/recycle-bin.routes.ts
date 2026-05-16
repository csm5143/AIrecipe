import { Router, Router as ExpressRouter } from 'express';
import { asyncHandler } from '../../../utils/helper';
import { getRecycleBinItems, restoreItem, permanentDelete } from '../controllers/recycle-bin.controller';
import { authenticate, authorize } from '../../auth/middleware/auth.middleware';

const router: ExpressRouter = Router();
router.use(asyncHandler(authenticate));

// 回收站：SUPER_ADMIN / ADMIN 可访问（EDITOR/AUDITOR 无权访问）
router.get('/', asyncHandler(authorize('SUPER_ADMIN', 'ADMIN')), asyncHandler(getRecycleBinItems));
router.post('/:id/restore', asyncHandler(authorize('SUPER_ADMIN', 'ADMIN')), asyncHandler(restoreItem));
router.delete('/:id/permanent', asyncHandler(authorize('SUPER_ADMIN', 'ADMIN')), asyncHandler(permanentDelete));

export default router;
