import { Router, Router as ExpressRouter } from 'express';
import { asyncHandler } from '../../../utils/helper';
import { getUsers, getUserById, updateUserStatus, deleteUser, createUser, exportUsersHandler } from '../controllers/user.controller';
import { authenticate, authorize } from '../../auth/middleware/auth.middleware';

const router: ExpressRouter = Router();
router.use(asyncHandler(authenticate));

router.get('/', asyncHandler(authorize('SUPER_ADMIN', 'ADMIN')), asyncHandler(getUsers));
router.get('/export', asyncHandler(authorize('SUPER_ADMIN', 'ADMIN')), asyncHandler(exportUsersHandler));
router.post('/', asyncHandler(authorize('SUPER_ADMIN', 'ADMIN')), asyncHandler(createUser));
router.get('/:id', asyncHandler(authorize('SUPER_ADMIN', 'ADMIN')), asyncHandler(getUserById));
router.patch('/:id/status', asyncHandler(authorize('SUPER_ADMIN', 'ADMIN')), asyncHandler(updateUserStatus));
router.delete('/:id', asyncHandler(authorize('SUPER_ADMIN', 'ADMIN')), asyncHandler(deleteUser));

export default router;
