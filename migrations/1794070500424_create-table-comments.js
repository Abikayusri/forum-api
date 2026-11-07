export const shorthands = undefined;

export const up = (pgm) => {
  pgm.createTable('comments', {
    id: {
      type: 'VARCHAR(50)',
      primaryKey: true,
    },
    'thread_id': {
      type: 'VARCHAR(50)',
      notNull: true,
      references: 'threads',
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
  pgm.dropTable('comments');
};