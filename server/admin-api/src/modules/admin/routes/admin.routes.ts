import { Router, Router as ExpressRouter } from 'express';
import { asyncHandler } from '../../../utils/helper';
import {
  getAdmins,
  getAdminById,
  createAdmin,
  forgotAdminPassword,
  resetAdminPasswordByCode,
  updateAdmin,
  resetAdminPassword,
  deleteAdmin,
  restoreAdmin,
} from '../controllers/admin.controller';
import { authenticate, authorize } from '../../auth/middleware/auth.middleware';

const router: ExpressRouter = Router();

router.post('/auth/forgot-password', asyncHandler(forgotAdminPassword));
router.post('/auth/reset-password', asyncHandler(resetAdminPasswordByCode));

router.use(asyncHandler(authenticate));

// 管理员管理：仅限 SUPER_ADMIN
router.get('/', asyncHandler(authorize('SUPER_ADMIN')), asyncHandler(getAdmins));
router.get('/:id', asyncHandler(authorize('SUPER_ADMIN')), asyncHandler(getAdminById));
router.post('/', asyncHandler(authorize('SUPER_ADMIN')), asyncHandler(createAdmin));
router.put('/:id', asyncHandler(authorize('SUPER_ADMIN')), asyncHandler(updateAdmin));
router.post('/:id/reset-password', asyncHandler(authorize('SUPER_ADMIN')), asyncHandler(resetAdminPassword));
router.delete('/:id', asyncHandler(authorize('SUPER_ADMIN')), asyncHandler(deleteAdmin));
router.post('/:id/restore', asyncHandler(authorize('SUPER_ADMIN')), asyncHandler(restoreAdmin));

export default router;
