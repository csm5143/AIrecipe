import { Router, Router as ExpressRouter } from 'express';
import { asyncHandler } from '../../../utils/helper';
import { authenticate, authorize } from '../../auth/middleware/auth.middleware';
import {
  createAdminComment,
  deleteAdminComment,
  getAdminCommentDetail,
  listAdminComments,
  searchCommentRecipes,
  updateAdminComment,
} from '../controllers/admin-comment.controller';

const router: ExpressRouter = Router();

router.use(asyncHandler(authenticate));
router.use(asyncHandler(authorize('SUPER_ADMIN', 'ADMIN', 'AUDITOR')));

router.get('/', asyncHandler(listAdminComments));
router.get('/recipe-options', asyncHandler(searchCommentRecipes));
router.get('/:id', asyncHandler(getAdminCommentDetail));
router.post('/', asyncHandler(createAdminComment));
router.put('/:id', asyncHandler(updateAdminComment));
router.delete('/:id', asyncHandler(deleteAdminComment));

export default router;
