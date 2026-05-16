import { Router, Router as ExpressRouter } from 'express';
import { asyncHandler } from '../../../utils/helper';
import { getFeedbacks, replyFeedback, updateFeedbackStatus, deleteFeedback } from '../controllers/feedback.controller';
import { authenticate, authorize } from '../../auth/middleware/auth.middleware';

const router: ExpressRouter = Router();
router.use(asyncHandler(authenticate));

// ADMIN 和 AUDITOR 均可访问反馈管理（前端侧边栏会按角色过滤）
router.get('/', asyncHandler(authorize('SUPER_ADMIN', 'ADMIN', 'AUDITOR')), asyncHandler(getFeedbacks));
router.patch('/:id/status', asyncHandler(authorize('SUPER_ADMIN', 'ADMIN', 'AUDITOR')), asyncHandler(updateFeedbackStatus));
router.post('/:id/reply', asyncHandler(authorize('SUPER_ADMIN', 'ADMIN', 'AUDITOR')), asyncHandler(replyFeedback));
router.delete('/:id', asyncHandler(authorize('SUPER_ADMIN', 'ADMIN', 'AUDITOR')), asyncHandler(deleteFeedback));

export default router;
