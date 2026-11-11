import LikesTableTestHelper from '../../../../tests/LikesTableTestHelper.js';
import CommentsTableTestHelper from '../../../../tests/CommentsTableTestHelper.js';
import ThreadsTableTestHelper from '../../../../tests/ThreadsTableTestHelper.js';
import UsersTableTestHelper from '../../../../tests/UsersTableTestHelper.js';
import pool from '../../database/postgres/pool.js';
import LikeRepositoryPostgres from '../LikeRepositoryPostgres.js';

describe('LikeRepositoryPostgres', () => {
  beforeEach(async () => {
    await UsersTableTestHelper.addUser({ id: 'user-123', username: 'dicoding' });
    await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
    await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123', owner: 'user-123' });
  });

  afterEach(async () => {
    await LikesTableTestHelper.cleanTable();
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('isCommentLiked function', () => {
    it('should return false when user has not liked the comment', async () => {
      // Arrange
      const likeRepositoryPostgres = new LikeRepositoryPostgres(pool, {});

      // Action & Assert
      await expect(likeRepositoryPostgres.isCommentLiked('comment-123', 'user-123')).resolves.toEqual(false);
    });

    it('should return true when user has liked the comment', async () => {
      // Arrange
      await LikesTableTestHelper.addLike({ commentId: 'comment-123', owner: 'user-123' });
      const likeRepositoryPostgres = new LikeRepositoryPostgres(pool, {});

      // Action & Assert
      await expect(likeRepositoryPostgres.isCommentLiked('comment-123', 'user-123')).resolves.toEqual(true);
    });
  });

  describe('addLike function', () => {
    it('should persist like', async () => {
      // Arrange
      const fakeIdGenerator = () => '123';
      const likeRepositoryPostgres = new LikeRepositoryPostgres(pool, fakeIdGenerator);

      // Action
      await likeRepositoryPostgres.addLike('comment-123', 'user-123');

      // Assert
      const likes = await LikesTableTestHelper.findLike('comment-123', 'user-123');
      expect(likes).toHaveLength(1);
      expect(likes[0].id).toEqual('like-123');
      expect(typeof likes[0].date).toEqual('string');
    });
  });

  describe('deleteLike function', () => {
    it('should remove like', async () => {
      // Arrange
      await LikesTableTestHelper.addLike({ commentId: 'comment-123', owner: 'user-123' });
      const likeRepositoryPostgres = new LikeRepositoryPostgres(pool, {});

      // Action
      await likeRepositoryPostgres.deleteLike('comment-123', 'user-123');

      // Assert
      const likes = await LikesTableTestHelper.findLike('comment-123', 'user-123');
      expect(likes).toHaveLength(0);
    });
  });
});
