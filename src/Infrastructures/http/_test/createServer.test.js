import http from 'node:http';
import request from 'supertest';
import pool from '../../database/postgres/pool.js';
import UsersTableTestHelper from '../../../../tests/UsersTableTestHelper.js';
import AuthenticationsTableTestHelper from '../../../../tests/AuthenticationsTableTestHelper.js';
import ThreadsTableTestHelper from '../../../../tests/ThreadsTableTestHelper.js';
import CommentsTableTestHelper from '../../../../tests/CommentsTableTestHelper.js';
import LikesTableTestHelper from '../../../../tests/LikesTableTestHelper.js';
import RepliesTableTestHelper from '../../../../tests/RepliesTableTestHelper.js';
import ServerTestHelper from '../../../../tests/ServerTestHelper.js';
import container from '../../container.js';
import createServer from '../createServer.js';
import AuthenticationTokenManager from '../../../Applications/security/AuthenticationTokenManager.js';

// Supertest membuka server baru di port acak untuk tiap request; tanpa ini socket keep-alive
// bisa terpakai ulang ke server tes sebelumnya yang memakai container berbeda.
http.globalAgent = new http.Agent({ keepAlive: false });

describe('HTTP server', () => {
  afterAll(async () => {
    await pool.end();
  });

  afterEach(async () => {
    await LikesTableTestHelper.cleanTable();
    await RepliesTableTestHelper.cleanTable();
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
    await AuthenticationsTableTestHelper.cleanTable();
  });

  it('should response 404 when request unregistered route', async () => {
    // Arrange
    const app = await createServer({});

    // Action
    const response = await request(app).get('/unregisteredRoute');

    // Assert
    expect(response.status).toEqual(404);
  });

  describe('when POST /users', () => {
    it('should response 201 and persisted user', async () => {
      // Arrange
      const requestPayload = {
        username: 'dicoding',
        password: 'secret',
        fullname: 'Dicoding Indonesia',
      };
      const app = await createServer(container);

      // Action
      const response = await request(app).post('/users').send(requestPayload);

      // Assert
      expect(response.status).toEqual(201);
      expect(response.body.status).toEqual('success');
      expect(response.body.data.addedUser).toBeDefined();
    });

    it('should response 400 when request payload not contain needed property', async () => {
      // Arrange
      const requestPayload = {
        fullname: 'Dicoding Indonesia',
        password: 'secret',
      };
      const app = await createServer(container);

      // Action
      const response = await request(app).post('/users').send(requestPayload);

      // Assert
      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('tidak dapat membuat user baru karena properti yang dibutuhkan tidak ada');
    });

    it('should response 400 when request payload not meet data type specification', async () => {
      // Arrange
      const requestPayload = {
        username: 'dicoding',
        password: 'secret',
        fullname: ['Dicoding Indonesia'],
      };
      const app = await createServer(container);

      // Action
      const response = await request(app).post('/users').send(requestPayload);

      // Assert
      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('tidak dapat membuat user baru karena tipe data tidak sesuai');
    });

    it('should response 400 when username more than 50 character', async () => {
      // Arrange
      const requestPayload = {
        username: 'dicodingindonesiadicodingindonesiadicodingindonesiadicoding',
        password: 'secret',
        fullname: 'Dicoding Indonesia',
      };
      const app = await createServer(container);

      // Action
      const response = await request(app).post('/users').send(requestPayload);

      // Assert
      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('tidak dapat membuat user baru karena karakter username melebihi batas limit');
    });

    it('should response 400 when username contain restricted character', async () => {
      // Arrange
      const requestPayload = {
        username: 'dicoding indonesia',
        password: 'secret',
        fullname: 'Dicoding Indonesia',
      };
      const app = await createServer(container);

      // Action
      const response = await request(app).post('/users').send(requestPayload);

      // Assert
      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('tidak dapat membuat user baru karena username mengandung karakter terlarang');
    });

    it('should response 400 when username unavailable', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ username: 'dicoding' });
      const requestPayload = {
        username: 'dicoding',
        fullname: 'Dicoding Indonesia',
        password: 'super_secret',
      };
      const app = await createServer(container);

      // Action
      const response = await request(app).post('/users').send(requestPayload);

      // Assert
      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('username tidak tersedia');
    });
  });

  describe('when POST /authentications', () => {
    it('should response 201 and new authentication', async () => {
      const requestPayload = {
        username: 'dicoding',
        password: 'secret',
      };
      const app = await createServer(container);

      await request(app).post('/users').send({
        username: 'dicoding',
        password: 'secret',
        fullname: 'Dicoding Indonesia',
      });

      const response = await request(app).post('/authentications').send(requestPayload);

      expect(response.status).toEqual(201);
      expect(response.body.status).toEqual('success');
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });

    it('should response 400 if username not found', async () => {
      const requestPayload = {
        username: 'dicoding',
        password: 'secret',
      };
      const app = await createServer(container);

      const response = await request(app).post('/authentications').send(requestPayload);

      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('username tidak ditemukan');
    });

    it('should response 401 if password wrong', async () => {
      const requestPayload = {
        username: 'dicoding',
        password: 'wrong_password',
      };
      const app = await createServer(container);

      await request(app).post('/users').send({
        username: 'dicoding',
        password: 'secret',
        fullname: 'Dicoding Indonesia',
      });

      const response = await request(app).post('/authentications').send(requestPayload);

      expect(response.status).toEqual(401);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('kredensial yang Anda masukkan salah');
    });

    it('should response 400 if login payload not contain needed property', async () => {
      const requestPayload = {
        username: 'dicoding',
      };
      const app = await createServer(container);

      const response = await request(app).post('/authentications').send(requestPayload);

      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('harus mengirimkan username dan password');
    });

    it('should response 400 if login payload wrong data type', async () => {
      const requestPayload = {
        username: 123,
        password: 'secret',
      };
      const app = await createServer(container);

      const response = await request(app).post('/authentications').send(requestPayload);

      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('username dan password harus string');
    });
  });

  describe('when PUT /authentications', () => {
    it('should return 200 and new access token', async () => {
      const app = await createServer(container);

      await request(app).post('/users').send({
        username: 'dicoding',
        password: 'secret',
        fullname: 'Dicoding Indonesia',
      });

      const loginResponse = await request(app).post('/authentications').send({
        username: 'dicoding',
        password: 'secret',
      });

      const { refreshToken } = loginResponse.body.data;
      const response = await request(app).put('/authentications').send({ refreshToken });

      expect(response.status).toEqual(200);
      expect(response.body.status).toEqual('success');
      expect(response.body.data.accessToken).toBeDefined();
    });

    it('should return 400 payload not contain refresh token', async () => {
      const app = await createServer(container);

      const response = await request(app).put('/authentications').send({});

      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('harus mengirimkan token refresh');
    });

    it('should return 400 if refresh token not string', async () => {
      const app = await createServer(container);

      const response = await request(app).put('/authentications').send({ refreshToken: 123 });

      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('refresh token harus string');
    });

    it('should return 400 if refresh token not valid', async () => {
      const app = await createServer(container);

      const response = await request(app).put('/authentications').send({ refreshToken: 'invalid_refresh_token' });

      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('refresh token tidak valid');
    });

    it('should return 400 if refresh token not registered in database', async () => {
      const app = await createServer(container);
      const refreshToken = await container.getInstance(AuthenticationTokenManager.name).createRefreshToken({ username: 'dicoding' });

      const response = await request(app).put('/authentications').send({ refreshToken });

      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('refresh token tidak ditemukan di database');
    });
  });

  describe('when DELETE /authentications', () => {
    it('should response 200 if refresh token valid', async () => {
      const app = await createServer(container);
      const refreshToken = 'refresh_token';
      await AuthenticationsTableTestHelper.addToken(refreshToken);

      const response = await request(app).delete('/authentications').send({ refreshToken });

      expect(response.status).toEqual(200);
      expect(response.body.status).toEqual('success');
    });

    it('should response 400 if refresh token not registered in database', async () => {
      const app = await createServer(container);
      const refreshToken = 'refresh_token';

      const response = await request(app).delete('/authentications').send({ refreshToken });

      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('refresh token tidak ditemukan di database');
    });

    it('should response 400 if payload not contain refresh token', async () => {
      const app = await createServer(container);

      const response = await request(app).delete('/authentications').send({});

      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('harus mengirimkan token refresh');
    });
  });

  describe('when POST /threads', () => {
    it('should response 401 when request without access token', async () => {
      // Arrange
      const app = await createServer(container);

      // Action
      const response = await request(app).post('/threads').send({
        title: 'sebuah thread',
        body: 'sebuah body thread',
      });

      // Assert
      expect(response.status).toEqual(401);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('Missing authentication');
    });

    it('should response 401 when access token is invalid', async () => {
      // Arrange
      const app = await createServer(container);

      // Action
      const response = await request(app)
        .post('/threads')
        .set('Authorization', 'Bearer invalid_token')
        .send({ title: 'sebuah thread', body: 'sebuah body thread' });

      // Assert
      expect(response.status).toEqual(401);
      expect(response.body.status).toEqual('fail');
    });

    it('should response 201 and persisted thread', async () => {
      // Arrange
      const app = await createServer(container);
      const accessToken = await ServerTestHelper.getAccessToken(app);

      // Action
      const response = await request(app)
        .post('/threads')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'sebuah thread', body: 'sebuah body thread' });

      // Assert
      expect(response.status).toEqual(201);
      expect(response.body.status).toEqual('success');
      expect(response.body.data.addedThread.id).toBeDefined();
      expect(response.body.data.addedThread.title).toEqual('sebuah thread');
      expect(response.body.data.addedThread.owner).toBeDefined();
      const threads = await ThreadsTableTestHelper.findThreadsById(response.body.data.addedThread.id);
      expect(threads).toHaveLength(1);
    });

    it('should response 400 when payload not contain needed property', async () => {
      // Arrange
      const app = await createServer(container);
      const accessToken = await ServerTestHelper.getAccessToken(app);

      // Action
      const response = await request(app)
        .post('/threads')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'sebuah thread' });

      // Assert
      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('tidak dapat membuat thread baru karena properti yang dibutuhkan tidak ada');
    });

    it('should response 400 when payload not meet data type specification', async () => {
      // Arrange
      const app = await createServer(container);
      const accessToken = await ServerTestHelper.getAccessToken(app);

      // Action
      const response = await request(app)
        .post('/threads')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 123, body: 'sebuah body thread' });

      // Assert
      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('tidak dapat membuat thread baru karena tipe data tidak sesuai');
    });
  });

  describe('when POST /threads/{threadId}/comments', () => {
    const addThread = async (app, accessToken) => {
      const response = await request(app)
        .post('/threads')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'sebuah thread', body: 'sebuah body thread' });
      return response.body.data.addedThread.id;
    };

    it('should response 401 when request without access token', async () => {
      // Arrange
      const app = await createServer(container);

      // Action
      const response = await request(app)
        .post('/threads/thread-123/comments')
        .send({ content: 'sebuah comment' });

      // Assert
      expect(response.status).toEqual(401);
      expect(response.body.message).toEqual('Missing authentication');
    });

    it('should response 201 and persisted comment', async () => {
      // Arrange
      const app = await createServer(container);
      const accessToken = await ServerTestHelper.getAccessToken(app);
      const threadId = await addThread(app, accessToken);

      // Action
      const response = await request(app)
        .post(`/threads/${threadId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'sebuah comment' });

      // Assert
      expect(response.status).toEqual(201);
      expect(response.body.status).toEqual('success');
      expect(response.body.data.addedComment.id).toBeDefined();
      expect(response.body.data.addedComment.content).toEqual('sebuah comment');
      expect(response.body.data.addedComment.owner).toBeDefined();
      const comments = await CommentsTableTestHelper.findCommentsById(response.body.data.addedComment.id);
      expect(comments).toHaveLength(1);
    });

    it('should response 404 when thread not found', async () => {
      // Arrange
      const app = await createServer(container);
      const accessToken = await ServerTestHelper.getAccessToken(app);

      // Action
      const response = await request(app)
        .post('/threads/thread-xxx/comments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'sebuah comment' });

      // Assert
      expect(response.status).toEqual(404);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('thread tidak ditemukan');
    });

    it('should response 400 when payload not contain needed property', async () => {
      // Arrange
      const app = await createServer(container);
      const accessToken = await ServerTestHelper.getAccessToken(app);
      const threadId = await addThread(app, accessToken);

      // Action
      const response = await request(app)
        .post(`/threads/${threadId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({});

      // Assert
      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('tidak dapat membuat komentar baru karena properti yang dibutuhkan tidak ada');
    });

    it('should response 400 when payload not meet data type specification', async () => {
      // Arrange
      const app = await createServer(container);
      const accessToken = await ServerTestHelper.getAccessToken(app);
      const threadId = await addThread(app, accessToken);

      // Action
      const response = await request(app)
        .post(`/threads/${threadId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 123 });

      // Assert
      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('tidak dapat membuat komentar baru karena tipe data tidak sesuai');
    });
  });

  describe('when DELETE /threads/{threadId}/comments/{commentId}', () => {
    const addThreadWithComment = async (app, accessToken) => {
      const threadResponse = await request(app)
        .post('/threads')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'sebuah thread', body: 'sebuah body thread' });
      const threadId = threadResponse.body.data.addedThread.id;
      const commentResponse = await request(app)
        .post(`/threads/${threadId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'sebuah comment' });
      return { threadId, commentId: commentResponse.body.data.addedComment.id };
    };

    it('should response 401 when request without access token', async () => {
      // Arrange
      const app = await createServer(container);

      // Action
      const response = await request(app).delete('/threads/thread-123/comments/comment-123');

      // Assert
      expect(response.status).toEqual(401);
      expect(response.body.message).toEqual('Missing authentication');
    });

    it('should response 200 and soft delete the comment', async () => {
      // Arrange
      const app = await createServer(container);
      const accessToken = await ServerTestHelper.getAccessToken(app);
      const { threadId, commentId } = await addThreadWithComment(app, accessToken);

      // Action
      const response = await request(app)
        .delete(`/threads/${threadId}/comments/${commentId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.status).toEqual('success');
      const [comment] = await CommentsTableTestHelper.findCommentsById(commentId);
      expect(comment.is_delete).toEqual(true);
    });

    it('should response 403 when user is not the comment owner', async () => {
      // Arrange
      const app = await createServer(container);
      const ownerToken = await ServerTestHelper.getAccessToken(app);
      const otherToken = await ServerTestHelper.getAccessToken(app, { username: 'johndoe', fullname: 'John Doe' });
      const { threadId, commentId } = await addThreadWithComment(app, ownerToken);

      // Action
      const response = await request(app)
        .delete(`/threads/${threadId}/comments/${commentId}`)
        .set('Authorization', `Bearer ${otherToken}`);

      // Assert
      expect(response.status).toEqual(403);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('anda tidak berhak menghapus komentar ini');
      const [comment] = await CommentsTableTestHelper.findCommentsById(commentId);
      expect(comment.is_delete).toEqual(false);
    });

    it('should response 404 when thread not found', async () => {
      // Arrange
      const app = await createServer(container);
      const accessToken = await ServerTestHelper.getAccessToken(app);

      // Action
      const response = await request(app)
        .delete('/threads/thread-xxx/comments/comment-123')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expect(response.status).toEqual(404);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('thread tidak ditemukan');
    });

    it('should response 404 when comment not found', async () => {
      // Arrange
      const app = await createServer(container);
      const accessToken = await ServerTestHelper.getAccessToken(app);
      const { threadId } = await addThreadWithComment(app, accessToken);

      // Action
      const response = await request(app)
        .delete(`/threads/${threadId}/comments/comment-xxx`)
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expect(response.status).toEqual(404);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('komentar tidak ditemukan');
    });
  });

  describe('when GET /threads/{threadId}', () => {
    it('should response 404 when thread not found', async () => {
      // Arrange
      const app = await createServer(container);

      // Action
      const response = await request(app).get('/threads/thread-xxx');

      // Assert
      expect(response.status).toEqual(404);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('thread tidak ditemukan');
    });

    it('should response 200 with thread detail and sorted comments', async () => {
      // Arrange
      const app = await createServer(container);
      const dicodingToken = await ServerTestHelper.getAccessToken(app);
      const johndoeToken = await ServerTestHelper.getAccessToken(app, { username: 'johndoe', fullname: 'John Doe' });
      const threadResponse = await request(app)
        .post('/threads')
        .set('Authorization', `Bearer ${dicodingToken}`)
        .send({ title: 'sebuah thread', body: 'sebuah body thread' });
      const threadId = threadResponse.body.data.addedThread.id;
      const firstComment = await request(app)
        .post(`/threads/${threadId}/comments`)
        .set('Authorization', `Bearer ${johndoeToken}`)
        .send({ content: 'komentar johndoe' });
      const secondComment = await request(app)
        .post(`/threads/${threadId}/comments`)
        .set('Authorization', `Bearer ${dicodingToken}`)
        .send({ content: 'komentar dicoding' });
      await request(app)
        .delete(`/threads/${threadId}/comments/${secondComment.body.data.addedComment.id}`)
        .set('Authorization', `Bearer ${dicodingToken}`);

      // Action
      const response = await request(app).get(`/threads/${threadId}`);

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.status).toEqual('success');
      const { thread } = response.body.data;
      expect(thread.id).toEqual(threadId);
      expect(thread.title).toEqual('sebuah thread');
      expect(thread.body).toEqual('sebuah body thread');
      expect(typeof thread.date).toEqual('string');
      expect(thread.username).toEqual('dicoding');
      expect(thread.comments).toHaveLength(2);
      expect(thread.comments[0].id).toEqual(firstComment.body.data.addedComment.id);
      expect(thread.comments[0].username).toEqual('johndoe');
      expect(thread.comments[0].content).toEqual('komentar johndoe');
      expect(typeof thread.comments[0].date).toEqual('string');
      expect(thread.comments[1].id).toEqual(secondComment.body.data.addedComment.id);
      expect(thread.comments[1].username).toEqual('dicoding');
      expect(thread.comments[1].content).toEqual('**komentar telah dihapus**');
    });
  });

  describe('when POST and DELETE /threads/{threadId}/comments/{commentId}/replies', () => {
    const addThreadWithComment = async (app, accessToken) => {
      const threadResponse = await request(app)
        .post('/threads')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'sebuah thread', body: 'sebuah body thread' });
      const threadId = threadResponse.body.data.addedThread.id;
      const commentResponse = await request(app)
        .post(`/threads/${threadId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'sebuah comment' });
      return { threadId, commentId: commentResponse.body.data.addedComment.id };
    };

    it('should response 401 when adding reply without access token', async () => {
      // Arrange
      const app = await createServer(container);

      // Action
      const response = await request(app)
        .post('/threads/thread-123/comments/comment-123/replies')
        .send({ content: 'sebuah balasan' });

      // Assert
      expect(response.status).toEqual(401);
      expect(response.body.message).toEqual('Missing authentication');
    });

    it('should response 201 and persisted reply', async () => {
      // Arrange
      const app = await createServer(container);
      const accessToken = await ServerTestHelper.getAccessToken(app);
      const { threadId, commentId } = await addThreadWithComment(app, accessToken);

      // Action
      const response = await request(app)
        .post(`/threads/${threadId}/comments/${commentId}/replies`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'sebuah balasan' });

      // Assert
      expect(response.status).toEqual(201);
      expect(response.body.status).toEqual('success');
      expect(response.body.data.addedReply.id).toBeDefined();
      expect(response.body.data.addedReply.content).toEqual('sebuah balasan');
      expect(response.body.data.addedReply.owner).toBeDefined();
      const replies = await RepliesTableTestHelper.findRepliesById(response.body.data.addedReply.id);
      expect(replies).toHaveLength(1);
    });

    it('should response 404 when adding reply to unknown thread or comment', async () => {
      // Arrange
      const app = await createServer(container);
      const accessToken = await ServerTestHelper.getAccessToken(app);
      const { threadId, commentId } = await addThreadWithComment(app, accessToken);

      // Action
      const threadResponse = await request(app)
        .post(`/threads/thread-xxx/comments/${commentId}/replies`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'sebuah balasan' });
      const commentResponse = await request(app)
        .post(`/threads/${threadId}/comments/comment-xxx/replies`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'sebuah balasan' });

      // Assert
      expect(threadResponse.status).toEqual(404);
      expect(threadResponse.body.message).toEqual('thread tidak ditemukan');
      expect(commentResponse.status).toEqual(404);
      expect(commentResponse.body.message).toEqual('komentar tidak ditemukan');
    });

    it('should response 400 when reply payload is invalid', async () => {
      // Arrange
      const app = await createServer(container);
      const accessToken = await ServerTestHelper.getAccessToken(app);
      const { threadId, commentId } = await addThreadWithComment(app, accessToken);

      // Action
      const emptyResponse = await request(app)
        .post(`/threads/${threadId}/comments/${commentId}/replies`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({});
      const typeResponse = await request(app)
        .post(`/threads/${threadId}/comments/${commentId}/replies`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 123 });

      // Assert
      expect(emptyResponse.status).toEqual(400);
      expect(emptyResponse.body.message).toEqual('tidak dapat membuat balasan baru karena properti yang dibutuhkan tidak ada');
      expect(typeResponse.status).toEqual(400);
      expect(typeResponse.body.message).toEqual('tidak dapat membuat balasan baru karena tipe data tidak sesuai');
    });

    it('should response 200 and soft delete reply only by its owner', async () => {
      // Arrange
      const app = await createServer(container);
      const ownerToken = await ServerTestHelper.getAccessToken(app);
      const otherToken = await ServerTestHelper.getAccessToken(app, { username: 'johndoe', fullname: 'John Doe' });
      const { threadId, commentId } = await addThreadWithComment(app, ownerToken);
      const replyResponse = await request(app)
        .post(`/threads/${threadId}/comments/${commentId}/replies`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ content: 'sebuah balasan' });
      const replyId = replyResponse.body.data.addedReply.id;

      // Action
      const forbiddenResponse = await request(app)
        .delete(`/threads/${threadId}/comments/${commentId}/replies/${replyId}`)
        .set('Authorization', `Bearer ${otherToken}`);
      const notFoundResponse = await request(app)
        .delete(`/threads/${threadId}/comments/${commentId}/replies/reply-xxx`)
        .set('Authorization', `Bearer ${ownerToken}`);
      const response = await request(app)
        .delete(`/threads/${threadId}/comments/${commentId}/replies/${replyId}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      // Assert
      expect(forbiddenResponse.status).toEqual(403);
      expect(forbiddenResponse.body.message).toEqual('anda tidak berhak menghapus balasan ini');
      expect(notFoundResponse.status).toEqual(404);
      expect(notFoundResponse.body.message).toEqual('balasan tidak ditemukan');
      expect(response.status).toEqual(200);
      expect(response.body.status).toEqual('success');
      const [reply] = await RepliesTableTestHelper.findRepliesById(replyId);
      expect(reply.is_delete).toEqual(true);
    });

    it('should show replies in thread detail', async () => {
      // Arrange
      const app = await createServer(container);
      const accessToken = await ServerTestHelper.getAccessToken(app);
      const { threadId, commentId } = await addThreadWithComment(app, accessToken);
      const firstReply = await request(app)
        .post(`/threads/${threadId}/comments/${commentId}/replies`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'balasan pertama' });
      await request(app)
        .post(`/threads/${threadId}/comments/${commentId}/replies`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'balasan kedua' });
      await request(app)
        .delete(`/threads/${threadId}/comments/${commentId}/replies/${firstReply.body.data.addedReply.id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      // Action
      const response = await request(app).get(`/threads/${threadId}`);

      // Assert
      expect(response.status).toEqual(200);
      const [comment] = response.body.data.thread.comments;
      expect(comment.replies).toHaveLength(2);
      expect(comment.replies[0].content).toEqual('**balasan telah dihapus**');
      expect(comment.replies[0].username).toEqual('dicoding');
      expect(typeof comment.replies[0].date).toEqual('string');
      expect(comment.replies[1].content).toEqual('balasan kedua');
    });
  });

  describe('when PUT /threads/{threadId}/comments/{commentId}/likes', () => {
    const addThreadWithComment = async (app, accessToken) => {
      const threadResponse = await request(app)
        .post('/threads')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'sebuah thread', body: 'sebuah body thread' });
      const threadId = threadResponse.body.data.addedThread.id;
      const commentResponse = await request(app)
        .post(`/threads/${threadId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'sebuah comment' });
      return { threadId, commentId: commentResponse.body.data.addedComment.id };
    };

    it('should response 401 when request without access token', async () => {
      // Arrange
      const app = await createServer(container);

      // Action
      const response = await request(app).put('/threads/thread-123/comments/comment-123/likes');

      // Assert
      expect(response.status).toEqual(401);
      expect(response.body.message).toEqual('Missing authentication');
    });

    it('should response 404 when thread not found', async () => {
      // Arrange
      const app = await createServer(container);
      const accessToken = await ServerTestHelper.getAccessToken(app);

      // Action
      const response = await request(app)
        .put('/threads/thread-xxx/comments/comment-123/likes')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expect(response.status).toEqual(404);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('thread tidak ditemukan');
    });

    it('should response 404 when comment not found', async () => {
      // Arrange
      const app = await createServer(container);
      const accessToken = await ServerTestHelper.getAccessToken(app);
      const { threadId } = await addThreadWithComment(app, accessToken);

      // Action
      const response = await request(app)
        .put(`/threads/${threadId}/comments/comment-xxx/likes`)
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expect(response.status).toEqual(404);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('komentar tidak ditemukan');
    });

    it('should response 200 and toggle like, shown as likeCount in thread detail', async () => {
      // Arrange
      const app = await createServer(container);
      const dicodingToken = await ServerTestHelper.getAccessToken(app);
      const johndoeToken = await ServerTestHelper.getAccessToken(app, { username: 'johndoe', fullname: 'John Doe' });
      const { threadId, commentId } = await addThreadWithComment(app, dicodingToken);
      const likeUrl = `/threads/${threadId}/comments/${commentId}/likes`;

      // Action
      const firstLike = await request(app).put(likeUrl).set('Authorization', `Bearer ${dicodingToken}`);
      await request(app).put(likeUrl).set('Authorization', `Bearer ${johndoeToken}`);
      const likedDetail = await request(app).get(`/threads/${threadId}`);
      const unlike = await request(app).put(likeUrl).set('Authorization', `Bearer ${johndoeToken}`);
      const unlikedDetail = await request(app).get(`/threads/${threadId}`);

      // Assert
      expect(firstLike.status).toEqual(200);
      expect(firstLike.body).toEqual({ status: 'success' });
      expect(unlike.status).toEqual(200);
      expect(likedDetail.body.data.thread.comments[0].likeCount).toEqual(2);
      expect(unlikedDetail.body.data.thread.comments[0].likeCount).toEqual(1);
    });
  });

  it('should handle server error correctly', async () => {
    // Arrange
    const requestPayload = {
      username: 'dicoding',
      fullname: 'Dicoding Indonesia',
      password: 'super_secret',
    };
    const app = await createServer({});

    // Action
    const response = await request(app).post('/users').send(requestPayload);

    // Assert
    expect(response.status).toEqual(500);
    expect(response.body.status).toEqual('error');
    expect(response.body.message).toEqual('terjadi kegagalan pada server kami');
  });
});
