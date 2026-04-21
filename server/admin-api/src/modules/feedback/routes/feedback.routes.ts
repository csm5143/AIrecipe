import { Router } from 'express';
import { asyncHandler } from '../../utils/helper';
import { getFeedbacks, replyFeedback } from '../controllers/feedback.controller';
import { authenticate } from '../../auth/middleware/auth.middleware';

const router = Router();
router.use(authenticate);

router.get('/', asyncHandler(getFeedbacks));
router.post('/:id/reply', asyncHandler(replyFeedback));

export default router;
