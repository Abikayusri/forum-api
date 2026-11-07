import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import daStyle from 'eslint-config-dicodingacademy';
import vitest from '@vitest/eslint-plugin';
import globals from 'globals';

export default defineConfig([
  {
    plugins: {
      vitest,
    },
  },
  daStyle,
  { files: ['**/*.{js,mjs,cjs}'], plugins: { js }, extends: ['js/recommended'], languageOptions: { globals: { ...vitest.environments.env.globals, ...globals.node } } },
  {
    // Interface abstrak sengaja mencantumkan parameter sebagai kontrak walau tidak dipakai.
    files: ['src/Domains/**/*Repository.js', 'src/Applications/security/*.js'],
    rules: {
      'no-unused-vars': ['error', { args: 'none' }],
    },
  },
]);
