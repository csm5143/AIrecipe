import { Router, Router as ExpressRouter } from 'express';
import { asyncHandler } from '../../../utils/helper';
import {
  forgotAdminPassword,
  resetAdminPasswordByCode,
} from '../controllers/admin.controller';

const router: ExpressRouter = Router();

router.post('/auth/forgot-password', asyncHandler(forgotAdminPassword));
router.post('/auth/reset-password', asyncHandler(resetAdminPasswordByCode));

export default router;
