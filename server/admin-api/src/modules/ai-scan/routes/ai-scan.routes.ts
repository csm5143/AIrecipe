import { Router, Router as ExpressRouter } from 'express';
import { asyncHandler } from '../../../utils/helper';
import { getAiScans, getAiScanById, updateAiScanStatus, deleteAiScan } from '../controllers/ai-scan.controller';
import { authenticate, authorize } from '../../auth/middleware/auth.middleware';

const router: ExpressRouter = Router();
router.use(asyncHandler(authenticate));

router.get('/', asyncHandler(authorize('SUPER_ADMIN', 'ADMIN', 'AUDITOR')), asyncHandler(getAiScans));
router.get('/:id', asyncHandler(authorize('SUPER_ADMIN', 'ADMIN', 'AUDITOR')), asyncHandler(getAiScanById));
router.patch('/:id/status', asyncHandler(authorize('SUPER_ADMIN', 'ADMIN', 'AUDITOR')), asyncHandler(updateAiScanStatus));
router.delete('/:id', asyncHandler(authorize('SUPER_ADMIN', 'ADMIN')), asyncHandler(deleteAiScan));

export default router;
