import express from 'express';

const createThreadsRouter = (handler, authenticate) => {
  const router = express.Router();

  router.post('/', authenticate, handler.postThreadHandler);
  router.get('/:threadId', handler.getThreadByIdHandler);

  return router;
};

export default createThreadsRouter;
