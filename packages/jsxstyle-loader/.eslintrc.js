'use strict';
module.exports = {
  env: { es6: true },
  parserOptions: { ecmaVersion: 2017 },
  plugins: ['node'],
  extends: ['eslint:recommended', 'plugin:node/recommended'],
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
};
