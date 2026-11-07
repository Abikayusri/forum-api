import RepliesTableTestHelper from '../../../../tests/RepliesTableTestHelper.js';
import CommentsTableTestHelper from '../../../../tests/CommentsTableTestHelper.js';
import ThreadsTableTestHelper from '../../../../tests/ThreadsTableTestHelper.js';
import UsersTableTestHelper from '../../../../tests/UsersTableTestHelper.js';
import AuthorizationError from '../../../Commons/exceptions/AuthorizationError.js';
import NotFoundError from '../../../Commons/exceptions/NotFoundError.js';
import NewReply from '../../../Domains/replies/entities/NewReply.js';
import AddedReply from '../../../Domains/replies/entities/AddedReply.js';
import pool from '../../database/postgres/pool.js';
import ReplyRepositoryPostgres from '../ReplyRepositoryPostgres.js';

describe('ReplyRepositoryPostgres', () => {
  beforeEach(async () => {
    await UsersTableTestHelper.addUser({ id: 'user-123', username: 'dicoding' });
    await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
    await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123', owner: 'user-123' });
  });

  afterEach(async () => {
    await RepliesTableTestHelper.cleanTable();
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('addReply function', () => {
    it('should persist new reply and return added reply correctly', async () => {
      // Arrange
      const newReply = new NewReply({
        content: 'sebuah balasan',
        commentId: 'comment-123',
        owner: 'user-123',
      });
      const fakeIdGenerator = () => '123';
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, fakeIdGenerator);

      // Action
      const addedReply = await replyRepositoryPostgres.addReply(newReply);

      // Assert
      const replies = await RepliesTableTestHelper.findRepliesById('reply-123');
      expect(replies).toHaveLength(1);
      expect(replies[0].comment_id).toEqual('comment-123');
      expect(replies[0].content).toEqual('sebuah balasan');
      expect(replies[0].owner).toEqual('user-123');
      expect(replies[0].is_delete).toEqual(false);
      expect(Number.isNaN(Date.parse(replies[0].date))).toEqual(false);
      expect(addedReply).toStrictEqual(new AddedReply({
        id: 'reply-123',
        content: 'sebuah balasan',
        owner: 'user-123',
      }));
    });
  });

  describe('verifyAvailableReply function', () => {
    it('should throw NotFoundError when reply not found', async () => {
      // Arrange
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      // Action & Assert
      await expect(replyRepositoryPostgres.verifyAvailableReply('reply-123', 'comment-123'))
        .rejects.toThrowError(NotFoundError);
    });

    it('should throw NotFoundError when reply belongs to another comment', async () => {
      // Arrange
      await CommentsTableTestHelper.addComment({ id: 'comment-456', threadId: 'thread-123', owner: 'user-123' });
      await RepliesTableTestHelper.addReply({ id: 'reply-123', commentId: 'comment-456' });
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      // Action & Assert
      await expect(replyRepositoryPostgres.verifyAvailableReply('reply-123', 'comment-123'))
        .rejects.toThrowError(NotFoundError);
    });

    it('should not throw NotFoundError when reply is available in the comment', async () => {
      // Arrange
      await RepliesTableTestHelper.addReply({ id: 'reply-123', commentId: 'comment-123' });
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      // Action & Assert
      await expect(replyRepositoryPostgres.verifyAvailableReply('reply-123', 'comment-123'))
        .resolves.not.toThrowError(NotFoundError);
    });
  });

  describe('verifyReplyOwner function', () => {
    it('should throw AuthorizationError when user is not the owner', async () => {
      // Arrange
      await RepliesTableTestHelper.addReply({ id: 'reply-123', owner: 'user-123' });
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      // Action & Assert
      await expect(replyRepositoryPostgres.verifyReplyOwner('reply-123', 'user-456'))
        .rejects.toThrowError(AuthorizationError);
    });

    it('should not throw AuthorizationError when user is the owner', async () => {
      // Arrange
      await RepliesTableTestHelper.addReply({ id: 'reply-123', owner: 'user-123' });
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      // Action & Assert
      await expect(replyRepositoryPostgres.verifyReplyOwner('reply-123', 'user-123'))
        .resolves.not.toThrowError(AuthorizationError);
    });
  });

  describe('deleteReply function', () => {
    it('should soft delete the reply', async () => {
      // Arrange
      await RepliesTableTestHelper.addReply({ id: 'reply-123' });
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      // Action
      await replyRepositoryPostgres.deleteReply('reply-123');

      // Assert
      const replies = await RepliesTableTestHelper.findRepliesById('reply-123');
      expect(replies).toHaveLength(1);
      expect(replies[0].is_delete).toEqual(true);
    });
  });

  describe('getRepliesByThreadId function', () => {
    it('should return empty array when thread has no reply', async () => {
      // Arrange
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      // Action
      const replies = await replyRepositoryPostgres.getRepliesByThreadId('thread-123');

      // Assert
      expect(replies).toEqual([]);
    });

    it('should return replies of the thread sorted by date ascending', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-456', username: 'johndoe' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-456', owner: 'user-123' });
      await CommentsTableTestHelper.addComment({ id: 'comment-789', threadId: 'thread-456', owner: 'user-123' });
      await RepliesTableTestHelper.addReply({
        id: 'reply-456',
        commentId: 'comment-123',
        owner: 'user-123',
        content: 'balasan kedua',
        date: '2021-08-08T08:07:01.522Z',
        isDelete: true,
      });
      await RepliesTableTestHelper.addReply({
        id: 'reply-123',
        commentId: 'comment-123',
        owner: 'user-456',
        content: 'balasan pertama',
        date: '2021-08-08T07:59:48.766Z',
      });
      await RepliesTableTestHelper.addReply({
        id: 'reply-789',
        commentId: 'comment-789',
        owner: 'user-123',
      });
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      // Action
      const replies = await replyRepositoryPostgres.getRepliesByThreadId('thread-123');

      // Assert
      expect(replies).toStrictEqual([
        {
          id: 'reply-123',
          commentId: 'comment-123',
          content: 'balasan pertama',
          date: '2021-08-08T07:59:48.766Z',
          username: 'johndoe',
          isDelete: false,
        },
        {
          id: 'reply-456',
          commentId: 'comment-123',
          content: 'balasan kedua',
          date: '2021-08-08T08:07:01.522Z',
          username: 'dicoding',
          isDelete: true,
        },
      ]);
    });
  });
});
