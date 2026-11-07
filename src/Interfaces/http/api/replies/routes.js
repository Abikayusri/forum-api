import express from 'express';

const createRepliesRouter = (handler, authenticate) => {
  const router = express.Router({ mergeParams: true });

  router.post('/', authenticate, handler.postReplyHandler);
  router.delete('/:replyId', authenticate, handler.deleteReplyHandler);

  return router;
};

export default createRepliesRouter;
