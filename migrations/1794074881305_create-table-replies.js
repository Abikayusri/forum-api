export const shorthands = undefined;

export const up = (pgm) => {
  pgm.createTable('replies', {
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
    content: {
      type: 'TEXT',
      notNull: true,
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
    'is_delete': {
      type: 'BOOLEAN',
      notNull: true,
      default: false,
    },
  });
};

export const down = (pgm) => {
  pgm.dropTable('replies');
};