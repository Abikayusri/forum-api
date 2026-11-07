import ThreadsHandler from './handler.js';
import createThreadsRouter from './routes.js';
import authentication from '../../middlewares/authentication.js';

export default (container) => {
  const threadsHandler = new ThreadsHandler(container);
  return createThreadsRouter(threadsHandler, authentication(container));
};
