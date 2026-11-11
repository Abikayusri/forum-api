import LikeRepository from '../../Domains/likes/LikeRepository.js';

class LikeRepositoryPostgres extends LikeRepository {
  constructor(pool, idGenerator) {
    super();
    this._pool = pool;
    this._idGenerator = idGenerator;
  }

  async isCommentLiked(commentId, owner) {
    const query = {
      text: 'SELECT id FROM user_comment_likes WHERE comment_id = $1 AND owner = $2',
      values: [commentId, owner],
    };

    const result = await this._pool.query(query);

    return result.rowCount > 0;
  }

  async addLike(commentId, owner) {
    const id = `like-${this._idGenerator()}`;
    const date = new Date().toISOString();

    const query = {
      text: 'INSERT INTO user_comment_likes (id, comment_id, owner, date) VALUES ($1, $2, $3, $4)',
      values: [id, commentId, owner, date],
    };

    await this._pool.query(query);
  }

  async deleteLike(commentId, owner) {
    const query = {
      text: 'DELETE FROM user_comment_likes WHERE comment_id = $1 AND owner = $2',
      values: [commentId, owner],
    };

    await this._pool.query(query);
  }
}

export default LikeRepositoryPostgres;