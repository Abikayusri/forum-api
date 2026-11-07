import AuthenticationTokenManager from '../../../Applications/security/AuthenticationTokenManager.js';
import AuthenticationError from '../../../Commons/exceptions/AuthenticationError.js';

const authentication = (container) => async (req, res, next) => {
  try {
    const [scheme, token] = (req.headers.authorization ?? '').split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new AuthenticationError('Missing authentication');
    }

    const tokenManager = container.getInstance(AuthenticationTokenManager.name);
    const { id } = await tokenManager.verifyAccessToken(token);

    req.auth = { credentials: { id } };
    next();
  } catch (error) {
    next(error);
  }
};

export default authentication;
