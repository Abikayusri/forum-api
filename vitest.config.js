import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    fileParallelism: false,
    coverage: {
      exclude: ['src/Commons/config.js'],
    },
  },
});
