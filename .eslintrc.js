'use strict';
module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es6: true,
    node: true,
  },

  root: true,

  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'prettier',
    'prettier/react',
  ],

  plugins: ['react', 'prettier'],

  parserOptions: {
    ecmaFeatures: {
      jsx: true,
      experimentalObjectRestSpread: true,
    },
  },

  rules: {
    'prettier/prettier': [
      'error',
      {
        singleQuote: true,
        trailingComma: 'es5',
      },
    ],
    strict: [2, 'global'],
    'no-console': 2,
    'no-var': 2,
    'prefer-const': 2,
    'object-shorthand': 2,
    'no-use-before-define': 2,
  },
};
