/* istanbul ignore file */
import pool from '../src/Infrastructures/database/postgres/pool.js';

const RepliesTableTestHelper = {
  async addReply({
    id = 'reply-123',
    commentId = 'comment-123',
    content = 'sebuah balasan',
    owner = 'user-123',
    date = '2021-08-08T07:59:48.766Z',
    isDelete = false,
  }) {
    const query = {
      text: 'INSERT INTO replies (id, comment_id, content, owner, date, is_delete) VALUES ($1, $2, $3, $4, $5, $6)',
      values: [id, commentId, content, owner, date, isDelete],
    };

    await pool.query(query);
  },

  async findRepliesById(id) {
    const query = {
      text: 'SELECT * FROM replies WHERE id = $1',
      values: [id],
    };

    const result = await pool.query(query);
    return result.rows;
  },

  async cleanTable() {
    await pool.query('DELETE FROM replies WHERE 1=1');
  },
};

export default RepliesTableTestHelper;
