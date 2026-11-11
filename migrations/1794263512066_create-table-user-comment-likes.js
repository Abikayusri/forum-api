export const shorthands = undefined;

export const up = (pgm) => {
  pgm.createTable('user_comment_likes', {
    id: {
      type: 'VARCHAR(50)',
      primaryKey: true,
    },
    'comment_id': {
      type: 'VARCHAR(50)',
      notNull: true,
      references: 'comments',
      onDelete: 'CASCADE',
    },
    owner: {
      type: 'VARCHAR(50)',
      notNull: true,
      references: 'users',
      onDelete: 'CASCADE',
    },
    date: {
      type: 'TEXT',
      notNull: true,
    },
  });

  pgm.addConstraint('user_comment_likes', 'unique_comment_id_and_owner', 'UNIQUE(comment_id, owner)');
};

export const down = (pgm) => {
  pgm.dropTable('user_comment_likes');
};