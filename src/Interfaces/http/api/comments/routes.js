import express from 'express';

const createCommentsRouter = (handler, authenticate) => {
  const router = express.Router({ mergeParams: true });

  router.post('/', authenticate, handler.postCommentHandler);
  router.delete('/:commentId', authenticate, handler.deleteCommentHandler);
  router.put('/:commentId/likes', authenticate, handler.putCommentLikeHandler);

  return router;
};

export default createCommentsRouter;
