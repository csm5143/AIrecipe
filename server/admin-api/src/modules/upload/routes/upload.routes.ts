import { Router, Router as ExpressRouter } from 'express';
import { asyncHandler } from '../../../utils/helper';
import {
  uploadMiddleware,
  getUploadCOSStatus,
  uploadFile,
  uploadScanImage,
  uploadRecipeCover,
  uploadRecipeStep,
  uploadAdminAvatar,
  uploadUserAvatar,
  uploadAiChatImage,
  uploadIngredient,
  uploadUserRecipeImage,
  uploadPostImage,
  uploadCollectionCover,
  uploadCategoryIcon,
  uploadFeedback,
  uploadSettings,
} from '../controllers/upload.controller';
import { authenticate } from '../../auth/middleware/auth.middleware';
import { authorize } from '../../auth/middleware/auth.middleware';
import { wxAuthenticate } from '../../wx/middleware/wxAuth.middleware';
import { COS_FOLDERS } from '../../../services/cos.service';

const router: ExpressRouter = Router();

function withUploadFolder(folder: string) {
  return (req: any, _res: any, next: any) => {
    req.body = { ...(req.body || {}), folder };
    next();
  };
}

router.post('/', asyncHandler(authenticate), uploadMiddleware, asyncHandler(uploadFile));
router.get('/cos/status', asyncHandler(authenticate), asyncHandler(authorize('SUPER_ADMIN', 'ADMIN')), asyncHandler(getUploadCOSStatus));
router.post('/scan', withUploadFolder(COS_FOLDERS.AI_SCAN), uploadMiddleware, asyncHandler(uploadScanImage));
router.post('/recipe-cover', asyncHandler(authenticate), withUploadFolder(COS_FOLDERS.RECIPE_COVER), uploadMiddleware, asyncHandler(uploadRecipeCover));
router.post('/recipe-step', asyncHandler(authenticate), withUploadFolder(COS_FOLDERS.RECIPE_STEPS), uploadMiddleware, asyncHandler(uploadRecipeStep));
router.post('/admin-avatar', asyncHandler(authenticate), withUploadFolder(COS_FOLDERS.ADMINS), uploadMiddleware, asyncHandler(uploadAdminAvatar));
router.post('/avatar', asyncHandler(authenticate), withUploadFolder(COS_FOLDERS.AVATARS), uploadMiddleware, asyncHandler(uploadUserAvatar));
router.post('/wx-avatar', asyncHandler(wxAuthenticate), withUploadFolder(COS_FOLDERS.AVATARS), uploadMiddleware, asyncHandler(uploadUserAvatar));
router.post('/chat-image', asyncHandler(wxAuthenticate), withUploadFolder(COS_FOLDERS.AI_CHAT), uploadMiddleware, asyncHandler(uploadAiChatImage));
router.post('/user-recipe-image', asyncHandler(wxAuthenticate), withUploadFolder(COS_FOLDERS.USER_RECIPES), uploadMiddleware, asyncHandler(uploadUserRecipeImage));
router.post('/post-image', asyncHandler(wxAuthenticate), withUploadFolder(COS_FOLDERS.POSTS), uploadMiddleware, asyncHandler(uploadPostImage));
router.post('/collection-cover', asyncHandler(wxAuthenticate), withUploadFolder(COS_FOLDERS.FAVORITES), uploadMiddleware, asyncHandler(uploadCollectionCover));
router.post('/ingredient', asyncHandler(authenticate), withUploadFolder(COS_FOLDERS.INGREDIENTS), uploadMiddleware, asyncHandler(uploadIngredient));
router.post('/category-icon', asyncHandler(authenticate), withUploadFolder(COS_FOLDERS.CATEGORIES), uploadMiddleware, asyncHandler(uploadCategoryIcon));
router.post('/feedback', asyncHandler(authenticate), withUploadFolder(COS_FOLDERS.FEEDBACK), uploadMiddleware, asyncHandler(uploadFeedback));
router.post('/wx-feedback', asyncHandler(wxAuthenticate), withUploadFolder(COS_FOLDERS.FEEDBACK), uploadMiddleware, asyncHandler(uploadFeedback));
router.post('/settings', asyncHandler(authenticate), withUploadFolder(COS_FOLDERS.SETTINGS), uploadMiddleware, asyncHandler(uploadSettings));

export default router;
