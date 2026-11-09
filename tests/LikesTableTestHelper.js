/* istanbul ignore file */
import pool from '../src/Infrastructures/database/postgres/pool.js';

const LikesTableTestHelper = {
  async addLike({
    id = 'like-123',
    commentId = 'comment-123',
    owner = 'user-123',
    date = '2021-08-08T07:30:00.000Z',
  }) {
    const query = {
      text: 'INSERT INTO user_comment_likes (id, comment_id, owner, date) VALUES ($1, $2, $3, $4)',
      values: [id, commentId, owner, date],
    };

    await pool.query(query);
  },

  async findLike(commentId, owner) {
    const query = {
      text: 'SELECT * FROM user_comment_likes WHERE comment_id = $1 AND owner = $2',
      values: [commentId, owner],
    };

    const result = await pool.query(query);
    return result.rows;
  },

  async cleanTable() {
    await pool.query('DELETE FROM user_comment_likes WHERE 1=1');
  },
};

export default LikesTableTestHelper;
