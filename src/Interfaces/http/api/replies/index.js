import RepliesHandler from './handler.js';
import createRepliesRouter from './routes.js';
import authentication from '../../middlewares/authentication.js';

export default (container) => {
  const repliesHandler = new RepliesHandler(container);
  return createRepliesRouter(repliesHandler, authentication(container));
};
