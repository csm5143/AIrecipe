import { Router, Router as ExpressRouter } from 'express';
import { asyncHandler } from '../../../utils/helper';
import { getUsers, getUserById, updateUserStatus } from '../controllers/user.controller';
import { authenticate } from '../../auth/middleware/auth.middleware';

const router: ExpressRouter = Router();

router.use(authenticate);

router.get('/', asyncHandler(getUsers));
router.get('/:id', asyncHandler(getUserById));
router.patch('/:id/status', asyncHandler(updateUserStatus));

export default router;
