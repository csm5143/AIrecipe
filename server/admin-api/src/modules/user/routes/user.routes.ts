import { Router, Router as ExpressRouter } from 'express';
import { asyncHandler } from '../../../utils/helper';
import { getUsers, getUserById, updateUserStatus, updateUser, deleteUser, createUser, exportUsersHandler, addUserFridgeItem, deleteUserFridgeItem, getUserShoppingLists } from '../controllers/user.controller';
import { authenticate, authorize } from '../../auth/middleware/auth.middleware';

const router: ExpressRouter = Router();
router.use(asyncHandler(authenticate));

router.get('/', asyncHandler(authorize('SUPER_ADMIN', 'ADMIN')), asyncHandler(getUsers));
router.get('/export', asyncHandler(authorize('SUPER_ADMIN', 'ADMIN')), asyncHandler(exportUsersHandler));
router.post('/', asyncHandler(authorize('SUPER_ADMIN', 'ADMIN')), asyncHandler(createUser));
router.get('/:id', asyncHandler(authorize('SUPER_ADMIN', 'ADMIN')), asyncHandler(getUserById));
router.put('/:id', asyncHandler(authorize('SUPER_ADMIN', 'ADMIN')), asyncHandler(updateUser));
router.patch('/:id/status', asyncHandler(authorize('SUPER_ADMIN', 'ADMIN')), asyncHandler(updateUserStatus));
router.delete('/:id', asyncHandler(authorize('SUPER_ADMIN', 'ADMIN')), asyncHandler(deleteUser));

// 小冰箱管理
router.post('/:userId/fridge', asyncHandler(authorize('SUPER_ADMIN', 'ADMIN')), asyncHandler(addUserFridgeItem));
router.delete('/:userId/fridge/:fridgeId', asyncHandler(authorize('SUPER_ADMIN', 'ADMIN')), asyncHandler(deleteUserFridgeItem));
router.get('/:userId/shopping-lists', asyncHandler(authorize('SUPER_ADMIN', 'ADMIN')), asyncHandler(getUserShoppingLists));

export default router;
