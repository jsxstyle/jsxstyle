'use strict';
module.exports = {
  env: { es6: true },
  plugins: ['node'],
  extends: ['eslint:recommended'],
  rules: {
    strict: [2, 'global'],
    'no-console': [
      2,
      {
        allow: ['error', 'info', 'warn', 'group', 'groupCollapsed', 'groupEnd'],
      },
    ],
    'no-var': 2,
    'no-unused-vars': 2,
    'prefer-const': 2,
    'object-shorthand': 2,
  },
  overrides: [
    {
      files: ['**/*.ts', '**/*/tsx'],
      parser: 'typescript-eslint-parser',
      plugins: ['react', 'typescript'],
      // https://github.com/eslint/typescript-eslint-parser#known-issues
      rules: {
        'no-undef': 0,
        'no-unused-vars': 0,
        'no-useless-constructor': 0,
        strict: 0,
      },
    },
  ],
};
