import { Router, Router as ExpressRouter } from 'express';
import { asyncHandler } from '../../../utils/helper';
import {
  createRecipeComment,
  deleteComment,
  getCommentReplies,
  getRecipeComments,
  likeComment,
  replyComment,
} from '../controllers/comment.controller';

const router: ExpressRouter = Router({ mergeParams: true });

router.get('/recipes/:id/comments', asyncHandler(getRecipeComments));
router.post('/recipes/:id/comments', asyncHandler(createRecipeComment));
router.get('/comments/:id/replies', asyncHandler(getCommentReplies));
router.post('/comments/:id/reply', asyncHandler(replyComment));
router.delete('/comments/:id', asyncHandler(deleteComment));
router.post('/comments/:id/like', asyncHandler(likeComment));

export default router;
