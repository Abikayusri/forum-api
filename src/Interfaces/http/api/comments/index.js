import CommentsHandler from './handler.js';
import createCommentsRouter from './routes.js';
import authentication from '../../middlewares/authentication.js';

export default (container) => {
  const commentsHandler = new CommentsHandler(container);
  return createCommentsRouter(commentsHandler, authentication(container));
};
