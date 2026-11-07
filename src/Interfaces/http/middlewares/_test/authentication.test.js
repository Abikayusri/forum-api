import { vi } from 'vitest';
import AuthenticationError from '../../../../Commons/exceptions/AuthenticationError.js';
import AuthenticationTokenManager from '../../../../Applications/security/AuthenticationTokenManager.js';
import authentication from '../authentication.js';

describe('authentication middleware', () => {
  const createContainer = (tokenManager) => ({
    getInstance: vi.fn().mockImplementation(() => tokenManager),
  });

  it('should pass AuthenticationError when authorization header is missing', async () => {
    // Arrange
    const req = { headers: {} };
    const next = vi.fn();
    const container = createContainer(new AuthenticationTokenManager());

    // Action
    await authentication(container)(req, {}, next);

    // Assert
    expect(next).toBeCalledWith(new AuthenticationError('Missing authentication'));
    expect(container.getInstance).not.toBeCalled();
  });

  it('should pass AuthenticationError when scheme is not Bearer', async () => {
    // Arrange
    const req = { headers: { authorization: 'Basic abc' } };
    const next = vi.fn();
    const container = createContainer(new AuthenticationTokenManager());

    // Action
    await authentication(container)(req, {}, next);

    // Assert
    expect(next).toBeCalledWith(new AuthenticationError('Missing authentication'));
  });

  it('should pass the error from token manager when token is invalid', async () => {
    // Arrange
    const req = { headers: { authorization: 'Bearer invalid_token' } };
    const next = vi.fn();
    const mockTokenManager = new AuthenticationTokenManager();
    mockTokenManager.verifyAccessToken = vi.fn()
      .mockImplementation(() => Promise.reject(new AuthenticationError('access token tidak valid')));
    const container = createContainer(mockTokenManager);

    // Action
    await authentication(container)(req, {}, next);

    // Assert
    expect(container.getInstance).toBeCalledWith(AuthenticationTokenManager.name);
    expect(mockTokenManager.verifyAccessToken).toBeCalledWith('invalid_token');
    expect(next).toBeCalledWith(new AuthenticationError('access token tidak valid'));
    expect(req.auth).toBeUndefined();
  });

  it('should set credentials and call next without error when token is valid', async () => {
    // Arrange
    const req = { headers: { authorization: 'Bearer valid_token' } };
    const next = vi.fn();
    const mockTokenManager = new AuthenticationTokenManager();
    mockTokenManager.verifyAccessToken = vi.fn()
      .mockImplementation(() => Promise.resolve({ id: 'user-123', username: 'dicoding' }));
    const container = createContainer(mockTokenManager);

    // Action
    await authentication(container)(req, {}, next);

    // Assert
    expect(mockTokenManager.verifyAccessToken).toBeCalledWith('valid_token');
    expect(req.auth).toStrictEqual({ credentials: { id: 'user-123' } });
    expect(next).toBeCalledWith();
  });
});
